import { create } from "zustand";
import type { Jugadora, HockeyRole, LBF, LBFJugadora, Profile, AsistenciaSesion, AsistenciaRegistro, Partido, PartidoConvocada, PartidoEvento, CalendarioEvento, Viaje } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";

interface HockeyStore {
  /* Auth */
  user: any | null;
  profile: Profile | null;
  roles: HockeyRole[];
  activeRole: HockeyRole | null;
  setUser: (u: any) => void;
  setProfile: (p: Profile | null) => void;
  setRoles: (r: HockeyRole[]) => void;
  setActiveRole: (r: HockeyRole | null) => void;

  /* Jugadoras */
  jugadoras: Jugadora[];
  jugadorasLoading: boolean;
  fetchJugadoras: () => Promise<void>;

  /* LBF */
  lbfs: LBF[];
  lbfsLoading: boolean;
  fetchLBFs: () => Promise<void>;

  /* Staff */
  staff: HockeyRole[];
  staffLoading: boolean;
  fetchStaff: () => Promise<void>;

  /* Phase 2: Asistencia */
  sesiones: AsistenciaSesion[];
  registros: AsistenciaRegistro[];
  fetchSesiones: () => Promise<void>;
  setSesiones: (fn: (prev: AsistenciaSesion[]) => AsistenciaSesion[]) => void;
  setRegistros: (fn: (prev: AsistenciaRegistro[]) => AsistenciaRegistro[]) => void;

  /* Phase 2: Partidos */
  partidos: Partido[];
  convocadas: PartidoConvocada[];
  eventos: PartidoEvento[];
  fetchPartidos: () => Promise<void>;
  setPartidos: (fn: (prev: Partido[]) => Partido[]) => void;
  setConvocadas: (fn: (prev: PartidoConvocada[]) => PartidoConvocada[]) => void;
  setEventos: (fn: (prev: PartidoEvento[]) => PartidoEvento[]) => void;

  /* Phase 2: Calendario */
  calEventos: CalendarioEvento[];
  fetchCalEventos: () => Promise<void>;
  setCalEventos: (fn: (prev: CalendarioEvento[]) => CalendarioEvento[]) => void;

  /* Phase 3: Viajes */
  viajes: Viaje[];
  viajesLoading: boolean;
  fetchViajes: () => Promise<void>;
  setViajes: (fn: (prev: Viaje[]) => Viaje[]) => void;
}

export const useStore = create<HockeyStore>((set, get) => ({
  user: null,
  profile: null,
  roles: [],
  activeRole: null,
  setUser: (u) => set({ user: u }),
  setProfile: (p) => set({ profile: p }),
  setRoles: (r) => set({ roles: r }),
  setActiveRole: (r) => set({ activeRole: r }),

  jugadoras: [],
  jugadorasLoading: false,
  fetchJugadoras: async () => {
    set({ jugadorasLoading: true });
    const sb = createClient();
    const { data } = await sb.from("jugadoras").select("*").order("apellido");
    set({ jugadoras: (data || []) as Jugadora[], jugadorasLoading: false });
  },

  lbfs: [],
  lbfsLoading: false,
  fetchLBFs: async () => {
    set({ lbfsLoading: true });
    const sb = createClient();
    const { data } = await sb.from("lbf").select("*").order("created_at", { ascending: false });
    set({ lbfs: (data || []) as LBF[], lbfsLoading: false });
  },

  staff: [],
  staffLoading: false,
  fetchStaff: async () => {
    set({ staffLoading: true });
    const sb = createClient();
    const { data } = await sb.from("hockey_roles").select("*, profile:profiles(*)").eq("active", true).order("role");
    set({ staff: (data || []) as HockeyRole[], staffLoading: false });
  },

  /* Phase 2: Asistencia */
  sesiones: [],
  registros: [],
  fetchSesiones: async () => {
    const sb = createClient();
    const { data } = await sb.from("asistencia_sesiones").select("*").order("fecha", { ascending: false }).limit(100);
    set({ sesiones: (data || []) as AsistenciaSesion[] });
  },
  setSesiones: (fn) => set((s) => ({ sesiones: fn(s.sesiones) })),
  setRegistros: (fn) => set((s) => ({ registros: fn(s.registros) })),

  /* Phase 2: Partidos */
  partidos: [],
  convocadas: [],
  eventos: [],
  fetchPartidos: async () => {
    const sb = createClient();
    const { data } = await sb.from("partidos").select("*").order("fecha", { ascending: false }).limit(100);
    set({ partidos: (data || []) as Partido[] });
  },
  setPartidos: (fn) => set((s) => ({ partidos: fn(s.partidos) })),
  setConvocadas: (fn) => set((s) => ({ convocadas: fn(s.convocadas) })),
  setEventos: (fn) => set((s) => ({ eventos: fn(s.eventos) })),

  /* Phase 2: Calendario */
  calEventos: [],
  fetchCalEventos: async () => {
    const sb = createClient();
    const { data } = await sb.from("calendario_eventos").select("*").order("fecha", { ascending: true }).limit(200);
    set({ calEventos: (data || []) as CalendarioEvento[] });
  },
  setCalEventos: (fn) => set((s) => ({ calEventos: fn(s.calEventos) })),

  /* Phase 3: Viajes */
  viajes: [],
  viajesLoading: false,
  fetchViajes: async () => {
    set({ viajesLoading: true });
    const sb = createClient();
    const { data } = await sb.from("viajes").select("*").order("created_at", { ascending: false });
    set({ viajes: (data || []) as Viaje[], viajesLoading: false });
  },
  setViajes: (fn) => set((s) => ({ viajes: fn(s.viajes) })),
}));
