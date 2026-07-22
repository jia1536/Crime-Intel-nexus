"""SentinelGrid backend API tests."""
import os
import io
import base64
import struct
import zlib
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://crime-intel-nexus.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _png_bytes():
    """Return a small valid PNG file (10x10 gradient)."""
    width, height = 20, 20
    raw = b""
    for y in range(height):
        raw += b"\x00"  # filter byte
        for x in range(width):
            raw += bytes([x * 12 % 256, y * 12 % 256, (x + y) * 8 % 256])
    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(raw)) + chunk(b"IEND", b"")
    return png


# --- KPIs ---
class TestKPIs:
    def test_kpis_fields(self, client):
        r = client.get(f"{API}/kpis")
        assert r.status_code == 200
        d = r.json()
        for k in ["active_alerts", "scams_flagged_today", "counterfeit_detected", "high_risk_zones", "cases_new", "escalated"]:
            assert k in d, f"missing {k}"
            assert isinstance(d[k], int), f"{k} not int"


# --- SCAM ---
class TestScam:
    def test_scam_checks_seeded(self, client):
        r = client.get(f"{API}/scam/checks")
        assert r.status_code == 200
        docs = r.json()
        assert isinstance(docs, list)
        assert len(docs) >= 17, f"expected >=17 seeded, got {len(docs)}"

    def test_scam_check_high_creates_case_alert(self, client):
        cases_before = client.get(f"{API}/cases").json()
        alerts_before = client.get(f"{API}/alerts", params={"limit": 500}).json()
        cases_ids_before = {c["id"] for c in cases_before}
        alerts_ids_before = {a["id"] for a in alerts_before}
        payload = {
            "text": "Sir, main CBI se bol raha hoon. Aapke Aadhaar par ek FIR dartur hui hai. Turant is UPI par 25000 transfer karo warna digital arrest ho jayega. Video call par bane raho.",
            "language": "en",
        }
        r = client.post(f"{API}/scam/check", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["verdict"] in ("Low", "Medium", "High", "Confirmed Scam")
        assert "confidence" in d
        assert "reasoning" in d
        assert "signals" in d and isinstance(d["signals"], list)
        if d["verdict"] in ("High", "Confirmed Scam"):
            cases_after = client.get(f"{API}/cases").json()
            alerts_after = client.get(f"{API}/alerts", params={"limit": 500}).json()
            new_cases = {c["id"] for c in cases_after} - cases_ids_before
            new_alerts = {a["id"] for a in alerts_after} - alerts_ids_before
            assert len(new_cases) >= 1, "no new case created for High verdict"
            assert len(new_alerts) >= 1, "no new alert for High verdict"

    def test_scam_check_persisted(self, client):
        payload = {"text": "TEST_persist Aapka KYC pending. OTP share karo warna account block.", "language": "en"}
        before = len(client.get(f"{API}/scam/checks").json())
        r = client.post(f"{API}/scam/check", json=payload)
        assert r.status_code == 200
        after = len(client.get(f"{API}/scam/checks").json())
        assert after > before, "scam check not persisted"

    def test_report_ncrb(self, client):
        r = client.post(f"{API}/scam/report-ncrb", json={"note": "TEST_"})
        assert r.status_code == 200
        d = r.json()
        assert d.get("ok") is True
        assert d.get("reference", "").startswith("NCRB-")


# --- TRANSCRIPT ---
class TestTranscript:
    def test_samples(self, client):
        r = client.get(f"{API}/transcript/samples")
        assert r.status_code == 200
        d = r.json()
        assert len(d) >= 3
        for it in d:
            assert "id" in it and "title" in it and "transcript" in it

    def test_analyze(self, client):
        text = ("Hello, main CBI officer bol raha hoon. Aapke naam par money laundering ka case hai. "
                "Turant video call par aao, warrant ready hai, aur 50,000 rupees UPI par transfer karo.")
        r = client.post(f"{API}/transcript/analyze", json={"transcript": text})
        assert r.status_code == 200, r.text
        d = r.json()
        assert "result" in d
        res = d["result"]
        assert "verdict" in res
        assert "confidenceScore" in res
        assert "categories" in res and isinstance(res["categories"], dict)
        # 5 booleans required
        for k in ["impersonation", "urgency", "video_call_demand", "money_demand", "fake_warrant"]:
            assert k in res["categories"], f"missing category {k}"
        assert "flagged_phrases" in res and isinstance(res["flagged_phrases"], list)

    def test_mha_draft(self, client):
        r = client.post(f"{API}/transcript/mha-draft", json={
            "verdict": "High", "summary": "digital arrest attempt", "categories": {"impersonation": True}
        })
        assert r.status_code == 200
        d = r.json()
        for k in ["title", "classification", "summary", "modus_operandi", "recommended_actions"]:
            assert k in d, f"missing {k}"
        assert isinstance(d["modus_operandi"], list)
        assert isinstance(d["recommended_actions"], list)


# --- COUNTERFEIT ---
class TestCounterfeit:
    def test_counterfeit_seeded(self, client):
        r = client.get(f"{API}/counterfeit")
        assert r.status_code == 200
        d = r.json()
        assert len(d) >= 12

    def test_counterfeit_analyze_creates_record(self, client):
        before = len(client.get(f"{API}/counterfeit").json())
        png = _png_bytes()
        files = {"file": ("test.png", png, "image/png")}
        # NOTE: don't send default json content-type for multipart
        r = requests.post(f"{API}/counterfeit/analyze", files=files)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["verdict"] in ("Genuine", "Suspected Fake", "Uncertain", "Fake")
        assert "denomination" in d
        assert "confidence" in d
        assert "checklist" in d
        for k in ["security_thread", "microprint", "serial_number_pattern", "watermark"]:
            assert k in d["checklist"], f"missing checklist.{k}"
        assert "notes" in d
        after = len(client.get(f"{API}/counterfeit").json())
        assert after > before, "counterfeit record not created"

    def test_log_seizure(self, client):
        payload = {
            "denomination": "₹500", "verdict": "Suspected Fake",
            "confidence": 80.0, "location": "TEST_Pune",
        }
        r = client.post(f"{API}/counterfeit/log-seizure", json=payload)
        assert r.status_code == 200
        d = r.json()
        assert d.get("module") == "Counterfeit Seizure"
        # Verify case exists
        cases = client.get(f"{API}/cases").json()
        ids = [c["id"] for c in cases]
        assert d["id"] in ids


# --- GRAPH ---
class TestGraph:
    def test_graph(self, client):
        r = client.get(f"{API}/graph")
        assert r.status_code == 200
        d = r.json()
        assert 25 <= len(d["nodes"]) <= 30, f"nodes count={len(d['nodes'])}"
        assert 40 <= len(d["edges"]) <= 50, f"edges count={len(d['edges'])}"
        assert all("cluster" in n for n in d["nodes"])

    def test_intel_report(self, client):
        r = client.post(f"{API}/graph/intelligence-report", json={"cluster_id": "A"})
        assert r.status_code == 200
        d = r.json()
        for k in ["title", "executive_summary", "key_findings", "recommended_actions", "risk_level", "_meta"]:
            assert k in d, f"missing {k}"


# --- HOTSPOTS ---
class TestHotspots:
    def test_hotspots_seeded(self, client):
        r = client.get(f"{API}/hotspots")
        assert r.status_code == 200
        d = r.json()
        assert len(d) >= 25

    def test_hotspots_filter(self, client):
        r = client.get(f"{API}/hotspots", params={"crime_type": "scam"})
        assert r.status_code == 200
        d = r.json()
        assert len(d) > 0
        assert all(h.get("crime_type") == "scam" for h in d)

    def test_hotspots_priority(self, client):
        r = client.get(f"{API}/hotspots/priority")
        assert r.status_code == 200
        d = r.json()
        assert len(d) <= 10
        scores = [h.get("score", 0) for h in d]
        assert scores == sorted(scores, reverse=True), "priority not sorted desc"


# --- CASES ---
class TestCases:
    def test_list(self, client):
        r = client.get(f"{API}/cases")
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_update_status_and_assignee(self, client):
        cases = client.get(f"{API}/cases").json()
        assert cases
        cid = cases[0]["id"]
        r = client.patch(f"{API}/cases/{cid}", json={"status": "Escalated"})
        assert r.status_code == 200
        assert r.json().get("status") == "Escalated"
        r2 = client.patch(f"{API}/cases/{cid}", json={"assignee": "Insp. R. Sharma"})
        assert r2.status_code == 200
        assert r2.json().get("assignee") == "Insp. R. Sharma"


# --- OFFICERS ---
class TestOfficers:
    def test_officers(self, client):
        r = client.get(f"{API}/officers")
        assert r.status_code == 200
        d = r.json()
        # iter2: officers endpoint now includes admin + officers from DB
        assert len(d) >= 4
        names = {o["name"] for o in d}
        assert "Insp. R. Sharma" in names


# --- ALERTS ---
class TestAlerts:
    def test_list_sorted(self, client):
        r = client.get(f"{API}/alerts")
        assert r.status_code == 200
        d = r.json()
        assert len(d) > 0
        dates = [a.get("created_at", "") for a in d]
        assert dates == sorted(dates, reverse=True), "alerts not sorted desc"

    def test_simulate(self, client):
        r = client.post(f"{API}/alerts/simulate", json={})
        assert r.status_code == 200
        d = r.json()
        for k in ["id", "type", "severity", "title", "created_at"]:
            assert k in d
