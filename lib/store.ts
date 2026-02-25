import { create } from "zustand";
import type { Jugadora, HockeyRole, LBF, LBFJugadora, Profile } from "@/lib/supabase/types";
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
}));
