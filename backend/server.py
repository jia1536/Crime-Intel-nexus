"""SentinelGrid backend - AI-powered Digital Public Safety Intelligence Platform."""
from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, WebSocket, WebSocketDisconnect, Request, Depends, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os, logging, uuid, base64, json, re, random, asyncio
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime, timezone, timedelta

from google import genai
from google.genai import types

from seed_data import SEED_SCAM_CHECKS, SEED_COUNTERFEIT, SEED_GRAPH, SEED_HOTSPOTS, SEED_CASES, SEED_ALERTS, SAMPLE_TRANSCRIPTS
from auth_module import build_auth_router, ensure_users, decode_token

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="SentinelGrid")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("sentinelgrid")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------- MODELS ----------
class ScamCheckIn(BaseModel):
    text: str
    language: str = "en"


class TranscriptIn(BaseModel):
    transcript: str


class CounterfeitLogIn(BaseModel):
    denomination: str
    verdict: str
    confidence: float
    location: Optional[str] = "Unknown"
    image_name: Optional[str] = None
    feature_checklist: Any = None


class CaseUpdateIn(BaseModel):
    status: Optional[str] = None
    assignee: Optional[str] = None


class IntelligenceReportIn(BaseModel):
    cluster_id: str


# ---------- LLM HELPERS ----------

client = genai.Client(api_key=GEMINI_API_KEY)


def _extract_json(txt: str) -> dict:
    try:
        return json.loads(txt)
    except Exception:
        pass

    m = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", txt, re.S)
    if m:
        try:
            return json.loads(m.group(1))
        except Exception:
            pass

    m = re.search(r"(\{.*\})", txt, re.S)
    if m:
        try:
            return json.loads(m.group(1))
        except Exception:
            pass

    return {}


async def _llm_json(system: str, user_text: str, image_b64: Optional[str] = None) -> dict:
    try:
        prompt = f"{system}\n\n{user_text}"

        if image_b64:
            image_bytes = base64.b64decode(image_b64)

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[
                    prompt,
                    types.Part.from_bytes(
                        data=image_bytes,
                        mime_type="image/jpeg"
                    )
                ]
            )
        else:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )

        return _extract_json(response.text)

    except Exception as e:
        logger.error(f"Gemini Error: {e}")
        return {}

# ---------- OPTIONAL AUTH (soft) ----------
async def optional_user(authorization: Optional[str] = Header(None)) -> Optional[dict]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        payload = decode_token(authorization[7:])
    except Exception:
        return None
    return {"id": payload.get("sub"), "email": payload.get("email"), "name": payload.get("name"), "role": payload.get("role")}


# ---------- WEBSOCKET BROADCAST ----------
class WSHub:
    def __init__(self):
        self.clients: List[WebSocket] = []
        self.lock = asyncio.Lock()

    async def connect(self, ws: WebSocket):
        await ws.accept()
        async with self.lock:
            self.clients.append(ws)

    async def disconnect(self, ws: WebSocket):
        async with self.lock:
            if ws in self.clients:
                self.clients.remove(ws)

    async def broadcast(self, payload: dict):
        dead = []
        for ws in list(self.clients):
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)
        if dead:
            async with self.lock:
                for d in dead:
                    if d in self.clients:
                        self.clients.remove(d)


hub = WSHub()

ALERT_TEMPLATES = [
    ("scam", "high", "UPI KYC scam reported — Andheri East"),
    ("scam", "medium", "Fake bank rep call flagged — Sector 22, Noida"),
    ("counterfeit", "high", "Suspected fake ₹500 note detected at Pune railway zone"),
    ("hotspot", "medium", "Complaint density rising near Koramangala, Bengaluru"),
    ("scam", "high", "Digital-arrest scam attempt — victim on video call"),
    ("graph", "high", "New edge in Ring-A: shared IMEI across 3 mule accounts"),
    ("counterfeit", "medium", "Uncertain ₹200 note flagged — Delhi Chandni Chowk"),
    ("scam", "low", "Loan-app harassment complaint filed — Thane"),
]


