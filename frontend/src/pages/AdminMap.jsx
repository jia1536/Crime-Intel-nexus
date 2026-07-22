import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { endpoints } from "@/lib/api";
import { MapPin, Flame, Filter } from "lucide-react";
import { SeverityDot } from "@/components/Verdict";

const TYPES = [
  { id: "all", label: "All" },
  { id: "scam", label: "Scam" },
  { id: "counterfeit", label: "Counterfeit" },
  { id: "cybercrime", label: "Cybercrime" },
];

const SEV_COLOR = { high: "#EF4444", medium: "#F59E0B", low: "#10B981" };

export default function AdminMap() {
  const [type, setType] = useState("all");
  const [pts, setPts] = useState([]);
  const [priority, setPriority] = useState([]);

  useEffect(() => { endpoints.hotspots(type).then(setPts); }, [type]);
  useEffect(() => { endpoints.patrolPriority().then(setPriority); }, []);

  const center = useMemo(() => [22.5, 78.5], []);

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      <div>
        <div className="text-[11px] uppercase tracking-widest text-blue-400">Command Centre · Geospatial</div>
        <h1 className="font-display font-bold text-3xl sm:text-4xl tracking-tight mt-1">Crime Pattern Map</h1>
        <p className="text-slate-400 mt-2 max-w-2xl">Live fraud density across Indian cities — filter by type, drill into hotspots, and prioritize patrols.</p>
      </div>

      <div className="mt-6 flex items-center gap-2 flex-wrap">
        <div className="text-xs text-slate-400 flex items-center gap-1 mr-2"><Filter className="h-3.5 w-3.5"/>Filter</div>
        {TYPES.map(t => (
          <button key={t.id} data-testid={`filter-${t.id}`} onClick={() => setType(t.id)}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${type === t.id ? "bg-white text-slate-900 border-white" : "border-white/10 text-slate-300 hover:bg-white/5"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        <Card className="lg:col-span-8 rounded-2xl p-2 glass-dark border-white/10 overflow-hidden">
          <div className="rounded-xl overflow-hidden" style={{ height: 560 }} data-testid="crime-map">
            <MapContainer center={center} zoom={5} style={{ height: "100%", width: "100%", backgroundColor: "#0B1120" }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              {pts.map((p) => (
                <CircleMarker key={p.id} center={[p.lat, p.lng]}
                  radius={p.severity === "high" ? 10 : p.severity === "medium" ? 7 : 5}
                  pathOptions={{
                    color: SEV_COLOR[p.severity],
                    fillColor: SEV_COLOR[p.severity],
                    fillOpacity: 0.55,
                    weight: p.severity === "high" ? 2 : 1,
                  }}
                >
                  <Popup>
                    <div style={{ fontFamily: "Inter" }}>
                      <div style={{ fontWeight: 600 }}>{p.title}</div>
                      <div style={{ fontSize: 12, color: "#475569" }}>{p.city} · {p.crime_type}</div>
                      <div style={{ fontSize: 12 }}>Incidents: {p.incident_count}</div>
                      <div style={{ fontSize: 12 }}>Severity: {p.severity}</div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
          <div className="flex items-center gap-4 mt-3 px-3 text-xs text-slate-400">
            {["high","medium","low"].map(s => (
              <div key={s} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SEV_COLOR[s] }} />{s} severity</div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-4 rounded-2xl p-5 glass-dark border-white/10">
          <div className="flex items-center gap-2 text-sm text-slate-300"><Flame className="h-4 w-4 text-red-400"/> Patrol priority</div>
          <div className="mt-3 space-y-2 max-h-[560px] overflow-y-auto scroll-thin pr-1" data-testid="patrol-list">
            {priority.map((p, i) => (
              <div key={p.id} className={`rounded-xl border p-3 flex items-start gap-3 ${p.severity === "high" ? "border-red-500/30 bg-red-500/5 pulse-red" : "border-white/10 bg-white/[0.03]"}`}>
                <div className="text-lg font-display font-bold text-slate-500 w-6">{i + 1}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-100 flex items-center gap-2"><SeverityDot severity={p.severity} /> {p.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{p.city} · {p.incident_count} incidents · {p.crime_type}</div>
                </div>
                <div className="text-xs font-display font-semibold text-slate-200">{p.score.toFixed(1)}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
