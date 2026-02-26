"use client";
import { useMemo } from "react";
import { useC } from "@/lib/theme-context";
import { Card, Ring, useMobile } from "@/components/ui";
import { DIVISIONES } from "@/lib/constants";
import type { Jugadora, LBF } from "@/lib/supabase/types";

export default function Dashboard({ jugadoras, lbfs }: { jugadoras: Jugadora[]; lbfs: LBF[]; userLevel: number }) {
  const { colors, cardBg, isDark } = useC();
  const mob = useMobile();

  const stats = useMemo(() => {
    const activas = jugadoras.filter(j => j.activa);
    const total = activas.length;
    const byRama: Record<string, number> = {};
    activas.forEach(j => { byRama[j.rama] = (byRama[j.rama] || 0) + 1; });
    const certVig = activas.filter(j => j.cert_medico_estado === "vigente").length;
    const socias = activas.filter(j => j.socia).length;
    const derecho = activas.filter(j => j.derecho_jugadora).length;
    const byDiv = DIVISIONES.map(d => ({ div: d, count: activas.filter(j => (j.division_efectiva || j.division_manual) === d).length })).filter(d => d.count > 0);
    const maxDiv = Math.max(...byDiv.map(d => d.count), 1);
    const lbfAprobadas = lbfs.filter(l => l.estado === "aprobada").length;
    const lbfPendientes = lbfs.filter(l => l.estado === "pendiente").length;
    return { total, byRama, certVig, socias, derecho, byDiv, maxDiv, lbfAprobadas, lbfPendientes, pctCert: total ? Math.round(certVig / total * 100) : 0, pctSocia: total ? Math.round(socias / total * 100) : 0, pctDerecho: total ? Math.round(derecho / total * 100) : 0 };
  }, [jugadoras, lbfs]);

  const kpiData = [
    { k: "total", l: "Total Activas", v: stats.total, i: "👥", c: colors.nv, bg: colors.nv + "10" },
    { k: "lbfOk", l: "LBF Aprobadas", v: stats.lbfAprobadas, i: "📋", c: colors.gn, bg: colors.gn + "10" },
    { k: "lbfPe", l: "LBF Pendientes", v: stats.lbfPendientes, i: "🟡", c: colors.yl, bg: colors.yl + "10" },
    ...Object.entries(stats.byRama).map(([rama, count]) => ({ k: "r" + rama, l: `Rama ${rama}`, v: count, i: "🏑", c: colors.bl, bg: colors.bl + "10" })),
  ];

  const track = isDark ? "rgba(255,255,255,.25)" : colors.g2;

  return (
    <div>
      <h2 style={{ margin: "0 0 16px", fontSize: mob ? 16 : 19, fontWeight: 800, color: colors.nv }}>📊 Dashboard</h2>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : `repeat(${Math.min(kpiData.length, 4)},1fr)`, gap: 8, marginBottom: mob ? 12 : 18 }}>
        {kpiData.map(k => (
          <div key={k.k} style={{ background: cardBg, borderRadius: 12, padding: mob ? "14px 12px" : "12px 14px", border: "1px solid " + colors.g2, textAlign: "center" as const, transition: "transform .1s,box-shadow .1s", minHeight: mob ? 80 : undefined }}>
            <div style={{ fontSize: mob ? 24 : 22, fontWeight: 800, color: k.c }}>{k.v}</div>
            <div style={{ fontSize: mob ? 11 : 10, color: colors.g5, marginTop: 2 }}>{k.i} {k.l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: mob ? 8 : 14 }}>
        {/* Bar Chart: Jugadoras por División */}
        <Card style={{ padding: mob ? "10px 12px" : "14px 16px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: colors.nv, marginBottom: 8 }}>Jugadoras por División</div>
          {stats.byDiv.map(d => (
            <div key={d.div} style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 2 }}>
                <span style={{ fontWeight: 600, color: colors.nv }}>{d.div}</span>
                <span style={{ color: colors.g4 }}>{d.count}</span>
              </div>
              <div style={{ height: 8, background: isDark ? "rgba(255,255,255,.08)" : colors.g1, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 4, width: (d.count / stats.maxDiv * 100) + "%", background: colors.bl }} />
              </div>
            </div>
          ))}
        </Card>

        {/* Donut: Rama Distribution */}
        <Card style={{ padding: mob ? "10px 12px" : "14px 16px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: colors.nv, marginBottom: 8 }}>Distribución por Rama</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24 }}>
            <svg width="120" height="120" viewBox="0 0 120 120">
              {(() => {
                const ramaColors = [colors.bl, colors.gn, colors.pr, colors.yl, colors.rd];
                const entries = Object.entries(stats.byRama);
                const total = entries.reduce((s, [, c]) => s + c, 0) || 1;
                const r = 50, cx2 = 60, cy = 60;
                const toRad = (d: number) => (d - 90) * Math.PI / 180;
                let angle = 0;
                return (
                  <>
                    <circle cx={cx2} cy={cy} r={r} fill="none" stroke={track} strokeWidth="20" />
                    {entries.map(([, count], i) => {
                      const sweep = (count / total) * 360;
                      const start = angle;
                      angle += sweep;
                      if (count === 0) return null;
                      const x1 = cx2 + r * Math.cos(toRad(start)), y1 = cy + r * Math.sin(toRad(start));
                      const x2 = cx2 + r * Math.cos(toRad(start + sweep)), y2 = cy + r * Math.sin(toRad(start + sweep));
                      const large = sweep > 180 ? 1 : 0;
                      return <path key={i} d={`M${cx2},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`} fill={ramaColors[i % ramaColors.length]} />;
                    })}
                    <circle cx={cx2} cy={cy} r="30" fill={cardBg} />
                    <text x={cx2} y={cy + 4} textAnchor="middle" fontSize="14" fontWeight="800" fill={colors.nv}>{stats.total}</text>
                  </>
                );
              })()}
            </svg>
            <div>
              {Object.entries(stats.byRama).map(([rama, count], i) => {
                const ramaColors = [colors.bl, colors.gn, colors.pr, colors.yl, colors.rd];
                return (
                  <div key={rama} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: ramaColors[i % ramaColors.length] }} />
                    <span style={{ fontSize: 11, color: colors.nv }}>Rama {rama} ({count})</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Semáforo Administrativo */}
        <Card style={{ gridColumn: mob ? "auto" : "1/-1", padding: mob ? "10px 12px" : "14px 16px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: colors.nv, marginBottom: 8 }}>Semáforo Administrativo</div>
          <div style={{ display: "flex", gap: 32, justifyContent: "center", flexWrap: "wrap" }}>
            <div style={{ textAlign: "center" }}>
              <Ring pct={stats.pctCert} color={stats.pctCert >= 80 ? colors.gn : stats.pctCert >= 50 ? colors.yl : colors.rd} size={90} icon="🏥" />
              <div style={{ fontSize: 11, fontWeight: 600, color: colors.nv, marginTop: 4 }}>Cert. Médico</div>
              <div style={{ fontSize: 10, color: colors.g4 }}>{stats.certVig}/{stats.total}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <Ring pct={stats.pctSocia} color={stats.pctSocia >= 80 ? colors.gn : stats.pctSocia >= 50 ? colors.yl : colors.rd} size={90} icon="🏠" />
              <div style={{ fontSize: 11, fontWeight: 600, color: colors.nv, marginTop: 4 }}>Socias</div>
              <div style={{ fontSize: 10, color: colors.g4 }}>{stats.socias}/{stats.total}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <Ring pct={stats.pctDerecho} color={stats.pctDerecho >= 80 ? colors.gn : stats.pctDerecho >= 50 ? colors.yl : colors.rd} size={90} icon="🏑" />
              <div style={{ fontSize: 11, fontWeight: 600, color: colors.nv, marginTop: 4 }}>Derecho Jugadora</div>
              <div style={{ fontSize: 10, color: colors.g4 }}>{stats.derecho}/{stats.total}</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
