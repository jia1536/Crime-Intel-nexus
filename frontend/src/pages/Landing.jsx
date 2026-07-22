import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useRole } from "@/lib/role";
import { Shield, User, Radio, Radar, ArrowRight, Lock, Activity, KeyRound } from "lucide-react";
import { Input } from "@/components/ui/input";

const ROLES = [
  { id: "citizen", title: "Citizen", subtitle: "Fraud Shield", desc: "Instantly verify a suspicious call, message or payment request with AI.", icon: User, tone: "from-blue-500/20" },
  { id: "officer", title: "Officer", subtitle: "Field Console", desc: "Analyze scam transcripts, verify counterfeit notes, and manage cases.", icon: Radio, tone: "from-amber-500/20" },
  { id: "admin", title: "Command Centre", subtitle: "Admin", desc: "Fraud-ring graph, geospatial heatmaps, and intelligence reports.", icon: Radar, tone: "from-red-500/20" },
];

export default function Landing() {
  const { setRole, setName, name } = useRole();
  const [n, setN] = useState(name || "");
  const nav = useNavigate();

  const enter = (r) => {
    setName(n || "Demo User");
    setRole(r);
    if (r === "citizen") nav("/citizen");
    else if (r === "officer") nav("/officer");
    else nav("/admin");
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: "#0B1120", color: "#F8FAFC" }}>
      <div className="grid-bg absolute inset-0 opacity-40 pointer-events-none" />
      <div className="absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full blur-3xl" style={{ background: "radial-gradient(closest-side, rgba(59,130,246,0.35), transparent)" }} />
      <div className="absolute -bottom-40 -left-40 h-[420px] w-[420px] rounded-full blur-3xl" style={{ background: "radial-gradient(closest-side, rgba(239,68,68,0.25), transparent)" }} />

      <header className="max-w-[1400px] mx-auto px-8 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#3B82F6" }}>
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="font-display font-bold text-lg">SentinelGrid</div>
            <div className="text-[10px] uppercase tracking-widest text-slate-400">Public Safety Intelligence</div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400 pulse-red" style={{ boxShadow: "0 0 8px #10B981" }} />
          Live · Delhi / Mumbai / Bengaluru / Pune
        </div>
      </header>

      <section className="max-w-[1400px] mx-auto px-8 pt-8 pb-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-widest text-slate-300 mb-6">
              <Activity className="h-3 w-3 text-blue-400" /> Operational · v1.0
            </div>
            <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight">
              Disrupt digital fraud <br />
              <span className="text-slate-400">before it hits the ledger.</span>
            </h1>
            <p className="mt-6 max-w-xl text-slate-300 text-base leading-relaxed">
              A unified command surface for citizens, field officers and intelligence teams — detecting scam calls, counterfeit notes and organised fraud rings in real time.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-xl">
              <Input
                data-testid="landing-name-input"
                placeholder="Enter your name (mock login)"
                value={n}
                onChange={(e) => setN(e.target.value)}
                className="h-12 rounded-full bg-white/5 border-white/10 text-slate-100 placeholder:text-slate-500"
              />
              <div className="text-xs text-slate-500 flex items-center gap-2 sm:pl-2">
                <Lock className="h-3.5 w-3.5" /> No password — demo only
              </div>
            </div>

            <div className="mt-6 flex items-center gap-6 text-xs text-slate-400">
              <div><span className="font-display text-2xl text-white block leading-none">4,812</span>scam checks · today</div>
              <div><span className="font-display text-2xl text-white block leading-none">37</span>counterfeit seizures</div>
              <div><span className="font-display text-2xl text-white block leading-none">3</span>active fraud rings</div>
            </div>

            <div className="mt-8">
              <Link to="/login" data-testid="officer-signin" className="inline-flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200 transition-colors">
                <KeyRound className="h-4 w-4"/> Officer & Admin sign-in <ArrowRight className="h-4 w-4"/>
              </Link>
              <div className="text-xs text-slate-500 mt-1">Real accounts unlock audit trail on every case action.</div>
            </div>
          </div>

          <div className="lg:col-span-5 grid gap-4">
            {ROLES.map(({ id, title, subtitle, desc, icon: Icon, tone }) => (
              <button
                key={id}
                data-testid={`enter-${id}`}
                onClick={() => enter(id)}
                className="group text-left rounded-2xl p-6 border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-colors relative overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${tone} to-transparent opacity-60 pointer-events-none`} />
                <div className="relative flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-slate-400">{subtitle}</div>
                        <div className="font-display font-bold text-xl">{title}</div>
                      </div>
                      <ArrowRight className="h-5 w-5 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <p className="mt-2 text-sm text-slate-300 leading-relaxed">{desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
