"use client";
import { useC } from "@/lib/theme-context";
import { HOCKEY_ROLES } from "@/lib/constants";
import type { HockeyRole } from "@/lib/supabase/types";

export default function RoleSelector({ roles, activeRole, onSelect }: { roles: HockeyRole[]; activeRole: HockeyRole | null; onSelect: (r: HockeyRole) => void }) {
  const { colors, cardBg } = useC();
  if (roles.length <= 1) return null;

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
      {roles.map(r => {
        const meta = HOCKEY_ROLES[r.role];
        const active = activeRole?.id === r.id;
        return (
          <button key={r.id} onClick={() => onSelect(r)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 10, border: active ? `2px solid ${colors.bl}` : `1px solid ${colors.g3}`, background: active ? colors.bl + "15" : cardBg, cursor: "pointer", fontSize: 12, fontWeight: active ? 700 : 500, color: colors.nv }}>
            <span>{meta?.i || "👤"}</span>
            <span>{meta?.l || r.role}</span>
            {r.divisiones.length > 0 && <span style={{ fontSize: 10, color: colors.g4 }}>({r.divisiones.join(", ")})</span>}
          </button>
        );
      })}
    </div>
  );
}
