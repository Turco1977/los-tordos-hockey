import { createClient } from "@/lib/supabase/client";
import type { HockeyRole } from "@/lib/supabase/types";

/** Fetch hockey roles for the current user */
export async function fetchMyRoles(): Promise<HockeyRole[]> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return [];
  const { data } = await sb.from("hockey_roles").select("*").eq("user_id", user.id).eq("active", true);
  return (data || []) as HockeyRole[];
}

/** Get the highest privilege level from roles (lower number = higher privilege) */
export function maxLevel(roles: HockeyRole[]): number {
  if (roles.length === 0) return 99;
  const { HOCKEY_ROLES } = require("@/lib/constants");
  return Math.min(...roles.map(r => HOCKEY_ROLES[r.role]?.lv ?? 99));
}

/** Check if any role grants access to a specific division */
export function hasAccessToDivision(roles: HockeyRole[], division: string): boolean {
  const lv = maxLevel(roles);
  if (lv <= 2) return true; // Director or Directora see all
  return roles.some(r => r.divisiones.includes(division));
}

/** Check if any role grants access to a specific rama */
export function hasAccessToRama(roles: HockeyRole[], rama: string): boolean {
  const lv = maxLevel(roles);
  if (lv <= 2) return true;
  return roles.some(r => r.ramas.includes(rama));
}

/** Get all divisions the user can access */
export function accessibleDivisiones(roles: HockeyRole[]): string[] {
  const lv = maxLevel(roles);
  if (lv <= 2) {
    const { DIVISIONES } = require("@/lib/constants");
    return [...DIVISIONES];
  }
  const divs = new Set<string>();
  roles.forEach(r => r.divisiones.forEach(d => divs.add(d)));
  return Array.from(divs);
}
