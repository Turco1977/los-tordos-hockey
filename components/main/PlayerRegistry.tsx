"use client";
import { useState, useMemo } from "react";
import { useC } from "@/lib/theme-context";
import { Ring, Btn, Pager, Empty, useMobile } from "@/components/ui";
import { paginate } from "@/lib/pagination";
import PlayerFilters, { emptyFilters, type Filters } from "./PlayerFilters";
import { jugadorasToCSV, downloadCSV } from "@/lib/export";
import { CERT_ST } from "@/lib/constants";
import type { Jugadora } from "@/lib/supabase/types";

function adminPct(j: Jugadora): { pct: number; color: string; certOk: boolean; djOk: boolean; sociaOk: boolean } {
  const certOk = j.cert_medico_estado === CERT_ST.VIG;
  const djOk = !!j.derecho_jugadora;
  const sociaOk = !!j.socia;
  const score = (certOk ? 1 : 0) + (djOk ? 1 : 0) + (sociaOk ? 1 : 0);
  const pct = Math.round((score / 3) * 100);
  const color = pct === 100 ? "#10B981" : pct >= 50 ? "#F59E0B" : "#DC2626";
  return { pct, color, certOk, djOk, sociaOk };
}

export default function PlayerRegistry({ jugadoras, onSelect, onNew, onDel, onBulk, userLevel }: { jugadoras: Jugadora[]; onSelect: (j: Jugadora) => void; onNew: () => void; onDel?: (ids: string[]) => void; onBulk?: (file: File) => void; userLevel: number }) {
  const { colors, cardBg, isDark } = useC();
  const mob = useMobile();
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [page, setPage] = useState(1);
  const [selMode, sSelMode] = useState(false);
  const [selIds, sSelIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    let list = jugadoras;
    if (filters.q) {
      const q = filters.q.toLowerCase();
      list = list.filter(j => j.nombre.toLowerCase().includes(q) || j.apellido.toLowerCase().includes(q) || j.dni.includes(q));
    }
    if (filters.division) list = list.filter(j => (j.division_efectiva || j.division_manual) === filters.division);
    if (filters.rama) list = list.filter(j => j.rama === filters.rama);
    if (filters.cert) list = list.filter(j => j.cert_medico_estado === filters.cert);
    if (filters.estado) list = list.filter(j => j.estado === filters.estado);
    if (filters.derecho === "si") list = list.filter(j => j.derecho_jugadora);
    else if (filters.derecho === "no") list = list.filter(j => !j.derecho_jugadora);
    if (filters.departamento) list = list.filter(j => j.departamento === filters.departamento);
    return list;
  }, [jugadoras, filters]);

  const paged = paginate(filtered, page, 20);
  const canDel = userLevel <= 1 && onDel;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: mob ? 16 : 20, fontWeight: 800, color: colors.nv }}>Padrón de Jugadoras</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {selMode && selIds.size > 0 && <button onClick={() => { if (confirm(`Eliminar ${selIds.size} jugadora(s)?`)) { onDel?.([...selIds]); sSelIds(new Set()); sSelMode(false); } }} style={{ padding: "4px 10px", borderRadius: 8, border: "1px solid #DC2626", background: "#DC2626", fontSize: 10, fontWeight: 700, color: "#fff", cursor: "pointer" }}>Eliminar ({selIds.size})</button>}
          {canDel && <button onClick={() => { if (selMode) { sSelMode(false); sSelIds(new Set()); } else { sSelMode(true); } }} style={{ padding: "4px 10px", borderRadius: 8, border: "1px solid " + (selMode ? "#DC2626" : colors.g3), background: selMode ? (isDark ? "#7F1D1D" : "#FEF2F2") : cardBg, fontSize: 10, fontWeight: 600, color: selMode ? "#DC2626" : colors.g5, cursor: "pointer" }}>{selMode ? "Cancelar" : "Seleccionar"}</button>}
          <Btn v="g" s="s" onClick={() => { downloadCSV(jugadorasToCSV(filtered), `padron-${new Date().toISOString().slice(0,10)}.csv`); }}>Exportar CSV</Btn>
          {onBulk && <label style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid " + colors.g3, background: cardBg, fontSize: 11, fontWeight: 600, color: colors.nv, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>Carga Masiva<input type="file" accept=".csv" onChange={e => { const f = e.target.files?.[0]; if (f) onBulk(f); e.target.value = ""; }} style={{ display: "none" }} /></label>}
          <Btn s="s" onClick={onNew}>+ Nueva Jugadora</Btn>
        </div>
      </div>
      <PlayerFilters filters={filters} onChange={f => { setFilters(f); setPage(1); }} />
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: colors.g4 }}>{filtered.length} jugadora{filtered.length !== 1 ? "s" : ""}</span>
        {selMode && <>
          <button onClick={() => { if (selIds.size === filtered.length) { sSelIds(new Set()); } else { sSelIds(new Set(filtered.map(j => j.id))); } }} style={{ padding: "3px 10px", borderRadius: 6, border: "1px solid " + colors.bl, background: cardBg, fontSize: 10, fontWeight: 600, color: colors.bl, cursor: "pointer" }}>{selIds.size === filtered.length ? "Deseleccionar todo" : "Seleccionar todo"}</button>
          <span style={{ fontSize: 10, color: colors.g4 }}>{selIds.size} seleccionada(s)</span>
        </>}
      </div>

      {paged.data.length === 0 ? (
        <Empty icon="👥" title="Sin jugadoras" sub="No hay jugadoras que coincidan con los filtros" />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: mob ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: mob ? 8 : 12 }}>
          {paged.data.map(j => {
            const isSel = selIds.has(j.id);
            const a = adminPct(j);
            const certLabel = j.cert_medico_estado === CERT_ST.VIG ? "Vigente" : j.cert_medico_estado === CERT_ST.VENC ? "Vencido" : "Pendiente";
            const certColor = j.cert_medico_estado === CERT_ST.VIG ? colors.gn : j.cert_medico_estado === CERT_ST.VENC ? colors.rd : colors.yl;
            const estadoIcon = j.estado === "activa" ? "✅" : j.estado === "suspendida" ? "⚠️" : "❌";
            return (
              <div key={j.id} onClick={() => {
                if (selMode) { sSelIds(prev => { const n = new Set(prev); if (n.has(j.id)) n.delete(j.id); else n.add(j.id); return n; }); }
                else { onSelect(j); }
              }} style={{
                background: isSel ? (isDark ? "#7F1D1D" : "#FEF2F2") : cardBg,
                borderRadius: 16,
                padding: mob ? "14px 10px" : "20px 16px",
                textAlign: "center",
                border: "1px solid " + (isSel ? "#DC2626" : colors.g2),
                cursor: "pointer",
                position: "relative",
              }}>
                {selMode && <input type="checkbox" checked={isSel} readOnly style={{ position: "absolute", top: 8, left: 8, width: 16, height: 16, cursor: "pointer", accentColor: "#DC2626" }} />}
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <Ring pct={a.pct} color={a.color} size={mob ? 80 : 100} icon="👤"
                    pe={a.certOk ? 0 : 1} cu={a.djOk ? 0 : 1} ok={a.sociaOk ? 1 : 0}
                    tot={3} />
                </div>
                <div style={{ fontSize: mob ? 12 : 14, fontWeight: 700, color: colors.nv, marginTop: 6, lineHeight: 1.2 }}>
                  {j.apellido}
                </div>
                <div style={{ fontSize: mob ? 10 : 11, color: colors.g4, marginTop: 1 }}>
                  {j.nombre}
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: 6, fontSize: 10, marginTop: 6, flexWrap: "wrap" }}>
                  <span style={{ padding: "1px 6px", borderRadius: 10, background: a.certOk ? "#D1FAE5" : j.cert_medico_estado === CERT_ST.VENC ? "#FEE2E2" : "#FEF3C7", color: certColor, fontWeight: 600 }}>{certLabel}</span>
                  <span style={{ padding: "1px 6px", borderRadius: 10, background: a.djOk ? "#D1FAE5" : "#FEE2E2", color: a.djOk ? colors.gn : colors.rd, fontWeight: 600 }}>{a.djOk ? "DJ ✓" : "DJ ✗"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 10, background: isDark ? "rgba(255,255,255,.08)" : colors.g1, color: colors.g5, fontWeight: 600 }}>
                    {j.division_efectiva || j.division_manual || "-"} · {j.rama}
                  </span>
                  <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 10, background: isDark ? "rgba(255,255,255,.08)" : colors.g1, color: colors.g5, fontWeight: 600 }}>
                    {estadoIcon} {j.estado || "activa"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Pager page={paged.page} totalPages={paged.totalPages} onPage={setPage} />
    </div>
  );
}
