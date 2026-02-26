"use client";
import { useState, useEffect, useMemo } from "react";
import { useC } from "@/lib/theme-context";
import { Card, Ring, Spinner, useMobile } from "@/components/ui";
import { DIVISIONES, RAMAS, LBF_ST } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { Jugadora, LBF, PartidoEvento, PartidoConvocada, Partido } from "@/lib/supabase/types";

const RAMA_COLORS: Record<string, string> = { A: "#3B82F6", B: "#8B5CF6", C: "#10B981", D: "#F59E0B", E: "#EC4899" };

interface PlayerStats {
  j: Jugadora;
  goles: number;
  amarillas: number;
  rojas: number;
  greenCards: number;
  partidos: number;
  totalPartidos: number;
  enLBF: boolean;
}

export default function Planteles({ jugadoras, lbfs, partidos, onSelect }: { jugadoras: Jugadora[]; lbfs: LBF[]; partidos: Partido[]; onSelect: (j: Jugadora) => void }) {
  const { colors, cardBg, isDark } = useC();
  const mob = useMobile();
  const [division, setDivision] = useState<string>(DIVISIONES[0]);
  const [rama, setRama] = useState<string>(RAMAS[0]);
  const [eventos, setEventos] = useState<PartidoEvento[]>([]);
  const [convocadas, setConvocadas] = useState<PartidoConvocada[]>([]);
  const [lbfJugadoraIds, setLbfJugadoraIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const sb = createClient();
    const teamPartidos = partidos.filter(p => p.division === division && p.rama === rama);
    const pIds = teamPartidos.map(p => p.id);

    const fetchAll = async () => {
      if (pIds.length > 0) {
        const [evRes, coRes] = await Promise.all([
          sb.from("partido_eventos").select("*").in("partido_id", pIds),
          sb.from("partido_convocadas").select("*").in("partido_id", pIds),
        ]);
        setEventos((evRes.data || []) as PartidoEvento[]);
        setConvocadas((coRes.data || []) as PartidoConvocada[]);
      } else {
        setEventos([]);
        setConvocadas([]);
      }

      const approvedLbfs = lbfs.filter(l => l.estado === LBF_ST.APR && l.division === division && l.rama === rama);
      if (approvedLbfs.length > 0) {
        const { data } = await sb.from("lbf_jugadoras").select("jugadora_id").in("lbf_id", approvedLbfs.map(l => l.id));
        setLbfJugadoraIds(new Set((data || []).map((d: any) => d.jugadora_id)));
      } else {
        setLbfJugadoraIds(new Set());
      }
      setLoading(false);
    };

    fetchAll();
  }, [division, rama, partidos, lbfs]);

  const stats: PlayerStats[] = useMemo(() => {
    const teamPlayers = jugadoras.filter(j =>
      (j.division_efectiva || j.division_manual) === division &&
      j.rama === rama &&
      j.estado !== "baja"
    ).slice(0, 20);

    const teamPartidos = partidos.filter(p => p.division === division && p.rama === rama);
    const totalP = teamPartidos.length;

    return teamPlayers.map(j => {
      const playerEventos = eventos.filter(e => e.jugadora_id === j.id);
      const playerConvocadas = convocadas.filter(c => c.jugadora_id === j.id);
      return {
        j,
        goles: playerEventos.filter(e => e.tipo === "gol").length,
        amarillas: playerEventos.filter(e => e.tipo === "amarilla").length,
        rojas: playerEventos.filter(e => e.tipo === "roja").length,
        greenCards: playerEventos.filter(e => e.tipo === "green_card").length,
        partidos: playerConvocadas.length,
        totalPartidos: totalP,
        enLBF: lbfJugadoraIds.has(j.id),
      };
    });
  }, [jugadoras, division, rama, partidos, eventos, convocadas, lbfJugadoraIds]);

  const selSt: React.CSSProperties = { padding: "7px 10px", borderRadius: 7, border: "1px solid " + colors.g3, fontSize: 12, background: cardBg, color: colors.nv };
  const ramaColor = RAMA_COLORS[rama] || colors.bl;
  const totalPartidos = partidos.filter(p => p.division === division && p.rama === rama).length;

  return (
    <div>
      <h2 style={{ margin: "0 0 4px", fontSize: mob ? 16 : 20, fontWeight: 800, color: colors.nv }}>Planteles</h2>
      <p style={{ color: colors.g4, fontSize: 12, margin: "0 0 14px" }}>Acumulados por equipo — hasta 20 jugadoras</p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
        <select value={division} onChange={e => setDivision(e.target.value)} style={selSt}>
          {DIVISIONES.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={rama} onChange={e => setRama(e.target.value)} style={selSt}>
          {RAMAS.map(r => <option key={r} value={r}>Rama {r}</option>)}
        </select>
        <span style={{ fontSize: 11, color: colors.g4 }}>{stats.length} jugadora{stats.length !== 1 ? "s" : ""} · {totalPartidos} partido{totalPartidos !== 1 ? "s" : ""}</span>
      </div>

      {loading ? <Spinner size={32} /> : stats.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 32 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🏑</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: colors.g5 }}>Sin jugadoras en {division} Rama {rama}</div>
          <div style={{ fontSize: 11, color: colors.g4, marginTop: 4 }}>Asigná jugadoras a esta división y rama desde el padrón</div>
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: mob ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: mob ? 8 : 12 }}>
          {stats.map(s => {
            const pct = s.totalPartidos > 0 ? Math.round((s.partidos / s.totalPartidos) * 100) : 0;
            const ringColor = pct >= 70 ? colors.gn : pct >= 30 ? ramaColor : colors.rd;
            return (
              <div key={s.j.id} onClick={() => onSelect(s.j)} style={{
                background: cardBg,
                borderRadius: 16,
                padding: mob ? "14px 10px" : "20px 16px",
                textAlign: "center",
                border: "1px solid " + colors.g2,
                cursor: "pointer",
              }}>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <Ring pct={pct} color={ringColor} size={mob ? 80 : 100} icon="🏑"
                    pe={s.rojas} cu={s.amarillas} ok={s.goles}
                    tot={Math.max(s.rojas + s.amarillas + s.goles, 1)} />
                </div>
                <div style={{ fontSize: mob ? 12 : 14, fontWeight: 700, color: colors.nv, marginTop: 6, lineHeight: 1.2 }}>
                  {s.j.apellido}
                </div>
                <div style={{ fontSize: mob ? 10 : 11, color: colors.g4, marginTop: 1 }}>
                  {s.j.nombre}
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: 8, fontSize: 11, marginTop: 6 }}>
                  <span style={{ color: colors.rd }}>🔴{s.rojas}</span>
                  <span style={{ color: colors.yl }}>🟡{s.amarillas}</span>
                  <span style={{ color: colors.gn }}>🟢{s.goles}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 10, background: isDark ? "rgba(255,255,255,.08)" : colors.g1, color: colors.g5, fontWeight: 600 }}>
                    {s.partidos}/{s.totalPartidos} PJ
                  </span>
                  {s.enLBF && <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 10, background: "#DCFCE7", color: "#166534", fontWeight: 600 }}>LBF</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
