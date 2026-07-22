import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, ShieldAlert, Banknote, Network, MapPin } from "lucide-react";

const iconFor = (t) => {
  if (t === "counterfeit") return <Banknote className="h-4 w-4 text-amber-400" />;
  if (t === "graph") return <Network className="h-4 w-4 text-blue-400" />;
  if (t === "hotspot") return <MapPin className="h-4 w-4 text-amber-400" />;
  if (t === "scam") return <ShieldAlert className="h-4 w-4 text-red-400" />;
  return <AlertTriangle className="h-4 w-4" />;
};

function wsUrl() {
  const base = process.env.REACT_APP_BACKEND_URL || "";
  return base.replace(/^http/, "ws") + "/api/ws/alerts";
}

export default function LiveAlertFeed() {
  const wsRef = useRef(null);
  const [status, setStatus] = useState("connecting");
  const retry = useRef(0);

  useEffect(() => {
    let closed = false;

    const connect = () => {
      if (closed) return;
      try {
        const ws = new WebSocket(wsUrl());
        wsRef.current = ws;
        ws.onopen = () => { setStatus("live"); retry.current = 0; };
        ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data);
            if (msg.kind === "alert" && msg.data) {
              const a = msg.data;
              toast(a.title, {
                description: `${(a.type || "").toUpperCase()} • ${new Date(a.created_at).toLocaleTimeString()}`,
                icon: iconFor(a.type),
              });
            }
          } catch (err) {
            console.warn("[LiveAlertFeed] Failed to parse WS message", err);
          }
        };
        ws.onclose = () => {
          setStatus("reconnecting");
          if (closed) return;
          retry.current += 1;
          const delay = Math.min(15000, 1500 * retry.current);
          setTimeout(connect, delay);
        };
        ws.onerror = (err) => {
          console.warn("[LiveAlertFeed] WebSocket error", err);
          try { ws.close(); } catch (closeErr) {
            console.warn("[LiveAlertFeed] Error closing socket after error", closeErr);
          }
        };
      } catch (err) {
        console.warn("[LiveAlertFeed] Failed to open WebSocket", err);
      }
    };

    connect();
    return () => {
      closed = true;
      try { wsRef.current?.close(); } catch (err) {
        console.warn("[LiveAlertFeed] Error closing socket on unmount", err);
      }
    };
  }, []);

  return (
    <div className="fixed bottom-4 left-4 z-40 text-[11px] uppercase tracking-widest text-slate-500 flex items-center gap-2 select-none" data-testid="ws-status">
      <span className={`h-2 w-2 rounded-full ${status === "live" ? "bg-emerald-400" : status === "reconnecting" ? "bg-amber-400" : "bg-slate-500"}`} style={{ boxShadow: status === "live" ? "0 0 8px #10B981" : "none" }} />
      {status === "live" ? "Streams · Live" : status === "reconnecting" ? "Reconnecting…" : "Connecting…"}
    </div>
  );
}
