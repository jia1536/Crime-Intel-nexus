import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { endpoints } from "@/lib/api";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { TrendingUp, Layers, MapPin, Files } from "lucide-react";

const RISK_COLORS = { "Confirmed Scam": "#EF4444", "High": "#F59E0B", "Medium": "#3B82F6", "Low": "#10B981" };
const NOTE_COLORS = { "Genuine": "#10B981", "Suspected Fake": "#EF4444", "Uncertain": "#F59E0B" };
const STATUS_COLORS = { "New": "#3B82F6", "Under Review": "#F59E0B", "Escalated": "#EF4444", "Resolved": "#10B981" };

export default function AdminAnalytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    const load = () => endpoints.analytics().then(d => { if (alive) setData(d); });
    load();
    const t = setInterval(load, 20000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      <div>
        <div className="text-[11px] uppercase tracking-widest text-blue-400">Command Centre · Analytics</div>
        <h1 className="font-display font-bold text-3xl sm:text-4xl tracking-tight mt-1">Trend intelligence</h1>
        <p className="text-slate-400 mt-2 max-w-2xl">Scam volume, verdict spread, counterfeit-denomination mix and hotspot cities — refreshed every 20 seconds.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
        <Card className="lg:col-span-8 rounded-2xl p-5 glass-dark border-white/10">
          <Header icon={TrendingUp} label="Scam checks · last 7 days" />
          <div className="h-64 mt-3" data-testid="chart-scam-by-day">
            <ResponsiveContainer>
              <LineChart data={data?.scam_by_day || []}>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickFormatter={(d) => d.slice(5)} />
                <YAxis stroke="#94A3B8" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: "#0B1120", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#F8FAFC" }} />
                <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 4, fill: "#3B82F6" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-4 rounded-2xl p-5 glass-dark border-white/10">
          <Header icon={Layers} label="Scam verdict mix" />
          <div className="h-64 mt-3" data-testid="chart-verdict">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data?.verdict_dist || []} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                  {(data?.verdict_dist || []).map((e, i) => <Cell key={i} fill={RISK_COLORS[e.name] || "#94A3B8"} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11, color: "#94A3B8" }} />
                <Tooltip contentStyle={{ backgroundColor: "#0B1120", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#F8FAFC" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-5 rounded-2xl p-5 glass-dark border-white/10">
          <Header icon={Layers} label="Counterfeit · by denomination" />
          <div className="h-64 mt-3" data-testid="chart-denom">
            <ResponsiveContainer>
              <BarChart data={data?.denom_dist || []}>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: "#0B1120", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#F8FAFC" }} />
                <Bar dataKey="value" fill="#F59E0B" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-4 rounded-2xl p-5 glass-dark border-white/10">
          <Header icon={Layers} label="Note-verdict mix" />
          <div className="h-64 mt-3" data-testid="chart-note-verdict">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data?.note_verdict || []} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                  {(data?.note_verdict || []).map((e, i) => <Cell key={i} fill={NOTE_COLORS[e.name] || "#94A3B8"} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11, color: "#94A3B8" }} />
                <Tooltip contentStyle={{ backgroundColor: "#0B1120", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#F8FAFC" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-3 rounded-2xl p-5 glass-dark border-white/10">
          <Header icon={Files} label="Case status" />
          <div className="h-64 mt-3" data-testid="chart-case-status">
            <ResponsiveContainer>
              <BarChart data={data?.case_status || []} layout="vertical">
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.06)" />
                <XAxis type="number" stroke="#94A3B8" fontSize={11} allowDecimals={false}/>
                <YAxis type="category" dataKey="name" stroke="#94A3B8" fontSize={11} width={90}/>
                <Tooltip contentStyle={{ backgroundColor: "#0B1120", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#F8FAFC" }} />
                <Bar dataKey="value" radius={[0,8,8,0]}>
                  {(data?.case_status || []).map((e, i) => <Cell key={i} fill={STATUS_COLORS[e.name] || "#94A3B8"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-12 rounded-2xl p-5 glass-dark border-white/10">
          <Header icon={MapPin} label="Top cities by incident volume" />
          <div className="h-64 mt-3" data-testid="chart-top-cities">
            <ResponsiveContainer>
              <BarChart data={data?.top_cities || []}>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="city" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: "#0B1120", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#F8FAFC" }} />
                <Bar dataKey="count" fill="#3B82F6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Header({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-300">
      <Icon className="h-4 w-4 text-blue-400"/> {label}
    </div>
  );
}
