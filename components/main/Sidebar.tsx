"use client";
import { TABS, HOCKEY_ROLES } from "@/lib/constants";
import { useC } from "@/lib/theme-context";
import type { HockeyRole } from "@/lib/supabase/types";

interface SidebarProps {
  tab: string;
  onTab: (t: string) => void;
  userLevel: number;
  profile: any;
  onLogout: () => void;
  onToggleTheme: () => void;
  isDark: boolean;
  mob: boolean;
  activeRole: HockeyRole | null;
}

export default function Sidebar({ tab, onTab, userLevel, profile, onLogout, onToggleTheme, isDark, mob, activeRole }: SidebarProps) {
  const { colors, cardBg } = useC();
  const visibleTabs = TABS.filter(t => userLevel <= t.minLv);
  const roleMeta = activeRole ? HOCKEY_ROLES[activeRole.role] : null;

  if (mob) {
    return (
      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: cardBg, borderTop: "1px solid " + colors.g2, display: "flex", justifyContent: "space-around", padding: "6px 0", zIndex: 100 }}>
        {visibleTabs.map(t => (
          <button key={t.id} onClick={() => onTab(t.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "4px 8px", color: tab === t.id ? colors.bl : colors.g4, fontSize: 10, fontWeight: tab === t.id ? 700 : 500 }}>
            <span style={{ fontSize: 18 }}>{t.i}</span>
            {t.l}
          </button>
        ))}
        <button onClick={onLogout} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "4px 8px", color: colors.g4, fontSize: 10 }}>
          <span style={{ fontSize: 18 }}>🚪</span>Salir
        </button>
      </nav>
    );
  }

  return (
    <aside style={{ width: 220, minHeight: "100vh", background: "#0A1628", color: "#E2E8F0", display: "flex", flexDirection: "column", flexShrink: 0 }}>
      <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid #1E293B" }}>
        <div style={{ fontSize: 28, textAlign: "center" }}>🏑</div>
        <div style={{ fontSize: 14, fontWeight: 800, textAlign: "center", marginTop: 4 }}>Los Tordos Hockey</div>
        {roleMeta && <div style={{ fontSize: 10, textAlign: "center", color: "#94A3B8", marginTop: 4 }}>{roleMeta.i} {roleMeta.l}</div>}
      </div>
      <nav style={{ flex: 1, padding: "12px 10px" }}>
        {visibleTabs.map(t => (
          <button key={t.id} onClick={() => onTab(t.id)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer", marginBottom: 4, fontSize: 13, fontWeight: tab === t.id ? 700 : 500, background: tab === t.id ? "#1E293B" : "transparent", color: tab === t.id ? "#fff" : "#94A3B8" }}>
            <span style={{ fontSize: 16 }}>{t.i}</span>{t.l}
          </button>
        ))}
      </nav>
      <div style={{ padding: "12px 16px", borderTop: "1px solid #1E293B" }}>
        <button onClick={onToggleTheme} style={{ width: "100%", padding: "8px", borderRadius: 6, border: "none", background: "#1E293B", color: "#94A3B8", cursor: "pointer", fontSize: 11, marginBottom: 8 }}>
          {isDark ? "☀️ Modo claro" : "🌙 Modo oscuro"}
        </button>
        {profile && <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 8, textAlign: "center" }}>{profile.first_name} {profile.last_name}</div>}
        <button onClick={onLogout} style={{ width: "100%", padding: "8px", borderRadius: 6, border: "1px solid #334155", background: "transparent", color: "#94A3B8", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
