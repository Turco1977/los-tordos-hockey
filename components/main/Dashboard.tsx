"use client";
import { useMemo, useState, useEffect } from "react";
import { useC } from "@/lib/theme-context";
import { Card, Ring, Spinner, useMobile } from "@/components/ui";
import { DIVISIONES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { Jugadora, LBF, Partido, PartidoEvento } from "@/lib/supabase/types";

const NON_COMP = ["Octava", "Novena", "Décima", "Pre Décima"];

export default function Dashboard({ jugadoras, lbfs, partidos }: { jugadoras: Jugadora[]; lbfs: LBF[]; partidos: Partido[]; userLevel: number }) {
  const { colors, cardBg, isDark } = useC();
  const mob = useMobile();
  const [eventos, setEventos] = useState<PartidoEvento[]>([]);
  const [loadingEv, setLoadingEv] = useState(true);

  // Fetch all eventos for ranking
  useEffect(() => {
    const sb = createClient();
    sb.from("partido_eventos").select("*").then(({ data }) => {
      setEventos((data || []) as PartidoEvento[]);
      setLoadingEv(false);
    });
  }, [partidos]);

  const stats = useMemo(() => {
    const activas = jugadoras.filter(j => j.estado !== "baja");
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

    // Non-competitive divisions
    const nonComp = activas.filter(j => NON_COMP.includes(j.division_efectiva || j.division_manual || "")).length;
    const pctNonComp = total ? Math.round(nonComp / total * 100) : 0;

    // Altas/bajas del mes
    const now = new Date();
    const mesActual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const altasMes = jugadoras.filter(j => j.fecha_alta && j.fecha_alta.startsWith(mesActual)).length;
    const bajasMes = jugadoras.filter(j => j.estado === "baja" && j.fecha_baja && j.fecha_baja.startsWith(mesActual)).length;

    // Suspendidas
    const suspendidas = jugadoras.filter(j => j.estado === "suspendida").length;

    return {
      total, byRama, certVig, socias, derecho, byDiv, maxDiv,
      lbfAprobadas, lbfPendientes,
      pctCert: total ? Math.round(certVig / total * 100) : 0,
      pctSocia: total ? Math.round(socias / total * 100) : 0,
      pctDerecho: total ? Math.round(derecho / total * 100) : 0,
      nonComp, pctNonComp, altasMes, bajasMes, suspendidas,
      totalPartidos: partidos.length,
    };
  }, [jugadoras, lbfs, partidos]);

  // Ranking goleadoras + tarjetas
  const ranking = useMemo(() => {
    if (eventos.length === 0) return { goles: [] as { j: Jugadora; count: number }[], amarillas: [] as { j: Jugadora; count: number }[], rojas: [] as { j: Jugadora; count: number }[] };
    const jugMap = new Map(jugadoras.map(j => [j.id, j]));
    const agg = (tipo: string) => {
      const counts: Record<string, number> = {};
      eventos.filter(e => e.tipo === tipo).forEach(e => { counts[e.jugadora_id] = (counts[e.jugadora_id] || 0) + 1; });
      return Object.entries(counts)
        .map(([id, count]) => ({ j: jugMap.get(id)!, count }))
        .filter(x => x.j)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    };
    return { goles: agg("gol"), amarillas: agg("amarilla"), rojas: agg("roja") };
  }, [eventos, jugadoras]);

  const kpiData = [
    { k: "total", l: "Total Activas", v: stats.total, c: colors.nv },
    { k: "lbfOk", l: "LBF Aprobadas", v: stats.lbfAprobadas, c: colors.gn },
    { k: "lbfPe", l: "LBF Pendientes", v: stats.lbfPendientes, c: colors.yl },
    { k: "partidos", l: "Partidos", v: stats.totalPartidos, c: colors.bl },
    { k: "altas", l: "Altas del Mes", v: stats.altasMes, c: colors.gn },
    { k: "bajas", l: "Bajas del Mes", v: stats.bajasMes, c: colors.rd },
    { k: "susp", l: "Suspendidas", v: stats.suspendidas, c: colors.yl },
    { k: "noncomp", l: "No Competitivas", v: stats.nonComp, c: colors.pr },
  ];

  const track = isDark ? "rgba(255,255,255,.25)" : colors.g2;

  const rankCard = (title: string, icon: string, items: { j: Jugadora; count: number }[], clr: string) => (
    <Card style={{ padding: mob ? "10px 12px" : "14px 16px" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: colors.nv, marginBottom: 8 }}>{icon} {title}</div>
      {loadingEv ? <Spinner size={20} /> : items.length === 0 ? (
        <div style={{ fontSize: 11, color: colors.g4 }}>Sin datos</div>
      ) : items.map((x, i) => (
        <div key={x.j.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: i < items.length - 1 ? "1px solid " + colors.g1 : "none" }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: clr, minWidth: 22, textAlign: "center" }}>{i + 1}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: colors.nv }}>{x.j.apellido}, {x.j.nombre}</div>
            <div style={{ fontSize: 10, color: colors.g4 }}>{x.j.division_efectiva || x.j.division_manual} · Rama {x.j.rama}</div>
          </div>
          <span style={{ fontSize: 16, fontWeight: 800, color: clr }}>{x.count}</span>
        </div>
      ))}
    </Card>
  );

  return (
    <div>
      <h2 style={{ margin: "0 0 16px", fontSize: mob ? 16 : 19, fontWeight: 800, color: colors.nv }}>Dashboard</h2>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(4, 1fr)", gap: 8, marginBottom: mob ? 12 : 18 }}>
        {kpiData.map(k => (
          <div key={k.k} style={{ background: cardBg, borderRadius: 12, padding: mob ? "14px 12px" : "12px 14px", border: "1px solid " + colors.g2, textAlign: "center" }}>
            <div style={{ fontSize: mob ? 24 : 22, fontWeight: 800, color: k.c }}>{k.v}</div>
            <div style={{ fontSize: mob ? 11 : 10, color: colors.g5, marginTop: 2 }}>{k.l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: mob ? 8 : 14 }}>
        {/* Bar Chart: Jugadoras por División */}
        <Card style={{ padding: mob ? "10px 12px" : "14px 16px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: colors.nv, marginBottom: 8 }}>Jugadoras por División</div>
          {stats.byDiv.map(d => {
            const isNonComp = NON_COMP.includes(d.div);
            return (
              <div key={d.div} style={{ marginBottom: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 2 }}>
                  <span style={{ fontWeight: 600, color: colors.nv }}>{d.div}{isNonComp ? " *" : ""}</span>
                  <span style={{ color: colors.g4 }}>{d.count}</span>
                </div>
                <div style={{ height: 8, background: isDark ? "rgba(255,255,255,.08)" : colors.g1, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 4, width: (d.count / stats.maxDiv * 100) + "%", background: isNonComp ? colors.pr : colors.bl }} />
                </div>
              </div>
            );
          })}
          <div style={{ fontSize: 9, color: colors.g4, marginTop: 6 }}>* Divisiones no competitivas ({stats.nonComp} — {stats.pctNonComp}% del total)</div>
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

        {/* Rankings */}
        {rankCard("Goleadoras", "⚽", ranking.goles, colors.gn)}
        {rankCard("Tarjetas Amarillas", "🟡", ranking.amarillas, colors.yl)}
        {rankCard("Tarjetas Rojas", "🔴", ranking.rojas, colors.rd)}

        {/* Resumen partidos */}
        <Card style={{ padding: mob ? "10px 12px" : "14px 16px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: colors.nv, marginBottom: 8 }}>Resumen Partidos</div>
          {partidos.length === 0 ? (
            <div style={{ fontSize: 11, color: colors.g4 }}>Sin partidos registrados</div>
          ) : (() => {
            const v = partidos.filter(p => p.resultado === "V").length;
            const d = partidos.filter(p => p.resultado === "D").length;
            const e = partidos.filter(p => p.resultado === "E").length;
            const gf = partidos.reduce((s, p) => s + (p.goles_favor || 0), 0);
            const gc = partidos.reduce((s, p) => s + (p.goles_contra || 0), 0);
            return (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, textAlign: "center" }}>
                <div><div style={{ fontSize: 20, fontWeight: 800, color: colors.gn }}>{v}</div><div style={{ fontSize: 10, color: colors.g4 }}>Victorias</div></div>
                <div><div style={{ fontSize: 20, fontWeight: 800, color: colors.yl }}>{e}</div><div style={{ fontSize: 10, color: colors.g4 }}>Empates</div></div>
                <div><div style={{ fontSize: 20, fontWeight: 800, color: colors.rd }}>{d}</div><div style={{ fontSize: 10, color: colors.g4 }}>Derrotas</div></div>
                <div style={{ gridColumn: "1/-1", borderTop: "1px solid " + colors.g1, paddingTop: 8, marginTop: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: colors.nv }}>{gf} GF · {gc} GC · Dif: {gf - gc >= 0 ? "+" : ""}{gf - gc}</span>
                </div>
              </div>
            );
          })()}
        </Card>
      </div>
    </div>
  );
}
