"use client";
import { useState, useMemo } from "react";
import { DIVISIONES, RAMAS, CALENDARIO_TIPOS } from "@/lib/constants";
import { Btn, Card } from "@/components/ui";
import { useC } from "@/lib/theme-context";
import { useStore } from "@/lib/store";

const TODAY = new Date().toISOString().slice(0, 10);
const fmtD = (d: string) => { if (!d) return "–"; const p = d.slice(0, 10).split("-"); return p[2] + "/" + p[1]; };
const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function expandRecurrence(ev: any): any[] {
  if (!ev.recurrencia || ev.recurrencia === "none") return [ev];
  const start = new Date(ev.fecha);
  const end = ev.recurrencia_fin ? new Date(ev.recurrencia_fin) : new Date(start.getFullYear(), start.getMonth() + 3, start.getDate());
  const events: any[] = [];
  const d = new Date(start);
  while (d <= end) {
    events.push({ ...ev, fecha: d.toISOString().slice(0, 10), _isRecurrence: events.length > 0 });
    if (ev.recurrencia === "diaria") d.setDate(d.getDate() + 1);
    else if (ev.recurrencia === "semanal") d.setDate(d.getDate() + 7);
    else if (ev.recurrencia === "mensual") d.setMonth(d.getMonth() + 1);
    else break;
  }
  return events;
}

