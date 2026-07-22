# SentinelGrid — Product Requirements

## Problem statement (verbatim)
Build a full-stack web app called "SentinelGrid" — an AI-powered Digital Public Safety Intelligence Platform for law enforcement, banks, and citizens to detect and disrupt digital fraud, counterfeit currency, and organised scam networks in real time. Role-based (Citizen, Officer, Command Centre Admin) with mock name+role login. Cohesive one-platform demo for a hackathon panel.

## Architecture
- Backend: FastAPI + MongoDB (motor) + WebSocket. Routes prefixed `/api`. JWT auth (bcrypt) via `auth_module.py`.
- Frontend: React (CRA) + TailwindCSS + shadcn/ui + Sonner + Lucide + react-force-graph-2d + react-leaflet + jsPDF + Recharts.
- LLM: Gemini 3 Flash via emergentintegrations using EMERGENT_LLM_KEY.
- Theming: dark navy (#0B1120) Officer/Admin, off-white (#F8FAFC) Citizen. Manrope headings, Inter body.

## Personas
- Citizen — quick verify a scam call/message/payment (mock role select).
- Officer — transcript analysis, currency forensics, bulk scanner, case triage (real login).
- Command Centre Admin — KPIs, live alerts, network graph, geospatial map, analytics, intel reports.

## What's implemented
### Iteration 1 (Feb 2026)
- Landing page with 3-role selector + mock name login.
- Navbar with role-switcher + per-role module nav.
- Citizen Fraud Shield chat: EN/HI toggle, 4 sample scenarios, animated verdict card, NCRB report.
- Officer Digital Arrest Analyzer with inline phrase highlights + MHA advisory draft.
- Officer Counterfeit Agent: single-note image upload + verdict + checklist + seizure logging.
- Admin Fraud Network Graph: force-directed canvas, cluster intel reports, jsPDF export.
- Admin Geospatial Map: react-leaflet + CARTO Dark, severity markers, patrol priority.
- Admin Command Centre Dashboard: KPI cards, live alert feed + quick-nav.
- Case & Alert Management table with status filters + detail drawer.
- Auto-seed on startup: 17 scam checks, 12 counterfeit, 27-node/43-edge graph, ~35 hotspots, 12 cases, 5 alerts.

### Iteration 2 (Feb 2026)
- **JWT Officer Auth**: `/api/auth/{login,register,me}` with bcrypt. 5 seeded accounts (1 admin + 4 officers). `/login` page + demo prefill cards. `optional_user` dependency attaches user identity to case updates.
- **Audit trail**: `audits` collection records every case status/assignee change with who/before/after/at. `/api/cases/{id}/audits` endpoint. Rendered as a diff-style trail in the case sheet.
- **WebSocket realtime alerts**: `/api/ws/alerts` + background ticker broadcasting every 20s + on-demand `simulateAlert`/`scam/check`. Frontend LiveAlertFeed connects via `wss://` and shows a "Streams · Live" pill; toasts fire instantly on every broadcast.
- **Bulk Note Scanner**: `/officer/bulk-counterfeit` — multi-image upload (up to 12), per-note verdict table, "Log bundle seizure" writes one case with a summary title.
- **Analytics tab**: `/admin/analytics` — 6 Recharts panels (7-day scam trend, verdict pie, denomination bars, note-verdict pie, case-status bars, top cities). `/api/analytics` aggregates in one call.

## Backlog / next
- P1: Push notifications when case is assigned to me (per-officer WS filter).
- P2: MHA advisory email/SMS dispatch (integration).
- P2: Export analytics dashboard to a printable PDF briefing.
- P2: Graph search (find node by phone/account) + saved cluster views.
- P2: Officer roles/permissions (e.g. only admin can escalate).
