import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, ScanLine, Banknote, Save, X, Layers } from "lucide-react";
import { endpoints } from "@/lib/api";
import { VerdictBadge } from "@/components/Verdict";
import { toast } from "sonner";

export default function OfficerBulkCounterfeit() {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const onFiles = (list) => {
    const arr = Array.from(list || []).slice(0, 12);
    setFiles(arr);
    setPreviews(arr.map(f => ({ name: f.name, url: URL.createObjectURL(f) })));
    setResult(null);
  };

  const removeAt = (i) => {
    setFiles(fs => fs.filter((_, idx) => idx !== i));
    setPreviews(ps => ps.filter((_, idx) => idx !== i));
  };

  const analyze = async () => {
    if (files.length === 0 || loading) return;
    setLoading(true);
    const started = Date.now();
    try {
      const [res] = await Promise.all([
        endpoints.counterfeitBulk(files),
        new Promise((r) => setTimeout(r, 1600)),
      ]);
      const elapsed = Date.now() - started;
      if (elapsed < 1600) await new Promise((r) => setTimeout(r, 1600 - elapsed));
      setResult(res);
    } catch (e) {
      toast.error("Bulk analysis failed");
    } finally { setLoading(false); }
  };

  const logBundle = async () => {
    if (!result) return;
    const fakes = result.results.filter(r => r.verdict === "Suspected Fake");
    await endpoints.counterfeitLog({
      denomination: fakes[0]?.denomination || "Bundle",
      verdict: `Bundle — ${fakes.length}/${result.summary.total} fake`,
      confidence: fakes.reduce((a,c)=>a+c.confidence,0) / Math.max(1, fakes.length),
      location: "Bulk seizure",
      feature_checklist: null,
      image_name: `bundle_${new Date().toISOString().slice(0,16)}`,
    });
    toast.success("Bundle seizure logged to Cases");
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      <div>
        <div className="text-[11px] uppercase tracking-widest text-blue-400">Officer · Bulk Note Scanner</div>
        <h1 className="font-display font-bold text-3xl sm:text-4xl tracking-tight mt-1">Analyze a whole bundle at once</h1>
        <p className="text-slate-400 mt-2 max-w-2xl">Upload up to 12 note images. AI inspects each note in parallel, ranks them by risk and logs the bundle as a single seizure case.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
        <Card className="lg:col-span-5 rounded-2xl p-5 glass-dark border-white/10">
          <div className="rounded-xl border-2 border-dashed border-white/15 p-6 bg-black/30" data-testid="bulk-dropzone">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <Layers className="h-8 w-8 text-slate-500 mx-auto" />
                <div className="text-sm text-slate-400 mt-2">Drop or pick multiple images</div>
                <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} data-testid="bulk-input" />
                <Button variant="outline" onClick={() => inputRef.current?.click()} className="mt-3 rounded-full border-white/15 bg-white/5 text-slate-100 hover:bg-white/10" data-testid="bulk-pick">
                  <Upload className="h-4 w-4 mr-2"/> Choose images
                </Button>
              </div>
            </div>
          </div>

          {previews.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {previews.map((p, i) => (
                <div key={i} className="relative rounded-lg overflow-hidden border border-white/10 group">
                  <img src={p.url} alt={p.name} className="w-full h-20 object-cover" />
                  <button onClick={() => removeAt(i)} className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/70 text-white text-xs flex items-center justify-center opacity-80 hover:opacity-100" data-testid={`bulk-remove-${i}`}>
                    <X className="h-3 w-3"/>
                  </button>
                </div>
              ))}
            </div>
          )}

          <Button data-testid="bulk-analyze" onClick={analyze} disabled={files.length === 0 || loading} className="mt-4 rounded-full w-full">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <ScanLine className="h-4 w-4 mr-2"/>}
            Analyze {files.length > 0 ? `${files.length} notes` : ""}
          </Button>
        </Card>

        <Card className="lg:col-span-7 rounded-2xl p-5 glass-dark border-white/10">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-300 flex items-center gap-2"><Banknote className="h-4 w-4 text-amber-400"/> Bundle result</div>
            {result && <Button size="sm" onClick={logBundle} className="rounded-full" data-testid="bulk-log"><Save className="h-4 w-4 mr-2"/>Log bundle seizure</Button>}
          </div>

          {loading && (
            <div className="mt-6 space-y-2">
              {[0,1,2,3,4].map(i => <div key={i} className="h-9 rounded-xl bg-white/5 animate-pulse" />)}
            </div>
          )}

          {!loading && result && (
            <div className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="grid grid-cols-4 gap-2 text-center">
                <StatChip label="Total" value={result.summary.total} tone="#3B82F6" />
                <StatChip label="Genuine" value={result.summary.genuine} tone="#10B981" />
                <StatChip label="Suspected Fake" value={result.summary.suspected_fake} tone="#EF4444" />
                <StatChip label="Uncertain" value={result.summary.uncertain} tone="#F59E0B" />
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
                <div className="grid grid-cols-12 px-3 py-2 text-[11px] uppercase tracking-widest text-slate-400 bg-white/[0.03]">
                  <div className="col-span-1">#</div>
                  <div className="col-span-4">File</div>
                  <div className="col-span-2">Denom</div>
                  <div className="col-span-3">Verdict</div>
                  <div className="col-span-2 text-right">Conf</div>
                </div>
                <div className="divide-y divide-white/5" data-testid="bulk-results-table">
                  {result.results.map((r, i) => (
                    <div key={r.id} className="grid grid-cols-12 px-3 py-2 items-center text-sm">
                      <div className="col-span-1 text-slate-500">{i+1}</div>
                      <div className="col-span-4 truncate text-slate-200">{r.image_name}</div>
                      <div className="col-span-2 text-slate-300">{r.denomination}</div>
                      <div className="col-span-3"><VerdictBadge verdict={r.verdict}/></div>
                      <div className="col-span-2 text-right font-mono text-slate-200">{r.confidence}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!loading && !result && <div className="mt-6 text-sm text-slate-500">Awaiting bundle — pick images on the left.</div>}
        </Card>
      </div>
    </div>
  );
}

function StatChip({ label, value, tone }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-slate-400">{label}</div>
      <div className="font-display text-2xl font-bold" style={{ color: tone }}>{value}</div>
    </div>
  );
}
