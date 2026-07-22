"""Iteration-3 focused verification: analytics shape, scam_check case+alert emission,
auth/cases regression, and WebSocket alert flow. Narrow scope — no full re-run."""
import os
import json
import time
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

ADMIN = {"email": "admin@sentinelgrid.gov.in", "password": "admin@123"}


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


# ---------- (1) Analytics variable-shadowing fix — still returns 6 keys ----------
class TestAnalyticsShape:
    def test_analytics_returns_all_six_keys_correct_shape(self, s):
        r = s.get(f"{API}/analytics")
        assert r.status_code == 200, r.text
        d = r.json()
        # All 6 expected keys present + are lists
        for k in ("scam_by_day", "verdict_dist", "denom_dist", "note_verdict", "top_cities", "case_status"):
            assert k in d, f"missing key {k}"
            assert isinstance(d[k], list), f"{k} not list"

        # scam_by_day: length must be exactly 7 (last 7 days rolling)
        assert len(d["scam_by_day"]) == 7
        for it in d["scam_by_day"]:
            assert "day" in it and "count" in it
            assert isinstance(it["count"], int)

        # verdict_dist: known verdict buckets
        v_names = {x["name"] for x in d["verdict_dist"]}
        assert {"Confirmed Scam", "High", "Medium", "Low"}.issubset(v_names)

        # note_verdict: known values (renamed loop variable shouldn't affect output)
        n_names = {x["name"] for x in d["note_verdict"]}
        assert {"Genuine", "Suspected Fake", "Uncertain"}.issubset(n_names)

        # case_status: known statuses
        cs_names = {x["name"] for x in d["case_status"]}
        assert {"New", "Under Review", "Escalated", "Resolved"}.issubset(cs_names)

        # top_cities: each item has city + count keys
        for it in d["top_cities"]:
            assert "city" in it and "count" in it

        # denom_dist: each item name+value
        for it in d["denom_dist"]:
            assert "name" in it and "value" in it


# ---------- (2) /api/scam/check still runs cleanly (unused `alert` removed) ----------
class TestScamCheck:
    def test_scam_check_high_severity_creates_case_and_alert(self, s):
        # 2a. Alerts count before (bump limit past default 30 to detect growth)
        r0 = s.get(f"{API}/alerts", params={"limit": 500})
        assert r0.status_code == 200
        alerts_before = len(r0.json())

        # 2b. Cases count before
        c0 = s.get(f"{API}/cases")
        assert c0.status_code == 200
        cases_before = len(c0.json())

        # 2c. High-severity scam text — LLM should typically classify as High/Confirmed Scam
        payload = {
            "text": (
                "URGENT CBI DIGITAL ARREST — Your Aadhaar is linked to money laundering. "
                "Stay on video call NOW. Transfer Rs. 2,00,000 via UPI to 9999999999@upi "
                "within 30 minutes or a non-bailable arrest warrant will be issued. Do not "
                "disconnect this call. Share your OTP immediately to verify identity."
            ),
            "language": "en",
        }
        r = s.post(f"{API}/scam/check", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()

        # Response shape
        for k in ("id", "text", "language", "verdict", "confidence", "reasoning", "signals", "created_at"):
            assert k in d, f"missing field {k} in scam_check response"
        assert d["verdict"] in ("Low", "Medium", "High", "Confirmed Scam")
        # ensure no leaked mongo id
        assert "_id" not in d

        # If verdict is High/Confirmed Scam, a new case AND a new alert should exist
        if d["verdict"] in ("High", "Confirmed Scam"):
            # small delay for async _emit_alert broadcast/persistence
            time.sleep(1.0)
            r1 = s.get(f"{API}/alerts", params={"limit": 500})
            assert r1.status_code == 200
            alerts_after = len(r1.json())
            assert alerts_after >= alerts_before + 1, (
                f"Alerts should have grown; before={alerts_before} after={alerts_after}"
            )
            c1 = s.get(f"{API}/cases")
            assert c1.status_code == 200
            assert len(c1.json()) >= cases_before + 1, "cases did not grow after high verdict scam_check"
        else:
            pytest.skip(f"LLM verdict was {d['verdict']}; case/alert only emitted on High/Confirmed Scam")


# ---------- (3) Regression: auth/login, cases list, PATCH+audit ----------
class TestAuthCasesAudit:
    def test_admin_login(self, s):
        r = s.post(f"{API}/auth/login", json=ADMIN)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "token" in d and isinstance(d["token"], str) and len(d["token"]) > 20
        assert d["user"]["role"] == "admin"

    def test_cases_list_returns_list(self, s):
        r = s.get(f"{API}/cases")
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        # non-empty (seed cases exist)
        assert len(r.json()) > 0

    def test_patch_case_with_bearer_writes_audit(self, s, admin_token):
        cases = s.get(f"{API}/cases").json()
        cid = cases[0]["id"]
        h = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
        r = requests.patch(f"{API}/cases/{cid}", json={"status": "Under Review"}, headers=h)
        assert r.status_code == 200, r.text
        audits = requests.get(f"{API}/cases/{cid}/audits").json()
        assert audits, "no audits recorded after PATCH"
        latest = audits[0]
        assert latest["who"] == "Cmdr. A. Iyer", f"expected admin name, got {latest.get('who')}"
        assert latest["action"] == "case_updated"
        assert latest.get("after", {}).get("status") == "Under Review"


# ---------- (4) WebSocket alert flow ----------
class TestWebSocket:
    def test_ws_upgrade_and_receive_alert(self):
        try:
            import websocket  # websocket-client
        except ImportError:
            pytest.skip("websocket-client not installed")

        ws_url = BASE_URL.replace("https://", "wss://").replace("http://", "ws://") + "/api/ws/alerts"
        try:
            ws = websocket.create_connection(ws_url, timeout=15)
        except Exception as e:
            pytest.fail(f"WS connect failed: {e}")

        try:
            ws.settimeout(25)
            hello = json.loads(ws.recv())
            assert hello.get("kind") == "hello", f"expected hello, got {hello}"

            # trigger a broadcast
            r = requests.post(f"{API}/alerts/simulate", json={})
            assert r.status_code == 200

            got_alert = False
            deadline = time.time() + 25
            while time.time() < deadline:
                try:
                    msg = json.loads(ws.recv())
                except Exception:
                    break
                if msg.get("kind") == "alert":
                    got_alert = True
                    for k in ("id", "type", "severity", "title", "created_at"):
                        assert k in msg["data"], f"alert missing field {k}"
                    break
            assert got_alert, "did not receive alert broadcast within 25s"
        finally:
            try:
                ws.close()
            except Exception:
                pass