export default function HockeyCalendario({ user, mob, showT, onNavAsist, onNavPartido }: any) {
  const { colors, isDark, cardBg } = useC();
  const calEventos = useStore(s => s.calEventos);
  const setCalEventos = useStore(s => s.setCalEventos);
  const sesiones = useStore(s => s.sesiones);
  const partidos = useStore(s => s.partidos);

  const [viewMode, sViewMode] = useState<"month" | "week" | "today">("month");
  const [curDate, sCurDate] = useState(new Date());
  const [fTipo, sFTipo] = useState("");
  const [fDiv, sFDiv] = useState("");
  const [showForm, sShowForm] = useState(false);
  const [form, sForm] = useState({ titulo: "", fecha: TODAY, hora: "", tipo: "entrenamiento", division: "", rama: "", descripcion: "", recurrencia: "none", recurrencia_fin: "" });

  // Expand all events with recurrence
  const allEvents = useMemo(() => {
    const base = calEventos.flatMap(e => expandRecurrence(e));
    // Also add sesiones and partidos as calendar events
    const fromSesiones = sesiones.map(s => ({ id: "ses-" + s.id, titulo: "🏑 Asistencia " + s.division, fecha: s.fecha, tipo: "entrenamiento", division: s.division, rama: s.rama, _source: "sesion", _sourceId: s.id }));
    const fromPartidos = partidos.map(p => ({ id: "par-" + p.id, titulo: "⚽ vs " + p.rival, fecha: p.fecha, tipo: "partido", division: p.division, rama: p.rama, _source: "partido", _sourceId: p.id }));
    return [...base, ...fromSesiones, ...fromPartidos];
  }, [calEventos, sesiones, partidos]);

  const filtered = allEvents.filter(e => (!fTipo || e.tipo === fTipo) && (!fDiv || e.division === fDiv));

  // Calendar helpers
  const y = curDate.getFullYear(), m = curDate.getMonth();
  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();

  const getEventsForDate = (date: string) => filtered.filter(e => e.fecha === date);

  const nav = (dir: number) => {
    const d = new Date(curDate);
    if (viewMode === "month") d.setMonth(d.getMonth() + dir);
    else if (viewMode === "week") d.setDate(d.getDate() + dir * 7);
    else d.setDate(d.getDate() + dir);
    sCurDate(d);
  };

  // Create event
  const crear = async () => {
    if (!form.titulo.trim()) { showT("Ingresá un título", "err"); return; }
    try {
      const res = await fetch("/api/hockey/calendario", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, created_by: user?.id }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCalEventos(p => [...p, data]);
      sShowForm(false);
      sForm({ titulo: "", fecha: TODAY, hora: "", tipo: "entrenamiento", division: "", rama: "", descripcion: "", recurrencia: "none", recurrencia_fin: "" });
      showT("Evento creado");
    } catch (e: any) { showT(e.message || "Error", "err"); }
  };

  // Delete event
  const del = async (id: string) => {
    try {
      await fetch("/api/hockey/calendario?id=" + id, { method: "DELETE" });
      setCalEventos(p => p.filter(e => e.id !== id));
      showT("Evento eliminado");
    } catch (e: any) { showT(e.message || "Error", "err"); }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: mob ? 18 : 20, color: colors.nv }}>📅 Calendario</h2>
        <div style={{ display: "flex", gap: 4 }}>
          {(["month", "week", "today"] as const).map(v => (
            <button key={v} onClick={() => sViewMode(v)} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid " + colors.g3, background: viewMode === v ? colors.nv : cardBg, color: viewMode === v ? "#fff" : colors.nv, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
              {v === "month" ? "Mes" : v === "week" ? "Semana" : "Hoy"}
            </button>
          ))}
          <Btn v="p" s="s" onClick={() => sShowForm(!showForm)}>+</Btn>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <select value={fTipo} onChange={e => sFTipo(e.target.value)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid " + colors.g3, fontSize: 11, background: cardBg, color: colors.nv }}>
          <option value="">Todos los tipos</option>
          {CALENDARIO_TIPOS.map(t => <option key={t.k} value={t.k}>{t.l}</option>)}
        </select>
        <select value={fDiv} onChange={e => sFDiv(e.target.value)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid " + colors.g3, fontSize: 11, background: cardBg, color: colors.nv }}>
          <option value="">Todas las divisiones</option>
          {DIVISIONES.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* New event form */}
      {showForm && (
        <Card style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: colors.nv }}>Nuevo Evento</div>
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 8 }}>
            <input value={form.titulo} onChange={e => sForm({ ...form, titulo: e.target.value })} placeholder="Título" style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid " + colors.g3, fontSize: 12, background: cardBg, color: colors.nv }} />
            <input type="date" value={form.fecha} onChange={e => sForm({ ...form, fecha: e.target.value })} style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid " + colors.g3, fontSize: 12, background: cardBg, color: colors.nv }} />
            <input type="time" value={form.hora} onChange={e => sForm({ ...form, hora: e.target.value })} style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid " + colors.g3, fontSize: 12, background: cardBg, color: colors.nv }} />
            <select value={form.tipo} onChange={e => sForm({ ...form, tipo: e.target.value })} style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid " + colors.g3, fontSize: 12, background: cardBg, color: colors.nv }}>
              {CALENDARIO_TIPOS.map(t => <option key={t.k} value={t.k}>{t.l}</option>)}
            </select>
            <select value={form.division} onChange={e => sForm({ ...form, division: e.target.value })} style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid " + colors.g3, fontSize: 12, background: cardBg, color: colors.nv }}>
              <option value="">División (opcional)</option>
              {DIVISIONES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={form.recurrencia} onChange={e => sForm({ ...form, recurrencia: e.target.value })} style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid " + colors.g3, fontSize: 12, background: cardBg, color: colors.nv }}>
              <option value="none">Sin recurrencia</option>
              <option value="diaria">Diaria</option>
              <option value="semanal">Semanal</option>
              <option value="mensual">Mensual</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <Btn v="s" s="s" onClick={crear}>Crear</Btn>
            <Btn v="g" s="s" onClick={() => sShowForm(false)}>Cancelar</Btn>
          </div>
        </Card>
      )}

      {/* Nav */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <button onClick={() => nav(-1)} style={{ background: "none", border: "1px solid " + colors.g3, borderRadius: 6, padding: "4px 10px", cursor: "pointer", color: colors.nv, fontSize: 14 }}>←</button>
        <span style={{ fontSize: 14, fontWeight: 700, color: colors.nv }}>{MONTHS[m]} {y}</span>
        <button onClick={() => nav(1)} style={{ background: "none", border: "1px solid " + colors.g3, borderRadius: 6, padding: "4px 10px", cursor: "pointer", color: colors.nv, fontSize: 14 }}>→</button>
      </div>

      {/* Month grid */}
      {viewMode === "month" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 1 }}>
          {DAYS.map(d => <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: colors.g4, padding: "4px 0" }}>{d}</div>)}
          {Array.from({ length: firstDay }).map((_, i) => <div key={"e" + i} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayEvts = getEventsForDate(dateStr);
            const isToday = dateStr === TODAY;
            return (
              <div key={day} style={{ minHeight: mob ? 50 : 70, padding: 3, border: "1px solid " + (isDark ? colors.g3 : "#E8ECF1"), borderRadius: 4, background: isToday ? (isDark ? "rgba(59,130,246,.1)" : "#EFF6FF") : cardBg }}>
                <div style={{ fontSize: 10, fontWeight: isToday ? 800 : 500, color: isToday ? colors.bl : colors.g5, marginBottom: 2 }}>{day}</div>
                {dayEvts.slice(0, 3).map((ev, ei) => {
                  const ct = CALENDARIO_TIPOS.find(t => t.k === ev.tipo);
                  return (
                    <div key={ei} onClick={() => {
                      if (ev._source === "sesion" && onNavAsist) onNavAsist(ev._sourceId);
                      if (ev._source === "partido" && onNavPartido) onNavPartido(ev._sourceId);
                    }} style={{ fontSize: 9, padding: "1px 3px", borderRadius: 3, background: (ct?.c || "#6B7280") + "20", color: ct?.c || colors.g5, marginBottom: 1, cursor: ev._source ? "pointer" : "default", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {ev.titulo?.slice(0, mob ? 10 : 18)}
                    </div>
                  );
                })}
                {dayEvts.length > 3 && <div style={{ fontSize: 8, color: colors.g4 }}>+{dayEvts.length - 3}</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* Week view */}
      {viewMode === "week" && (() => {
        const startOfWeek = new Date(curDate);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        return (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
            {Array.from({ length: 7 }).map((_, i) => {
              const d = new Date(startOfWeek);
              d.setDate(d.getDate() + i);
              const dateStr = d.toISOString().slice(0, 10);
              const dayEvts = getEventsForDate(dateStr);
              const isToday = dateStr === TODAY;
              return (
                <div key={i} style={{ padding: 6, borderRadius: 6, background: isToday ? (isDark ? "rgba(59,130,246,.1)" : "#EFF6FF") : cardBg, border: "1px solid " + colors.g2, minHeight: 100 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: isToday ? colors.bl : colors.g5, marginBottom: 4 }}>{DAYS[i]} {d.getDate()}</div>
                  {dayEvts.map((ev, ei) => {
                    const ct = CALENDARIO_TIPOS.find(t => t.k === ev.tipo);
                    return (
                      <div key={ei} style={{ fontSize: 10, padding: "2px 4px", borderRadius: 4, background: (ct?.c || "#6B7280") + "15", borderLeft: "2px solid " + (ct?.c || "#6B7280"), marginBottom: 3, color: colors.nv }}>
                        {ev.hora && <span style={{ fontSize: 9, color: colors.g4 }}>{ev.hora} </span>}
                        {ev.titulo?.slice(0, 20)}
                        {!ev._isRecurrence && ev.id && !ev.id.startsWith("ses-") && !ev.id.startsWith("par-") && (
                          <button onClick={() => del(ev.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 9, color: colors.rd, float: "right" }}>✕</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Today view */}
      {viewMode === "today" && (() => {
        const todayEvts = getEventsForDate(TODAY);
        return (
          <Card>
            <div style={{ fontSize: 13, fontWeight: 700, color: colors.nv, marginBottom: 10 }}>Hoy — {new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}</div>
            {todayEvts.length === 0 ? <div style={{ textAlign: "center", padding: 24, color: colors.g4 }}>No hay eventos hoy</div> : (
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
                {todayEvts.map((ev, i) => {
                  const ct = CALENDARIO_TIPOS.find(t => t.k === ev.tipo);
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 6, background: isDark ? "rgba(255,255,255,.04)" : "#F9FAFB", borderLeft: "3px solid " + (ct?.c || "#6B7280") }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: colors.nv }}>{ev.titulo}</div>
                        <div style={{ fontSize: 11, color: colors.g5 }}>{ev.hora || ""} {ev.division || ""}</div>
                      </div>
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 8, background: (ct?.c || "#6B7280") + "15", color: ct?.c }}>{ct?.l}</span>
                      {ev._source === "sesion" && <Btn v="s" s="s" onClick={() => onNavAsist?.(ev._sourceId)}>Asistencia</Btn>}
                      {ev._source === "partido" && <Btn v="r" s="s" onClick={() => onNavPartido?.(ev._sourceId)}>Stats</Btn>}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })()}
    </div>
  );
}
