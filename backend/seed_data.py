"""Seed data for SentinelGrid."""
import uuid
from datetime import datetime, timezone, timedelta
import random

random.seed(42)

def _now(minus_min=0):
    return (datetime.now(timezone.utc) - timedelta(minutes=minus_min)).isoformat()


SEED_SCAM_CHECKS = [
    {"id": str(uuid.uuid4()),
     "text": "Received a WhatsApp call. Person claimed to be CBI officer, said my Aadhaar is linked to a money-laundering case in Mumbai and asked me to stay on video call for 'digital arrest'. Demanded ₹1.2 lakh RTGS to 'protect' my account.",
     "language": "en", "verdict": "Confirmed Scam", "confidence": 96,
     "reasoning": "Classic digital-arrest impersonation of CBI with threat and payment demand.",
     "signals": ["Impersonation (CBI)", "Digital arrest video call demand", "Money transfer demand"], "created_at": _now(90)},
    {"id": str(uuid.uuid4()),
     "text": "SMS: 'Your electricity bill is overdue. Pay ₹1,850 immediately or power will be cut in 2 hours. Call 809XXXXXXX.'",
     "language": "en", "verdict": "High", "confidence": 88,
     "reasoning": "Urgent threat + unofficial number is a common utility-bill scam pattern.",
     "signals": ["Urgency", "Unofficial contact number", "Utility impersonation"], "created_at": _now(120)},
    {"id": str(uuid.uuid4()),
     "text": "Someone from 'Amazon delivery' asked for OTP to complete the delivery of a package I never ordered.",
     "language": "en", "verdict": "Confirmed Scam", "confidence": 98,
     "reasoning": "Delivery services never ask for OTP. OTP is only for financial authentication.",
     "signals": ["OTP request", "Impersonation (courier)"], "created_at": _now(35)},
    {"id": str(uuid.uuid4()),
     "text": "Job offer received on Telegram — ₹8,000/day just for rating YouTube videos. They asked me to deposit ₹5,000 as 'security'.",
     "language": "en", "verdict": "Confirmed Scam", "confidence": 97,
     "reasoning": "Task-fraud / part-time job scam with upfront deposit.",
     "signals": ["Task fraud", "Upfront deposit", "Telegram lure"], "created_at": _now(240)},
    {"id": str(uuid.uuid4()),
     "text": "Bank called: they said my card is blocked and I must share the CVV and OTP to unblock.",
     "language": "en", "verdict": "Confirmed Scam", "confidence": 99,
     "reasoning": "Banks never ask for CVV/OTP.",
     "signals": ["CVV request", "OTP request", "Impersonation (Bank)"], "created_at": _now(15)},
    {"id": str(uuid.uuid4()),
     "text": "मुझे कॉल आया कि आपके नाम पर कस्टम में पार्सल पकड़ा गया है, ड्रग्स मिले हैं, तुरंत ₹80,000 ट्रांसफर करो।",
     "language": "hi", "verdict": "Confirmed Scam", "confidence": 96,
     "reasoning": "कस्टम/ड्रग्स धमकी के साथ पैसे की मांग — डिजिटल अरेस्ट scam pattern.",
     "signals": ["Customs impersonation", "Threat", "Money demand"], "created_at": _now(55)},
    {"id": str(uuid.uuid4()),
     "text": "Got a link on SMS: 'kyc-update.icici-secure.co' asking to verify KYC.",
     "language": "en", "verdict": "High", "confidence": 92,
     "reasoning": "Suspicious lookalike domain for KYC — likely phishing.",
     "signals": ["Suspicious domain", "KYC phishing"], "created_at": _now(75)},
    {"id": str(uuid.uuid4()),
     "text": "Someone said I won ₹25 lakh in KBC lottery and need to pay ₹15,000 GST to release funds.",
     "language": "en", "verdict": "Confirmed Scam", "confidence": 99,
     "reasoning": "Classic lottery/KBC fee-fraud.",
     "signals": ["Lottery fraud", "Advance fee"], "created_at": _now(180)},
    {"id": str(uuid.uuid4()),
     "text": "Received a WhatsApp forward about UPI reward — 'click to claim ₹5,000 gift'.",
     "language": "en", "verdict": "Medium", "confidence": 70,
     "reasoning": "Unverified reward link — likely UPI phishing.",
     "signals": ["Phishing link", "UPI reward lure"], "created_at": _now(200)},
    {"id": str(uuid.uuid4()),
     "text": "A loan app is threatening to send obscene messages to my contacts unless I pay ₹40,000 today.",
     "language": "en", "verdict": "Confirmed Scam", "confidence": 95,
     "reasoning": "Illegal loan-app harassment/extortion pattern.",
     "signals": ["Loan-app extortion", "Threat"], "created_at": _now(300)},
    {"id": str(uuid.uuid4()),
     "text": "Investment 'expert' on Telegram guaranteed 30% weekly returns on crypto. Asked to install a trading app via APK.",
     "language": "en", "verdict": "Confirmed Scam", "confidence": 97,
     "reasoning": "Guaranteed high returns + sideloaded APK are classic pig-butchering signals.",
     "signals": ["Investment fraud", "Unverified APK", "Pig-butchering"], "created_at": _now(400)},
    {"id": str(uuid.uuid4()),
     "text": "मेरे बेटे की आवाज में कॉल आया कि accident हो गया है, तुरंत ₹50,000 UPI करो।",
     "language": "hi", "verdict": "High", "confidence": 88,
     "reasoning": "AI-voice-cloning परिवार सदस्य के इमरजेंसी scam.",
     "signals": ["Voice-clone", "Emergency lure", "UPI demand"], "created_at": _now(50)},
    {"id": str(uuid.uuid4()),
     "text": "Cash-on-delivery courier person asked to scan a QR code to 'refund' delivery charge.",
     "language": "en", "verdict": "High", "confidence": 90,
     "reasoning": "Scanning QR sends money, does not receive.",
     "signals": ["QR-scan reversal trick", "Refund scam"], "created_at": _now(20)},
    {"id": str(uuid.uuid4()),
     "text": "Got a notice claiming to be from TRAI, saying my number will be disconnected in 2 hours.",
     "language": "en", "verdict": "High", "confidence": 89,
     "reasoning": "TRAI impersonation with urgency — trending scam.",
     "signals": ["Impersonation (TRAI)", "Urgency"], "created_at": _now(10)},
    {"id": str(uuid.uuid4()),
     "text": "Person claimed to be ED officer, sent a fake 'arrest warrant' on WhatsApp with my photo.",
     "language": "en", "verdict": "Confirmed Scam", "confidence": 99,
     "reasoning": "Fake warrant + ED impersonation — digital arrest.",
     "signals": ["Fake warrant", "Impersonation (ED)"], "created_at": _now(60)},
    {"id": str(uuid.uuid4()),
     "text": "Anyone else got a call from '+92' number saying they need my bank details for a foreign inheritance?",
     "language": "en", "verdict": "Confirmed Scam", "confidence": 98,
     "reasoning": "419 inheritance scam.",
     "signals": ["419 scam", "International lure"], "created_at": _now(500)},
    {"id": str(uuid.uuid4()),
     "text": "Neighbour got a call that her son is booked in Delhi drug case and needs 2 lakh urgently.",
     "language": "en", "verdict": "Confirmed Scam", "confidence": 97,
     "reasoning": "Family-in-trouble impersonation.",
     "signals": ["Family-in-trouble", "Threat"], "created_at": _now(320)},
]


