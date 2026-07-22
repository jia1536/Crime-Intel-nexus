const map = {
  "Confirmed Scam": { color: "#EF4444", bg: "bg-red-500/10", ring: "ring-red-500/40", label: "Confirmed Scam" },
  "High": { color: "#EF4444", bg: "bg-red-500/10", ring: "ring-red-500/40", label: "High Risk" },
  "Medium": { color: "#F59E0B", bg: "bg-amber-500/10", ring: "ring-amber-500/40", label: "Medium Risk" },
  "Low": { color: "#10B981", bg: "bg-emerald-500/10", ring: "ring-emerald-500/40", label: "Low Risk" },
  "Suspected Fake": { color: "#EF4444", bg: "bg-red-500/10", ring: "ring-red-500/40", label: "Suspected Fake" },
  "Genuine": { color: "#10B981", bg: "bg-emerald-500/10", ring: "ring-emerald-500/40", label: "Genuine" },
  "Uncertain": { color: "#F59E0B", bg: "bg-amber-500/10", ring: "ring-amber-500/40", label: "Uncertain" },
};

export function verdictStyle(v) {
  return map[v] || { color: "#94A3B8", bg: "bg-slate-500/10", ring: "ring-slate-500/40", label: v || "Unknown" };
}

export function VerdictBadge({ verdict, className = "" }) {
  const s = verdictStyle(verdict);
  return (
    <span data-testid="verdict-badge"
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ${s.bg} ${s.ring} ${className}`}
      style={{ color: s.color }}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
      {s.label}
    </span>
  );
}

export function SeverityDot({ severity, className = "" }) {
  const c = severity === "high" ? "#EF4444" : severity === "medium" ? "#F59E0B" : "#10B981";
  return <span className={`inline-block h-2 w-2 rounded-full ${className}`} style={{ backgroundColor: c }} />;
}