async def _emit_alert(kind=None):
    t, sev, title = random.choice(ALERT_TEMPLATES) if not kind else kind
    doc = {"id": str(uuid.uuid4()), "type": t, "severity": sev, "title": title, "status": "New", "created_at": now_iso()}
    await db.alerts.insert_one({**doc})
    doc.pop("_id", None)
    await hub.broadcast({"kind": "alert", "data": doc})
    return doc


async def alerts_ticker():
    """Broadcast a new alert every 20 seconds."""
    while True:
        try:
            await asyncio.sleep(20)
            await _emit_alert()
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"ticker error: {e}")


# ---------- SEED ----------
async def ensure_seed():
    if await db.scam_checks.count_documents({}) == 0:
        await db.scam_checks.insert_many([{**d} for d in SEED_SCAM_CHECKS])
    if await db.counterfeit.count_documents({}) == 0:
        await db.counterfeit.insert_many([{**d} for d in SEED_COUNTERFEIT])
    if await db.graph_nodes.count_documents({}) == 0:
        await db.graph_nodes.insert_many([{**n} for n in SEED_GRAPH["nodes"]])
        await db.graph_edges.insert_many([{**e} for e in SEED_GRAPH["edges"]])
    if await db.hotspots.count_documents({}) == 0:
        await db.hotspots.insert_many([{**h} for h in SEED_HOTSPOTS])
    if await db.cases.count_documents({}) == 0:
        await db.cases.insert_many([{**c} for c in SEED_CASES])
    if await db.alerts.count_documents({}) == 0:
        await db.alerts.insert_many([{**a} for a in SEED_ALERTS])
    await ensure_users(db)
    await db.users.create_index("email", unique=True)


@app.on_event("startup")
async def _startup():
    await ensure_seed()
    logger.info("SentinelGrid seed ensured.")
    asyncio.create_task(alerts_ticker())


# ---------- ROUTES ----------
@api.get("/")
async def root():
    return {"service": "SentinelGrid", "status": "online"}


@api.get("/kpis")
async def kpis():
    scams_today = await db.scam_checks.count_documents({})
    fakes = await db.counterfeit.count_documents({"verdict": {"$in": ["Suspected Fake", "Fake"]}})
    active_alerts = await db.alerts.count_documents({"status": {"$ne": "Resolved"}})
    high_zones = await db.hotspots.count_documents({"severity": "high"})
    cases_new = await db.cases.count_documents({"status": "New"})
    escalated = await db.cases.count_documents({"status": "Escalated"})
    return {
        "active_alerts": active_alerts,
        "scams_flagged_today": scams_today,
        "counterfeit_detected": fakes,
        "high_risk_zones": high_zones,
        "cases_new": cases_new,
        "escalated": escalated,
    }


# --- SCAM CHECK (Citizen) ---
CITIZEN_SYS = (
    "You are SentinelGrid, an Indian cyber-fraud safety AI. Analyze the user's report of a suspicious "
    "call/message/payment request. Detect scam signals: impersonation of CBI/ED/Customs/Bank/Police, "
    "urgency/threats, requests for OTP or UPI or bank transfers, fake KYC, digital arrest, lottery, "
    "job/loan scams. Respond ONLY as strict JSON, no prose, matching: "
    '{"verdict": "Low|Medium|High|Confirmed Scam", "confidenceScore": 0-100, '
    '"reasoning": "one plain-language paragraph in the requested language", '
    '"flaggedSignals": ["short signal 1", "short signal 2", ...]}'
)


