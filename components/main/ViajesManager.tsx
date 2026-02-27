"use client";
import { useState, useMemo, useEffect } from "react";
import { useC } from "@/lib/theme-context";
import { Card, Btn, Empty, useMobile, Pager } from "@/components/ui";
import { VIAJE_ST, VIAJE_SC, VIAJE_MOTIVOS, HOCKEY_ROLES } from "@/lib/constants";
import { canAddToViaje, fullName } from "@/lib/mappers";
import { createClient } from "@/lib/supabase/client";
import { paginate } from "@/lib/pagination";
import type { Jugadora, Viaje, ViajeJugadora, ViajeStaff, ViajeHistorial, HockeyRole } from "@/lib/supabase/types";

type View = "list" | "new" | "detail";
const fmtDate = (d: string) => { if (!d) return "–"; const p = d.split("-"); return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d; };
const fmtMoney = (n: number) => n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

export default function ViajesManager({ jugadoras, viajes, userId, userLevel, onRefresh, staff }: { jugadoras: Jugadora[]; viajes: Viaje[]; userId: string; userLevel: number; onRefresh: () => void; staff: HockeyRole[] }) {
  const { colors } = useC();
  const mob = useMobile();
  const sb = createClient();

  const [view, setView] = useState<View>("list");
  const [selViaje, setSelViaje] = useState<Viaje | null>(null);
  const [vjPlayers, setVjPlayers] = useState<ViajeJugadora[]>([]);
  const [vjStaff, setVjStaff] = useState<ViajeStaff[]>([]);
  const [vjHist, setVjHist] = useState<ViajeHistorial[]>([]);
  const [form, setForm] = useState({ destino: "", fecha_ida: "", fecha_vuelta: "", motivo: "torneo", costo_transporte: 0, costo_alojamiento: 0, costo_alimentacion: 0, costo_otros: 0, notas: "" });
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);

  const openDetail = async (v: Viaje) => {
    setSelViaje(v);
    const [pRes, sRes, hRes] = await Promise.all([
      sb.from("viaje_jugadoras").select("*, jugadora:jugadoras(*)").eq("viaje_id", v.id).order("created_at"),
      sb.from("viaje_staff").select("*, profile:profiles(*)").eq("viaje_id", v.id).order("created_at"),
      sb.from("viaje_historial").select("*, profile:profiles(*)").eq("viaje_id", v.id).order("created_at", { ascending: false }),
    ]);
    setVjPlayers((pRes.data || []) as any);
    setVjStaff((sRes.data || []) as any);
    setVjHist((hRes.data || []) as any);
    setView("detail");
  };

  const createViaje = async () => {
    setSaving(true);
    const res = await fetch("/api/hockey/viajes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, creado_por: userId }) });
    const data = await res.json();
    setSaving(false);
    if (data.error) return alert(data.error);
    onRefresh();
    setView("list");
    setForm({ destino: "", fecha_ida: "", fecha_vuelta: "", motivo: "torneo", costo_transporte: 0, costo_alojamiento: 0, costo_alimentacion: 0, costo_otros: 0, notas: "" });
  };

  const addPlayer = async (j: Jugadora) => {
    if (!selViaje) return;
    await sb.from("viaje_jugadoras").insert({ viaje_id: selViaje.id, jugadora_id: j.id });
    await sb.from("viaje_historial").insert({ viaje_id: selViaje.id, accion: "jugadora_agregada", detalle: fullName(j), user_id: userId });
    openDetail(selViaje);
  };

  const removePlayer = async (vjId: string) => {
    if (!selViaje) return;
    await sb.from("viaje_jugadoras").delete().eq("id", vjId);
    openDetail(selViaje);
  };

  const addStaff = async (hr: HockeyRole) => {
    if (!selViaje) return;
    const alreadyIn = vjStaff.some(s => s.user_id === hr.user_id);
    if (alreadyIn) return;
    const rolLabel = HOCKEY_ROLES[hr.role]?.l || hr.role;
    await sb.from("viaje_staff").insert({ viaje_id: selViaje.id, user_id: hr.user_id, rol: rolLabel });
    await sb.from("viaje_historial").insert({ viaje_id: selViaje.id, accion: "staff_agregado", detalle: `${hr.profile?.first_name || ""} ${hr.profile?.last_name || ""} (${rolLabel})`, user_id: userId });
    openDetail(selViaje);
  };

  const removeStaff = async (vsId: string) => {
    if (!selViaje) return;
    await sb.from("viaje_staff").delete().eq("id", vsId);
    openDetail(selViaje);
  };

  const updateEstado = async (estado: string) => {
    if (!selViaje) return;
    await fetch("/api/hockey/viajes", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: selViaje.id, estado, _user_id: userId, _action: `estado_${estado}` }) });
    onRefresh();
    setSelViaje({ ...selViaje, estado: estado as any });
  };

  const deleteViaje = async () => {
    if (!selViaje) return;
    if (!confirm(`¿Eliminar viaje a "${selViaje.destino}"? Esta acción no se puede deshacer.`)) return;
    const res = await fetch("/api/hockey/viajes", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: selViaje.id }) });
    const data = await res.json();
    if (data.error) return alert(data.error);
    onRefresh();
    setView("list");
    setSelViaje(null);
  };

  const available = useMemo(() => {
    if (!selViaje) return [];
    const inViaje = new Set(vjPlayers.map(p => p.jugadora_id));
    return jugadoras.filter(j => j.activa && !inViaje.has(j.id)).sort((a, b) => a.apellido.localeCompare(b.apellido));
  }, [selViaje, jugadoras, vjPlayers]);

  const availableStaff = useMemo(() => {
    if (!selViaje) return [];
    const inViaje = new Set(vjStaff.map(s => s.user_id));
    return staff.filter(s => s.active && !inViaje.has(s.user_id));
  }, [selViaje, staff, vjStaff]);

  const pagedViajes = paginate(viajes, page, 15);

  const Badge = ({ s }: { s: string }) => { const c = VIAJE_SC[s]; if (!c) return null; return <span style={{ background: c.bg, color: c.c, padding: "2px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>{c.i} {c.l}</span>; };
  const motivoLabel = (k: string) => VIAJE_MOTIVOS.find(m => m.k === k)?.l || k;

  // ── New view ──
  if (view === "new") {
    const inputSt: React.CSSProperties = { width: "100%", padding: 8, borderRadius: 7, border: "1px solid " + colors.g3, fontSize: 12, boxSizing: "border-box" };
    return (
      <div>
        <button onClick={() => setView("list")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: colors.bl, fontWeight: 600, padding: 0, marginBottom: 12 }}>← Volver</button>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.nv, marginBottom: 14 }}>Nuevo Viaje</h3>
        <Card>
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 12 }}>
            <div><label style={{ fontSize: 11, fontWeight: 600, color: colors.g5 }}>Destino *</label><input value={form.destino} onChange={e => setForm({ ...form, destino: e.target.value })} style={inputSt} placeholder="Ej: Buenos Aires" /></div>
            <div><label style={{ fontSize: 11, fontWeight: 600, color: colors.g5 }}>Motivo</label><select value={form.motivo} onChange={e => setForm({ ...form, motivo: e.target.value })} style={inputSt}>{VIAJE_MOTIVOS.map(m => <option key={m.k} value={m.k}>{m.i} {m.l}</option>)}</select></div>
            <div><label style={{ fontSize: 11, fontWeight: 600, color: colors.g5 }}>Fecha Ida *</label><input type="date" value={form.fecha_ida} onChange={e => setForm({ ...form, fecha_ida: e.target.value })} style={inputSt} /></div>
            <div><label style={{ fontSize: 11, fontWeight: 600, color: colors.g5 }}>Fecha Vuelta *</label><input type="date" value={form.fecha_vuelta} onChange={e => setForm({ ...form, fecha_vuelta: e.target.value })} style={inputSt} /></div>
            <div><label style={{ fontSize: 11, fontWeight: 600, color: colors.g5 }}>Transporte ($)</label><input type="number" value={form.costo_transporte || ""} onChange={e => setForm({ ...form, costo_transporte: Number(e.target.value) || 0 })} style={inputSt} /></div>
            <div><label style={{ fontSize: 11, fontWeight: 600, color: colors.g5 }}>Alojamiento ($)</label><input type="number" value={form.costo_alojamiento || ""} onChange={e => setForm({ ...form, costo_alojamiento: Number(e.target.value) || 0 })} style={inputSt} /></div>
            <div><label style={{ fontSize: 11, fontWeight: 600, color: colors.g5 }}>Alimentación ($)</label><input type="number" value={form.costo_alimentacion || ""} onChange={e => setForm({ ...form, costo_alimentacion: Number(e.target.value) || 0 })} style={inputSt} /></div>
            <div><label style={{ fontSize: 11, fontWeight: 600, color: colors.g5 }}>Otros ($)</label><input type="number" value={form.costo_otros || ""} onChange={e => setForm({ ...form, costo_otros: Number(e.target.value) || 0 })} style={inputSt} /></div>
            <div style={{ gridColumn: mob ? "1" : "1/-1" }}><label style={{ fontSize: 11, fontWeight: 600, color: colors.g5 }}>Notas</label><textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} style={{ ...inputSt, minHeight: 60, resize: "vertical" }} /></div>
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
            <Btn v="g" onClick={() => setView("list")}>Cancelar</Btn>
            <Btn disabled={!form.destino || !form.fecha_ida || !form.fecha_vuelta || saving} onClick={createViaje}>{saving ? "Creando..." : "Crear Viaje"}</Btn>
          </div>
        </Card>
      </div>
    );
  }

  // ── Detail view ──
  if (view === "detail" && selViaje) {
    const editable = selViaje.estado === VIAJE_ST.BORR;
    const costoTotal = (selViaje.costo_transporte || 0) + (selViaje.costo_alojamiento || 0) + (selViaje.costo_alimentacion || 0) + (selViaje.costo_otros || 0);

    return (
      <div>
        <button onClick={() => { setView("list"); setSelViaje(null); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: colors.bl, fontWeight: 600, padding: 0, marginBottom: 8 }}>← Volver</button>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: colors.nv }}>🚌 {selViaje.destino}</h3>
            <div style={{ fontSize: 11, color: colors.g4, marginTop: 2 }}>{motivoLabel(selViaje.motivo)} | {fmtDate(selViaje.fecha_ida)} → {fmtDate(selViaje.fecha_vuelta)}</div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <Badge s={selViaje.estado} />
            {editable && <Btn s="s" v="w" onClick={() => updateEstado("pendiente")}>Enviar a Aprobación</Btn>}
            {selViaje.estado === VIAJE_ST.PEND && userLevel <= 2 && <Btn s="s" v="s" onClick={() => updateEstado("aprobado")}>Aprobar</Btn>}
            {selViaje.estado === VIAJE_ST.PEND && userLevel <= 2 && <Btn s="s" v="r" onClick={() => updateEstado("cancelado")}>Cancelar</Btn>}
            {userLevel <= 3 && <Btn s="s" v="r" onClick={deleteViaje}>🗑 Eliminar</Btn>}
          </div>
        </div>

        {/* Costos card */}
        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: colors.nv, marginBottom: 8 }}>💰 Costos</div>
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "1fr 1fr 1fr 1fr 1fr", gap: 8 }}>
            {[
              { l: "Transporte", v: selViaje.costo_transporte },
              { l: "Alojamiento", v: selViaje.costo_alojamiento },
              { l: "Alimentación", v: selViaje.costo_alimentacion },
              { l: "Otros", v: selViaje.costo_otros },
              { l: "TOTAL", v: costoTotal },
            ].map(c => (
              <div key={c.l} style={{ padding: 8, borderRadius: 6, background: c.l === "TOTAL" ? colors.bl + "15" : colors.g1, textAlign: "center" }}>
                <div style={{ fontSize: 10, color: colors.g4 }}>{c.l}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: c.l === "TOTAL" ? colors.bl : colors.nv }}>{fmtMoney(c.v || 0)}</div>
              </div>
            ))}
          </div>
        </Card>

        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 14 }}>
          {/* Jugadoras */}
          <Card>
            <div style={{ fontSize: 12, fontWeight: 700, color: colors.nv, marginBottom: 8 }}>👥 Jugadoras ({vjPlayers.length})</div>
            {vjPlayers.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: editable ? 10 : 0 }}>
                {vjPlayers.map(vj => (
                  <div key={vj.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", borderRadius: 6, border: "1px solid " + colors.g1, fontSize: 11 }}>
                    <span style={{ color: colors.nv, fontWeight: 600 }}>{vj.jugadora ? `${vj.jugadora.apellido}, ${vj.jugadora.nombre}` : "?"}</span>
                    {editable && <button onClick={() => removePlayer(vj.id)} style={{ background: "none", border: "1px solid " + colors.rd, borderRadius: 4, padding: "2px 6px", fontSize: 9, cursor: "pointer", color: colors.rd }}>✕</button>}
                  </div>
                ))}
              </div>
            )}
            {vjPlayers.length === 0 && <div style={{ fontSize: 11, color: colors.g4, marginBottom: editable ? 10 : 0 }}>Sin jugadoras asignadas</div>}
            {editable && (
              <>
                <div style={{ fontSize: 10, fontWeight: 600, color: colors.g5, marginBottom: 4 }}>Agregar jugadora:</div>
                <div style={{ maxHeight: 300, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                  {available.map(j => {
                    const check = canAddToViaje(j);
                    const blocked = !check.ok;
                    return (
                      <div key={j.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 8px", borderRadius: 6, border: "1px solid " + (blocked ? colors.rd + "40" : colors.g1), background: blocked ? colors.rd + "08" : "transparent", fontSize: 11 }}>
                        <div>
                          <span style={{ color: blocked ? colors.g4 : colors.nv }}>{j.apellido}, {j.nombre}</span>
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
              </>
            )}
          </Card>

          {/* Staff */}
          <Card>
            <div style={{ fontSize: 12, fontWeight: 700, color: colors.nv, marginBottom: 8 }}>🏋️ Staff ({vjStaff.length})</div>
            {vjStaff.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: editable ? 10 : 0 }}>
                {vjStaff.map(vs => (
                  <div key={vs.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", borderRadius: 6, border: "1px solid " + colors.g1, fontSize: 11 }}>
                    <div>
                      <span style={{ color: colors.nv, fontWeight: 600 }}>{vs.profile ? `${vs.profile.first_name} ${vs.profile.last_name}` : "?"}</span>
                      <span style={{ marginLeft: 6, fontSize: 9, color: colors.bl, fontWeight: 600 }}>{vs.rol}</span>
                    </div>
                    {editable && <button onClick={() => removeStaff(vs.id)} style={{ background: "none", border: "1px solid " + colors.rd, borderRadius: 4, padding: "2px 6px", fontSize: 9, cursor: "pointer", color: colors.rd }}>✕</button>}
                  </div>
                ))}
              </div>
            )}
            {vjStaff.length === 0 && <div style={{ fontSize: 11, color: colors.g4, marginBottom: editable ? 10 : 0 }}>Sin staff asignado</div>}
            {editable && availableStaff.length > 0 && (
              <>
                <div style={{ fontSize: 10, fontWeight: 600, color: colors.g5, marginBottom: 4 }}>Agregar staff:</div>
                <div style={{ maxHeight: 200, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                  {availableStaff.map(hr => (
                    <div key={hr.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 8px", borderRadius: 6, border: "1px solid " + colors.g1, fontSize: 11 }}>
                      <span style={{ color: colors.nv }}>{hr.profile?.first_name} {hr.profile?.last_name} <span style={{ fontSize: 9, color: colors.g4 }}>({HOCKEY_ROLES[hr.role]?.l || hr.role})</span></span>
                      <button onClick={() => addStaff(hr)} style={{ background: colors.gn, color: "#fff", border: "none", borderRadius: 4, padding: "3px 8px", fontSize: 10, cursor: "pointer", fontWeight: 600, flexShrink: 0 }}>+ Agregar</button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>

        {/* Notas */}
        {selViaje.notas && (
          <Card style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: colors.nv, marginBottom: 4 }}>📝 Notas</div>
            <div style={{ fontSize: 12, color: colors.g5, whiteSpace: "pre-wrap" }}>{selViaje.notas}</div>
          </Card>
        )}

        {/* Historial */}
        {vjHist.length > 0 && (
          <Card style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: colors.nv, marginBottom: 8 }}>📜 Historial</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {vjHist.map(h => (
                <div key={h.id} style={{ display: "flex", gap: 8, fontSize: 11, color: colors.g5 }}>
                  <span style={{ color: colors.g4, flexShrink: 0 }}>{new Date(h.created_at).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                  <span><strong>{h.profile ? `${h.profile.first_name} ${h.profile.last_name}` : "?"}</strong> — {h.accion}{h.detalle ? `: ${h.detalle}` : ""}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  }

  // ── List view ──
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: mob ? 16 : 20, fontWeight: 800, color: colors.nv }}>🚌 Viajes</h2>
        <Btn s="s" onClick={() => setView("new")}>+ Nuevo Viaje</Btn>
      </div>
      {pagedViajes.data.length === 0 ? <Empty icon="🚌" title="Sin viajes" sub="Creá tu primer viaje" /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {pagedViajes.data.map(v => {
            const total = (v.costo_transporte || 0) + (v.costo_alojamiento || 0) + (v.costo_alimentacion || 0) + (v.costo_otros || 0);
            return (
              <Card key={v.id} onClick={() => openDetail(v)} style={{ cursor: "pointer", padding: 12, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: colors.nv }}>{v.destino}</div>
                  <div style={{ fontSize: 11, color: colors.g4 }}>{motivoLabel(v.motivo)} | {fmtDate(v.fecha_ida)} → {fmtDate(v.fecha_vuelta)}</div>
                </div>
                {total > 0 && <span style={{ fontSize: 11, color: colors.g5, fontWeight: 600 }}>{fmtMoney(total)}</span>}
                <Badge s={v.estado} />
              </Card>
            );
          })}
        </div>
      )}
      <Pager page={pagedViajes.page} totalPages={pagedViajes.totalPages} onPage={setPage} />
    </div>
  );
}
