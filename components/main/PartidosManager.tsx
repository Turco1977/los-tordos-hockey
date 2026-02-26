"use client";
import { useState, useEffect, useCallback } from "react";
import { DIVISIONES, RAMAS, COMPETENCIA_TIPOS, EVENTO_TIPOS, RESULTADO_COLORS } from "@/lib/constants";
import { Btn, Card } from "@/components/ui";
import { useC } from "@/lib/theme-context";
import { useStore } from "@/lib/store";

const TODAY = new Date().toISOString().slice(0, 10);
const fmtD = (d: string) => { if (!d) return "–"; const p = d.slice(0, 10).split("-"); return p[2] + "/" + p[1] + "/" + p[0]; };

export default function PartidosManager({ user, mob, showT }: any) {
  const { colors, isDark, cardBg } = useC();
  const jugadoras = useStore(s => s.jugadoras);
  const partidos = useStore(s => s.partidos);
  const setPartidos = useStore(s => s.setPartidos);

  const [view, sView] = useState<"list" | "new" | "detail">("list");
  const [sel, sSel] = useState<any>(null);
  const [convocadas, sConvocadas] = useState<any[]>([]);
  const [eventos, sEventos] = useState<any[]>([]);
  const [fDiv, sFDiv] = useState("");
  const [fRama, sFRama] = useState("");
  const [form, sForm] = useState<{fecha:string;rival:string;sede:string;division:string;rama:string;competencia:string;notas:string}>({ fecha: TODAY, rival: "", sede: "local", division: DIVISIONES[0], rama: "A", competencia: "ahl", notas: "" });
  const [evForm, sEvForm] = useState({ tipo: "gol", jugadora_id: "", minuto: "" });

  const loadDetail = useCallback(async (p: any) => {
    sSel(p);
    sView("detail");
    const [cRes, eRes] = await Promise.all([
      fetch("/api/hockey/partidos/convocadas?partido_id=" + p.id),
      fetch("/api/hockey/partidos/eventos?partido_id=" + p.id),
    ]);
    sConvocadas(await cRes.json());
    sEventos(await eRes.json());
  }, []);

  // Create
  const crearPartido = async () => {
    if (!form.rival.trim()) { showT("Ingresá el rival", "err"); return; }
    try {
      const res = await fetch("/api/hockey/partidos", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, created_by: user?.id }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPartidos(p => [data, ...p]);
      showT("Partido creado");
      loadDetail(data);
    } catch (e: any) { showT(e.message || "Error", "err"); }
  };

  // Update score
  const updateScore = async (field: string, value: number) => {
    try {
      const res = await fetch("/api/hockey/partidos", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sel.id, [field]: Math.max(0, value), resultado: calcResultado(field === "goles_favor" ? value : sel.goles_favor, field === "goles_contra" ? value : sel.goles_contra) }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      sSel(data);
      setPartidos(p => p.map(x => x.id === data.id ? data : x));
    } catch (e: any) { showT(e.message || "Error", "err"); }
  };

  const calcResultado = (f: number, c: number) => f > c ? "V" : f < c ? "D" : "E";

  // Add event
  const addEvento = async () => {
    if (!evForm.jugadora_id) { showT("Seleccioná jugadora", "err"); return; }
    try {
      const res = await fetch("/api/hockey/partidos/eventos", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partido_id: sel.id, ...evForm, minuto: evForm.minuto ? parseInt(evForm.minuto) : null }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      sEventos(p => [...p, data]);
      sEvForm({ tipo: "gol", jugadora_id: "", minuto: "" });
      // Refresh partido for score update
      const pRes = await fetch("/api/hockey/partidos");
      const all = await pRes.json();
      if (Array.isArray(all)) {
        setPartidos(() => all);
        const updated = all.find((p: any) => p.id === sel.id);
        if (updated) sSel(updated);
      }
      showT("Evento registrado");
    } catch (e: any) { showT(e.message || "Error", "err"); }
  };

  // Delete event
  const delEvento = async (id: string) => {
    try {
      await fetch("/api/hockey/partidos/eventos?id=" + id + "&partido_id=" + sel.id, { method: "DELETE" });
      sEventos(p => p.filter(e => e.id !== id));
      const pRes = await fetch("/api/hockey/partidos");
      const all = await pRes.json();
      if (Array.isArray(all)) {
        setPartidos(() => all);
        const updated = all.find((p: any) => p.id === sel.id);
        if (updated) sSel(updated);
      }
    } catch (e: any) { showT(e.message || "Error", "err"); }
  };

  // Save convocadas
  const saveConvocadas = async (ids: string[]) => {
    try {
      const res = await fetch("/api/hockey/partidos/convocadas", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partido_id: sel.id, jugadoras: ids.map(id => ({ jugadora_id: id, titular: true })) }),
      });
      const data = await res.json();
      if (Array.isArray(data)) sConvocadas(data);
      showT("Plantel guardado");
    } catch (e: any) { showT(e.message || "Error", "err"); }
  };

  const filtered = partidos.filter(p => (!fDiv || p.division === fDiv) && (!fRama || p.rama === fRama));
  const activeJugadoras = jugadoras.filter(j => j.activa);

  // ── LIST ──
  if (view === "list") return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: mob ? 18 : 20, color: colors.nv }}>⚽ Partidos</h2>
        <Btn v="p" s="s" onClick={() => sView("new")}>+ Nuevo Partido</Btn>
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
      {filtered.length === 0 ? <Card><div style={{ textAlign: "center", padding: 24, color: colors.g4 }}>No hay partidos registrados.</div></Card> : (
        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "repeat(auto-fill,minmax(300px,1fr))", gap: 10 }}>
          {filtered.map(p => {
            const rc = RESULTADO_COLORS[p.resultado || ""] || { bg: colors.g2, c: colors.g5 };
            return (
              <Card key={p.id} onClick={() => loadDetail(p)} style={{ cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: colors.nv }}>{fmtD(p.fecha)}</span>
                  {p.resultado && <span style={{ fontSize: 11, padding: "2px 10px", borderRadius: 12, background: rc.bg, color: rc.c, fontWeight: 700 }}>{p.resultado} {p.goles_favor}-{p.goles_contra}</span>}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: colors.nv }}>vs {p.rival}</div>
                <div style={{ fontSize: 11, color: colors.g5, marginTop: 2 }}>{p.division} • Rama {p.rama} • {p.sede === "local" ? "🏠 Local" : "✈️ Visitante"}</div>
                <div style={{ fontSize: 10, color: colors.g4, marginTop: 2 }}>{COMPETENCIA_TIPOS.find(c => c.k === p.competencia)?.l}</div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  // ── NEW ──
  if (view === "new") return (
    <div>
      <Btn v="g" s="s" onClick={() => sView("list")}>← Volver</Btn>
      <h3 style={{ margin: "12px 0", fontSize: 16, color: colors.nv }}>Nuevo Partido</h3>
      <Card style={{ maxWidth: 480 }}>
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: colors.g5 }}>Fecha
            <input type="date" value={form.fecha} onChange={e => sForm({ ...form, fecha: e.target.value })} style={{ display: "block", width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid " + colors.g3, marginTop: 4, fontSize: 13, background: cardBg, color: colors.nv }} />
          </label>
          <label style={{ fontSize: 11, fontWeight: 600, color: colors.g5 }}>Rival
            <input value={form.rival} onChange={e => sForm({ ...form, rival: e.target.value })} placeholder="Nombre del equipo rival" style={{ display: "block", width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid " + colors.g3, marginTop: 4, fontSize: 13, background: cardBg, color: colors.nv }} />
          </label>
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
          <label style={{ fontSize: 11, fontWeight: 600, color: colors.g5 }}>Competencia
            <select value={form.competencia} onChange={e => sForm({ ...form, competencia: e.target.value })} style={{ display: "block", width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid " + colors.g3, marginTop: 4, fontSize: 13, background: cardBg, color: colors.nv }}>
              {COMPETENCIA_TIPOS.map(c => <option key={c.k} value={c.k}>{c.l}</option>)}
            </select>
          </label>
          <Btn v="s" onClick={crearPartido}>Crear Partido</Btn>
        </div>
      </Card>
    </div>
  );

  // ── DETAIL ──
  const convIds = new Set(convocadas.map(c => c.jugadora_id));
  return (
    <div>
      <Btn v="g" s="s" onClick={() => { sView("list"); sSel(null); }}>← Volver</Btn>
      <div style={{ marginTop: 12, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: colors.nv }}>{sel.goles_favor} - {sel.goles_contra}</div>
          {sel.resultado && <span style={{ fontSize: 14, padding: "2px 12px", borderRadius: 12, background: (RESULTADO_COLORS[sel.resultado] || {}).bg, color: (RESULTADO_COLORS[sel.resultado] || {}).c, fontWeight: 700 }}>{sel.resultado}</span>}
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: colors.nv, marginTop: 4 }}>vs {sel.rival}</div>
        <div style={{ fontSize: 11, color: colors.g5 }}>{fmtD(sel.fecha)} • {sel.division} • Rama {sel.rama} • {sel.sede === "local" ? "🏠 Local" : "✈️ Visitante"}</div>
      </div>

      {/* Score controls */}
      <Card style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: colors.nv }}>Marcador</div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{ textAlign: "center" as const }}>
            <div style={{ fontSize: 10, color: colors.g5, marginBottom: 4 }}>A favor</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button onClick={() => updateScore("goles_favor", sel.goles_favor - 1)} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid " + colors.g3, background: cardBg, cursor: "pointer", fontSize: 14, color: colors.nv }}>−</button>
              <span style={{ fontSize: 20, fontWeight: 800, minWidth: 30, textAlign: "center" as const, color: colors.nv }}>{sel.goles_favor}</span>
              <button onClick={() => updateScore("goles_favor", sel.goles_favor + 1)} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid " + colors.g3, background: cardBg, cursor: "pointer", fontSize: 14, color: colors.nv }}>+</button>
            </div>
          </div>
          <div style={{ textAlign: "center" as const }}>
            <div style={{ fontSize: 10, color: colors.g5, marginBottom: 4 }}>En contra</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button onClick={() => updateScore("goles_contra", sel.goles_contra - 1)} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid " + colors.g3, background: cardBg, cursor: "pointer", fontSize: 14, color: colors.nv }}>−</button>
              <span style={{ fontSize: 20, fontWeight: 800, minWidth: 30, textAlign: "center" as const, color: colors.nv }}>{sel.goles_contra}</span>
              <button onClick={() => updateScore("goles_contra", sel.goles_contra + 1)} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid " + colors.g3, background: cardBg, cursor: "pointer", fontSize: 14, color: colors.nv }}>+</button>
            </div>
          </div>
        </div>
      </Card>

      {/* Events */}
      <Card style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: colors.nv }}>Eventos del Partido</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
          <select value={evForm.tipo} onChange={e => sEvForm({ ...evForm, tipo: e.target.value })} style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid " + colors.g3, fontSize: 11, background: cardBg, color: colors.nv }}>
            {EVENTO_TIPOS.map(e => <option key={e.k} value={e.k}>{e.i} {e.l}</option>)}
          </select>
          <select value={evForm.jugadora_id} onChange={e => sEvForm({ ...evForm, jugadora_id: e.target.value })} style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid " + colors.g3, fontSize: 11, flex: 1, minWidth: 120, background: cardBg, color: colors.nv }}>
            <option value="">Jugadora...</option>
            {activeJugadoras.map(j => <option key={j.id} value={j.id}>{j.apellido}, {j.nombre}</option>)}
          </select>
          <input value={evForm.minuto} onChange={e => sEvForm({ ...evForm, minuto: e.target.value })} placeholder="Min" type="number" style={{ width: 50, padding: "6px 8px", borderRadius: 6, border: "1px solid " + colors.g3, fontSize: 11, background: cardBg, color: colors.nv }} />
          <Btn v="s" s="s" onClick={addEvento}>+</Btn>
        </div>
        {eventos.length === 0 ? <div style={{ fontSize: 11, color: colors.g4 }}>Sin eventos</div> : (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 4 }}>
            {eventos.map(ev => {
              const et = EVENTO_TIPOS.find(e => e.k === ev.tipo);
              const j = jugadoras.find(j => j.id === ev.jugadora_id);
              return (
                <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 6px", borderRadius: 4, background: isDark ? "rgba(255,255,255,.04)" : "#F9FAFB" }}>
                  <span style={{ fontSize: 14 }}>{et?.i}</span>
                  <span style={{ flex: 1, fontSize: 11, color: colors.nv }}>{j ? j.apellido + ", " + j.nombre : "?"}</span>
                  {ev.minuto && <span style={{ fontSize: 10, color: colors.g4 }}>{ev.minuto}&apos;</span>}
                  <button onClick={() => delEvento(ev.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: colors.rd }}>✕</button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Convocadas */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: colors.nv }}>Plantel Convocado ({convocadas.length})</div>
          <Btn v="s" s="s" onClick={() => saveConvocadas(activeJugadoras.filter(j => convIds.has(j.id)).map(j => j.id))}>💾 Guardar</Btn>
        </div>
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 2 }}>
          {activeJugadoras.map(j => {
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