SEED_COUNTERFEIT = [
    {"id": str(uuid.uuid4()), "denomination": "₹500", "verdict": "Genuine", "confidence": 96,
     "checklist": {"security_thread": "pass", "microprint": "pass", "serial_number_pattern": "pass", "watermark": "pass"},
     "notes": "All security features present.", "image_name": "note500_a.jpg", "created_at": _now(200)},
    {"id": str(uuid.uuid4()), "denomination": "₹500", "verdict": "Suspected Fake", "confidence": 87,
     "checklist": {"security_thread": "fail", "microprint": "fail", "serial_number_pattern": "unclear", "watermark": "fail"},
     "notes": "Missing security thread. Serial font irregular.", "image_name": "note500_b.jpg", "created_at": _now(120)},
    {"id": str(uuid.uuid4()), "denomination": "₹200", "verdict": "Genuine", "confidence": 93,
     "checklist": {"security_thread": "pass", "microprint": "pass", "serial_number_pattern": "pass", "watermark": "pass"},
     "notes": "Genuine note.", "image_name": "note200_a.jpg", "created_at": _now(400)},
    {"id": str(uuid.uuid4()), "denomination": "₹200", "verdict": "Suspected Fake", "confidence": 79,
     "checklist": {"security_thread": "unclear", "microprint": "fail", "serial_number_pattern": "fail", "watermark": "unclear"},
     "notes": "Microprint blurred. Serial spacing off.", "image_name": "note200_b.jpg", "created_at": _now(80)},
    {"id": str(uuid.uuid4()), "denomination": "₹100", "verdict": "Genuine", "confidence": 95,
     "checklist": {"security_thread": "pass", "microprint": "pass", "serial_number_pattern": "pass", "watermark": "pass"},
     "notes": "Verified.", "image_name": "note100_a.jpg", "created_at": _now(600)},
    {"id": str(uuid.uuid4()), "denomination": "₹100", "verdict": "Uncertain", "confidence": 55,
     "checklist": {"security_thread": "unclear", "microprint": "unclear", "serial_number_pattern": "pass", "watermark": "unclear"},
     "notes": "Image quality low. Retake recommended.", "image_name": "note100_b.jpg", "created_at": _now(30)},
    {"id": str(uuid.uuid4()), "denomination": "₹500", "verdict": "Suspected Fake", "confidence": 91,
     "checklist": {"security_thread": "fail", "microprint": "pass", "serial_number_pattern": "fail", "watermark": "fail"},
     "notes": "Serial repeated across multiple bundle notes.", "image_name": "note500_c.jpg", "created_at": _now(340)},
    {"id": str(uuid.uuid4()), "denomination": "₹200", "verdict": "Genuine", "confidence": 90,
     "checklist": {"security_thread": "pass", "microprint": "pass", "serial_number_pattern": "pass", "watermark": "pass"},
     "notes": "OK.", "image_name": "note200_c.jpg", "created_at": _now(720)},
    {"id": str(uuid.uuid4()), "denomination": "₹500", "verdict": "Genuine", "confidence": 94,
     "checklist": {"security_thread": "pass", "microprint": "pass", "serial_number_pattern": "pass", "watermark": "pass"},
     "notes": "OK.", "image_name": "note500_d.jpg", "created_at": _now(1000)},
    {"id": str(uuid.uuid4()), "denomination": "₹100", "verdict": "Suspected Fake", "confidence": 82,
     "checklist": {"security_thread": "fail", "microprint": "fail", "serial_number_pattern": "unclear", "watermark": "fail"},
     "notes": "Poor paper quality and misaligned print.", "image_name": "note100_c.jpg", "created_at": _now(150)},
    {"id": str(uuid.uuid4()), "denomination": "₹200", "verdict": "Suspected Fake", "confidence": 84,
     "checklist": {"security_thread": "fail", "microprint": "fail", "serial_number_pattern": "fail", "watermark": "unclear"},
     "notes": "Multiple failed features.", "image_name": "note200_d.jpg", "created_at": _now(450)},
    {"id": str(uuid.uuid4()), "denomination": "₹500", "verdict": "Uncertain", "confidence": 60,
     "checklist": {"security_thread": "unclear", "microprint": "unclear", "serial_number_pattern": "pass", "watermark": "pass"},
     "notes": "Ambiguous, second opinion suggested.", "image_name": "note500_e.jpg", "created_at": _now(20)},
]