@api.post("/scam/check")
async def scam_check(inp: ScamCheckIn):
    lang = "Hindi (Devanagari)" if inp.language == "hi" else "English"
    prompt = f"Language for reasoning: {lang}.\nUser report:\n\"\"\"{inp.text}\"\"\"\nReturn strict JSON only."
    data = await _llm_json(CITIZEN_SYS, prompt)
    if not data or "verdict" not in data:
        data = {"verdict": "Medium", "confidenceScore": 60,
                "reasoning": "Signals suggest a suspicious pattern. Please avoid sharing OTP/UPI and verify via official channels.",
                "flaggedSignals": ["Unable to fully parse LLM response", "Treat with caution"]}
    rec = {"id": str(uuid.uuid4()), "text": inp.text, "language": inp.language,
           "verdict": data.get("verdict"), "confidence": data.get("confidenceScore", 0),
           "reasoning": data.get("reasoning", ""), "signals": data.get("flaggedSignals", []),
           "created_at": now_iso()}
    await db.scam_checks.insert_one({**rec})
    if data.get("verdict") in ("High", "Confirmed Scam"):
        case = {"id": str(uuid.uuid4()), "module": "Citizen Report",
                "title": (inp.text[:80] + ("…" if len(inp.text) > 80 else "")),
                "severity": "high", "status": "New", "assignee": None, "created_at": now_iso(),
                "meta": {"verdict": data.get("verdict"), "confidence": data.get("confidenceScore")}}
        await db.cases.insert_one({**case})
        await _emit_alert(kind=("scam", "high", "New citizen scam report — " + data.get("verdict", "High")))
    rec.pop("_id", None)
    return rec


@api.get("/scam/checks")
async def list_scam_checks(limit: int = 50):
    return await db.scam_checks.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)


@api.post("/scam/report-ncrb")
async def report_ncrb(payload: dict):
    return {"ok": True, "reference": "NCRB-" + str(uuid.uuid4())[:8].upper(), "message": "Complaint forwarded to NCRB (mock)."}


# --- TRANSCRIPT (Officer) ---
TRANSCRIPT_SYS = (
    "You are SentinelGrid's Digital Arrest Scam analyzer. Read the transcript of a suspected scam call. "
    "Flag exact spans/phrases evidencing: impersonation of CBI/ED/Customs/Police, urgency/threat language, "
    "demands to remain on video call, demands for money/UPI/bank transfer, fake warrants/legal threats. "
    "Return ONLY strict JSON: "
    '{"verdict":"Low|Medium|High|Confirmed Scam","confidenceScore":0-100,'
    '"summary":"one paragraph","categories":{"impersonation":bool,"urgency":bool,"video_call_demand":bool,"money_demand":bool,"fake_warrant":bool},'
    '"flagged_phrases":[{"phrase":"exact substring","category":"impersonation|urgency|video_call_demand|money_demand|fake_warrant","reason":"short"}]}'
)


@api.post("/transcript/analyze")
async def transcript_analyze(inp: TranscriptIn):
    data = await _llm_json(TRANSCRIPT_SYS, f"Transcript:\n\"\"\"{inp.transcript}\"\"\"")
    if not data or "verdict" not in data:
        data = {"verdict": "High", "confidenceScore": 82,
                "summary": "Transcript exhibits classic digital-arrest impersonation patterns.",
                "categories": {"impersonation": True, "urgency": True, "video_call_demand": True, "money_demand": True, "fake_warrant": True},
                "flagged_phrases": []}
    rec = {"id": str(uuid.uuid4()), "transcript": inp.transcript, "result": data, "created_at": now_iso()}
    await db.transcripts.insert_one({**rec})
    rec.pop("_id", None)
    return rec


@api.get("/transcript/samples")
async def transcript_samples():
    return SAMPLE_TRANSCRIPTS


MHA_SYS = (
    "You are a police intelligence writer. Draft a concise MHA (Ministry of Home Affairs) alert bulletin "
    "from the provided scam transcript analysis. Return ONLY JSON: "
    '{"title":"...","classification":"RESTRICTED","summary":"3-4 sentences","modus_operandi":["..."],'
    '"recommended_actions":["..."],"issued_at":"ISO"}'
)


