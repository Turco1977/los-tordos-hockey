"use client";
import { useState, useMemo, useEffect } from "react";
import { useC } from "@/lib/theme-context";
import { Card, Btn, LbfBadge, Empty, Spinner, useMobile, Pager } from "@/components/ui";
import { apiFetch } from "@/lib/api/apiFetch";
import { DIVISIONES, RAMAS, LBF_ST, findEntrenadora } from "@/lib/constants";
import { fullName } from "@/lib/mappers";
import { printLBF, shareLBFWhatsApp } from "@/lib/export";
import { createClient } from "@/lib/supabase/client";
import { paginate } from "@/lib/pagination";
import type { Jugadora, LBF, LBFJugadora } from "@/lib/supabase/types";
import LBFHistory from "./LBFHistory";

type View = "list" | "new" | "detail";
const currentYear = new Date().getFullYear();

export default function LBFManager({ jugadoras, lbfs, userId, userLevel, onRefresh }: { jugadoras: Jugadora[]; lbfs: LBF[]; userId: string; userLevel: number; onRefresh: () => void }) {
  const { colors, cardBg } = useC();
  const mob = useMobile();
  const [view, setView] = useState<View>("list");
  const [selLbf, setSelLbf] = useState<LBF | null>(null);
  const [lbfPlayers, setLbfPlayers] = useState<(LBFJugadora & { jugadora?: Jugadora })[]>([]);
  const [form, setForm] = useState({ ano: currentYear, division: DIVISIONES[0] as string, rama: RAMAS[0] as string, entrenadora: "" });
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [filterDiv, setFilterDiv] = useState<string>("");
  const [search, setSearch] = useState("");
  const [availDiv, setAvailDiv] = useState<string>("");
  const [availRama, setAvailRama] = useState<string>("");

  const sb = createClient();

  // Auto-populate entrenadora when division/rama changes
  useEffect(() => {
    const ent = findEntrenadora(form.division, form.rama);
    setForm(prev => ({ ...prev, entrenadora: ent }));
  }, [form.division, form.rama]);

  const openDetail = async (lbf: LBF) => {
    setSelLbf(lbf);
    setAvailDiv(lbf.division);
    setAvailRama(lbf.rama);
    setSearch("");
    const { data } = await sb.from("lbf_jugadoras").select("*, jugadora:jugadoras(*)").eq("lbf_id", lbf.id).order("orden");
    setLbfPlayers((data || []) as any);
    setView("detail");
  };

  const createLBF = async () => {
    setSaving(true);
    const res = await apiFetch("/api/hockey/lbf", { method: "POST", body: JSON.stringify({ ano: form.ano, division: form.division, rama: form.rama, entrenadora: form.entrenadora || null }) });
    const data = await res.json();
    setSaving(false);
    if (data.error) return alert(data.error);
    onRefresh();
    setView("list");
    setForm({ ano: currentYear, division: DIVISIONES[0], rama: RAMAS[0], entrenadora: "" });
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
    await apiFetch("/api/hockey/lbf", { method: "PUT", body: JSON.stringify({ id: selLbf.id, estado, _user_id: userId, _action: `estado_${estado}` }) });
    onRefresh();
    setSelLbf({ ...selLbf, estado: estado as any });
  };

  const deleteLBF = async () => {
    if (!selLbf) return;
    if (!confirm(`¿Eliminar "${selLbf.nombre}"? Esta acción no se puede deshacer.`)) return;
    const res = await apiFetch("/api/hockey/lbf", { method: "DELETE", body: JSON.stringify({ id: selLbf.id }) });
    const data = await res.json();
    if (data.error) return alert(data.error);
    onRefresh();
    setView("list");
    setSelLbf(null);
  };

  const available = useMemo(() => {
    if (!selLbf) return [];
    const inLbf = new Set(lbfPlayers.map(p => p.jugadora_id));
    let list = jugadoras.filter(j => j.activa && !inLbf.has(j.id));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(j => `${j.apellido} ${j.nombre}`.toLowerCase().includes(q) || j.dni.includes(q));
    }
    if (availDiv) list = list.filter(j => (j.division_efectiva || j.division_manual) === availDiv);
    if (availRama) list = list.filter(j => j.rama === availRama);
    return list.sort((a, b) => a.apellido.localeCompare(b.apellido));
  }, [selLbf, jugadoras, lbfPlayers, search, availDiv, availRama]);

  const filteredLbfs = useMemo(() => {
    if (!filterDiv) return lbfs;
    return lbfs.filter(l => l.division === filterDiv);
  }, [lbfs, filterDiv]);

  const pagedLbfs = paginate(filteredLbfs, page, 15);

  if (view === "new") {
    const inputSt: React.CSSProperties = { width: "100%", padding: 8, borderRadius: 7, border: "1px solid " + colors.g3, fontSize: 12, boxSizing: "border-box" };
    return (
      <div>
        <button onClick={() => setView("list")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: colors.bl, fontWeight: 600, padding: 0, marginBottom: 12 }}>← Volver</button>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.nv, marginBottom: 14 }}>Nueva Lista de Buena Fe</h3>
        <Card>
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 12 }}>
            <div><label style={{ fontSize: 11, fontWeight: 600, color: colors.g5 }}>Año *</label><input type="number" value={form.ano} onChange={e => setForm({ ...form, ano: Number(e.target.value) })} style={inputSt} min={2020} max={2100} /></div>
            <div><label style={{ fontSize: 11, fontWeight: 600, color: colors.g5 }}>División *</label><select value={form.division} onChange={e => setForm({ ...form, division: e.target.value })} style={inputSt}>{DIVISIONES.map(d => <option key={d}>{d}</option>)}</select></div>
            <div><label style={{ fontSize: 11, fontWeight: 600, color: colors.g5 }}>Rama *</label><select value={form.rama} onChange={e => setForm({ ...form, rama: e.target.value })} style={inputSt}>{RAMAS.map(r => <option key={r}>{r}</option>)}</select></div>
            <div><label style={{ fontSize: 11, fontWeight: 600, color: colors.g5 }}>Entrenador/a</label><input value={form.entrenadora} onChange={e => setForm({ ...form, entrenadora: e.target.value })} style={inputSt} placeholder="Auto-detectado del organigrama" /></div>
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
            <Btn v="g" onClick={() => setView("list")}>Cancelar</Btn>
            <Btn disabled={!form.ano || !form.division || !form.rama || saving} onClick={createLBF}>{saving ? "Creando..." : "Crear LBF"}</Btn>
          </div>
        </Card>
      </div>
    );
  }

  if (view === "detail" && selLbf) {
    const editable = selLbf.estado !== LBF_ST.RECH && userLevel <= 3;
    return (
      <div>
        <button onClick={() => { setView("list"); setSelLbf(null); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: colors.bl, fontWeight: 600, padding: 0, marginBottom: 8 }}>← Volver</button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: colors.nv }}>{selLbf.nombre}</h3>
            <div style={{ fontSize: 11, color: colors.g4, marginTop: 2 }}>{selLbf.division} | Rama {selLbf.rama}{selLbf.entrenadora ? ` | ${selLbf.entrenadora}` : ""} | Temporada {selLbf.ano}</div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <LbfBadge s={selLbf.estado} />
            {editable && <Btn s="s" v="w" onClick={() => updateEstado("pendiente")}>Enviar a Aprobación</Btn>}
            {selLbf.estado === LBF_ST.PEND && userLevel <= 2 && <Btn s="s" v="s" onClick={() => updateEstado("aprobada")}>Aprobar</Btn>}
            {selLbf.estado === LBF_ST.PEND && userLevel <= 2 && <Btn s="s" v="r" onClick={() => updateEstado("rechazada")}>Rechazar</Btn>}
            <Btn s="s" v="g" onClick={() => printLBF(selLbf, lbfPlayers)}>Descargar PDF</Btn>
            <Btn s="s" v="g" onClick={() => shareLBFWhatsApp(selLbf, lbfPlayers)}>WhatsApp</Btn>
            {userLevel <= 3 && <Btn s="s" v="r" onClick={deleteLBF}>Eliminar</Btn>}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 14 }}>
          {editable && (
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: colors.nv }}>Disponibles ({available.length})</div>
              </div>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o DNI..." style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid " + colors.g3, fontSize: 11, marginBottom: 6, boxSizing: "border-box" }} />
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                <select value={availDiv} onChange={e => setAvailDiv(e.target.value)} style={{ flex: 1, padding: "4px 6px", borderRadius: 6, border: "1px solid " + colors.g3, fontSize: 10, color: colors.g5 }}>
                  <option value="">Todas las divisiones</option>
                  {DIVISIONES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={availRama} onChange={e => setAvailRama(e.target.value)} style={{ padding: "4px 6px", borderRadius: 6, border: "1px solid " + colors.g3, fontSize: 10, color: colors.g5 }}>
                  <option value="">Todas</option>
                  {RAMAS.map(r => <option key={r} value={r}>Rama {r}</option>)}
                </select>
              </div>
              {available.length === 0 ? <div style={{ fontSize: 11, color: colors.g4 }}>{search ? "Sin resultados" : "No hay más jugadoras en esta división/rama"}</div> : (
                <div style={{ maxHeight: 400, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                  {available.map(j => {
                    const otherDiv = (j.division_efectiva || j.division_manual) !== selLbf?.division || j.rama !== selLbf?.rama;
                    return (
                      <div key={j.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", borderRadius: 6, border: "1px solid " + colors.g1, fontSize: 11 }}>
                        <div>
                          <span style={{ color: colors.nv }}>{j.apellido}, {j.nombre}</span>
                          {otherDiv && <span style={{ fontSize: 9, color: colors.yl, marginLeft: 4 }}>({j.rama} - {j.division_efectiva || j.division_manual || "Sin div."})</span>}
                        </div>
                        <button onClick={() => addPlayer(j)} style={{ background: colors.gn, color: "#fff", border: "none", borderRadius: 4, padding: "3px 8px", fontSize: 10, cursor: "pointer", fontWeight: 600, flexShrink: 0 }}>+ Agregar</button>
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
        <h2 style={{ margin: 0, fontSize: mob ? 16 : 20, fontWeight: 800, color: colors.nv }}>Listas de Buena Fe</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select value={filterDiv} onChange={e => { setFilterDiv(e.target.value); setPage(1); }} style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid " + colors.g3, fontSize: 11, color: colors.g5 }}>
            <option value="">Todas las divisiones</option>
            {DIVISIONES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <Btn s="s" onClick={() => setView("new")}>+ Nueva LBF</Btn>
        </div>
      </div>
      {pagedLbfs.data.length === 0 ? <Empty icon="📋" title="Sin listas" sub={filterDiv ? `No hay listas para ${filterDiv}` : "Creá tu primera Lista de Buena Fe"} /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {pagedLbfs.data.map(lbf => (
            <Card key={lbf.id} onClick={() => openDetail(lbf)} style={{ cursor: "pointer", padding: 12, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 140 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: colors.nv }}>{lbf.nombre}</div>
                <div style={{ fontSize: 11, color: colors.g4 }}>{lbf.division} | Rama {lbf.rama}{lbf.entrenadora ? ` | ${lbf.entrenadora}` : ""}</div>
              </div>
              <span style={{ fontSize: 11, color: colors.g5 }}>{lbf.ano}</span>
              <LbfBadge s={lbf.estado} sm />
            </Card>
          ))}
        </div>
      )}
      <Pager page={pagedLbfs.page} totalPages={pagedLbfs.totalPages} onPage={setPage} />
    </div>
  );
}
