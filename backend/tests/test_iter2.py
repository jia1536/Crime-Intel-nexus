"""SentinelGrid iteration-2 tests: auth, audit trail, bulk counterfeit, analytics, websocket."""
import os
import io
import json
import struct
import zlib
import asyncio
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

ADMIN = {"email": "admin@sentinelgrid.gov.in", "password": "admin@123"}
OFFICER = {"email": "sharma@delhi.police.in", "password": "officer@123"}


def _jpeg_bytes(color=(200, 180, 60), size=(160, 80), variance=True):
    """Build a real JPEG using PIL with some visual features (bands/gradient)."""
    from PIL import Image, ImageDraw
    img = Image.new("RGB", size, color)
    d = ImageDraw.Draw(img)
    # gradient bands
    for y in range(size[1]):
        c = (color[0] - y % 40, color[1] - y % 30, color[2] + y % 25)
        c = tuple(max(0, min(255, x)) for x in c)
        d.line([(0, y), (size[0], y)], fill=c)
    # a "serial number" strip
    d.rectangle([10, 10, 60, 22], fill=(20, 20, 20))
    d.text((12, 12), "0AZ1234", fill=(255, 255, 255))
    # watermark oval
    d.ellipse([size[0] - 60, 20, size[0] - 20, 60], outline=(0, 0, 0), width=2)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=88)
    return buf.getvalue()


@pytest.fixture(scope="session")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


@pytest.fixture(scope="session")
def admin_token(s):
    r = s.post(f"{API}/auth/login", json=ADMIN)
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="session")
def officer_token(s):
    r = s.post(f"{API}/auth/login", json=OFFICER)
    assert r.status_code == 200, r.text
    return r.json()["token"]


