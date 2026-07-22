import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { endpoints } from "@/lib/api";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SeverityDot } from "@/components/Verdict";
import { Files, User, History } from "lucide-react";
import { toast } from "sonner";

const STATUS = ["New", "Under Review", "Escalated", "Resolved"];
const STATUS_COLOR = {
  "New": "text-blue-300 bg-blue-500/10 border-blue-500/30",
  "Under Review": "text-amber-300 bg-amber-500/10 border-amber-500/30",
  "Escalated": "text-red-300 bg-red-500/10 border-red-500/30",
  "Resolved": "text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
};

export default function CasesTable() {
  const [cases, setCases] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [active, setActive] = useState(null);
  const [audits, setAudits] = useState([]);
  const [filter, setFilter] = useState("all");

  const load = () => endpoints.cases().then(setCases);
  useEffect(() => { load(); endpoints.officers().then(setOfficers); }, []);

  useEffect(() => {
    if (active?.id) endpoints.caseAudits(active.id).then(setAudits);
    else setAudits([]);
  }, [active?.id]);

  const update = async (id, patch) => {
    const doc = await endpoints.updateCase(id, patch);
    setCases(cs => cs.map(c => c.id === id ? doc : c));
    if (active?.id === id) { setActive(doc); endpoints.caseAudits(id).then(setAudits); }
    toast.success("Case updated");
  };

  const filtered = filter === "all" ? cases : cases.filter(c => c.status === filter);

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-blue-400">Case Management</div>
          <h1 className="font-display font-bold text-3xl sm:text-4xl tracking-tight mt-1">Alerts & Incidents</h1>
          <p className="text-slate-400 mt-1">Every flagged event across modules — assign, escalate, resolve.</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {["all", ...STATUS].map(s => (
            <button key={s} data-testid={`filter-${s.toLowerCase().replace(/\s+/g,'-')}`}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full border transition-colors ${filter === s ? "bg-white text-slate-900 border-white" : "border-white/10 text-slate-300 hover:bg-white/5"}`}>
              {s === "all" ? "All" : s} {s !== "all" && <span className="opacity-60">({cases.filter(c=>c.status===s).length})</span>}
            </button>
          ))}
        </div>
      </div>

      <Card className="mt-6 rounded-2xl glass-dark border-white/10 overflow-hidden">
        <div className="grid grid-cols-12 px-4 py-3 text-[11px] uppercase tracking-widest text-slate-400 border-b border-white/5">
          <div className="col-span-5">Case</div>
          <div className="col-span-2">Module</div>
          <div className="col-span-2">Assignee</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1 text-right">Sev</div>
        </div>
        <div className="divide-y divide-white/5" data-testid="cases-table">
          {filtered.map((c) => (
            <button key={c.id} onClick={() => setActive(c)} data-testid={`case-row-${c.id}`}
              className="w-full grid grid-cols-12 px-4 py-3 text-left items-center hover:bg-white/[0.03] transition-colors">
              <div className="col-span-5">
                <div className="text-sm font-medium text-slate-100">{c.title}</div>
                <div className="text-[11px] text-slate-500">{new Date(c.created_at).toLocaleString()}</div>
              </div>
              <div className="col-span-2 text-xs text-slate-300">{c.module}</div>
              <div className="col-span-2 text-xs text-slate-300 flex items-center gap-1.5">
                {c.assignee ? <><User className="h-3.5 w-3.5 opacity-60"/>{c.assignee}</> : <span className="text-slate-500 italic">Unassigned</span>}
              </div>
              <div className="col-span-2">
                <span className={`text-[11px] px-2 py-1 rounded-full border ${STATUS_COLOR[c.status] || "text-slate-300 bg-white/5 border-white/10"}`}>{c.status}</span>
              </div>
              <div className="col-span-1 text-right"><SeverityDot severity={c.severity} /></div>
            </button>
          ))}
          {filtered.length === 0 && <div className="p-6 text-sm text-slate-500">No cases in this view.</div>}
        </div>
      </Card>

      <Sheet open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent side="right" className="bg-[#0B1120] text-slate-100 border-white/10 w-full sm:max-w-lg">
          {active && (
            <>
              <SheetHeader>
                <SheetTitle className="text-slate-100 font-display">{active.title}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4 text-sm">
                <div className="flex items-center gap-2">
                  <SeverityDot severity={active.severity} />
                  <span className="text-slate-300 capitalize">{active.severity} severity</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-400">{active.module}</span>
                </div>
                <div className="text-xs text-slate-400">Created {new Date(active.created_at).toLocaleString()}</div>

                <div>
                  <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-2">Status</div>
                  <Select value={active.status} onValueChange={(v) => update(active.id, { status: v })}>
                    <SelectTrigger data-testid="case-status" className="bg-white/5 border-white/10 text-slate-100"><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-2">Assign officer</div>
                  <Select value={active.assignee || ""} onValueChange={(v) => update(active.id, { assignee: v })}>
                    <SelectTrigger data-testid="case-assignee" className="bg-white/5 border-white/10 text-slate-100"><SelectValue placeholder="Choose officer" /></SelectTrigger>
                    <SelectContent>{officers.map(o => <SelectItem key={o.id} value={o.name}>{o.name} · {o.unit}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                {active.meta && Object.keys(active.meta).length > 0 && (
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-2">Metadata</div>
                    <pre className="rounded-xl bg-black/40 border border-white/10 p-3 text-xs text-slate-300 font-mono overflow-x-auto">{JSON.stringify(active.meta, null, 2)}</pre>
                  </div>
                )}

                <div>
                  <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5"><History className="h-3.5 w-3.5"/> Audit trail</div>
                  <div className="space-y-2 max-h-64 overflow-y-auto scroll-thin pr-1" data-testid="audit-trail">
                    {audits.length === 0 && <div className="text-xs text-slate-500 italic">No changes yet.</div>}
                    {audits.map(a => (
                      <div key={a.id} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="text-slate-200 font-medium">{a.who}</div>
                          <div className="text-slate-500">{new Date(a.at).toLocaleString()}</div>
                        </div>
                        <div className="text-slate-400 mt-0.5">{a.action}</div>
                        {a.before && a.after && (
                          <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                            {Object.keys(a.after).map(k => (
                              <span key={k} className="rounded-full bg-white/5 px-2 py-0.5 text-slate-300">
                                <span className="text-slate-500">{k}:</span>{" "}
                                <span className="text-slate-400 line-through">{String(a.before?.[k] ?? "—")}</span>{" → "}
                                <span className="text-blue-300">{String(a.after?.[k] ?? "—")}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
