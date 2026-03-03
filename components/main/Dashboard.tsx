"use client";
import { useMemo, useState, useEffect } from "react";
import { useC } from "@/lib/theme-context";
import { Card, Ring, Spinner, useMobile } from "@/components/ui";
import { DIVISIONES, CONVOCATORIA_TIPOS, RESULTADO_COLORS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { Jugadora, LBF, Partido, PartidoEvento, PartidoConvocada } from "@/lib/supabase/types";

const NON_COMP = ["Octava", "Novena", "Décima", "Pre Décima"];
const fmtD = (d: string) => { if (!d) return "–"; const p = d.slice(0, 10).split("-"); return p[2] + "/" + p[1] + "/" + p[0]; };

export default function Dashboard({ jugadoras, lbfs, partidos }: { jugadoras: Jugadora[]; lbfs: LBF[]; partidos: Partido[]; userLevel: number }) {
  const { colors, cardBg, isDark } = useC();
  const mob = useMobile();
  const [eventos, setEventos] = useState<PartidoEvento[]>([]);
  const [convocadasAll, setConvocadasAll] = useState<PartidoConvocada[]>([]);
  const [loadingEv, setLoadingEv] = useState(true);

  // Fetch all eventos + convocadas for rankings and participation stats
  // Filter by accessible partido IDs (partidos prop is already filtered)
  const partidoIds = useMemo(() => new Set(partidos.map(p => p.id)), [partidos]);
  useEffect(() => {
    const sb = createClient();
    Promise.all([
      sb.from("partido_eventos").select("*"),
      sb.from("partido_convocadas").select("*"),
    ]).then(([evRes, convRes]) => {
      const ev = (evRes.data || []) as PartidoEvento[];
      const conv = (convRes.data || []) as PartidoConvocada[];
      setEventos(ev.filter(e => partidoIds.has(e.partido_id)));
      setConvocadasAll(conv.filter(c => partidoIds.has(c.partido_id)));
      setLoadingEv(false);
    });
  }, [partidos, partidoIds]);

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

    const nonComp = activas.filter(j => NON_COMP.includes(j.division_efectiva || j.division_manual || "")).length;
    const pctNonComp = total ? Math.round(nonComp / total * 100) : 0;

    const now = new Date();
    const mesActual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const altasMes = jugadoras.filter(j => j.fecha_alta && j.fecha_alta.startsWith(mesActual)).length;
    const bajasMes = jugadoras.filter(j => j.estado === "baja" && j.fecha_baja && j.fecha_baja.startsWith(mesActual)).length;
    const suspendidas = jugadoras.filter(j => j.estado === "suspendida").length;

    const totalPartidos = partidos.filter(p => p.competencia === "partido").length;
    const totalEntrenamientos = partidos.filter(p => p.competencia === "entrenamiento").length;

    return {
      total, byRama, certVig, socias, derecho, byDiv, maxDiv,
      lbfAprobadas, lbfPendientes,
      pctCert: total ? Math.round(certVig / total * 100) : 0,
      pctSocia: total ? Math.round(socias / total * 100) : 0,
      pctDerecho: total ? Math.round(derecho / total * 100) : 0,
      nonComp, pctNonComp, altasMes, bajasMes, suspendidas,
      totalPartidos, totalEntrenamientos, totalConvocatorias: partidos.length,
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

  // Player participation: how many convocatorias each player was in
  const participation = useMemo(() => {
    if (convocadasAll.length === 0) return [];
    const jugMap = new Map(jugadoras.map(j => [j.id, j]));
    const counts: Record<string, number> = {};
    convocadasAll.forEach(c => { counts[c.jugadora_id] = (counts[c.jugadora_id] || 0) + 1; });
    return Object.entries(counts)
      .map(([id, count]) => ({ j: jugMap.get(id)!, count }))
      .filter(x => x.j)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [convocadasAll, jugadoras]);

  const kpiData = [
    { k: "total", l: "Total Activas", v: stats.total, c: colors.nv },
    { k: "lbfOk", l: "LBF Aprobadas", v: stats.lbfAprobadas, c: colors.gn },
    { k: "lbfPe", l: "LBF Pendientes", v: stats.lbfPendientes, c: colors.yl },
    { k: "conv", l: "Convocatorias", v: stats.totalConvocatorias, c: colors.bl },
    { k: "partidos", l: "Partidos", v: stats.totalPartidos, c: colors.pr },
    { k: "entren", l: "Entrenamientos", v: stats.totalEntrenamientos, c: colors.gn },
    { k: "altas", l: "Altas del Mes", v: stats.altasMes, c: colors.gn },
    { k: "bajas", l: "Bajas del Mes", v: stats.bajasMes, c: colors.rd },
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

  // Recent convocatorias (last 5)
  const recentConv = partidos.slice(0, 5);

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

      {/* Recent Convocatorias - full width */}
      <Card style={{ padding: mob ? "10px 12px" : "14px 16px", marginBottom: mob ? 8 : 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: colors.nv, marginBottom: 10 }}>📣 Últimas Convocatorias</div>
        {recentConv.length === 0 ? (
          <div style={{ fontSize: 11, color: colors.g4 }}>No hay convocatorias registradas</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "repeat(auto-fill,minmax(280px,1fr))", gap: 8 }}>
            {recentConv.map(p => {
              const rc = RESULTADO_COLORS[p.resultado || ""] || { bg: colors.g2, c: colors.g5 };
              const tipo = CONVOCATORIA_TIPOS.find(c => c.k === p.competencia);
              const isP = p.competencia === "partido";
              return (
                <div key={p.id} style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid " + colors.g2, background: isDark ? "rgba(255,255,255,.03)" : "#FAFBFC" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: colors.nv }}>{fmtD(p.fecha)}</span>
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      {tipo && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 8, background: isP ? "#DBEAFE" : "#F3E8FF", color: isP ? "#1D4ED8" : "#7C3AED", fontWeight: 600 }}>{tipo.i} {tipo.l}</span>}
                      {p.resultado && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 8, background: rc.bg, color: rc.c, fontWeight: 700 }}>{p.resultado} {p.goles_favor}-{p.goles_contra}</span>}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: colors.nv }}>{isP ? `vs ${p.rival}` : "🏋️ Entrenamiento"}</div>
                  <div style={{ fontSize: 10, color: colors.g5, marginTop: 2 }}>{p.division} • Rama {p.rama} • {p.sede === "local" ? "🏠 Local" : "✈️ Visitante"}</div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: mob ? 8 : 14 }}>
        {/* Player Participation - most convoked */}
        <Card style={{ padding: mob ? "10px 12px" : "14px 16px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: colors.nv, marginBottom: 8 }}>📣 Participación en Convocatorias</div>
          {loadingEv ? <Spinner size={20} /> : participation.length === 0 ? (
            <div style={{ fontSize: 11, color: colors.g4 }}>Sin datos</div>
          ) : participation.map((x, i) => (
            <div key={x.j.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: i < participation.length - 1 ? "1px solid " + colors.g1 : "none" }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: colors.bl, minWidth: 22, textAlign: "center" }}>{i + 1}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: colors.nv }}>{x.j.apellido}, {x.j.nombre}</div>
                <div style={{ fontSize: 10, color: colors.g4 }}>{x.j.division_efectiva || x.j.division_manual} · Rama {x.j.rama}</div>
              </div>
              <span style={{ fontSize: 16, fontWeight: 800, color: colors.bl }}>{x.count}</span>
            </div>
          ))}
        </Card>

        {/* Resumen partidos */}
        <Card style={{ padding: mob ? "10px 12px" : "14px 16px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: colors.nv, marginBottom: 8 }}>Resumen Partidos</div>
          {partidos.filter(p => p.competencia === "partido").length === 0 ? (
            <div style={{ fontSize: 11, color: colors.g4 }}>Sin partidos registrados</div>
          ) : (() => {
            const matches = partidos.filter(p => p.competencia === "partido");
            const v = matches.filter(p => p.resultado === "V").length;
            const d = matches.filter(p => p.resultado === "D").length;
            const e = matches.filter(p => p.resultado === "E").length;
            const gf = matches.reduce((s, p) => s + (p.goles_favor || 0), 0);
            const gc = matches.reduce((s, p) => s + (p.goles_contra || 0), 0);
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
      </div>
    </div>
  );
}
