import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useRole } from "@/lib/role";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Shield, LogIn, Loader2 } from "lucide-react";
import { toast } from "sonner";

const DEMO = [
  { email: "admin@sentinelgrid.gov.in", pw: "admin@123", label: "Command Centre Admin" },
  { email: "sharma@delhi.police.in", pw: "officer@123", label: "Insp. R. Sharma · Delhi Cyber Cell" },
  { email: "patel@mumbai.police.in", pw: "officer@123", label: "SI A. Patel · Mumbai EOW" },
];

export default function Login() {
  const { login } = useAuth();
  const { setRole, setName } = useRole();
  const [email, setEmail] = useState("admin@sentinelgrid.gov.in");
  const [pw, setPw] = useState("admin@123");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  const submit = async (e) => {
    e?.preventDefault();
    setBusy(true);
    try {
      const u = await login(email, pw);
      setName(u.name);
      setRole(u.role === "admin" ? "admin" : "officer");
      toast.success(`Welcome, ${u.name}`);
      nav(u.role === "admin" ? "/admin" : "/officer");
    } catch (e2) {
      const msg = e2?.response?.data?.detail || "Login failed";
      toast.error(typeof msg === "string" ? msg : "Login failed");
    } finally { setBusy(false); }
  };

  const fill = (d) => { setEmail(d.email); setPw(d.pw); };

  return (
    <div className="min-h-screen relative flex items-center px-6" style={{ backgroundColor: "#0B1120", color: "#F8FAFC" }}>
      <div className="grid-bg absolute inset-0 opacity-40 pointer-events-none" />
      <div className="absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full blur-3xl" style={{ background: "radial-gradient(closest-side, rgba(59,130,246,0.35), transparent)" }} />

      <div className="relative z-10 max-w-[1100px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7">
          <Link to="/" className="inline-flex items-center gap-2 mb-8" data-testid="login-brand">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#3B82F6" }}><Shield className="h-5 w-5 text-white"/></div>
            <div>
              <div className="font-display font-bold text-lg">SentinelGrid</div>
              <div className="text-[10px] uppercase tracking-widest text-slate-400">Public Safety Intelligence</div>
            </div>
          </Link>
          <div className="text-[11px] uppercase tracking-widest text-blue-400">Officer sign-in</div>
          <h1 className="font-display font-bold text-4xl sm:text-5xl tracking-tight mt-2">Every action, on the record.</h1>
          <p className="text-slate-400 mt-4 max-w-xl">Signing in with an officer account attaches your name to every case status change, escalation and seizure log — creating a full audit trail your unit can defend.</p>

          <div className="mt-8">
            <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-3">Demo accounts (click to prefill)</div>
            <div className="space-y-2">
              {DEMO.map((d) => (
                <button key={d.email} onClick={() => fill(d)} data-testid={`demo-${d.email}`}
                  className="w-full text-left rounded-xl border border-white/10 px-3 py-2 hover:bg-white/5 transition-colors">
                  <div className="text-sm font-medium">{d.label}</div>
                  <div className="text-xs text-slate-400 font-mono">{d.email} · {d.pw}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <Card className="lg:col-span-5 rounded-2xl p-6 glass-dark border-white/10 self-start">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-1">Email</div>
              <Input data-testid="login-email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white/5 border-white/10 text-slate-100" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-1">Password</div>
              <Input data-testid="login-password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} className="bg-white/5 border-white/10 text-slate-100" />
            </div>
            <Button data-testid="login-submit" type="submit" disabled={busy} className="w-full rounded-full">
              {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <LogIn className="h-4 w-4 mr-2"/>}
              Sign in
            </Button>
            <div className="text-xs text-slate-500 text-center">
              Citizen? <Link to="/" className="text-blue-400 hover:underline">Continue as citizen</Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