# ---------------- AUTH ----------------
class TestAuth:
    def test_login_admin(self, s):
        r = s.post(f"{API}/auth/login", json=ADMIN)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "token" in d and isinstance(d["token"], str) and len(d["token"]) > 20
        u = d["user"]
        for k in ("id", "email", "name", "role", "unit"):
            assert k in u
        assert u["role"] == "admin"
        assert u["email"] == ADMIN["email"]

    def test_login_officer(self, s):
        r = s.post(f"{API}/auth/login", json=OFFICER)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["user"]["role"] == "officer"
        assert d["user"]["email"] == OFFICER["email"]

    def test_login_wrong_password(self, s):
        r = s.post(f"{API}/auth/login", json={"email": ADMIN["email"], "password": "wrong"})
        assert r.status_code == 401

    def test_me_requires_token(self, s):
        # New session without any auth header
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_me_with_token(self, s, admin_token):
        r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        d = r.json()
        assert d["email"] == ADMIN["email"]
        assert d["role"] == "admin"
        # ensure no password_hash leaked
        assert "password_hash" not in d

    def test_register_and_duplicate(self, s):
        import uuid as _uuid
        email = f"test_{_uuid.uuid4().hex[:8]}@sentinelgrid.gov.in"
        payload = {"email": email, "password": "Testpass@123", "name": "TEST_User", "role": "officer", "unit": "TEST_Unit"}
        r = s.post(f"{API}/auth/register", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["user"]["email"] == email
        assert d["token"]
        # duplicate
        r2 = s.post(f"{API}/auth/register", json=payload)
        assert r2.status_code == 400


# ---------------- AUDIT TRAIL ----------------
class TestAudit:
    def _first_case(self, s):
        cases = s.get(f"{API}/cases").json()
        assert cases
        return cases[0]["id"]

    def test_audit_with_auth_uses_user_name(self, s, admin_token):
        cid = self._first_case(s)
        h = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
        r = requests.patch(f"{API}/cases/{cid}", json={"status": "Under Review"}, headers=h)
        assert r.status_code == 200, r.text
        # fetch audits
        audits = requests.get(f"{API}/cases/{cid}/audits").json()
        assert audits, "no audits recorded"
        latest = audits[0]
        assert latest["who"] == "Cmdr. A. Iyer"
        assert latest["action"] == "case_updated"
        assert latest["after"].get("status") == "Under Review"

    def test_audit_without_auth_anonymous(self, s):
        cid = self._first_case(s)
        r = requests.patch(f"{API}/cases/{cid}", json={"status": "Escalated"}, headers={"Content-Type": "application/json"})
        assert r.status_code == 200
        audits = requests.get(f"{API}/cases/{cid}/audits").json()
        assert audits
        # find the just-created escalated audit
        for a in audits:
            if a.get("after", {}).get("status") == "Escalated":
                assert a["who"] == "Anonymous Demo"
                return
        pytest.fail("No anonymous audit entry found")


# ---------------- BULK COUNTERFEIT ----------------
class TestBulkCounterfeit:
    def test_bulk_analyze(self, s):
        before = len(s.get(f"{API}/counterfeit").json())
        imgs = [_jpeg_bytes(color=(200, 180, 60)),
                _jpeg_bytes(color=(180, 60, 60), size=(200, 100)),
                _jpeg_bytes(color=(120, 140, 200), size=(180, 90))]
        files = [("files", (f"note_{i}.jpg", b, "image/jpeg")) for i, b in enumerate(imgs)]
        r = requests.post(f"{API}/counterfeit/bulk-analyze", files=files)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "results" in d and "summary" in d
        assert len(d["results"]) == 3
        s_ = d["summary"]
        for k in ("total", "genuine", "suspected_fake", "uncertain"):
            assert k in s_
        assert s_["total"] == 3
        assert s_["genuine"] + s_["suspected_fake"] + s_["uncertain"] == 3
        for rec in d["results"]:
            for k in ("verdict", "denomination", "confidence", "checklist"):
                assert k in rec
            assert rec["verdict"] in ("Genuine", "Suspected Fake", "Uncertain", "Fake")
            for ck in ("security_thread", "microprint", "serial_number_pattern", "watermark"):
                assert ck in rec["checklist"]
        after = len(s.get(f"{API}/counterfeit").json())
        assert after >= before + 3, f"expected persistence: before={before} after={after}"


# ---------------- ANALYTICS ----------------
class TestAnalytics:
    def test_analytics_shape(self, s):
        r = s.get(f"{API}/analytics")
        assert r.status_code == 200
        d = r.json()
        for k in ("scam_by_day", "verdict_dist", "denom_dist", "note_verdict", "top_cities", "case_status"):
            assert k in d, f"missing {k}"
            assert isinstance(d[k], list)
        assert len(d["scam_by_day"]) == 7
        for it in d["scam_by_day"]:
            assert "day" in it and "count" in it
        # note_verdict has 3 known verdicts
        names = {x["name"] for x in d["note_verdict"]}
        assert {"Genuine", "Suspected Fake", "Uncertain"}.issubset(names)


# ---------------- WEBSOCKET ----------------
class TestWebSocket:
    def test_ws_hello_and_alert(self):
        try:
            import websocket  # websocket-client
        except ImportError:
            pytest.skip("websocket-client not installed")

        ws_url = BASE_URL.replace("https://", "wss://").replace("http://", "ws://") + "/api/ws/alerts"
        try:
            ws = websocket.create_connection(ws_url, timeout=10)
        except Exception as e:
            pytest.fail(f"WS connect failed: {e}")

        try:
            ws.settimeout(8)
            hello = json.loads(ws.recv())
            assert hello.get("kind") == "hello"
            # trigger a broadcast
            r = requests.post(f"{API}/alerts/simulate", json={})
            assert r.status_code == 200
            # receive next message (should be alert)
            got_alert = False
            for _ in range(3):
                try:
                    msg = json.loads(ws.recv())
                except Exception:
                    break
                if msg.get("kind") == "alert":
                    got_alert = True
                    d = msg["data"]
                    for k in ("id", "type", "severity", "title", "created_at"):
                        assert k in d
                    break
            assert got_alert, "did not receive alert broadcast within timeout"
        finally:
            try: ws.close()
            except Exception: pass


# ---------------- REGRESSION QUICK CHECKS ----------------
class TestRegression:
    def test_officers_from_db(self, s):
        r = s.get(f"{API}/officers")
        assert r.status_code == 200
        d = r.json()
        # 4 officers + 1 admin = 5 (admin included since role in [officer,admin])
        assert len(d) >= 4
        names = {o["name"] for o in d}
        assert "Insp. R. Sharma" in names

    def test_kpis(self, s):
        r = s.get(f"{API}/kpis")
        assert r.status_code == 200
        d = r.json()
        for k in ("active_alerts", "scams_flagged_today", "counterfeit_detected", "high_risk_zones", "cases_new", "escalated"):
            assert k in d

    def test_graph(self, s):
        r = s.get(f"{API}/graph")
        assert r.status_code == 200
        d = r.json()
        assert d["nodes"] and d["edges"]

    def test_hotspots(self, s):
        r = s.get(f"{API}/hotspots")
        assert r.status_code == 200

    def test_alerts(self, s):
        r = s.get(f"{API}/alerts")
        assert r.status_code == 200
