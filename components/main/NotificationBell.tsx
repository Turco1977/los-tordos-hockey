"use client";
import { useState, useRef, useEffect } from "react";
import { useC } from "@/lib/theme-context";
import { apiFetch } from "@/lib/api/apiFetch";
import type { Notificacion } from "@/lib/supabase/types";

const fmtTime = (d: string) => {
  const dt = new Date(d);
  const now = new Date();
  const diff = Math.floor((now.getTime() - dt.getTime()) / 60000);
  if (diff < 1) return "ahora";
  if (diff < 60) return `hace ${diff}m`;
  if (diff < 1440) return `hace ${Math.floor(diff / 60)}h`;
  return dt.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
};

export default function NotificationBell({ notificaciones, onRefresh, onNav }: { notificaciones: Notificacion[]; onRefresh: () => void; onNav: (tab: string) => void }) {
  const { colors, cardBg } = useC();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unread = notificaciones.filter(n => !n.leida).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markRead = async (id: string) => {
    await apiFetch("/api/hockey/notificaciones", { method: "PUT", body: JSON.stringify({ id }) });
    onRefresh();
  };

  const markAllRead = async () => {
    await apiFetch("/api/hockey/notificaciones", { method: "PUT", body: JSON.stringify({ all: true }) });
    onRefresh();
  };

  const handleClick = (n: Notificacion) => {
    if (!n.leida) markRead(n.id);
    if (n.link) onNav(n.link);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{ background: "none", border: "none", cursor: "pointer", position: "relative", padding: 6, fontSize: 20 }} title="Notificaciones">
        🔔
        {unread > 0 && (
          <span style={{ position: "absolute", top: 0, right: 0, background: "#DC2626", color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: "50%", minWidth: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "100%", width: 320, maxHeight: 400, overflowY: "auto", background: cardBg, border: "1px solid " + colors.g2, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,.15)", zIndex: 200 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: "1px solid " + colors.g2 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: colors.nv }}>Notificaciones</span>
            {unread > 0 && <button onClick={markAllRead} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: colors.bl, fontWeight: 600 }}>Marcar todas leídas</button>}
          </div>
          {notificaciones.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", fontSize: 12, color: colors.g4 }}>Sin notificaciones</div>
          ) : (
            notificaciones.map(n => (
              <div key={n.id} onClick={() => handleClick(n)} style={{ padding: "10px 14px", borderBottom: "1px solid " + colors.g2, cursor: "pointer", background: n.leida ? "transparent" : (colors.bl + "08") }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: n.leida ? 500 : 700, color: colors.nv }}>{n.titulo}</div>
                    <div style={{ fontSize: 11, color: colors.g5, marginTop: 2 }}>{n.mensaje}</div>
                  </div>
                  <span style={{ fontSize: 9, color: colors.g4, flexShrink: 0, marginTop: 2 }}>{fmtTime(n.created_at)}</span>
                </div>
                {!n.leida && <div style={{ width: 6, height: 6, borderRadius: "50%", background: colors.bl, position: "absolute", left: 6, marginTop: -14 }} />}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
