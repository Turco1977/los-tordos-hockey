"use client";
import { useC } from "@/lib/theme-context";
import { Card, useMobile } from "@/components/ui";
import { ORGANIGRAMA } from "@/lib/constants";

export default function Organigrama() {
  const { colors, cardBg } = useC();
  const mob = useMobile();

  return (
    <div>
      <h2 style={{ margin: "0 0 16px", fontSize: mob ? 16 : 20, fontWeight: 800, color: colors.nv }}>🏗️ Organigrama Hockey</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {ORGANIGRAMA.map((area, i) => (
          <Card key={i}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 20 }}>{area.icon}</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: area.color }}>{area.area}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr 1fr", gap: 8 }}>
              {area.members.map((m, j) => (
                <div key={j} style={{ padding: "8px 12px", borderRadius: 8, background: area.color + "10", border: "1px solid " + area.color + "30" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: colors.nv }}>{m.nombre}</div>
                  <div style={{ fontSize: 10, color: colors.g5, fontWeight: 600 }}>{m.role}</div>
                  {m.rama && <span style={{ fontSize: 9, color: area.color, fontWeight: 700, marginRight: 4 }}>Rama {m.rama}</span>}
                  {m.divisiones && m.divisiones.length > 0 && (
                    <div style={{ marginTop: 3, display: "flex", gap: 3, flexWrap: "wrap" }}>
                      {m.divisiones.map(d => (
                        <span key={d} style={{ fontSize: 9, padding: "1px 6px", borderRadius: 10, background: area.color + "20", color: area.color, fontWeight: 600 }}>{d}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
