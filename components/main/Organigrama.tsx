"use client";
import { useState } from "react";
import { useC } from "@/lib/theme-context";
import { useMobile } from "@/components/ui";
import { ORGANIGRAMA } from "@/lib/constants";

function OrgNode({ icon, title, sub, color, children, cnt, expanded, onToggle, mob }: any) {
  const { colors, cardBg } = useC();
  return (
    <div style={{ marginBottom: 6 }}>
      <div onClick={onToggle} style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: mob ? "8px 10px" : "10px 14px",
        background: cardBg, borderRadius: 10,
        border: "1px solid " + colors.g2,
        borderLeft: "4px solid " + color,
        cursor: "pointer",
      }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: colors.nv }}>{title}</div>
          {sub && <div style={{ fontSize: 10, color: colors.g4 }}>{sub}</div>}
        </div>
        {cnt !== undefined && (
          <span style={{
            background: colors.g1, borderRadius: 12,
            padding: "1px 8px", fontSize: 10, fontWeight: 600, color: colors.g5,
          }}>{cnt}</span>
        )}
        <span style={{
          fontSize: 12, color: colors.g4,
          transform: expanded ? "rotate(90deg)" : "none",
          transition: "transform .2s",
        }}>▶</span>
      </div>
      {expanded && (
        <div style={{
          marginLeft: mob ? 12 : 24, marginTop: 4,
          borderLeft: "2px solid " + color + "22",
          paddingLeft: mob ? 8 : 14,
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

function MemberCard({ m, color }: { m: any; color: string }) {
  const { colors } = useC();
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: "5px 10px", background: colors.g1,
      borderRadius: 7, border: "1px solid " + colors.g2, marginBottom: 3,
    }}>
      <span style={{ fontSize: 10 }}>👤</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color, textTransform: "uppercase" as const }}>{m.role}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: colors.nv }}>{m.nombre}</div>
      </div>
      {m.divisiones && m.divisiones.length > 0 && (
        <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
          {m.divisiones.map((d: string) => (
            <span key={d} style={{
              fontSize: 8, padding: "1px 5px", borderRadius: 10,
              background: color + "15", color, fontWeight: 600,
            }}>{d}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Organigrama() {
  const { colors } = useC();
  const mob = useMobile();
  const [ex, setEx] = useState<Record<string, boolean>>({});

  const tog = (k: string) => setEx(p => ({ ...p, [k]: !p[k] }));

  // Group areas hierarchically
  const dir = ORGANIGRAMA.find(a => a.area === "Dirección");
  const entRamas = ORGANIGRAMA.filter(a => a.area.startsWith("Entrenadores Rama"));
  const pfAreas = ORGANIGRAMA.filter(a => a.area.startsWith("PF Rama") || a.area === "Preparación Física");
  const pfCoord = pfAreas.find(a => a.area === "Preparación Física");
  const pfRamas = pfAreas.filter(a => a.area.startsWith("PF Rama"));
  const desarrollo = ORGANIGRAMA.find(a => a.area === "Desarrollo");
  const monitoras = ORGANIGRAMA.find(a => a.area === "Monitoras");
  const gym = ORGANIGRAMA.find(a => a.area === "Gym");

  return (
    <div style={{ maxWidth: mob ? undefined : 720 }}>
      <h2 style={{ margin: "0 0 4px", fontSize: mob ? 16 : 19, color: colors.nv, fontWeight: 800 }}>Organigrama</h2>
      <p style={{ color: colors.g4, fontSize: 12, margin: "0 0 12px" }}>Estructura deportiva — Departamento de Hockey</p>

      {/* Director Deportivo */}
      {dir && (
        <OrgNode mob={mob} icon="🎯" title="Dirección" sub="Director Deportivo + Directora Hockey" color="#C8102E" cnt={dir.members.length} expanded={ex.dir !== false} onToggle={() => tog("dir")}>
          {dir.members.map((m, i) => (
            <MemberCard key={i} m={m} color="#C8102E" />
          ))}
        </OrgNode>
      )}

      {/* Entrenadores */}
      <OrgNode mob={mob} icon="📋" title="Entrenadores" sub="Por rama y división" color="#3B82F6" cnt={entRamas.reduce((s, a) => s + a.members.length, 0)} expanded={!!ex.ent} onToggle={() => tog("ent")}>
        {entRamas.map((area, i) => {
          const ramaKey = "ent_" + i;
          return (
            <OrgNode key={i} mob={mob} icon={area.icon} title={area.area} color={area.color} cnt={area.members.length} expanded={!!ex[ramaKey]} onToggle={() => tog(ramaKey)}>
              {area.members.map((m, j) => (
                <MemberCard key={j} m={m} color={area.color} />
              ))}
            </OrgNode>
          );
        })}
      </OrgNode>

      {/* Preparación Física */}
      <OrgNode mob={mob} icon="🏋️" title="Preparación Física" sub={pfCoord ? `Coord: ${pfCoord.members[0]?.nombre}` : ""} color="#F97316" cnt={pfRamas.reduce((s, a) => s + a.members.length, 0)} expanded={!!ex.pf} onToggle={() => tog("pf")}>
        {pfCoord && pfCoord.members.map((m, i) => (
          <MemberCard key={"c" + i} m={{ ...m, role: "Coordinador PF" }} color="#F97316" />
        ))}
        {pfRamas.map((area, i) => {
          const pfKey = "pf_" + i;
          return (
            <OrgNode key={i} mob={mob} icon="💪" title={area.area} color="#F97316" cnt={area.members.length} expanded={!!ex[pfKey]} onToggle={() => tog(pfKey)}>
              {area.members.map((m, j) => (
                <MemberCard key={j} m={m} color="#F97316" />
              ))}
            </OrgNode>
          );
        })}
      </OrgNode>

      {/* Desarrollo */}
      {desarrollo && (
        <OrgNode mob={mob} icon="⚡" title="Desarrollo" sub="Motor + Técnico" color="#6366F1" cnt={desarrollo.members.length} expanded={!!ex.des} onToggle={() => tog("des")}>
          {desarrollo.members.map((m, i) => (
            <MemberCard key={i} m={m} color="#6366F1" />
          ))}
        </OrgNode>
      )}

      {/* Monitoras */}
      {monitoras && (
        <OrgNode mob={mob} icon="👁️" title="Monitoras" color="#14B8A6" cnt={monitoras.members.length} expanded={!!ex.mon} onToggle={() => tog("mon")}>
          {monitoras.members.map((m, i) => (
            <MemberCard key={i} m={m} color="#14B8A6" />
          ))}
        </OrgNode>
      )}

      {/* Gym */}
      {gym && (
        <OrgNode mob={mob} icon="🏠" title="Gym" color="#78716C" cnt={gym.members.length} expanded={!!ex.gym} onToggle={() => tog("gym")}>
          {gym.members.map((m, i) => (
            <MemberCard key={i} m={m} color="#78716C" />
          ))}
        </OrgNode>
      )}
    </div>
  );
}
