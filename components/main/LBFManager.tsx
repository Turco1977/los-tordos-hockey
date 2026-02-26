"use client";
import { useState, useMemo } from "react";
import { useC } from "@/lib/theme-context";
import { Card, Btn, LbfBadge, Empty, Spinner, useMobile, Pager } from "@/components/ui";
import { DIVISIONES, RAMAS, LBF_ST } from "@/lib/constants";
import { canAddToLBF, fullName } from "@/lib/mappers";
import { printLBF, shareLBFWhatsApp } from "@/lib/export";
import { createClient } from "@/lib/supabase/client";
import { paginate } from "@/lib/pagination";
import type { Jugadora, LBF, LBFJugadora } from "@/lib/supabase/types";
import LBFHistory from "./LBFHistory";

type View = "list" | "new" | "detail";

export default function LBFManager({ jugadoras, lbfs, userId, userLevel, onRefresh }: { jugadoras: Jugadora[]; lbfs: LBF[]; userId: string; userLevel: number; onRefresh: () => void }) {
  const { colors, cardBg } = useC();
  const mob = useMobile();
  const [view, setView] = useState<View>("list");
  const [selLbf, setSelLbf] = useState<LBF | null>(null);
  const [lbfPlayers, setLbfPlayers] = useState<(LBFJugadora & { jugadora?: Jugadora })[]>([]);
  const [form, setForm] = useState({ nombre: "", division: DIVISIONES[0] as string, rama: RAMAS[0] as string, fecha_partido: "", rival: "", sede: "" });
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);

  const sb = createClient();

  const openDetail = async (lbf: LBF) => {
    setSelLbf(lbf);
    const { data } = await sb.from("lbf_jugadoras").select("*, jugadora:jugadoras(*)").eq("lbf_id", lbf.id).order("orden");
    setLbfPlayers((data || []) as any);
    setView("detail");
  };

  const createLBF = async () => {
    setSaving(true);
    const res = await fetch("/api/hockey/lbf", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, creado_por: userId }) });
    const data = await res.json();
    setSaving(false);
    if (data.error) return alert(data.error);
    onRefresh();
    setView("list");
    setForm({ nombre: "", division: DIVISIONES[0], rama: RAMAS[0], fecha_partido: "", rival: "", sede: "" });
  };

  const addPlayer = async (j: Jugadora) => {
    if (!selLbf) return;
    await sb.from("lbf_jugadoras").insert({ lbf_id: selLbf.id, jugadora_id: j.id, titular: true, orden: lbfPlayers.length + 1 });
    await sb.from("lbf_historial").insert({ lbf_id: selLbf.id, accion: "jugadora_agregada", detalle: fullName(j), user_id: userId });
    openDetail(selLbf);
  };

  const removePlayer = async (ljId: string) => {
    if (!selLbf) return;
    await sb.from("lbf_jugadoras").delete().eq("id", ljId);
    openDetail(selLbf);
  };

  const toggleTitular = async (lj: LBFJugadora) => {
    await sb.from("lbf_jugadoras").update({ titular: !lj.titular }).eq("id", lj.id);
    if (selLbf) openDetail(selLbf);
  };

  const updateEstado = async (estado: string) => {
    if (!selLbf) return;
    await fetch("/api/hockey/lbf", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: selLbf.id, estado, _user_id: userId, _action: `estado_${estado}` }) });
    onRefresh();
    setSelLbf({ ...selLbf, estado: estado as any });
  };

  const available = useMemo(() => {
    if (!selLbf) return [];
    const inLbf = new Set(lbfPlayers.map(p => p.jugadora_id));
    return jugadoras.filter(j => j.activa && !inLbf.has(j.id)).sort((a, b) => {
      // Prioritize same division/rama, then sort alphabetically
      const aMatch = ((a.division_efectiva || a.division_manual) === selLbf.division && a.rama === selLbf.rama) ? 0 : 1;
      const bMatch = ((b.division_efectiva || b.division_manual) === selLbf.division && b.rama === selLbf.rama) ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;
      return a.apellido.localeCompare(b.apellido);
    });
  }, [selLbf, jugadoras, lbfPlayers]);

  const pagedLbfs = paginate(lbfs, page, 15);

  if (view === "new") {
    const inputSt: React.CSSProperties = { width: "100%", padding: 8, borderRadius: 7, border: "1px solid " + colors.g3, fontSize: 12, boxSizing: "border-box" };
    return (
      <div>
        <button onClick={() => setView("list")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: colors.bl, fontWeight: 600, padding: 0, marginBottom: 12 }}>← Volver</button>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.nv, marginBottom: 14 }}>Nueva Lista de Buena Fe</h3>
        <Card>
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 12 }}>
            <div><label style={{ fontSize: 11, fontWeight: 600, color: colors.g5 }}>Nombre *</label><input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} style={inputSt} /></div>
            <div><label style={{ fontSize: 11, fontWeight: 600, color: colors.g5 }}>División</label><select value={form.division} onChange={e => setForm({ ...form, division: e.target.value })} style={inputSt}>{DIVISIONES.map(d => <option key={d}>{d}</option>)}</select></div>
            <div><label style={{ fontSize: 11, fontWeight: 600, color: colors.g5 }}>Rama</label><select value={form.rama} onChange={e => setForm({ ...form, rama: e.target.value })} style={inputSt}>{RAMAS.map(r => <option key={r}>{r}</option>)}</select></div>
            <div><label style={{ fontSize: 11, fontWeight: 600, color: colors.g5 }}>Fecha Partido</label><input type="date" value={form.fecha_partido} onChange={e => setForm({ ...form, fecha_partido: e.target.value })} style={inputSt} /></div>
            <div><label style={{ fontSize: 11, fontWeight: 600, color: colors.g5 }}>Rival</label><input value={form.rival} onChange={e => setForm({ ...form, rival: e.target.value })} style={inputSt} /></div>
            <div><label style={{ fontSize: 11, fontWeight: 600, color: colors.g5 }}>Sede</label><input value={form.sede} onChange={e => setForm({ ...form, sede: e.target.value })} style={inputSt} /></div>
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
            <Btn v="g" onClick={() => setView("list")}>Cancelar</Btn>
            <Btn disabled={!form.nombre || saving} onClick={createLBF}>{saving ? "Creando..." : "Crear LBF"}</Btn>
          </div>
        </Card>
      </div>
    );
  }

  if (view === "detail" && selLbf) {
    const editable = selLbf.estado === LBF_ST.BORR;
    return (
      <div>
        <button onClick={() => { setView("list"); setSelLbf(null); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: colors.bl, fontWeight: 600, padding: 0, marginBottom: 8 }}>← Volver</button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: colors.nv }}>{selLbf.nombre}</h3>
            <div style={{ fontSize: 11, color: colors.g4, marginTop: 2 }}>{selLbf.division} | {selLbf.rama} {selLbf.rival && `| vs ${selLbf.rival}`}</div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <LbfBadge s={selLbf.estado} />
            {editable && <Btn s="s" v="w" onClick={() => updateEstado("pendiente")}>Enviar a Aprobación</Btn>}
            {selLbf.estado === LBF_ST.PEND && userLevel <= 2 && <Btn s="s" v="s" onClick={() => updateEstado("aprobada")}>Aprobar</Btn>}
            {selLbf.estado === LBF_ST.PEND && userLevel <= 2 && <Btn s="s" v="r" onClick={() => updateEstado("rechazada")}>Rechazar</Btn>}
            <Btn s="s" v="g" onClick={() => printLBF(selLbf, lbfPlayers)}>📄 Descargar PDF</Btn>
            <Btn s="s" v="g" onClick={() => shareLBFWhatsApp(selLbf, lbfPlayers)}>📲 WhatsApp</Btn>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 14 }}>
          {editable && (
            <Card>
              <div style={{ fontSize: 12, fontWeight: 700, color: colors.nv, marginBottom: 8 }}>Disponibles ({available.length})</div>
              {available.length === 0 ? <div style={{ fontSize: 11, color: colors.g4 }}>No hay jugadoras disponibles</div> : (
                <div style={{ maxHeight: 400, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                  {available.map(j => {
                    const check = canAddToLBF(j);
                    const blocked = !check.ok;
                    const divMatch = (j.division_efectiva || j.division_manual) === selLbf?.division && j.rama === selLbf?.rama;
                    return (
                      <div key={j.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", borderRadius: 6, border: "1px solid " + (blocked ? colors.rd + "40" : colors.g1), background: blocked ? colors.rd + "08" : "transparent", fontSize: 11, opacity: divMatch ? 1 : 0.6 }}>
                        <div>
                          <span style={{ color: blocked ? colors.g4 : colors.nv }}>{j.apellido}, {j.nombre}</span>
                          {!divMatch && <span style={{ fontSize: 9, color: colors.yl, marginLeft: 4 }}>({j.rama} - {j.division_efectiva || j.division_manual || "Sin div."})</span>}
                          {blocked && <div style={{ fontSize: 9, color: colors.rd, fontWeight: 600, marginTop: 1 }}>🚫 {check.reason}</div>}
                        </div>
                        {blocked
                          ? <span style={{ fontSize: 9, color: colors.rd, fontWeight: 600, flexShrink: 0, padding: "3px 8px" }}>Bloqueada</span>
                          : <button onClick={() => addPlayer(j)} style={{ background: colors.gn, color: "#fff", border: "none", borderRadius: 4, padding: "3px 8px", fontSize: 10, cursor: "pointer", fontWeight: 600, flexShrink: 0 }}>+ Agregar</button>
                        }
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          )}
          <Card style={editable ? {} : { gridColumn: "1/-1" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: colors.nv, marginBottom: 8 }}>En la lista ({lbfPlayers.length})</div>
            {lbfPlayers.length === 0 ? <div style={{ fontSize: 11, color: colors.g4 }}>Lista vacía</div> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {lbfPlayers.sort((a, b) => a.orden - b.orden).map(lj => (
                  <div key={lj.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", borderRadius: 6, border: "1px solid " + colors.g1, fontSize: 11 }}>
                    <div>
                      <span style={{ color: colors.nv, fontWeight: 600 }}>{lj.jugadora ? `${lj.jugadora.apellido}, ${lj.jugadora.nombre}` : "?"}</span>
                      <span style={{ marginLeft: 6, fontSize: 9, color: lj.titular ? colors.gn : colors.yl, fontWeight: 600 }}>{lj.titular ? "Titular" : "Suplente"}</span>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      {editable && <button onClick={() => toggleTitular(lj)} style={{ background: "none", border: "1px solid " + colors.g3, borderRadius: 4, padding: "2px 6px", fontSize: 9, cursor: "pointer", color: colors.g5 }}>{lj.titular ? "→ Sup" : "→ Tit"}</button>}
                      {editable && <button onClick={() => removePlayer(lj.id)} style={{ background: "none", border: "1px solid " + colors.rd, borderRadius: 4, padding: "2px 6px", fontSize: 9, cursor: "pointer", color: colors.rd }}>✕</button>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
        <div style={{ marginTop: 14 }}><LBFHistory lbfId={selLbf.id} /></div>
      </div>
    );
  }

  // List view
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: mob ? 16 : 20, fontWeight: 800, color: colors.nv }}>📋 Listas de Buena Fe</h2>
        <Btn s="s" onClick={() => setView("new")}>+ Nueva LBF</Btn>
      </div>
      {pagedLbfs.data.length === 0 ? <Empty icon="📋" title="Sin listas" sub="Creá tu primera Lista de Buena Fe" /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {pagedLbfs.data.map(lbf => (
            <Card key={lbf.id} onClick={() => openDetail(lbf)} style={{ cursor: "pointer", padding: 12, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 140 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: colors.nv }}>{lbf.nombre}</div>
                <div style={{ fontSize: 11, color: colors.g4 }}>{lbf.division} | {lbf.rama} {lbf.rival && `| vs ${lbf.rival}`}</div>
              </div>
              {lbf.fecha_partido && <span style={{ fontSize: 11, color: colors.g5 }}>{lbf.fecha_partido}</span>}
              <LbfBadge s={lbf.estado} sm />
            </Card>
          ))}
        </div>
      )}
      <Pager page={pagedLbfs.page} totalPages={pagedLbfs.totalPages} onPage={setPage} />
    </div>
  );
}
