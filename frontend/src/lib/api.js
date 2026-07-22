import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API, timeout: 60000 });

export const endpoints = {
  kpis: () => api.get("/kpis").then(r => r.data),
  scamCheck: (text, language) => api.post("/scam/check", { text, language }).then(r => r.data),
  scamList: () => api.get("/scam/checks").then(r => r.data),
  reportNcrb: (payload) => api.post("/scam/report-ncrb", payload).then(r => r.data),
  transcriptSamples: () => api.get("/transcript/samples").then(r => r.data),
  transcriptAnalyze: (transcript) => api.post("/transcript/analyze", { transcript }).then(r => r.data),
  mhaDraft: (payload) => api.post("/transcript/mha-draft", payload).then(r => r.data),
  counterfeitAnalyze: (file) => {
    const fd = new FormData(); fd.append("file", file);
    return api.post("/counterfeit/analyze", fd, { headers: { "Content-Type": "multipart/form-data" } }).then(r => r.data);
  },
  counterfeitBulk: (files) => {
    const fd = new FormData();
    files.forEach(f => fd.append("files", f));
    return api.post("/counterfeit/bulk-analyze", fd, { headers: { "Content-Type": "multipart/form-data" } }).then(r => r.data);
  },
  counterfeitList: () => api.get("/counterfeit").then(r => r.data),
  counterfeitLog: (payload) => api.post("/counterfeit/log-seizure", payload).then(r => r.data),
  graph: () => api.get("/graph").then(r => r.data),
  intelReport: (cluster_id) => api.post("/graph/intelligence-report", { cluster_id }).then(r => r.data),
  hotspots: (crime_type) => api.get("/hotspots", { params: { crime_type } }).then(r => r.data),
  patrolPriority: () => api.get("/hotspots/priority").then(r => r.data),
  cases: () => api.get("/cases").then(r => r.data),
  updateCase: (id, payload) => api.patch(`/cases/${id}`, payload).then(r => r.data),
  caseAudits: (id) => api.get(`/cases/${id}/audits`).then(r => r.data),
  officers: () => api.get("/officers").then(r => r.data),
  alerts: () => api.get("/alerts").then(r => r.data),
  simulateAlert: () => api.post("/alerts/simulate").then(r => r.data),
  analytics: () => api.get("/analytics").then(r => r.data),
};
