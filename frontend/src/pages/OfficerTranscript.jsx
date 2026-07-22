import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, FileText, ShieldAlert, Wand2, Radio, ScrollText } from "lucide-react";
import { endpoints } from "@/lib/api";
import { VerdictBadge, verdictStyle } from "@/components/Verdict";
import { toast } from "sonner";

const CAT_LABEL = {
  impersonation: "Impersonation",
  urgency: "Urgency / threat",
  video_call_demand: "Video call demand",
  money_demand: "Money demand",
  fake_warrant: "Fake warrant",
};

function highlightTranscript(text, phrases = []) {
  if (!text) return "";
  let nodes = [{ type: "t", text }];
  phrases.forEach((p) => {
    const q = (p.phrase || "").trim();
    if (!q) return;
    const next = [];
    nodes.forEach((n) => {
      if (n.type !== "t") { next.push(n); return; }
      const parts = n.text.split(q);
      parts.forEach((seg, i) => {
        next.push({ type: "t", text: seg });
        if (i < parts.length - 1) next.push({ type: "hl", text: q, category: p.category, reason: p.reason });
      });
    });
    nodes = next;
  });
  return nodes;
}

export default function OfficerTranscript() {
  const [samples, setSamples] = useState([]);
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mha, setMha] = useState(null);
  const [mhaLoading, setMhaLoading] = useState(false);

  useEffect(() => {
    endpoints.transcriptSamples().then((s) => {
      setSamples(s);
      if (s?.[0]) setTranscript(s[0].transcript);
    });
  }, []);

  const analyze = async () => {
    if (!transcript.trim() || loading) return;
    setLoading(true); setResult(null); setMha(null);
    const started = Date.now();
    try {
      const [res] = await Promise.all([
        endpoints.transcriptAnalyze(transcript),
        new Promise((r) => setTimeout(r, 1600)),
      ]);
      const elapsed = Date.now() - started;
      if (elapsed < 1600) await new Promise((r) => setTimeout(r, 1600 - elapsed));
      setResult(res.result);
    } catch (e) {
      toast.error("Analysis failed");
    } finally { setLoading(false); }
  };

  const generateMha = async () => {
    if (!result) return;
    setMhaLoading(true);
    try {
      const draft = await endpoints.mhaDraft({ transcript, analysis: result });
      setMha(draft);
      toast.success("MHA Alert Draft ready");
    } catch { toast.error("Draft failed"); }
    finally { setMhaLoading(false); }
  };

  const nodes = result ? highlightTranscript(transcript, result.flagged_phrases || []) : null;
  const s = result ? verdictStyle(result.verdict) : null;

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      <div>
        <div className="text-[11px] uppercase tracking-widest text-blue-400">Officer · Investigation</div>
        <h1 className="font-display font-bold text-3xl sm:text-4xl tracking-tight mt-1">Digital Arrest Scam Analyzer</h1>
        <p className="text-slate-400 mt-2 max-w-2xl">Paste a suspected scam call transcript. AI highlights impersonation, threats, and money demands inline, then compiles an MHA advisory draft.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
        <Card className="lg:col-span-4 rounded-2xl p-5 glass-dark border-white/10">
          <div className="flex items-center gap-2 text-sm text-slate-300 mb-3"><ScrollText className="h-4 w-4 text-blue-400"/> Sample transcripts</div>
          <div className="space-y-2">
            {samples.map((s) => (
              <button key={s.id} data-testid={`sample-transcript-${s.id}`}
                onClick={() => { setTranscript(s.transcript); setResult(null); setMha(null); }}
                className="w-full text-left px-3 py-2 rounded-xl border border-white/10 hover:bg-white/5 transition-colors">
                <div className="text-sm font-medium text-slate-100">{s.title}</div>
                <div className="text-xs text-slate-400 line-clamp-2 mt-1">{s.transcript.slice(0, 90)}…</div>
              </button>
            ))}
          </div>
          <div className="mt-5">
            <Textarea data-testid="transcript-input"
              value={transcript} onChange={(e) => setTranscript(e.target.value)}
              className="min-h-[140px] bg-white/5 border-white/10 text-slate-100"
              placeholder="Paste transcript here…" />
            <Button data-testid="analyze-transcript" onClick={analyze} disabled={loading} className="mt-3 rounded-full w-full">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <Wand2 className="h-4 w-4 mr-2"/>}
              Analyze transcript
            </Button>
          </div>
        </Card>

        <div className="lg:col-span-8 space-y-6">
          <Card className="rounded-2xl p-6 glass-dark border-white/10">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-sm text-slate-300"><FileText className="h-4 w-4 text-blue-400"/> Highlighted transcript</div>
              {result && (
                <div className="flex items-center gap-3">
                  <VerdictBadge verdict={result.verdict} />
                  <div className="text-xs text-slate-400">Confidence <span className="font-display text-white font-semibold text-sm" style={{ color: s.color }}>{result.confidenceScore}%</span></div>
                </div>
              )}
            </div>

            <div className="mt-4 rounded-xl bg-black/30 border border-white/5 p-4 leading-relaxed text-slate-100 whitespace-pre-wrap text-sm min-h-[180px]" data-testid="transcript-highlight">
              {loading && (
                <div className="space-y-2">
                  <div className="h-3 w-full rounded bg-white/10 animate-pulse" />
                  <div className="h-3 w-11/12 rounded bg-white/10 animate-pulse" />
                  <div className="h-3 w-3/4 rounded bg-white/10 animate-pulse" />
                  <div className="h-3 w-5/6 rounded bg-white/10 animate-pulse" />
                </div>
              )}
              {!loading && nodes && nodes.map((n, i) => n.type === "hl"
                ? <mark key={i} className={n.category === "urgency" ? "hl-warning" : "hl-danger"} title={n.reason}>{n.text}</mark>
                : <span key={i}>{n.text}</span>)}
              {!loading && !result && <span className="text-slate-400">{transcript}</span>}
            </div>

            {result && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2">
                {Object.entries(result.categories || {}).map(([k, v]) => (
                  <div key={k} className={`rounded-xl px-3 py-2 border text-xs ${v ? "border-red-500/40 bg-red-500/10 text-red-300" : "border-white/10 bg-white/5 text-slate-400"}`}>
                    <div className="font-medium">{CAT_LABEL[k] || k}</div>
                    <div className="text-[10px] uppercase tracking-widest opacity-70 mt-1">{v ? "Detected" : "Not detected"}</div>
                  </div>
                ))}
              </div>
            )}

            {result && (
              <div className="mt-4">
                <div className="text-xs text-slate-400 leading-relaxed">{result.summary}</div>
                <div className="mt-4">
                  <Button data-testid="gen-mha" onClick={generateMha} disabled={mhaLoading} className="rounded-full">
                    {mhaLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <ShieldAlert className="h-4 w-4 mr-2"/>}
                    Generate MHA Alert Draft
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {mha && (
            <Card data-testid="mha-draft" className="rounded-2xl p-6 border-white/10" style={{ background: "linear-gradient(180deg, rgba(59,130,246,0.08), rgba(17,24,39,0.6))" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Radio className="h-4 w-4 text-blue-400" /><div className="text-[11px] uppercase tracking-widest text-blue-300">MHA Alert Bulletin</div></div>
                <div className="text-[10px] uppercase tracking-widest text-slate-400">{mha.classification}</div>
              </div>
              <div className="font-display text-xl font-bold mt-2">{mha.title}</div>
              <p className="text-sm text-slate-300 mt-3">{mha.summary}</p>
              <div className="grid md:grid-cols-2 gap-6 mt-4 text-sm">
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-2">Modus Operandi</div>
                  <ul className="space-y-1 text-slate-200 list-disc pl-4">{(mha.modus_operandi||[]).map((x,i)=><li key={i}>{x}</li>)}</ul>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-2">Recommended Actions</div>
                  <ul className="space-y-1 text-slate-200 list-disc pl-4">{(mha.recommended_actions||[]).map((x,i)=><li key={i}>{x}</li>)}</ul>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
