"use client";
import { useState, useEffect, useCallback } from "react";
import { DIVISIONES, RAMAS, CONVOCATORIA_TIPOS } from "@/lib/constants";
import { Btn, Card } from "@/components/ui";
import { apiFetch } from "@/lib/api/apiFetch";
import { useC } from "@/lib/theme-context";
import { useStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { shareConvocatoriaWhatsApp } from "@/lib/export";

const TODAY = new Date().toISOString().slice(0, 10);
const YEAR = new Date().getFullYear();
const fmtD = (d: string) => { if (!d) return "–"; const p = d.slice(0, 10).split("-"); return p[2] + "/" + p[1] + "/" + p[0]; };

export default function PartidosManager({ user, mob, showT }: any) {
  const { colors, isDark, cardBg } = useC();
  const jugadoras = useStore(s => s.jugadoras);
  const partidos = useStore(s => s.partidos);
  const setPartidos = useStore(s => s.setPartidos);
  const lbfs = useStore(s => s.lbfs);

  const [view, sView] = useState<"list" | "new" | "detail">("list");
  const [sel, sSel] = useState<any>(null);
  const [convocadas, sConvocadas] = useState<any[]>([]);
  const [fDiv, sFDiv] = useState("");
  const [fRama, sFRama] = useState("");
  const [form, sForm] = useState<{fecha:string;fecha_numero:string;rival:string;sede:string;division:string;rama:string;competencia:string;notas:string}>({ fecha: TODAY, fecha_numero: "", rival: "", sede: "local", division: DIVISIONES[0], rama: "A", competencia: "partido", notas: "" });
  const [lbfJugadoraIds, sLbfJugadoraIds] = useState<string[]>([]);
  const [detailLbfIds, sDetailLbfIds] = useState<string[]>([]);
  const [loadingLbf, sLoadingLbf] = useState(false);

  // Auto-load LBF jugadoras when division/rama changes in the form
  useEffect(() => {
    if (view !== "new") return;
    const loadLbfPlayers = async () => {
      const approvedLbf = lbfs.find(l => l.estado === "aprobada" && l.division === form.division && l.rama === form.rama && l.ano === YEAR);
      if (!approvedLbf) { sLbfJugadoraIds([]); return; }
      sLoadingLbf(true);
      const sb = createClient();
      const { data } = await sb.from("lbf_jugadoras").select("jugadora_id").eq("lbf_id", approvedLbf.id);
      sLbfJugadoraIds((data || []).map((d: any) => d.jugadora_id));
      sLoadingLbf(false);
    };
    loadLbfPlayers();
  }, [view, form.division, form.rama, lbfs]);

  const loadDetail = useCallback(async (p: any) => {
    sSel(p);
    sView("detail");
    const cRes = await apiFetch("/api/hockey/partidos/convocadas?partido_id=" + p.id);
    sConvocadas(await cRes.json());
    // Load LBF players for this convocatoria's division/rama
    const approvedLbf = lbfs.find(l => l.estado === "aprobada" && l.division === p.division && l.rama === p.rama && l.ano === YEAR);
    if (approvedLbf) {
      const sb = createClient();
      const { data } = await sb.from("lbf_jugadoras").select("jugadora_id").eq("lbf_id", approvedLbf.id);
      sDetailLbfIds((data || []).map((d: any) => d.jugadora_id));
    } else {
      sDetailLbfIds([]);
    }
  }, [lbfs]);

  // Create convocatoria
  const crearConvocatoria = async () => {
    if (form.competencia === "partido" && !form.rival.trim()) { showT("Ingresá el rival", "err"); return; }
    try {
      const body = { ...form, created_by: user?.id };
      if (form.competencia === "entrenamiento") body.rival = "Entrenamiento";
      const res = await apiFetch("/api/hockey/partidos", {
        method: "POST", body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPartidos(p => [data, ...p]);

      // Auto-save LBF jugadoras as convocadas
      if (lbfJugadoraIds.length > 0) {
        await apiFetch("/api/hockey/partidos/convocadas", {
          method: "POST",
          body: JSON.stringify({ partido_id: data.id, jugadoras: lbfJugadoraIds.map(id => ({ jugadora_id: id, titular: true })) }),
        });
      }

      showT("Convocatoria creada");
      loadDetail(data);
    } catch (e: any) { showT(e.message || "Error", "err"); }
  };

  // Save convocadas
  const saveConvocadas = async (ids: string[]) => {
    try {
      const res = await apiFetch("/api/hockey/partidos/convocadas", {
        method: "POST", body: JSON.stringify({ partido_id: sel.id, jugadoras: ids.map(id => ({ jugadora_id: id, titular: true })) }),
      });
      const data = await res.json();
      if (Array.isArray(data)) sConvocadas(data);
      showT("Plantel guardado");
    } catch (e: any) { showT(e.message || "Error", "err"); }
  };

  // Delete convocatoria
  const deleteConvocatoria = async () => {
    if (!sel || !confirm("¿Eliminar esta convocatoria?")) return;
    try {
      const res = await apiFetch("/api/hockey/partidos?id=" + sel.id, { method: "DELETE" });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPartidos(p => p.filter(x => x.id !== sel.id));
      showT("Convocatoria eliminada");
      sView("list"); sSel(null);
    } catch (e: any) { showT(e.message || "Error", "err"); }
  };

  // WhatsApp share
  const shareWhatsApp = () => {
    const convJugadoras = convocadas.map(c => jugadoras.find(j => j.id === c.jugadora_id)).filter(Boolean) as any[];
    shareConvocatoriaWhatsApp(sel, convJugadoras);
  };

  const filtered = partidos.filter(p => (!fDiv || p.division === fDiv) && (!fRama || p.rama === fRama));
  const activeJugadoras = jugadoras.filter(j => j.activa);

  // For the "new" view: players from LBF
  const lbfPlayers = activeJugadoras.filter(j => lbfJugadoraIds.includes(j.id));
  const approvedLbf = lbfs.find(l => l.estado === "aprobada" && l.division === form.division && l.rama === form.rama && l.ano === YEAR);

  // ── LIST ──
  if (view === "list") return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: mob ? 18 : 20, color: colors.nv }}>📣 Convocatorias</h2>
        <Btn v="p" s="s" onClick={() => sView("new")}>+ Nueva Convocatoria</Btn>
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
      {filtered.length === 0 ? <Card><div style={{ textAlign: "center", padding: 24, color: colors.g4 }}>No hay convocatorias registradas.</div></Card> : (
        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "repeat(auto-fill,minmax(300px,1fr))", gap: 10 }}>
          {filtered.map(p => {
            const tipo = CONVOCATORIA_TIPOS.find(c => c.k === p.competencia);
            return (
              <Card key={p.id} onClick={() => loadDetail(p)} style={{ cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: colors.nv }}>{fmtD(p.fecha)}</span>
                  {tipo && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: p.competencia === "partido" ? "#DBEAFE" : "#F3E8FF", color: p.competencia === "partido" ? "#1D4ED8" : "#7C3AED", fontWeight: 600 }}>{tipo.i} {tipo.l}</span>}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: colors.nv }}>{p.competencia === "entrenamiento" ? "🏋️ Entrenamiento" : `vs ${p.rival}`}</div>
                <div style={{ fontSize: 11, color: colors.g5, marginTop: 2 }}>
                  {p.fecha_numero ? `Fecha ${p.fecha_numero} • ` : ""}{p.division} • Rama {p.rama} • {p.sede === "local" ? "🏠 Local" : "✈️ Visitante"}
                </div>
                {p.notas && <div style={{ fontSize: 10, color: colors.g4, marginTop: 4, fontStyle: "italic" }}>📝 {p.notas.length > 60 ? p.notas.slice(0, 60) + "…" : p.notas}</div>}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  // ── NEW ──
  if (view === "new") {
    const isPartido = form.competencia === "partido";
    return (
      <div>
        <Btn v="g" s="s" onClick={() => sView("list")}>← Volver</Btn>
        <h3 style={{ margin: "12px 0", fontSize: 16, color: colors.nv }}>Nueva Convocatoria</h3>
        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 14, alignItems: "start" }}>
          {/* Left: Form */}
          <Card style={{ maxWidth: 480 }}>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: colors.g5 }}>Tipo
                <select value={form.competencia} onChange={e => sForm({ ...form, competencia: e.target.value })} style={{ display: "block", width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid " + colors.g3, marginTop: 4, fontSize: 13, background: cardBg, color: colors.nv }}>
                  {CONVOCATORIA_TIPOS.map(c => <option key={c.k} value={c.k}>{c.i} {c.l}</option>)}
                </select>
              </label>
              <label style={{ fontSize: 11, fontWeight: 600, color: colors.g5 }}>Día
                <input type="date" value={form.fecha} onChange={e => sForm({ ...form, fecha: e.target.value })} style={{ display: "block", width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid " + colors.g3, marginTop: 4, fontSize: 13, background: cardBg, color: colors.nv }} />
              </label>
              <label style={{ fontSize: 11, fontWeight: 600, color: colors.g5 }}>Fecha (nro)
                <input type="number" value={form.fecha_numero} onChange={e => sForm({ ...form, fecha_numero: e.target.value })} placeholder="Ej: 1, 2, 10..." min="1" style={{ display: "block", width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid " + colors.g3, marginTop: 4, fontSize: 13, background: cardBg, color: colors.nv }} />
              </label>
              {isPartido && (
                <label style={{ fontSize: 11, fontWeight: 600, color: colors.g5 }}>Rival
                  <input value={form.rival} onChange={e => sForm({ ...form, rival: e.target.value })} placeholder="Nombre del equipo rival" style={{ display: "block", width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid " + colors.g3, marginTop: 4, fontSize: 13, background: cardBg, color: colors.nv }} />
                </label>
              )}
              <label style={{ fontSize: 11, fontWeight: 600, color: colors.g5 }}>Sede
                <select value={form.sede} onChange={e => sForm({ ...form, sede: e.target.value })} style={{ display: "block", width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid " + colors.g3, marginTop: 4, fontSize: 13, background: cardBg, color: colors.nv }}>
                  <option value="local">🏠 Local</option>
                  <option value="visitante">✈️ Visitante</option>
                </select>
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
              <label style={{ fontSize: 11, fontWeight: 600, color: colors.g5 }}>Notas
                <textarea value={form.notas} onChange={e => sForm({ ...form, notas: e.target.value })} placeholder="Notas, instrucciones, punto de encuentro..." rows={3} style={{ display: "block", width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid " + colors.g3, marginTop: 4, fontSize: 13, background: cardBg, color: colors.nv, resize: "vertical", fontFamily: "inherit" }} />
              </label>
              <Btn v="s" onClick={crearConvocatoria}>Crear Convocatoria</Btn>
            </div>
          </Card>

          {/* Right: LBF players preview */}
          <Card>
            <div style={{ fontSize: 12, fontWeight: 700, color: colors.nv, marginBottom: 8 }}>
              Jugadoras de la LBF ({lbfPlayers.length})
            </div>
            {!approvedLbf ? (
              <div style={{ fontSize: 11, color: colors.yl, padding: "12px 0" }}>
                ⚠️ No hay LBF aprobada para {form.division} Rama {form.rama} {YEAR}
              </div>
            ) : loadingLbf ? (
              <div style={{ fontSize: 11, color: colors.g4, padding: "12px 0" }}>Cargando...</div>
            ) : lbfPlayers.length === 0 ? (
              <div style={{ fontSize: 11, color: colors.g4, padding: "12px 0" }}>La LBF no tiene jugadoras asignadas</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 2, maxHeight: 400, overflowY: "auto" }}>
                {lbfPlayers.map((j, i) => (
                  <div key={j.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 8px", borderRadius: 4, background: isDark ? "rgba(16,185,129,.08)" : "#F0FDF4" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: colors.gn, minWidth: 20 }}>{i + 1}</span>
                    <span style={{ flex: 1, fontSize: 12, color: colors.nv }}>{j.apellido}, {j.nombre}</span>
                    <span style={{ fontSize: 10, color: colors.g4 }}>{j.posicion || ""}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ fontSize: 10, color: colors.g4, marginTop: 8 }}>
              Estas jugadoras se agregarán automáticamente como convocadas
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ── DETAIL ──
  const convIds = new Set(convocadas.map(c => c.jugadora_id));
  const isPartido = sel?.competencia === "partido";
  const tipoLabel = CONVOCATORIA_TIPOS.find(c => c.k === sel?.competencia);
  // Show only LBF players for this division/rama (~20), sorted by name
  const detailPlayers = detailLbfIds.length > 0
    ? activeJugadoras.filter(j => detailLbfIds.includes(j.id)).sort((a, b) => a.apellido.localeCompare(b.apellido))
    : activeJugadoras.filter(j => convIds.has(j.id)); // fallback: show currently convoked
  const convCount = detailPlayers.filter(j => convIds.has(j.id)).length;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", flexWrap: "wrap", gap: 8 }}>
        <Btn v="g" s="s" onClick={() => { sView("list"); sSel(null); }}>← Volver</Btn>
        <div style={{ display: "flex", gap: 6 }}>
          <Btn v="s" s="s" onClick={shareWhatsApp}>📱 WhatsApp</Btn>
          <Btn v="g" s="s" onClick={deleteConvocatoria} style={{ color: colors.rd }}>🗑️ Eliminar</Btn>
        </div>
      </div>
      <div style={{ marginTop: 12, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          {tipoLabel && <span style={{ fontSize: 11, padding: "2px 10px", borderRadius: 10, background: isPartido ? "#DBEAFE" : "#F3E8FF", color: isPartido ? "#1D4ED8" : "#7C3AED", fontWeight: 600 }}>{tipoLabel.i} {tipoLabel.l}</span>}
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: colors.nv, marginTop: 4 }}>
          {isPartido ? `vs ${sel.rival}` : "🏋️ Entrenamiento"}
        </div>
        <div style={{ fontSize: 11, color: colors.g5 }}>
          {fmtD(sel.fecha)}{sel.fecha_numero ? ` • Fecha ${sel.fecha_numero}` : ""} • {sel.division} • Rama {sel.rama} • {sel.sede === "local" ? "🏠 Local" : "✈️ Visitante"}
        </div>
        {sel.notas && <div style={{ fontSize: 12, color: colors.g5, marginTop: 6, padding: "8px 12px", background: isDark ? "rgba(255,255,255,.04)" : "#F9FAFB", borderRadius: 6, fontStyle: "italic" }}>📝 {sel.notas}</div>}
      </div>

      {/* Convocadas - only LBF players */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: colors.nv }}>Plantel Convocado ({convCount}/{detailPlayers.length})</div>
          <Btn v="s" s="s" onClick={() => saveConvocadas(detailPlayers.filter(j => convIds.has(j.id)).map(j => j.id))}>💾 Guardar</Btn>
        </div>
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 2 }}>
          {detailPlayers.map(j => {
            const isConv = convIds.has(j.id);
            return (
              <div key={j.id} onClick={() => {
                if (isConv) sConvocadas(p => p.filter(c => c.jugadora_id !== j.id));
                else sConvocadas(p => [...p, { id: "t-" + j.id, partido_id: sel.id, jugadora_id: j.id, titular: true, created_at: "" }]);
              }} style={{ display: "flex", alignItems: "center", gap: 8, padding: mob ? "8px" : "4px 8px", borderRadius: 4, cursor: "pointer", background: isConv ? (isDark ? "rgba(16,185,129,.12)" : "#D1FAE5") : "transparent", minHeight: mob ? 40 : undefined }}>
                <span style={{ fontSize: 14 }}>{isConv ? "✅" : "⬜"}</span>
                <span style={{ flex: 1, fontSize: 12, color: colors.nv }}>{j.apellido}, {j.nombre}</span>
                <span style={{ fontSize: 10, color: colors.g4 }}>{j.posicion || ""}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
