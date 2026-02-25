"use client";
import { useC } from "@/lib/theme-context";
import { Card, Ring } from "@/components/ui";
import { RAMAS, DIVISIONES } from "@/lib/constants";
import type { Jugadora } from "@/lib/supabase/types";

export default function LBFSummary({ jugadoras }: { jugadoras: Jugadora[] }) {
  const { colors } = useC();
  const activas = jugadoras.filter(j => j.activa);

  const byRama = RAMAS.map(r => {
    const list = activas.filter(j => j.rama === r);
    const total = list.length;
    const cert = list.filter(j => j.cert_medico_estado === "vigente").length;
    const der = list.filter(j => j.derecho_jugadora).length;
    const pct = total > 0 ? Math.round(Math.min(cert, der) / total * 100) : 0;
    return { rama: r, total, cert, der, pct };
  });

  return (
    <Card style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: colors.nv, marginBottom: 12 }}>Resumen para Buena Fe</div>
      <div style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
        {byRama.map(r => (
          <div key={r.rama} style={{ textAlign: "center" }}>
            <Ring pct={r.pct} color={r.pct >= 75 ? colors.gn : r.pct >= 50 ? colors.yl : colors.rd} size={80} icon="🏑" />
            <div style={{ fontSize: 11, fontWeight: 700, color: colors.nv, marginTop: 4 }}>{r.rama}</div>
            <div style={{ fontSize: 10, color: colors.g4 }}>{r.total} jugadoras | {r.cert} cert | {r.der} DJ</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
