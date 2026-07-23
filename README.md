# SentinelGrid

**AI-powered Digital Public Safety Intelligence Platform for citizens, officers and command centres — detecting digital fraud, counterfeit currency and organised scam networks in real time.**

Built for hackathon judging. Fully seeded, fully live, one cohesive command surface.

---

## What it does

SentinelGrid is a single platform with three surfaces, one shared case system and a live intelligence feed:

| Role | What they get |
|------|---------------|
| **Citizen** | A chat-style Fraud Shield (English + Hindi) that verifies a suspicious call, message or payment request in seconds — verdict, confidence, red-flag signals, one-tap NCRB report. |
| **Officer** | Digital Arrest scam transcript analyzer with inline phrase highlights + MHA advisory draft, a single-note counterfeit currency verifier, a bulk note scanner (up to 12 notes at once), and the shared case table. |
| **Command Centre Admin** | Live KPI dashboard, WebSocket alert feed, force-directed fraud-ring graph with LLM intelligence reports (PDF export), geospatial hotspot map with patrol priority ranking, and a Recharts analytics tab. |

Every case action (status change, assignee change, seizure log) writes to an audit trail that shows who did what and when.

---

## Stack

- **Frontend**: React (CRA) · TailwindCSS · shadcn/ui · Sonner · Lucide · react-force-graph-2d · react-leaflet · Recharts · jsPDF
- **Backend**: FastAPI · MongoDB (motor) · WebSocket · JWT + bcrypt
- **AI**: Gemini 3 Flash via `emergentintegrations` (text + vision) with a rules-based fallback so demos never break
- **Maps**: OpenStreetMap (CARTO Dark tiles), no API key required

---

## Live demo
Frontend: [crime-intel-nexus-ol0g5zqn6-jia1536s-projects.vercel.app](https://crime-intel-nexus.vercel.app/)


Seeded on first load: 17 scam checks · 12 counterfeit records · 27-node/43-edge fraud graph across 3 rings · ~35 geospatial hotspots (Delhi/Mumbai/Bengaluru/Pune) · 12 cases · 5 alerts.

---

## Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Command Centre Admin | `admin@sentinelgrid.gov.in` | `admin@123` |
| Officer (Delhi) | `sharma@delhi.police.in` | `officer@123` |
| Officer (Mumbai) | `patel@mumbai.police.in` | `officer@123` |
| Officer (Bengaluru) | `nair@bengaluru.police.in` | `officer@123` |
| Officer (Pune) | `kaur@pune.police.in` | `officer@123` |

Citizens don't need to log in — just click **Citizen** on the landing page.

---

## Suggested demo path (3 minutes)

1. **Landing** → click **Citizen** → try a sample scam scenario → watch the animated verdict card.
2. Switch role (top-right dropdown) to **Command Centre** → skim the KPIs and live alert feed.
3. Open **Fraud Graph** → click a cluster → **Generate Intelligence Report** → **Export PDF**.
4. Open **Crime Map** → filter by *scam* → check the patrol-priority list on the right.
5. Open **Analytics** → 6 live charts.
6. Open **Cases** → click any row → change status → see the audit trail update with your officer name.

---

## Running it locally

### Prerequisites
- Python 3.11+
- Node.js 18+ / yarn
- MongoDB running locally (default port 27017)

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env      # then fill in EMERGENT_LLM_KEY + JWT_SECRET
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend
```bash
cd frontend
yarn install
cp .env.example .env      # then set REACT_APP_BACKEND_URL=http://localhost:8001
yarn start
```

The frontend runs on http://localhost:3000 and talks to the backend via `REACT_APP_BACKEND_URL`. Seed data is written automatically to MongoDB on the first backend boot.

---

## Repo layout

```
/app
├── backend/
│   ├── server.py             # FastAPI app, all /api routes, WebSocket, seed
│   ├── auth_module.py        # JWT + bcrypt, seeded officer accounts
│   ├── seed_data.py          # Scam checks, counterfeit, graph, hotspots, cases, alerts
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.js            # Router
│   │   ├── pages/            # Landing, Login, Citizen chat, Officer & Admin surfaces, Cases
│   │   ├── components/       # Navbar, LiveAlertFeed, Verdict, shadcn/ui
│   │   └── lib/              # api, auth, role, i18n
│   └── package.json
├── memory/
│   ├── PRD.md                # Product spec + implementation log
│   └── test_credentials.md   # Same accounts as above
└── README.md
```

---

## Security notes

- Passwords are bcrypt-hashed in MongoDB. JWTs are signed with `HS256` using `JWT_SECRET`.
- JWT is currently stored in `localStorage` for demo simplicity — production should use `httpOnly` + `Secure` + `SameSite=Strict` cookies (a comment in `frontend/src/lib/auth.jsx` marks this tradeoff).
- Never commit `.env` files. Use `.env.example` (already provided) as the template.

---

## Design language

- **Dark** (`#0B1120`) for Officer + Command Centre surfaces — ops-room feel.
- **Light** (`#F8FAFC`) for Citizen surfaces — approachable + calm.
- Consistent risk palette: blue (neutral) · amber (medium) · red (high / confirmed) · green (safe / genuine).
- Manrope headings, Inter body, JetBrains Mono for identifiers.

---

## Team & attribution
1)Jiya — frontend & citizen flow; 
2)Kanhaiya — backend & LLM integration; 3)Harshada — graph/geospatial modules


