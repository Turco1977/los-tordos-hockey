"use client";
import { useMemo } from "react";
import { useC } from "@/lib/theme-context";
import { Card, Ring, useMobile } from "@/components/ui";
import { DIVISIONES } from "@/lib/constants";
import type { Jugadora, LBF } from "@/lib/supabase/types";

export default function Dashboard({ jugadoras, lbfs }: { jugadoras: Jugadora[]; lbfs: LBF[]; userLevel: number }) {
  const { colors, cardBg } = useC();
  const mob = useMobile();

  const stats = useMemo(() => {
    const activas = jugadoras.filter(j => j.activa);
    const total = activas.length;
    const comp = activas.filter(j => j.rama === "A").length;
    const noComp = total - comp;
    const certVig = activas.filter(j => j.cert_medico_estado === "vigente").length;
    const socias = activas.filter(j => j.socia).length;
    const derecho = activas.filter(j => j.derecho_jugadora).length;
    const byDiv = DIVISIONES.map(d => ({ div: d, count: activas.filter(j => (j.division_efectiva || j.division_manual) === d).length })).filter(d => d.count > 0);
    const maxDiv = Math.max(...byDiv.map(d => d.count), 1);
    const lbfAprobadas = lbfs.filter(l => l.estado === "aprobada").length;
    const lbfPendientes = lbfs.filter(l => l.estado === "pendiente").length;
    return { total, comp, noComp, certVig, socias, derecho, byDiv, maxDiv, lbfAprobadas, lbfPendientes, pctCert: total ? Math.round(certVig / total * 100) : 0, pctSocia: total ? Math.round(socias / total * 100) : 0, pctDerecho: total ? Math.round(derecho / total * 100) : 0 };
  }, [jugadoras, lbfs]);

  const kpi = (icon: string, label: string, value: number | string, color: string) => (
    <Card style={{ flex: 1, minWidth: mob ? 140 : 160, textAlign: "center" }}>
      <div style={{ fontSize: 24 }}>{icon}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: colors.g4, marginTop: 2 }}>{label}</div>
    </Card>
  );

  return (
    <div>
      <h2 style={{ margin: "0 0 16px", fontSize: mob ? 16 : 20, fontWeight: 800, color: colors.nv }}>📊 Dashboard</h2>

      {/* KPI Cards */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        {kpi("👥", "Total Activas", stats.total, colors.nv)}
        {kpi("🏑", "Competitivas", stats.comp, colors.bl)}
        {kpi("🌟", "No Competitivas", stats.noComp, colors.pr)}
        {kpi("📋", "LBF Aprobadas", stats.lbfAprobadas, colors.gn)}
        {kpi("🟡", "LBF Pendientes", stats.lbfPendientes, colors.yl)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 14 }}>
        {/* Bar Chart: Jugadoras por División */}
        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, color: colors.nv, marginBottom: 12 }}>Jugadoras por División</div>
          <svg width="100%" viewBox={`0 0 300 ${stats.byDiv.length * 28 + 10}`} style={{ display: "block" }}>
            {stats.byDiv.map((d, i) => {
              const w = (d.count / stats.maxDiv) * 200;
              return (
                <g key={d.div} transform={`translate(0,${i * 28})`}>
                  <text x="0" y="14" fontSize="9" fill={colors.g5} fontWeight="600">{d.div}</text>
                  <rect x="90" y="2" width={w} height="16" rx="4" fill={colors.bl} opacity="0.8" />
                  <text x={92 + w} y="14" fontSize="9" fill={colors.nv} fontWeight="700">{d.count}</text>
                </g>
              );
            })}
          </svg>
        </Card>

        {/* Donut: Rama Distribution */}
        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, color: colors.nv, marginBottom: 12 }}>Distribución por Rama</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24 }}>
            <svg width="120" height="120" viewBox="0 0 120 120">
              {(() => {
                const total = stats.comp + stats.noComp || 1;
                const a1 = (stats.comp / total) * 360;
                const r = 50, cx = 60, cy = 60;
                const toRad = (d: number) => (d - 90) * Math.PI / 180;
                const x1 = cx + r * Math.cos(toRad(0)), y1 = cy + r * Math.sin(toRad(0));
                const x2 = cx + r * Math.cos(toRad(a1)), y2 = cy + r * Math.sin(toRad(a1));
                const large = a1 > 180 ? 1 : 0;
                return (
                  <>
                    <circle cx={cx} cy={cy} r={r} fill="none" stroke={colors.pr} strokeWidth="20" />
                    {stats.comp > 0 && <path d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`} fill={colors.bl} />}
                    <circle cx={cx} cy={cy} r="30" fill={cardBg} />
                    <text x={cx} y={cy + 4} textAnchor="middle" fontSize="14" fontWeight="800" fill={colors.nv}>{stats.total}</text>
                  </>
                );
              })()}
            </svg>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: colors.bl }} />
                <span style={{ fontSize: 11, color: colors.nv }}>Comp. ({stats.comp})</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: colors.pr }} />
                <span style={{ fontSize: 11, color: colors.nv }}>No Comp. ({stats.noComp})</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Semáforo Administrativo */}
        <Card style={{ gridColumn: mob ? "auto" : "1/-1" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: colors.nv, marginBottom: 12 }}>Semáforo Administrativo</div>
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