# Fraud network graph with 3 clusters
def _mk_graph():
    nodes = []
    edges = []

    def add_node(nid, label, type_, cluster, risk):
        nodes.append({"id": nid, "label": label, "type": type_, "cluster": cluster, "risk": risk})

    def add_edge(s, t, kind):
        edges.append({"source": s, "target": t, "kind": kind})

    # Cluster A - Delhi ring
    A = "A"
    add_node("A-P1", "+91 98110 33301", "phone", A, "high")
    add_node("A-P2", "+91 98110 33302", "phone", A, "high")
    add_node("A-P3", "+91 98110 33303", "phone", A, "medium")
    add_node("A-B1", "HDFC-8842 (Mule)", "account", A, "high")
    add_node("A-B2", "SBI-1177 (Mule)", "account", A, "high")
    add_node("A-B3", "PNB-2043 (Mule)", "account", A, "medium")
    add_node("A-D1", "IMEI-3355-A", "device", A, "high")
    add_node("A-D2", "IMEI-3356-A", "device", A, "medium")
    add_node("A-V1", "Victim R.S.", "victim", A, "medium")
    add_node("A-V2", "Victim K.M.", "victim", A, "medium")
    add_node("A-V3", "Victim S.D.", "victim", A, "low")
    for s, t, k in [("A-P1","A-D1","uses"),("A-P2","A-D1","uses"),("A-P3","A-D2","uses"),
                    ("A-P1","A-B1","controls"),("A-P2","A-B2","controls"),("A-P3","A-B3","controls"),
                    ("A-V1","A-B1","transferred"),("A-V2","A-B1","transferred"),
                    ("A-V2","A-B2","transferred"),("A-V3","A-B3","transferred"),
                    ("A-V1","A-B2","transferred"),
                    ("A-P1","A-P2","called"),("A-P2","A-P3","called"),
                    ("A-B1","A-B2","transferred"),("A-B2","A-B3","transferred")]:
        add_edge(s,t,k)

    # Cluster B - Mumbai ring
    B = "B"
    add_node("B-P1", "+91 98670 55501", "phone", B, "high")
    add_node("B-P2", "+91 98670 55502", "phone", B, "medium")
    add_node("B-P3", "+91 98670 55503", "phone", B, "high")
    add_node("B-B1", "ICICI-9902 (Mule)", "account", B, "high")
    add_node("B-B2", "Kotak-4471 (Mule)", "account", B, "high")
    add_node("B-D1", "IMEI-8890-B", "device", B, "high")
    add_node("B-V1", "Victim A.T.", "victim", B, "medium")
    add_node("B-V2", "Victim P.J.", "victim", B, "low")
    add_node("B-V3", "Victim S.R.", "victim", B, "medium")
    for s,t,k in [("B-P1","B-D1","uses"),("B-P2","B-D1","uses"),("B-P3","B-D1","uses"),
                  ("B-P1","B-B1","controls"),("B-P3","B-B2","controls"),
                  ("B-V1","B-B1","transferred"),("B-V2","B-B1","transferred"),("B-V3","B-B2","transferred"),
                  ("B-V1","B-B2","transferred"),("B-V3","B-B1","transferred"),
                  ("B-P1","B-P2","called"),("B-P2","B-P3","called"),("B-P1","B-P3","called"),
                  ("B-B1","B-B2","transferred")]:
        add_edge(s,t,k)

    # Cluster C - South ring
    C = "C"
    add_node("C-P1", "+91 96770 22201", "phone", C, "medium")
    add_node("C-P2", "+91 96770 22202", "phone", C, "high")
    add_node("C-B1", "Axis-3311 (Mule)", "account", C, "high")
    add_node("C-B2", "PNB-7789 (Mule)", "account", C, "medium")
    add_node("C-D1", "IMEI-1177-C", "device", C, "high")
    add_node("C-V1", "Victim N.K.", "victim", C, "low")
    add_node("C-V2", "Victim M.G.", "victim", C, "medium")
    for s,t,k in [("C-P1","C-D1","uses"),("C-P2","C-D1","uses"),("C-P1","C-B1","controls"),
                  ("C-P2","C-B2","controls"),("C-V1","C-B1","transferred"),("C-V2","C-B2","transferred"),
                  ("C-V1","C-B2","transferred"),("C-V2","C-B1","transferred"),
                  ("C-P1","C-P2","called"),("C-B1","C-B2","transferred")]:
        add_edge(s,t,k)

    # Cross-cluster hints (multiple)
    add_edge("A-B1","B-B1","transferred")
    add_edge("B-B2","C-B1","transferred")
    add_edge("A-D1","B-D1","shared")
    add_edge("A-P3","B-P2","called")
    return {"nodes": nodes, "edges": edges}