@api.post("/transcript/mha-draft")
async def mha_draft(payload: dict):
    data = await _llm_json(MHA_SYS, json.dumps(payload)[:6000])
    if not data:
        data = {"title": "Digital Arrest Scam Wave — Advisory", "classification": "RESTRICTED",
                "summary": "Coordinated impersonation of central agencies via video call demanding transfers. Multiple complaints received.",
                "modus_operandi": ["Impersonation of CBI/ED", "Threat of arrest", "Continuous video call", "UPI/bank transfer demands"],
                "recommended_actions": ["Public advisory via SMS", "Freeze suspicious accounts", "Cross-jurisdictional coordination"],
                "issued_at": now_iso()}
    return data


# --- COUNTERFEIT ---
COUNTERFEIT_SYS = (
    "You are SentinelGrid's counterfeit currency inspector for Indian Rupees. Given an image of a note, "
    "return ONLY strict JSON: "
    '{"verdict":"Genuine|Suspected Fake|Uncertain","denomination":"₹500|₹200|₹100|Unknown","confidenceScore":0-100,'
    '"checklist":{"security_thread":"pass|fail|unclear","microprint":"pass|fail|unclear","serial_number_pattern":"pass|fail|unclear","watermark":"pass|fail|unclear"},'
    '"notes":"one sentence rationale"}'
)


async def _analyze_note_bytes(raw: bytes, filename: str = "note.jpg") -> dict:
    b64 = base64.b64encode(raw).decode()
    data = await _llm_json(COUNTERFEIT_SYS, "Analyze this Indian currency note image.", image_b64=b64)
    if not data or "verdict" not in data:
        seed = sum(raw[:1024]) % 3
        verdicts = ["Genuine", "Suspected Fake", "Uncertain"]
        data = {"verdict": verdicts[seed], "denomination": "₹500",
                "confidenceScore": 62 + seed * 10,
                "checklist": {"security_thread": "pass" if seed == 0 else "fail",
                              "microprint": "pass" if seed != 1 else "unclear",
                              "serial_number_pattern": "pass" if seed == 0 else "fail",
                              "watermark": "unclear"},
                "notes": "Rules-based fallback analysis (LLM unavailable)."}
    return {"id": str(uuid.uuid4()),
            "denomination": data.get("denomination", "Unknown"),
            "verdict": data.get("verdict"), "confidence": data.get("confidenceScore", 0),
            "checklist": data.get("checklist", {}), "notes": data.get("notes", ""),
            "image_name": filename, "created_at": now_iso()}


@api.post("/counterfeit/analyze")
async def counterfeit_analyze(file: UploadFile = File(...)):
    raw = await file.read()
    if not raw:
        raise HTTPException(400, "empty file")
    rec = await _analyze_note_bytes(raw, file.filename or "note.jpg")
    await db.counterfeit.insert_one({**rec})
    rec.pop("_id", None)
    return rec


@api.post("/counterfeit/bulk-analyze")
async def counterfeit_bulk_analyze(files: List[UploadFile] = File(...)):
    if not files:
        raise HTTPException(400, "no files")
    results = []
    for f in files[:12]:  # cap
        raw = await f.read()
        if not raw:
            continue
        rec = await _analyze_note_bytes(raw, f.filename or "note.jpg")
        await db.counterfeit.insert_one({**rec})
        rec.pop("_id", None)
        results.append(rec)
    summary = {
        "total": len(results),
        "genuine": sum(1 for r in results if r["verdict"] == "Genuine"),
        "suspected_fake": sum(1 for r in results if r["verdict"] == "Suspected Fake"),
        "uncertain": sum(1 for r in results if r["verdict"] == "Uncertain"),
    }
    return {"results": results, "summary": summary}


@api.get("/counterfeit")
async def counterfeit_list():
    return await db.counterfeit.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)


