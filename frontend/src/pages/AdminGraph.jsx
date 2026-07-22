import { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { endpoints } from "@/lib/api";
import { FileDown, Loader2, Radar, Phone, Landmark, Smartphone, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";

const TYPE_COLOR = { phone: "#3B82F6", account: "#F59E0B", device: "#10B981", victim: "#EF4444" };
const TYPE_ICON = { phone: Phone, account: Landmark, device: Smartphone, victim: UserIcon };
const CLUSTER_NAMES = { A: "Ring A · Delhi", B: "Ring B · Mumbai", C: "Ring C · South" };

export default function AdminGraph() {
  const [data, setData] = useState({ nodes: [], edges: [] });
  const [selected, setSelected] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dims, setDims] = useState({ w: 800, h: 560 });
  const boxRef = useRef(null);
  const fgRef = useRef(null);

  useEffect(() => { endpoints.graph().then(setData); }, []);

  useEffect(() => {
    const update = () => {
      if (boxRef.current) {
        setDims({ w: boxRef.current.offsetWidth, h: 560 });
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const graph = useMemo(() => ({
    nodes: data.nodes.map((n) => ({ ...n })),
    links: data.edges.map((e) => ({ ...e })),
  }), [data]);

  const runReport = async (cluster) => {
    setLoading(true); setReport(null);
    try {
      const [r] = await Promise.all([
        endpoints.intelReport(cluster),
        new Promise((res) => setTimeout(res, 1500)),
      ]);
      setReport({ cluster, ...r });
    } catch { toast.error("Report failed"); }
    finally { setLoading(false); }
  };

  const exportPdf = () => {
    if (!report) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    let y = 60;
    doc.setFont("helvetica", "bold"); doc.setFontSize(18);
    doc.text(`SentinelGrid — Intelligence Report`, 40, y); y += 24;
    doc.setFontSize(12); doc.setFont("helvetica", "normal");
    doc.text(CLUSTER_NAMES[report.cluster] || report.cluster, 40, y); y += 20;
    doc.text(`Risk Level: ${report.risk_level?.toUpperCase()}`, 40, y); y += 24;
    doc.setFont("helvetica", "bold"); doc.text(report.title || "Report", 40, y); y += 20;
    doc.setFont("helvetica", "normal");
    const wrap = (t) => doc.splitTextToSize(t, 515);
    wrap(report.executive_summary || "").forEach(line => { doc.text(line, 40, y); y += 16; });
    y += 6;
    doc.setFont("helvetica","bold"); doc.text("Key Findings", 40, y); y += 16; doc.setFont("helvetica","normal");
    (report.key_findings || []).forEach(k => { wrap("• " + k).forEach(line => { doc.text(line, 40, y); y += 14; }); });
    y += 6;
    doc.setFont("helvetica","bold"); doc.text("Recommended Actions", 40, y); y += 16; doc.setFont("helvetica","normal");
    (report.recommended_actions || []).forEach(k => { wrap("• " + k).forEach(line => { doc.text(line, 40, y); y += 14; }); });
    doc.save(`SentinelGrid_${report.cluster}_Report.pdf`);
  };

  const clusters = ["A", "B", "C"];

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      <div>
        <div className="text-[11px] uppercase tracking-widest text-blue-400">Command Centre · Intelligence</div>
        <h1 className="font-display font-bold text-3xl sm:text-4xl tracking-tight mt-1">Fraud Network Graph</h1>
        <p className="text-slate-400 mt-2 max-w-2xl">Phones, mule accounts, devices and victims — mapped as a live force-directed network. Click any node for details.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
        <Card className="lg:col-span-8 rounded-2xl p-4 glass-dark border-white/10 overflow-hidden" data-testid="graph-canvas">
          <div ref={boxRef} className="rounded-xl bg-black/40 border border-white/5" style={{ height: 560 }}>
            {graph.nodes.length > 0 && (
              <ForceGraph2D
                ref={fgRef}
                graphData={graph}
                width={dims.w - 32}
                height={dims.h}
                backgroundColor="rgba(0,0,0,0)"
                nodeRelSize={5}
                linkColor={() => "rgba(148,163,184,0.35)"}
                linkWidth={1}
                nodeCanvasObject={(node, ctx, scale) => {
                  const r = node.risk === "high" ? 6 : node.risk === "medium" ? 5 : 4;
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
                  ctx.fillStyle = TYPE_COLOR[node.type] || "#94A3B8";
                  ctx.fill();
                  if (node.risk === "high") {
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, r + 4, 0, 2 * Math.PI);
                    ctx.strokeStyle = "rgba(239,68,68,0.55)";
                    ctx.lineWidth = 1.2; ctx.stroke();
                  }
                  if (scale > 1.5) {
                    ctx.fillStyle = "#E2E8F0"; ctx.font = "10px Inter";
                    ctx.fillText(node.label, node.x + 8, node.y + 3);
                  }
                }}
                onNodeClick={(n) => setSelected(n)}
                cooldownTicks={80}
              />
            )}
          </div>
          <div className="flex items-center flex-wrap gap-3 mt-3 text-xs text-slate-400">
            {Object.entries(TYPE_COLOR).map(([k,v]) => (
              <div key={k} className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: v }} /> {k}</div>
            ))}
          </div>
        </Card>

        <div className="lg:col-span-4 space-y-4">
          <Card className="rounded-2xl p-5 glass-dark border-white/10">
            <div className="text-sm text-slate-300 flex items-center gap-2"><Radar className="h-4 w-4 text-blue-400"/> Clusters</div>
            <div className="mt-3 space-y-2">
              {clusters.map((c) => {
                const count = data.nodes.filter(n => n.cluster === c).length;
                return (
                  <button key={c} data-testid={`cluster-${c}`} onClick={() => runReport(c)}
                    className="w-full text-left px-3 py-2 rounded-xl border border-white/10 hover:bg-white/5 transition-colors flex items-center justify-between">
                    <div>
                      <div className="text-sm text-slate-100 font-medium">{CLUSTER_NAMES[c]}</div>
                      <div className="text-xs text-slate-400">{count} nodes</div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-300 border border-red-500/30">HIGH</span>
                  </button>
                );
              })}
            </div>
          </Card>

          {selected && (
            <Card className="rounded-2xl p-5 glass-dark border-white/10" data-testid="node-detail">
              <div className="text-[11px] uppercase tracking-widest text-slate-400">Selected node</div>
              <div className="font-display font-semibold text-lg mt-1">{selected.label}</div>
              <div className="mt-2 text-xs text-slate-400">Type: <span className="text-slate-200">{selected.type}</span> · Risk: <span className="text-slate-200">{selected.risk}</span> · Cluster: <span className="text-slate-200">{CLUSTER_NAMES[selected.cluster]}</span></div>
              <Button size="sm" className="mt-3 rounded-full" onClick={() => runReport(selected.cluster)}>Report cluster</Button>
            </Card>
          )}

          {(loading || report) && (
            <Card className="rounded-2xl p-5 border-white/10" style={{ background: "linear-gradient(180deg, rgba(59,130,246,0.08), rgba(17,24,39,0.6))" }} data-testid="intel-report">
              {loading && <div className="space-y-2"><div className="h-3 rounded bg-white/10 animate-pulse"/><div className="h-3 rounded bg-white/10 animate-pulse w-11/12"/><div className="h-3 rounded bg-white/10 animate-pulse w-3/4"/></div>}
              {!loading && report && (
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-blue-300">Intelligence Report</div>
                  <div className="font-display font-bold text-lg mt-1">{report.title}</div>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">{report.executive_summary}</p>
                  <div className="mt-3 text-xs text-slate-400 uppercase tracking-widest">Key findings</div>
                  <ul className="text-xs text-slate-200 list-disc pl-4 space-y-1 mt-1">{(report.key_findings||[]).map((k,i)=><li key={i}>{k}</li>)}</ul>
                  <div className="mt-3 text-xs text-slate-400 uppercase tracking-widest">Recommended actions</div>
                  <ul className="text-xs text-slate-200 list-disc pl-4 space-y-1 mt-1">{(report.recommended_actions||[]).map((k,i)=><li key={i}>{k}</li>)}</ul>
                  <Button onClick={exportPdf} className="mt-4 rounded-full w-full" data-testid="export-pdf"><FileDown className="h-4 w-4 mr-2"/>Export PDF</Button>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