SEED_GRAPH = _mk_graph()


CITIES = [
    ("Delhi", 28.6139, 77.2090),
    ("Noida", 28.5355, 77.3910),
    ("Gurugram", 28.4595, 77.0266),
    ("Mumbai", 19.0760, 72.8777),
    ("Thane", 19.2183, 72.9781),
    ("Bengaluru", 12.9716, 77.5946),
    ("Pune", 18.5204, 73.8567),
]


def _mk_hotspots():
    types = ["scam", "counterfeit", "cybercrime"]
    sevs = ["high", "medium", "low"]
    out = []
    for city, lat, lon in CITIES:
        n = random.randint(4, 6)
        for _ in range(n):
            out.append({
                "id": str(uuid.uuid4()),
                "city": city,
                "lat": lat + random.uniform(-0.06, 0.06),
                "lng": lon + random.uniform(-0.06, 0.06),
                "crime_type": random.choice(types),
                "severity": random.choices(sevs, weights=[3, 4, 3])[0],
                "incident_count": random.randint(3, 40),
                "reported_at": _now(random.randint(5, 720)),
                "title": f"{random.choice(['Scam cluster','Fake note seizure','Cybercrime hotspot','UPI fraud density'])} — {city}",
            })
    return out


SEED_HOTSPOTS = _mk_hotspots()