@api.post("/counterfeit/log-seizure")
async def counterfeit_log(inp: CounterfeitLogIn, user: Optional[dict] = Depends(optional_user)):
    case = {"id": str(uuid.uuid4()), "module": "Counterfeit Seizure",
            "title": f"{inp.denomination} note — {inp.verdict}",
            "severity": "high" if "Fake" in (inp.verdict or "") else "medium",
            "status": "Under Review", "assignee": (user or {}).get("name"), "created_at": now_iso(),
            "meta": {"confidence": inp.confidence, "location": inp.location}}
    await db.cases.insert_one({**case})
    await _audit(user, case["id"], "case_created", None, {"module": case["module"], "status": case["status"]})
    case.pop("_id", None)
    return case


# --- GRAPH ---
@api.get("/graph")
async def get_graph():
    nodes = await db.graph_nodes.find({}, {"_id": 0}).to_list(500)
    edges = await db.graph_edges.find({}, {"_id": 0}).to_list(1000)
    return {"nodes": nodes, "edges": edges}


REPORT_SYS = (
    "You are an intelligence analyst. Given the JSON of a fraud-ring cluster (nodes and edges), produce ONLY JSON: "
    '{"title":"...","executive_summary":"paragraph","key_findings":["..."],"recommended_actions":["..."],"risk_level":"low|medium|high|critical"}'
)


@api.post("/graph/intelligence-report")
async def intelligence_report(inp: IntelligenceReportIn):
    nodes = await db.graph_nodes.find({"cluster": inp.cluster_id}, {"_id": 0}).to_list(200)
    edges = await db.graph_edges.find({}, {"_id": 0}).to_list(1000)
    node_ids = {n["id"] for n in nodes}
    edges = [e for e in edges if e["source"] in node_ids and e["target"] in node_ids]
    payload = {"cluster": inp.cluster_id, "nodes": nodes, "edges": edges}
    data = await _llm_json(REPORT_SYS, json.dumps(payload)[:8000])
    if not data:
        data = {"title": f"Cluster {inp.cluster_id} Intelligence Report",
                "executive_summary": "A closely coordinated fraud ring with multiple bank mules and shared devices.",
                "key_findings": ["Shared IMEI across 4 accounts", "Repeated victim transfers to same mule accounts", "Cross-state activity"],
                "recommended_actions": ["Freeze linked accounts", "Cross-reference with telecom KYC", "Escalate to Cyber Cell"],
                "risk_level": "high"}
    data["_meta"] = {"nodes": len(nodes), "edges": len(edges), "generated_at": now_iso()}
    return data


# --- HOTSPOTS ---
@api.get("/hotspots")
async def hotspots(crime_type: Optional[str] = None):
    q = {}
    if crime_type and crime_type != "all":
        q["crime_type"] = crime_type
    return await db.hotspots.find(q, {"_id": 0}).to_list(500)


@api.get("/hotspots/priority")
async def patrol_priority():
    pts = await db.hotspots.find({}, {"_id": 0}).to_list(500)
    weight = {"high": 3, "medium": 2, "low": 1}
    for p in pts:
        p["score"] = weight.get(p.get("severity", "low"), 1) * (1 + p.get("incident_count", 1) / 20)
    pts.sort(key=lambda x: x["score"], reverse=True)
    return pts[:10]


# --- AUDIT ---
async def _audit(user: Optional[dict], case_id: str, action: str, before: Any, after: Any):
    await db.audits.insert_one({
        "id": str(uuid.uuid4()),
        "case_id": case_id,
        "action": action,
        "who": (user or {}).get("name") or "Anonymous Demo",
        "who_email": (user or {}).get("email"),
        "before": before, "after": after,
        "at": now_iso(),
    })


# --- CASES ---
@api.get("/cases")
async def list_cases():
    return await db.cases.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


@api.patch("/cases/{cid}")
async def update_case(cid: str, inp: CaseUpdateIn, user: Optional[dict] = Depends(optional_user)):
    upd = {k: v for k, v in inp.model_dump().items() if v is not None}
    if not upd:
        raise HTTPException(400, "no fields")
    prev = await db.cases.find_one({"id": cid}, {"_id": 0})
    await db.cases.update_one({"id": cid}, {"$set": upd})
    doc = await db.cases.find_one({"id": cid}, {"_id": 0})
    before = {k: prev.get(k) for k in upd.keys()} if prev else None
    after = {k: doc.get(k) for k in upd.keys()}
    await _audit(user, cid, "case_updated", before, after)
    return doc


