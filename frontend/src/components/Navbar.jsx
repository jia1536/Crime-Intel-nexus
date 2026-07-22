import { Link, useNavigate, useLocation } from "react-router-dom";
import { useRole } from "@/lib/role";
import { Shield, LayoutDashboard, MessageSquareWarning, ScanLine, Radar, Map as MapIcon, Files, ChevronDown, LogOut, BarChart3, Layers } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";

const NAV_BY_ROLE = {
  citizen: [{ to: "/citizen", label: "Fraud Shield", icon: MessageSquareWarning }],
  officer: [
    { to: "/officer", label: "Dashboard", icon: LayoutDashboard },
    { to: "/officer/transcript", label: "Scam Analyzer", icon: MessageSquareWarning },
    { to: "/officer/counterfeit", label: "Counterfeit", icon: ScanLine },
    { to: "/officer/bulk-counterfeit", label: "Bulk Scanner", icon: Layers },
    { to: "/cases", label: "Cases", icon: Files },
  ],
  admin: [
    { to: "/admin", label: "Command Centre", icon: LayoutDashboard },
    { to: "/admin/graph", label: "Fraud Graph", icon: Radar },
    { to: "/admin/map", label: "Crime Map", icon: MapIcon },
    { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/officer/counterfeit", label: "Counterfeit", icon: ScanLine },
    { to: "/cases", label: "Cases", icon: Files },
  ],
};

const ROLE_LABEL = { citizen: "Citizen", officer: "Officer", admin: "Command Centre" };

export default function Navbar() {
  const { role, setRole, name, setName } = useRole();
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  if (!role) return null;
  const isDark = role === "officer" || role === "admin";
  const items = NAV_BY_ROLE[role] || [];

  const switchRole = (r) => {
    setRole(r);
    if (r === "citizen") nav("/citizen");
    else if (r === "officer") nav("/officer");
    else nav("/admin");
  };

  return (
    <header
      data-testid="app-navbar"
      className={`fixed top-0 inset-x-0 z-50 ${isDark ? "glass-dark" : "glass-light"} border-b`}
      style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}
    >
      <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2" data-testid="brand-link">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#3B82F6" }}>
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div className="leading-tight">
            <div className="font-display font-bold text-[15px]">SentinelGrid</div>
            <div className="text-[10px] uppercase tracking-widest text-slate-400">Public Safety Intelligence</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1 ml-4">
          {items.map(({ to, label, icon: Icon }) => {
            const active = loc.pathname === to;
            return (
              <Link key={to} to={to} data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
                className={`px-3 py-2 rounded-full text-sm flex items-center gap-2 transition-colors
                  ${active
                    ? (isDark ? "bg-white/10 text-white" : "bg-slate-900 text-white")
                    : (isDark ? "text-slate-300 hover:text-white hover:bg-white/5" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100")}`}>
                <Icon className="h-4 w-4" /> {label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button data-testid="role-switcher"
                className={`px-3 py-2 rounded-full text-sm flex items-center gap-2 border transition-colors
                  ${isDark ? "border-white/10 hover:bg-white/5 text-slate-200" : "border-slate-200 hover:bg-slate-100 text-slate-700"}`}>
                <span className="text-xs uppercase tracking-widest text-slate-400">View</span>
                <span className="font-medium">{ROLE_LABEL[role]}</span>
                <ChevronDown className="h-4 w-4 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Switch role</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => switchRole("citizen")} data-testid="switch-citizen">Citizen — Fraud Shield</DropdownMenuItem>
              <DropdownMenuItem onClick={() => switchRole("officer")} data-testid="switch-officer">Officer — Field Console</DropdownMenuItem>
              <DropdownMenuItem onClick={() => switchRole("admin")} data-testid="switch-admin">Command Centre — Admin</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { logout(); setRole(""); setName(""); nav("/"); }} data-testid="signout">
                <LogOut className="h-4 w-4 mr-2" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {(user?.name || name) && (
            <span className={`hidden sm:inline text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              {user?.name || name}{user?.unit ? ` · ${user.unit}` : ""}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
