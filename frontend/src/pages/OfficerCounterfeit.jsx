import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, ScanLine, Check, X, HelpCircle, Save, Banknote } from "lucide-react";
import { endpoints } from "@/lib/api";
import { VerdictBadge, verdictStyle } from "@/components/Verdict";
import { toast } from "sonner";

const CHECKS = [
  { key: "security_thread", label: "Security thread" },
  { key: "microprint", label: "Microprint" },
  { key: "serial_number_pattern", label: "Serial number pattern" },
  { key: "watermark", label: "Watermark" },
];

const CheckIcon = ({ status }) => {
  if (status === "pass") return <Check className="h-4 w-4 text-emerald-400" />;
  if (status === "fail") return <X className="h-4 w-4 text-red-400" />;
  return <HelpCircle className="h-4 w-4 text-amber-400" />;
};

export default function OfficerCounterfeit() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);
  const inputRef = useRef(null);

  const load = () => endpoints.counterfeitList().then(setList);
  useEffect(() => { load(); }, []);

  const onFile = (f) => {
    if (!f) return;
    setFile(f); setResult(null);
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const analyze = async () => {
    if (!file || loading) return;
    setLoading(true);
    const started = Date.now();
    try {
      const [res] = await Promise.all([
        endpoints.counterfeitAnalyze(file),
        new Promise((r) => setTimeout(r, 1800)),
      ]);
      const elapsed = Date.now() - started;
      if (elapsed < 1800) await new Promise((r) => setTimeout(r, 1800 - elapsed));
      setResult(res);
      load();
    } catch { toast.error("Analysis failed"); } finally { setLoading(false); }
  };

  const logSeizure = async () => {
    if (!result) return;
    await endpoints.counterfeitLog({
      denomination: result.denomination,
      verdict: result.verdict,
      confidence: result.confidence,
      feature_checklist: result.checklist,
      image_name: result.image_name || "capture.jpg",
      location: "Field Console",
    });
    toast.success("Seizure logged to Cases");
  };

  const s = result ? verdictStyle(result.verdict) : null;

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      <div>
        <div className="text-[11px] uppercase tracking-widest text-blue-400">Officer · Currency Forensics</div>
        <h1 className="font-display font-bold text-3xl sm:text-4xl tracking-tight mt-1">Counterfeit Currency Identification</h1>
        <p className="text-slate-400 mt-2 max-w-2xl">Upload an image of a suspect note (₹100 / ₹200 / ₹500). AI inspects security thread, microprint, serial pattern and watermark.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
        <Card className="lg:col-span-5 rounded-2xl p-5 glass-dark border-white/10">
          <div className="rounded-xl border-2 border-dashed border-white/15 aspect-[16/9] flex items-center justify-center bg-black/30 relative overflow-hidden">
            {preview ? (
              <img src={preview} alt="note" className="max-h-full max-w-full object-contain" />
            ) : (
              <div className="text-center">
                <Banknote className="h-10 w-10 text-slate-500 mx-auto" />
                <div className="mt-2 text-sm text-slate-400">Drop image or click below</div>
              </div>
            )}
          </div>
          <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} data-testid="file-input" />
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => inputRef.current?.click()} className="rounded-full border-white/15 bg-white/5 text-slate-100 hover:bg-white/10" data-testid="pick-file">
              <Upload className="h-4 w-4 mr-2" /> Choose image
            </Button>
            <Button onClick={analyze} disabled={!file || loading} className="rounded-full flex-1" data-testid="analyze-note">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ScanLine className="h-4 w-4 mr-2" />}
              Analyze note
            </Button>
          </div>
        </Card>

        <Card className="lg:col-span-7 rounded-2xl p-5 glass-dark border-white/10">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-300">Verdict card</div>
            {result && <VerdictBadge verdict={result.verdict} />}
          </div>

          {loading && (
            <div className="mt-6 space-y-3">
              {[0,1,2,3].map(i => <div key={i} className="h-10 rounded-xl bg-white/5 animate-pulse" />)}
            </div>
          )}

          {!loading && result && (
            <div className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex items-baseline gap-4">
                <div className="font-display text-4xl font-bold" style={{ color: s.color }}>{result.confidence}%</div>
                <div className="text-slate-400 text-sm">confidence · {result.denomination}</div>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full" style={{ width: `${result.confidence}%`, backgroundColor: s.color }} />
              </div>
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CHECKS.map((c) => {
                  const st = result.checklist?.[c.key] || "unclear";
                  return (
                    <div key={c.key} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 flex items-center justify-between">
                      <div className="text-sm text-slate-200">{c.label}</div>
                      <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-slate-400">
                        <CheckIcon status={st} /> {st}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-4 text-sm text-slate-300">{result.notes}</p>
              <div className="mt-4"><Button onClick={logSeizure} className="rounded-full" data-testid="log-seizure"><Save className="h-4 w-4 mr-2"/>Log this seizure</Button></div>
            </div>
          )}

          {!loading && !result && (
            <div className="mt-6 text-sm text-slate-500">Awaiting sample — pick an image on the left.</div>
          )}
        </Card>

        <Card className="lg:col-span-12 rounded-2xl p-5 glass-dark border-white/10">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-300">Recent seizure checks</div>
            <div className="text-xs text-slate-400">{list.length} records</div>
          </div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="counterfeit-list">
            {list.slice(0, 9).map((c) => (
              <div key={c.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-center justify-between">
                  <div className="font-display font-semibold">{c.denomination}</div>
                  <VerdictBadge verdict={c.verdict} />
                </div>
                <div className="text-xs text-slate-400 mt-1">{c.image_name} · {new Date(c.created_at).toLocaleString()}</div>
                <div className="text-xs text-slate-300 mt-2 line-clamp-2">{c.notes}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
