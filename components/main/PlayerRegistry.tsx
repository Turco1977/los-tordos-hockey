"use client";
import { useState, useMemo } from "react";
import { useC } from "@/lib/theme-context";
import { Card, Btn, Pager, CertBadge, Empty, useMobile } from "@/components/ui";
import { paginate } from "@/lib/pagination";
import PlayerFilters, { emptyFilters, type Filters } from "./PlayerFilters";
import { jugadorasToCSV, downloadCSV } from "@/lib/export";
import type { Jugadora } from "@/lib/supabase/types";

export default function PlayerRegistry({ jugadoras, onSelect, onNew, userLevel }: { jugadoras: Jugadora[]; onSelect: (j: Jugadora) => void; onNew: () => void; userLevel: number }) {
  const { colors, cardBg } = useC();
  const mob = useMobile();
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = jugadoras;
    if (filters.q) {
      const q = filters.q.toLowerCase();
      list = list.filter(j => j.nombre.toLowerCase().includes(q) || j.apellido.toLowerCase().includes(q) || j.dni.includes(q));
    }
    if (filters.division) list = list.filter(j => (j.division_efectiva || j.division_manual) === filters.division);
    if (filters.rama) list = list.filter(j => j.rama === filters.rama);
    if (filters.cert) list = list.filter(j => j.cert_medico_estado === filters.cert);
    if (filters.activa === "si") list = list.filter(j => j.activa);
    else if (filters.activa === "no") list = list.filter(j => !j.activa);
    return list;
  }, [jugadoras, filters]);

  const paged = paginate(filtered, page, 20);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: mob ? 16 : 20, fontWeight: 800, color: colors.nv }}>👥 Padrón de Jugadoras</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn v="g" s="s" onClick={() => { downloadCSV(jugadorasToCSV(filtered), `padron-${new Date().toISOString().slice(0,10)}.csv`); }}>Exportar CSV</Btn>
          <Btn s="s" onClick={onNew}>+ Nueva Jugadora</Btn>
        </div>
      </div>
      <PlayerFilters filters={filters} onChange={f => { setFilters(f); setPage(1); }} />
      <div style={{ fontSize: 11, color: colors.g4, marginBottom: 8 }}>{filtered.length} jugadora{filtered.length !== 1 ? "s" : ""}</div>

      {paged.data.length === 0 ? (
        <Empty icon="👥" title="Sin jugadoras" sub="No hay jugadoras que coincidan con los filtros" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {paged.data.map(j => (
            <Card key={j.id} onClick={() => onSelect(j)} style={{ cursor: "pointer", padding: mob ? 12 : 14, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
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
          ))}
        </div>
      )}
      <Pager page={paged.page} totalPages={paged.totalPages} onPage={setPage} />
    </div>
  );
}