SEED_CASES = [
    {"id": str(uuid.uuid4()), "module": "Citizen Report", "title": "Digital arrest scam — CBI impersonation", "severity": "high", "status": "Escalated", "assignee": "Insp. R. Sharma", "created_at": _now(120), "meta": {"verdict": "Confirmed Scam"}},
    {"id": str(uuid.uuid4()), "module": "Counterfeit Seizure", "title": "₹500 fake note bundle — Pune station", "severity": "high", "status": "Under Review", "assignee": "SI P. Kaur", "created_at": _now(80), "meta": {"denomination": "₹500"}},
    {"id": str(uuid.uuid4()), "module": "Graph Cluster", "title": "Ring-A: shared IMEI across 4 accounts", "severity": "high", "status": "New", "assignee": None, "created_at": _now(30), "meta": {"cluster": "A"}},
    {"id": str(uuid.uuid4()), "module": "Hotspot", "title": "UPI fraud density rising — Andheri", "severity": "medium", "status": "New", "assignee": None, "created_at": _now(15), "meta": {"city": "Mumbai"}},
    {"id": str(uuid.uuid4()), "module": "Transcript", "title": "ED impersonation transcript — Delhi", "severity": "high", "status": "Escalated", "assignee": "Insp. R. Sharma", "created_at": _now(240), "meta": {}},
    {"id": str(uuid.uuid4()), "module": "Citizen Report", "title": "Loan-app harassment", "severity": "medium", "status": "Resolved", "assignee": "Insp. K. Nair", "created_at": _now(720), "meta": {}},
    {"id": str(uuid.uuid4()), "module": "Counterfeit Seizure", "title": "₹200 fake — Chandni Chowk", "severity": "medium", "status": "Under Review", "assignee": "Insp. R. Sharma", "created_at": _now(300), "meta": {}},
    {"id": str(uuid.uuid4()), "module": "Graph Cluster", "title": "Ring-B: cross-account funnel", "severity": "high", "status": "Under Review", "assignee": "SI A. Patel", "created_at": _now(400), "meta": {"cluster": "B"}},
    {"id": str(uuid.uuid4()), "module": "Hotspot", "title": "Cybercrime hotspot — Koramangala", "severity": "medium", "status": "New", "assignee": None, "created_at": _now(55), "meta": {"city": "Bengaluru"}},
    {"id": str(uuid.uuid4()), "module": "Citizen Report", "title": "QR-scan refund scam", "severity": "medium", "status": "Resolved", "assignee": "SI P. Kaur", "created_at": _now(900), "meta": {}},
    {"id": str(uuid.uuid4()), "module": "Transcript", "title": "Customs impersonation call", "severity": "high", "status": "New", "assignee": None, "created_at": _now(45), "meta": {}},
    {"id": str(uuid.uuid4()), "module": "Graph Cluster", "title": "Ring-C: southern mule network", "severity": "medium", "status": "New", "assignee": None, "created_at": _now(600), "meta": {"cluster": "C"}},
]


