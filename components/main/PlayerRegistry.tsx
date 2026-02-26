"use client";
import { useState, useMemo } from "react";
import { useC } from "@/lib/theme-context";
import { Card, Btn, Pager, CertBadge, Empty, useMobile } from "@/components/ui";
import { paginate } from "@/lib/pagination";
import PlayerFilters, { emptyFilters, type Filters } from "./PlayerFilters";
import { jugadorasToCSV, downloadCSV } from "@/lib/export";
import type { Jugadora } from "@/lib/supabase/types";

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
        <h2 style={{ margin: 0, fontSize: mob ? 16 : 20, fontWeight: 800, color: colors.nv }}>👥 Padrón de Jugadoras</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {selMode && selIds.size > 0 && <button onClick={() => { if (confirm(`Eliminar ${selIds.size} jugadora(s)?`)) { onDel?.([...selIds]); sSelIds(new Set()); sSelMode(false); } }} style={{ padding: "4px 10px", borderRadius: 8, border: "1px solid #DC2626", background: "#DC2626", fontSize: 10, fontWeight: 700, color: "#fff", cursor: "pointer" }}>🗑️ Eliminar ({selIds.size})</button>}
          {canDel && <button onClick={() => { if (selMode) { sSelMode(false); sSelIds(new Set()); } else { sSelMode(true); } }} style={{ padding: "4px 10px", borderRadius: 8, border: "1px solid " + (selMode ? "#DC2626" : colors.g3), background: selMode ? (isDark ? "#7F1D1D" : "#FEF2F2") : cardBg, fontSize: 10, fontWeight: 600, color: selMode ? "#DC2626" : colors.g5, cursor: "pointer" }}>{selMode ? "✕ Cancelar" : "☑️ Seleccionar"}</button>}
          <Btn v="g" s="s" onClick={() => { downloadCSV(jugadorasToCSV(filtered), `padron-${new Date().toISOString().slice(0,10)}.csv`); }}>Exportar CSV</Btn>
          {onBulk && <label style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid " + colors.g3, background: cardBg, fontSize: 11, fontWeight: 600, color: colors.nv, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>📤 Carga Masiva<input type="file" accept=".csv" onChange={e => { const f = e.target.files?.[0]; if (f) onBulk(f); e.target.value = ""; }} style={{ display: "none" }} /></label>}
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
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {paged.data.map(j => {
            const isSel = selIds.has(j.id);
            return (
              <Card key={j.id} onClick={() => { if (selMode) { sSelIds(prev => { const n = new Set(prev); if (n.has(j.id)) n.delete(j.id); else n.add(j.id); return n; }); } else { onSelect(j); } }} style={{ cursor: "pointer", padding: mob ? 12 : 14, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", background: isSel ? (isDark ? "#7F1D1D" : "#FEF2F2") : cardBg }}>
                {selMode && <input type="checkbox" checked={isSel} readOnly style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#DC2626" }} />}
                <div style={{ flex: 1, minWidth: 140 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: colors.nv }}>{j.apellido}, {j.nombre}</div>
                  <div style={{ fontSize: 11, color: colors.g4 }}>DNI {j.dni}</div>
                </div>
                <div style={{ fontSize: 11, color: colors.g5, minWidth: 90 }}>{j.division_efectiva || j.division_manual || "-"}</div>
                <div style={{ fontSize: 11, color: colors.g5, minWidth: 80 }}>{j.rama}</div>
                <CertBadge s={j.cert_medico_estado} sm />
                {!j.activa && <span style={{ fontSize: 10, color: colors.rd, fontWeight: 600 }}>Inactiva</span>}
                {j.derecho_jugadora && <span style={{ fontSize: 10, color: colors.gn, fontWeight: 600 }}>DJ ✓</span>}
              </Card>
            );
          })}
        </div>
      )}
      <Pager page={paged.page} totalPages={paged.totalPages} onPage={setPage} />
    </div>
  );
}
