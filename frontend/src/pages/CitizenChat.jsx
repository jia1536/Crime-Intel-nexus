import { useState } from "react";
import { Send, Sparkles, ShieldCheck, Bot, User as UserIcon, Loader2, FileWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { endpoints } from "@/lib/api";
import { i18n } from "@/lib/i18n";
import { VerdictBadge, verdictStyle } from "@/components/Verdict";

export default function CitizenChat() {
  const [lang, setLang] = useState("en");
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const t = i18n[lang];

  const runCheck = async (input) => {
    const v = (input ?? text).trim();
    if (!v || loading) return;
    setMsgs((m) => [...m, { role: "user", text: v }]);
    setText("");
    setLoading(true);
    const started = Date.now();
    try {
      const [res] = await Promise.all([
        endpoints.scamCheck(v, lang),
        new Promise((r) => setTimeout(r, 1400)), // ensure realistic analysis feel
      ]);
      const elapsed = Date.now() - started;
      if (elapsed < 1400) await new Promise((r) => setTimeout(r, 1400 - elapsed));
      setMsgs((m) => [...m, { role: "ai", data: res }]);
    } catch (e) {
      toast.error("Could not analyze. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const reportNcrb = async (data) => {
    const r = await endpoints.reportNcrb({ verdict: data.verdict, text: data.text });
    toast.success(`Reported to NCRB — Ref ${r.reference}`, { description: "Complaint forwarded to National Cyber Crime Reporting Portal (mock)." });
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-blue-600">Citizen · Fraud Shield</div>
          <h1 className="font-display font-bold text-3xl sm:text-4xl tracking-tight text-slate-900 mt-1">
            {lang === "en" ? "Is this a scam?" : "क्या यह धोखा है?"}
          </h1>
          <p className="text-slate-500 mt-2 max-w-xl">
            {lang === "en"
              ? "Paste a suspicious message, describe a call, or share a payment request. Our AI checks it in seconds."
              : "संदिग्ध संदेश पेस्ट करें, कॉल का विवरण दें या भुगतान अनुरोध साझा करें। हमारा AI कुछ सेकंड में जाँच लेगा।"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            data-testid="lang-en"
            onClick={() => setLang("en")}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${lang === "en" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
          >EN</button>
          <button
            data-testid="lang-hi"
            onClick={() => setLang("hi")}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${lang === "hi" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
          >हिं</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
        <div className="lg:col-span-8">
          <Card className="rounded-2xl border-slate-200 shadow-sm min-h-[420px] p-5 bg-white">
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> {t.tip}
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto scroll-thin pr-1" data-testid="chat-thread">
              {msgs.length === 0 && (
                <div className="text-slate-400 text-sm italic">
                  {lang === "en" ? "Ask something like: 'Someone from CBI called demanding money to avoid arrest.'" : "उदाहरण: 'CBI से कॉल आया और पैसे माँगे।'"}
                </div>
              )}
              {msgs.map((m, i) => m.role === "user" ? (
                <div key={i} className="flex gap-3 justify-end">
                  <div className="rounded-2xl bg-slate-900 text-white px-4 py-3 max-w-[80%] text-sm">{m.text}</div>
                  <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center"><UserIcon className="h-4 w-4 text-slate-600" /></div>
                </div>
              ) : (
                <div key={i} className="flex gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#3B82F6" }}><Bot className="h-4 w-4 text-white" /></div>
                  <VerdictReveal data={m.data} onReport={() => reportNcrb(m.data)} t={t} />
                </div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#3B82F6" }}><Loader2 className="h-4 w-4 text-white animate-spin" /></div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    {lang === "en" ? "Analyzing red-flag signals…" : "संकेतों का विश्लेषण हो रहा है…"}
                    <div className="mt-2 flex gap-2">
                      <div className="h-2 w-2 rounded-full bg-slate-400 animate-pulse" />
                      <div className="h-2 w-2 rounded-full bg-slate-400 animate-pulse" style={{ animationDelay: "150ms" }} />
                      <div className="h-2 w-2 rounded-full bg-slate-400 animate-pulse" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 border-t border-slate-100 pt-4">
              <Textarea
                data-testid="chat-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t.placeholder}
                className="min-h-[80px] rounded-xl border-slate-200 bg-slate-50"
              />
              <div className="mt-3 flex justify-between items-center">
                <div className="text-xs text-slate-400">{t.describe}</div>
                <Button data-testid="chat-submit" onClick={() => runCheck()} disabled={loading} className="rounded-full">
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  {t.check}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <Card className="rounded-2xl p-5 border-slate-200 bg-white">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Sparkles className="h-4 w-4 text-blue-500" /> {t.quick}
            </div>
            <div className="mt-3 space-y-2">
              {t.samples.map((s, i) => (
                <button key={i} data-testid={`sample-${i}`} onClick={() => runCheck(s)}
                  className="w-full text-left text-sm px-3 py-2 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </Card>

          <Card className="rounded-2xl p-5 border-slate-200 bg-gradient-to-br from-blue-50 to-white">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-3"><FileWarning className="h-4 w-4 text-blue-500"/> Common scams right now</div>
            <ul className="text-sm text-slate-600 space-y-2">
              <li>• Digital arrest — CBI/ED impersonation</li>
              <li>• Fake KYC / bank blocked SMS</li>
              <li>• Courier OTP requests</li>
              <li>• KBC lottery advance-fee</li>
              <li>• Task fraud on Telegram</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function VerdictReveal({ data, onReport, t }) {
  if (!data) return null;
  const s = verdictStyle(data.verdict);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 max-w-[85%] text-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between gap-4">
        <VerdictBadge verdict={data.verdict} />
        <div className="text-[11px] uppercase tracking-widest text-slate-400">{t.confidence}</div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full" style={{ width: `${data.confidence}%`, backgroundColor: s.color, transition: "width 700ms ease" }} />
        </div>
        <div className="font-display text-lg font-bold" style={{ color: s.color }}>{data.confidence}%</div>
      </div>
      <div className="mt-3 text-slate-700 leading-relaxed">{data.reasoning}</div>
      {(data.signals?.length ?? 0) > 0 && (
        <div className="mt-3">
          <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-1">{t.signals}</div>
          <div className="flex flex-wrap gap-1.5">
            {data.signals.map((sig, i) => (
              <span key={i} className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-600 border border-red-100">{sig}</span>
            ))}
          </div>
        </div>
      )}
      <div className="mt-4">
        <Button data-testid="report-ncrb" onClick={onReport} size="sm" variant="outline" className="rounded-full">
          {t.report_ncrb}
        </Button>
      </div>
    </div>
  );
}
