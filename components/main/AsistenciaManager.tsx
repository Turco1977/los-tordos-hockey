"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { DIVISIONES, RAMAS, TIPO_ACTIVIDAD } from "@/lib/constants";
import { Btn, Card, Ring } from "@/components/ui";
import { useC } from "@/lib/theme-context";
import { useStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import QRCode from "qrcode";

const TODAY = new Date().toISOString().slice(0, 10);
const fmtD = (d: string) => { if (!d) return "–"; const p = d.slice(0, 10).split("-"); return p[2] + "/" + p[1] + "/" + p[0]; };

interface SesionStats { id: string; presentes: number; total: number; pct: number }

export default function AsistenciaManager({ user, mob, showT }: any) {
  const { colors, isDark, cardBg } = useC();
  const jugadoras = useStore(s => s.jugadoras);
  const sesiones = useStore(s => s.sesiones);
  const setSesiones = useStore(s => s.setSesiones);
  const registros = useStore(s => s.registros);
  const setRegistros = useStore(s => s.setRegistros);

  const [view, sView] = useState<"list" | "new" | "detail">("list");
  const [selSesion, sSelSesion] = useState<any>(null);
  const [qrUrl, sQrUrl] = useState("");
  const [qrTimer, sQrTimer] = useState(0);
  const [fDiv, sFDiv] = useState("");
  const [fRama, sFRama] = useState("");
  const [form, sForm] = useState<{fecha:string;division:string;rama:string;tipo_actividad:string;notas:string}>({ fecha: TODAY, division: DIVISIONES[0], rama: "A", tipo_actividad: "entrenamiento", notas: "" });
  const [sesionStatsMap, setSesionStatsMap] = useState<Record<string, SesionStats>>({});
  const [loadingStats, setLoadingStats] = useState(true);

  // Load attendance stats for all sessions (for list view %)
  useEffect(() => {
    const sb = createClient();
    sb.from("asistencia_registros").select("sesion_id, jugadora_id, presente").eq("presente", true).then(({ data }) => {
      const map: Record<string, Set<string>> = {};
      (data || []).forEach((r: any) => {
        if (!map[r.sesion_id]) map[r.sesion_id] = new Set();
        map[r.sesion_id].add(r.jugadora_id);
      });
      const statsMap: Record<string, SesionStats> = {};
      sesiones.forEach(s => {
        const activas = jugadoras.filter(j => j.estado !== "baja" && (j.division_efectiva || j.division_manual) === s.division && j.rama === s.rama);
        const presCount = map[s.id]?.size || 0;
        const tot = activas.length || 1;
        statsMap[s.id] = { id: s.id, presentes: presCount, total: activas.length, pct: Math.round((presCount / tot) * 100) };
      });
      setSesionStatsMap(statsMap);
      setLoadingStats(false);
    });
  }, [sesiones, jugadoras]);

  // Load registros when opening a session
  const loadRegistros = useCallback(async (sesionId: string) => {
    const res = await fetch("/api/hockey/asistencia/registros?sesion_id=" + sesionId);
    const data = await res.json();
    if (Array.isArray(data)) setRegistros(() => data);
  }, [setRegistros]);

  const openDetail = (s: any) => { sSelSesion(s); sView("detail"); loadRegistros(s.id); sQrUrl(""); sQrTimer(0); };

  const crearSesion = async () => {
    try {
      const res = await fetch("/api/hockey/asistencia", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, created_by: user?.id }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSesiones(p => [data, ...p]);
      showT("Sesión creada");
      openDetail(data);
    } catch (e: any) { showT(e.message || "Error", "err"); }
  };

  const genQR = async () => {
    try {
      const res = await fetch("/api/hockey/asistencia/qr", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sesion_id: selSesion.id }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      sSelSesion(data);
      setSesiones(p => p.map(s => s.id === data.id ? data : s));
      const url = window.location.origin + "/asistencia/" + data.qr_token;
      const dataUrl = await QRCode.toDataURL(url, { width: 300 });
      sQrUrl(dataUrl);
      sQrTimer(30 * 60);
      showT("QR generado (30 min)");
    } catch (e: any) { showT(e.message || "Error", "err"); }
  };

  useEffect(() => {
    if (qrTimer <= 0) return;
    const t = setInterval(() => sQrTimer(p => p > 0 ? p - 1 : 0), 1000);
    return () => clearInterval(t);
  }, [qrTimer]);

  const togglePresente = (jugadoraId: string) => {
    setRegistros(prev => {
      const exists = prev.find(r => r.jugadora_id === jugadoraId);
      if (exists) return prev.filter(r => r.jugadora_id !== jugadoraId);
      return [...prev, { id: "temp-" + jugadoraId, sesion_id: selSesion.id, jugadora_id: jugadoraId, presente: true, metodo: "manual" as const, hora: new Date().toISOString(), created_at: new Date().toISOString() }];
    });
  };

  const guardarAsistencia = async () => {
    try {
      const res = await fetch("/api/hockey/asistencia/registros", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sesion_id: selSesion.id, registros: registros.filter(r => r.presente) }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRegistros(() => data);
      showT("Asistencia guardada");
    } catch (e: any) { showT(e.message || "Error", "err"); }
  };

  const cerrarSesion = async () => {
    await guardarAsistencia();
    try {
      const res = await fetch("/api/hockey/asistencia", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selSesion.id, estado: "cerrada" }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      sSelSesion(data);
      setSesiones(p => p.map(s => s.id === data.id ? data : s));
      showT("Sesión cerrada");
    } catch (e: any) { showT(e.message || "Error", "err"); }
  };

  // Filter athletes by session division+rama
  const sessionAthletes = selSesion
    ? jugadoras.filter(j => j.estado !== "baja" && (j.division_efectiva || j.division_manual) === selSesion.division && j.rama === selSesion.rama)
    : [];
  const presentes = registros.filter(r => r.presente);
  const pct = sessionAthletes.length > 0 ? Math.round((presentes.length / sessionAthletes.length) * 100) : 0;

  const filtered = sesiones.filter(s => (!fDiv || s.division === fDiv) && (!fRama || s.rama === fRama));

  // Average attendance for filtered sessions
  const avgPct = useMemo(() => {
    const vals = filtered.map(s => sesionStatsMap[s.id]?.pct).filter(v => v != null);
    return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  }, [filtered, sesionStatsMap]);

  // Low attendance sessions (< 50%)
  const lowAttendance = useMemo(() => {
    return filtered.filter(s => {
      const st = sesionStatsMap[s.id];
      return st && st.pct < 50 && st.total > 0;
    }).length;
  }, [filtered, sesionStatsMap]);

  // ── LIST VIEW ──
  if (view === "list") return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: mob ? 18 : 20, fontWeight: 800, color: colors.nv }}>Asistencia</h2>
        <Btn v="p" s="s" onClick={() => sView("new")}>+ Nueva Sesión</Btn>
      </div>

      {/* Summary KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(4, 1fr)", gap: 8, marginBottom: 14 }}>
        <div style={{ background: cardBg, borderRadius: 12, padding: "12px 14px", border: "1px solid " + colors.g2, textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: colors.nv }}>{filtered.length}</div>
          <div style={{ fontSize: 10, color: colors.g5 }}>Sesiones</div>
        </div>
        <div style={{ background: cardBg, borderRadius: 12, padding: "12px 14px", border: "1px solid " + colors.g2, textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: avgPct >= 70 ? colors.gn : avgPct >= 50 ? colors.yl : colors.rd }}>{avgPct}%</div>
          <div style={{ fontSize: 10, color: colors.g5 }}>Promedio Asistencia</div>
        </div>
        <div style={{ background: cardBg, borderRadius: 12, padding: "12px 14px", border: "1px solid " + colors.g2, textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: colors.gn }}>{filtered.filter(s => s.estado === "abierta").length}</div>
          <div style={{ fontSize: 10, color: colors.g5 }}>Abiertas</div>
        </div>
        <div style={{ background: cardBg, borderRadius: 12, padding: "12px 14px", border: "1px solid " + colors.g2, textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: lowAttendance > 0 ? colors.rd : colors.gn }}>{lowAttendance}</div>
          <div style={{ fontSize: 10, color: colors.g5 }}>Baja Asistencia (&lt;50%)</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <select value={fDiv} onChange={e => sFDiv(e.target.value)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid " + colors.g3, fontSize: 11, background: cardBg, color: colors.nv }}>
          <option value="">Todas las divisiones</option>
          {DIVISIONES.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={fRama} onChange={e => sFRama(e.target.value)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid " + colors.g3, fontSize: 11, background: cardBg, color: colors.nv }}>
          <option value="">Todas las ramas</option>
          {RAMAS.map(r => <option key={r} value={r}>Rama {r}</option>)}
        </select>
      </div>
      {filtered.length === 0 ? <Card><div style={{ textAlign: "center", padding: 24, color: colors.g4 }}>No hay sesiones. Creá una nueva.</div></Card> : (
        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "repeat(auto-fill,minmax(280px,1fr))", gap: 10 }}>
          {filtered.map(s => {
            const st = sesionStatsMap[s.id];
            const sPct = st?.pct ?? 0;
            return (
              <Card key={s.id} onClick={() => openDetail(s)} style={{ cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: colors.nv }}>{fmtD(s.fecha)}</span>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 12, background: s.estado === "abierta" ? "#D1FAE5" : colors.g2, color: s.estado === "abierta" ? "#065F46" : colors.g5, fontWeight: 600 }}>{s.estado === "abierta" ? "Abierta" : "Cerrada"}</span>
                </div>
                <div style={{ fontSize: 11, color: colors.g5 }}>{s.division} · Rama {s.rama}</div>
                <div style={{ fontSize: 11, color: colors.g4, marginTop: 2 }}>{TIPO_ACTIVIDAD.find(t => t.k === s.tipo_actividad)?.i} {TIPO_ACTIVIDAD.find(t => t.k === s.tipo_actividad)?.l}</div>
                {st && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                    <div style={{ flex: 1, height: 6, background: isDark ? "rgba(255,255,255,.08)" : colors.g1, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 3, width: sPct + "%", background: sPct >= 70 ? colors.gn : sPct >= 50 ? colors.yl : colors.rd }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: sPct >= 70 ? colors.gn : sPct >= 50 ? colors.yl : colors.rd, minWidth: 36 }}>{sPct}%</span>
                    <span style={{ fontSize: 10, color: colors.g4 }}>{st.presentes}/{st.total}</span>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  // ── NEW SESSION ──
  if (view === "new") return (
    <div>
      <Btn v="g" s="s" onClick={() => sView("list")}>← Volver</Btn>
      <h3 style={{ margin: "12px 0", fontSize: 16, fontWeight: 700, color: colors.nv }}>Nueva Sesión de Asistencia</h3>
      <Card style={{ maxWidth: 480 }}>
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: colors.g5 }}>Fecha
            <input type="date" value={form.fecha} onChange={e => sForm({ ...form, fecha: e.target.value })} style={{ display: "block", width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid " + colors.g3, marginTop: 4, fontSize: 13, background: cardBg, color: colors.nv }} />
          </label>
          <label style={{ fontSize: 11, fontWeight: 600, color: colors.g5 }}>División
            <select value={form.division} onChange={e => sForm({ ...form, division: e.target.value })} style={{ display: "block", width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid " + colors.g3, marginTop: 4, fontSize: 13, background: cardBg, color: colors.nv }}>
              {DIVISIONES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <label style={{ fontSize: 11, fontWeight: 600, color: colors.g5 }}>Rama
            <select value={form.rama} onChange={e => sForm({ ...form, rama: e.target.value })} style={{ display: "block", width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid " + colors.g3, marginTop: 4, fontSize: 13, background: cardBg, color: colors.nv }}>
              {RAMAS.map(r => <option key={r} value={r}>Rama {r}</option>)}
            </select>
          </label>
          <label style={{ fontSize: 11, fontWeight: 600, color: colors.g5 }}>Tipo de Actividad
            <select value={form.tipo_actividad} onChange={e => sForm({ ...form, tipo_actividad: e.target.value })} style={{ display: "block", width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid " + colors.g3, marginTop: 4, fontSize: 13, background: cardBg, color: colors.nv }}>
              {TIPO_ACTIVIDAD.map(t => <option key={t.k} value={t.k}>{t.i} {t.l}</option>)}
            </select>
          </label>
          <label style={{ fontSize: 11, fontWeight: 600, color: colors.g5 }}>Notas
            <textarea value={form.notas} onChange={e => sForm({ ...form, notas: e.target.value })} rows={2} style={{ display: "block", width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid " + colors.g3, marginTop: 4, fontSize: 13, resize: "vertical" as const, background: cardBg, color: colors.nv }} />
          </label>
          <Btn v="s" onClick={crearSesion}>Crear Sesión</Btn>
        </div>
      </Card>
    </div>
  );

  // ── DETAIL VIEW ──
  return (
    <div>
      <Btn v="g" s="s" onClick={() => { sView("list"); sSelSesion(null); }}>← Volver</Btn>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: colors.nv }}>{fmtD(selSesion.fecha)} — {selSesion.division}</h3>
          <div style={{ fontSize: 11, color: colors.g5 }}>Rama {selSesion.rama} · {TIPO_ACTIVIDAD.find(t => t.k === selSesion.tipo_actividad)?.l}</div>
        </div>
        <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 12, background: selSesion.estado === "abierta" ? "#D1FAE5" : colors.g2, color: selSesion.estado === "abierta" ? "#065F46" : colors.g5, fontWeight: 600 }}>{selSesion.estado === "abierta" ? "Abierta" : "Cerrada"}</span>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <Ring pct={pct} color={pct >= 75 ? colors.gn : pct >= 50 ? colors.yl : colors.rd} size={80} icon="🏑" />
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: colors.nv }}>{presentes.length}/{sessionAthletes.length}</div>
          <div style={{ fontSize: 11, color: colors.g5 }}>Presentes ({pct}%)</div>
          <div style={{ fontSize: 10, color: colors.g4 }}>QR: {presentes.filter(r => r.metodo === "qr").length} · Manual: {presentes.filter(r => r.metodo === "manual").length}</div>
        </div>
      </div>

      {selSesion.estado === "abierta" && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <Btn v="pu" s="s" onClick={genQR}>Generar QR</Btn>
          <Btn v="s" s="s" onClick={guardarAsistencia}>Guardar</Btn>
          <Btn v="r" s="s" onClick={cerrarSesion}>Cerrar Sesión</Btn>
        </div>
      )}

      {qrUrl && (
        <Card style={{ textAlign: "center" as const, marginBottom: 16 }}>
          <img src={qrUrl} alt="QR" style={{ width: 200, height: 200 }} />
          <div style={{ fontSize: 11, color: colors.g5, marginTop: 4 }}>Expira en {Math.floor(qrTimer / 60)}:{String(qrTimer % 60).padStart(2, "0")}</div>
          <div style={{ fontSize: 10, color: colors.g4, marginTop: 2 }}>Las jugadoras escanean y ponen su DNI</div>
        </Card>
      )}

      <Card>
        <div style={{ fontSize: 12, fontWeight: 700, color: colors.nv, marginBottom: 10 }}>Listado — {selSesion.division} Rama {selSesion.rama}</div>
        {sessionAthletes.length === 0 ? <div style={{ color: colors.g4, fontSize: 12 }}>No hay jugadoras activas en esta división y rama</div> : (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 2 }}>
            {sessionAthletes.map(j => {
              const reg = registros.find(r => r.jugadora_id === j.id);
              const isPresent = !!reg?.presente;
              return (
                <div key={j.id} onClick={() => selSesion.estado === "abierta" && togglePresente(j.id)}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: mob ? "10px 8px" : "6px 8px", borderRadius: 6, background: isPresent ? (isDark ? "rgba(16,185,129,.15)" : "#D1FAE5") : "transparent", cursor: selSesion.estado === "abierta" ? "pointer" : "default", minHeight: mob ? 44 : undefined }}>
                  <span style={{ fontSize: 16 }}>{isPresent ? "✅" : "⬜"}</span>
                  <span style={{ flex: 1, fontSize: mob ? 13 : 12, fontWeight: isPresent ? 600 : 400, color: colors.nv }}>{j.apellido}, {j.nombre}</span>
                  {reg?.metodo === "qr" && <span style={{ fontSize: 9, background: colors.pr + "20", color: colors.pr, padding: "1px 6px", borderRadius: 8 }}>QR</span>}
                  <span style={{ fontSize: 10, color: colors.g4 }}>{j.dni}</span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