SEED_ALERTS = [
    {"id": str(uuid.uuid4()), "type": "scam", "severity": "high", "title": "Digital-arrest attempt — Delhi", "status": "New", "created_at": _now(3)},
    {"id": str(uuid.uuid4()), "type": "counterfeit", "severity": "high", "title": "Fake ₹500 bundle seized — Pune", "status": "Under Review", "created_at": _now(20)},
    {"id": str(uuid.uuid4()), "type": "graph", "severity": "high", "title": "New cross-cluster edge detected", "status": "New", "created_at": _now(9)},
    {"id": str(uuid.uuid4()), "type": "hotspot", "severity": "medium", "title": "Rising UPI complaints — Andheri", "status": "New", "created_at": _now(35)},
    {"id": str(uuid.uuid4()), "type": "scam", "severity": "medium", "title": "TRAI disconnection scam surge", "status": "New", "created_at": _now(60)},
]


SAMPLE_TRANSCRIPTS = [
    {"id": "t1", "title": "CBI Digital Arrest — Delhi", "transcript":
     "Caller: Sir, this is Inspector Verma from CBI headquarters. Your Aadhaar number has been used in a money-laundering case registered in Mumbai. Right now a warrant has been issued in your name. You cannot cut this video call — we are recording. If you disconnect, a team will reach your home in 30 minutes. You must transfer ₹1,20,000 to the RBI verification account I share, otherwise you will be arrested tonight.\nCitizen: Sir but I have not done anything...\nCaller: Do not argue. Your bank account is linked to Nawab Singh Chauhan drug case. Stay on video. Now go to your banking app and do exactly what I say."},
    {"id": "t2", "title": "ED Threat — Mumbai", "transcript":
     "Caller: Madam, ED here. We have your PAN linked to a hawala transaction of 8.5 lakhs. I am sending you a warrant on WhatsApp. Do not tell anyone. You must remain on this call and share your screen. Immediate deposit of ₹80,000 as ‘case bond’ is required. Otherwise arrest warrant is already active."},
    {"id": "t3", "title": "Customs Parcel Scam", "transcript":
     "Caller: Hello, Customs department. A parcel in your name from Bangkok has been seized. Contents include narcotics and a fake passport. Mumbai Police is on the line as well. Kindly transfer ₹95,000 into this account for verification, otherwise FIR will be filed."},
]
