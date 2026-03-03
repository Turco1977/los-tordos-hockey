"use client";
import { useMemo } from "react";
import { maxLevel, accessibleDivisiones, accessibleRamas, accessibleTeamPairs } from "@/lib/api/auth";
import type { HockeyRole } from "@/lib/supabase/types";
import type { Jugadora, LBF, AsistenciaSesion, Partido, CalendarioEvento } from "@/lib/supabase/types";

interface FilteredData {
  jugadoras: Jugadora[];
  lbfs: LBF[];
  sesiones: AsistenciaSesion[];
  partidos: Partido[];
  calEventos: CalendarioEvento[];
  allowedDivisiones: string[];
  allowedRamas: string[];
  /** true if the user is filtered (level 3+) */
  isFiltered: boolean;
}

export function useFilteredData(
  roles: HockeyRole[],
  jugadoras: Jugadora[],
  lbfs: LBF[],
  sesiones: AsistenciaSesion[],
  partidos: Partido[],
  calEventos: CalendarioEvento[],
): FilteredData {
  const lv = maxLevel(roles);
  const isFiltered = lv > 2;

  const allowedDivisiones = useMemo(() => accessibleDivisiones(roles), [roles]);
  const allowedRamas = useMemo(() => accessibleRamas(roles), [roles]);
  const teamPairs = useMemo(() => accessibleTeamPairs(roles), [roles]);

  const filteredJugadoras = useMemo(() => {
    if (!isFiltered) return jugadoras;
    return jugadoras.filter(j => {
      const div = j.division_efectiva || j.division_manual || "";
      return teamPairs.has(`${div}|${j.rama}`);
    });
  }, [jugadoras, isFiltered, teamPairs]);

  const filteredLbfs = useMemo(() => {
    if (!isFiltered) return lbfs;
    return lbfs.filter(l => teamPairs.has(`${l.division}|${l.rama}`));
  }, [lbfs, isFiltered, teamPairs]);

  const filteredSesiones = useMemo(() => {
    if (!isFiltered) return sesiones;
    return sesiones.filter(s => teamPairs.has(`${s.division}|${s.rama}`));
  }, [sesiones, isFiltered, teamPairs]);

  const filteredPartidos = useMemo(() => {
    if (!isFiltered) return partidos;
    return partidos.filter(p => teamPairs.has(`${p.division}|${p.rama}`));
  }, [partidos, isFiltered, teamPairs]);

  const filteredCalEventos = useMemo(() => {
    if (!isFiltered) return calEventos;
    return calEventos.filter(e => {
      // Events without division are general — visible to all
      if (!e.division) return true;
      const rama = e.rama || "";
      if (!rama) return allowedDivisiones.includes(e.division);
      return teamPairs.has(`${e.division}|${rama}`);
    });
  }, [calEventos, isFiltered, teamPairs, allowedDivisiones]);

  return {
    jugadoras: filteredJugadoras,
    lbfs: filteredLbfs,
    sesiones: filteredSesiones,
    partidos: filteredPartidos,
    calEventos: filteredCalEventos,
    allowedDivisiones,
    allowedRamas,
    isFiltered,
  };
}