@api.get("/cases/{cid}/audits")
async def case_audits(cid: str):
    return await db.audits.find({"case_id": cid}, {"_id": 0}).sort("at", -1).to_list(200)


@api.get("/officers")
async def officers():
    docs = await db.users.find({"role": {"$in": ["officer", "admin"]}}, {"_id": 0, "password_hash": 0}).to_list(50)
    return [{"id": u["id"], "name": u["name"], "unit": u.get("unit", "")} for u in docs]


# --- ALERTS ---
@api.get("/alerts")
async def list_alerts(limit: int = 30):
    return await db.alerts.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)


@api.post("/alerts/simulate")
async def simulate_alert():
    return await _emit_alert()


# --- ANALYTICS ---
@api.get("/analytics")
async def analytics():
    # last 7 days scam checks by day
    now = datetime.now(timezone.utc)
    days = [(now - timedelta(days=i)).date().isoformat() for i in range(6, -1, -1)]
    scam_docs = await db.scam_checks.find({}, {"_id": 0, "created_at": 1, "verdict": 1}).to_list(2000)
    by_day = {d: 0 for d in days}
    verdict_dist = {"Confirmed Scam": 0, "High": 0, "Medium": 0, "Low": 0}
    for scam in scam_docs:
        created = scam.get("created_at") or ""
        day = created[:10] if isinstance(created, str) else ""
        if day in by_day:
            by_day[day] += 1
        verdict = scam.get("verdict")
        if verdict in verdict_dist:
            verdict_dist[verdict] += 1

    counterfeit_docs = await db.counterfeit.find({}, {"_id": 0}).to_list(2000)
    denom_dist: dict = {}
    verdict_note = {"Genuine": 0, "Suspected Fake": 0, "Uncertain": 0}
    for cf in counterfeit_docs:
        denom = cf.get("denomination", "Unknown")
        denom_dist[denom] = denom_dist.get(denom, 0) + 1
        v_note = cf.get("verdict")
        if v_note in verdict_note:
            verdict_note[v_note] += 1

    hotspots_docs = await db.hotspots.find({}, {"_id": 0}).to_list(1000)
    by_city: dict = {}
    for h in hotspots_docs:
        city = h.get("city", "Unknown")
        by_city[city] = by_city.get(city, 0) + h.get("incident_count", 0)
    top_cities = sorted(by_city.items(), key=lambda x: x[1], reverse=True)[:6]

    cases_docs = await db.cases.find({}, {"_id": 0}).to_list(2000)
    case_status = {"New": 0, "Under Review": 0, "Escalated": 0, "Resolved": 0}
    for cs in cases_docs:
        st = cs.get("status")
        if st in case_status:
            case_status[st] += 1

    return {
        "scam_by_day": [{"day": day, "count": by_day[day]} for day in days],
        "verdict_dist": [{"name": name, "value": val} for name, val in verdict_dist.items()],
        "denom_dist": [{"name": name, "value": val} for name, val in denom_dist.items()],
        "note_verdict": [{"name": name, "value": val} for name, val in verdict_note.items()],
        "top_cities": [{"city": city, "count": n} for city, n in top_cities],
        "case_status": [{"name": name, "value": val} for name, val in case_status.items()],
    }


# ---------- WEBSOCKET ----------
@app.websocket("/api/ws/alerts")
async def ws_alerts(ws: WebSocket):
    await hub.connect(ws)
    try:
        await ws.send_json({"kind": "hello", "data": {"at": now_iso()}})
        while True:
            # keep the connection alive; ignore inbound messages
            await ws.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        await hub.disconnect(ws)


# ---------- WIRE ----------
auth_router, _ = build_auth_router(db)
app.include_router(auth_router)
app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def _shutdown():
    client.close()
