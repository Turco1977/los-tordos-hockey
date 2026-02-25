"use client";
import { useC } from "@/lib/theme-context";
import { DIVISIONES, RAMAS, CERT_ST } from "@/lib/constants";

export interface Filters { q: string; division: string; rama: string; cert: string; activa: string }
export const emptyFilters: Filters = { q: "", division: "", rama: "", cert: "", activa: "si" };

export default function PlayerFilters({ filters, onChange }: { filters: Filters; onChange: (f: Filters) => void }) {
  const { colors, cardBg } = useC();
  const s: React.CSSProperties = { padding: "7px 10px", borderRadius: 7, border: "1px solid " + colors.g3, fontSize: 12, background: cardBg, color: colors.nv, boxSizing: "border-box" as const };

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14, alignItems: "center" }}>
      <input placeholder="Buscar nombre, apellido, DNI..." value={filters.q} onChange={e => onChange({ ...filters, q: e.target.value })} style={{ ...s, flex: 1, minWidth: 180 }} />
      <select value={filters.division} onChange={e => onChange({ ...filters, division: e.target.value })} style={s}>
        <option value="">Todas las divisiones</option>
        {DIVISIONES.map(d => <option key={d} value={d}>{d}</option>)}
      </select>
      <select value={filters.rama} onChange={e => onChange({ ...filters, rama: e.target.value })} style={s}>
        <option value="">Todas las ramas</option>
        {RAMAS.map(r => <option key={r} value={r}>{r}</option>)}
      </select>
      <select value={filters.cert} onChange={e => onChange({ ...filters, cert: e.target.value })} style={s}>
        <option value="">Cert. médico</option>
        <option value={CERT_ST.VIG}>Vigente</option>
        <option value={CERT_ST.VENC}>Vencido</option>
        <option value={CERT_ST.PEND}>Pendiente</option>
      </select>
      <select value={filters.activa} onChange={e => onChange({ ...filters, activa: e.target.value })} style={s}>
        <option value="si">Activas</option>
        <option value="no">Inactivas</option>
        <option value="">Todas</option>
      </select>
    </div>
  );
}
