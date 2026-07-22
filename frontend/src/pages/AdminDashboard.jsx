import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { endpoints } from "@/lib/api";
import { AlertTriangle, ShieldAlert, Banknote, MapPin, Network, Radio, Users, ArrowRight, Files, ScanLine, Radar, BarChart3, Layers } from "lucide-react";
import { useRole } from "@/lib/role";

const KPI = [
  { key: "active_alerts", label: "Active Alerts", icon: AlertTriangle, tone: "#EF4444" },
  { key: "scams_flagged_today", label: "Scams Flagged (24h)", icon: ShieldAlert, tone: "#F59E0B" },
  { key: "counterfeit_detected", label: "Counterfeit Detected", icon: Banknote, tone: "#3B82F6" },
  { key: "high_risk_zones", label: "High-Risk Zones", icon: MapPin, tone: "#10B981" },
];

const QUICK = [
  { to: "/officer/transcript", title: "Scam Transcript", desc: "Analyze suspected digital-arrest calls", icon: Radio },
  { to: "/officer/counterfeit", title: "Currency Forensics", desc: "Verify notes with AI", icon: ScanLine },
  { to: "/officer/bulk-counterfeit", title: "Bulk Note Scanner", desc: "Analyze a whole bundle at once", icon: Layers },
  { to: "/admin/graph", title: "Fraud Graph", desc: "Explore ring clusters", icon: Radar },
  { to: "/admin/map", title: "Crime Map", desc: "Geospatial hotspots", icon: MapPin },
  { to: "/admin/analytics", title: "Analytics", desc: "Trends & distributions", icon: BarChart3 },
  { to: "/cases", title: "Cases", desc: "Manage alerts & incidents", icon: Files },
];

export default function AdminDashboard() {
  const { name } = useRole();
  const [kpis, setKpis] = useState({});
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const load = async () => {
      const [k, a] = await Promise.all([endpoints.kpis(), endpoints.alerts()]);
      setKpis(k); setAlerts(a);
    };
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-blue-400">Command Centre</div>
          <h1 className="font-display font-bold text-3xl sm:text-4xl tracking-tight mt-1">Situation Room</h1>
          <p className="text-slate-400 mt-1">Welcome{ name ? `, ${name}` : "" }. Live intelligence across all modules.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 8px #10B981" }} />
          Streams online · updated every 15s
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8" data-testid="kpi-grid">
        {KPI.map(({ key, label, icon: Icon, tone }) => (
          <Card key={key} className="rounded-2xl p-5 glass-dark border-white/10 relative overflow-hidden">
            <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full opacity-15" style={{ background: `radial-gradient(closest-side, ${tone}, transparent)` }} />
            <div className="flex items-center justify-between relative">
              <div className="text-[11px] uppercase tracking-widest text-slate-400">{label}</div>
              <Icon className="h-4 w-4" style={{ color: tone }} />
            </div>
            <div className="font-display text-4xl font-bold mt-2" style={{ color: tone }}>{kpis[key] ?? "—"}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
        <Card className="lg:col-span-8 rounded-2xl p-5 glass-dark border-white/10">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-300 flex items-center gap-2"><Network className="h-4 w-4 text-blue-400"/> Live alert feed</div>
            <div className="text-xs text-slate-500">Newest first</div>
          </div>
          <div className="mt-4 space-y-2 max-h-[520px] overflow-y-auto scroll-thin pr-1" data-testid="alert-feed">
            {alerts.map((a) => (
              <div key={a.id} className={`rounded-xl px-3 py-2.5 border flex items-center gap-3 ${a.severity === "high" ? "border-red-500/30 bg-red-500/5" : a.severity === "medium" ? "border-amber-500/30 bg-amber-500/5" : "border-white/10 bg-white/[0.03]"}`}>
                <div className={`h-2 w-2 rounded-full ${a.severity === "high" ? "bg-red-500 pulse-red" : a.severity === "medium" ? "bg-amber-400 pulse-amber" : "bg-emerald-400"}`} />
                <div className="flex-1">
                  <div className="text-sm text-slate-100">{a.title}</div>
                  <div className="text-[11px] text-slate-500 uppercase tracking-widest">{a.type} · {new Date(a.created_at).toLocaleTimeString()}</div>
                </div>
                <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">{a.status || "New"}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="lg:col-span-4 space-y-4">
          {QUICK.map(({ to, title, desc, icon: Icon }) => (
            <Link key={to} to={to} data-testid={`quicknav-${title.toLowerCase().replace(/\s+/g,'-')}`}
              className="block rounded-2xl p-4 border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center"><Icon className="h-5 w-5 text-blue-400" /></div>
                <div className="flex-1">
                  <div className="font-display font-semibold">{title}</div>
                  <div className="text-xs text-slate-400">{desc}</div>
                </div>
                <ArrowRight className="h-4 w-4 opacity-50" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
