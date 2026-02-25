/* ── Theme Palette (same as Los Tordos) ── */
export const T={nv:"#0A1628",rd:"#C8102E",g1:"#F7F8FA",g2:"#E8ECF1",g3:"#CBD2DC",g4:"#8B95A5",g5:"#5A6577",gn:"#10B981",yl:"#F59E0B",bl:"#3B82F6",pr:"#8B5CF6"};
export const TD={nv:"#E2E8F0",rd:"#F87171",g1:"#0F172A",g2:"#1E293B",g3:"#334155",g4:"#94A3B8",g5:"#CBD5E1",gn:"#34D399",yl:"#FBBF24",bl:"#60A5FA",pr:"#A78BFA"};

/* ── Hockey Divisions ── */
export const DIVISIONES = [
  "Primera",
  "Reserva",
  "Sub 21",
  "Juveniles A",
  "Juveniles B",
  "Cadetes A",
  "Cadetes B",
  "Menores A",
  "Menores B",
  "Pre-mini",
  "Mini",
  "Escuelita",
] as const;
export type Division = typeof DIVISIONES[number];

/* ── Hockey Branches (ramas) ── */
export const RAMAS = ["Competitiva", "No Competitiva"] as const;
export type Rama = typeof RAMAS[number];

/* ── Hockey Positions ── */
export const POSICIONES = [
  "Arquera",
  "Defensa Central",
  "Defensa Lateral",
  "Mediocampista",
  "Delantera",
  "Volante",
] as const;

/* ── Hockey Roles (4 niveles) ── */
export const HOCKEY_ROLES: Record<string,{l:string;i:string;lv:number}> = {
  director_deportivo: { l: "Director Deportivo", i: "🎯", lv: 1 },
  directora_hockey:   { l: "Directora Hockey", i: "🏑", lv: 2 },
  entrenador:         { l: "Entrenador/a", i: "📋", lv: 3 },
  pf:                 { l: "Preparador/a Físico", i: "🏋️", lv: 3 },
  monitora:           { l: "Monitora", i: "👁️", lv: 4 },
};
export const HOCKEY_ROLE_KEYS = Object.keys(HOCKEY_ROLES);

/* ── LBF Status ── */
export const LBF_ST = { BORR: "borrador", PEND: "pendiente", APR: "aprobada", RECH: "rechazada" } as const;
export type LbfStatus = typeof LBF_ST[keyof typeof LBF_ST];
export const LBF_SC: Record<string,{l:string;c:string;bg:string;i:string}> = {
  [LBF_ST.BORR]: { l: "Borrador", c: T.g5, bg: "#F3F4F6", i: "📝" },
  [LBF_ST.PEND]: { l: "Pendiente", c: T.yl, bg: "#FEF3C7", i: "🟡" },
  [LBF_ST.APR]:  { l: "Aprobada", c: T.gn, bg: "#D1FAE5", i: "✅" },
  [LBF_ST.RECH]: { l: "Rechazada", c: T.rd, bg: "#FEE2E2", i: "❌" },
};

/* ── Cert Medico Status ── */
export const CERT_ST = { VIG: "vigente", VENC: "vencido", PEND: "pendiente" } as const;
export const CERT_SC: Record<string,{l:string;c:string;bg:string}> = {
  [CERT_ST.VIG]:  { l: "Vigente", c: T.gn, bg: "#D1FAE5" },
  [CERT_ST.VENC]: { l: "Vencido", c: T.rd, bg: "#FEE2E2" },
  [CERT_ST.PEND]: { l: "Pendiente", c: T.yl, bg: "#FEF3C7" },
};

/* ── Division age mapping (year cutoffs for 2025 season) ── */
export const DIV_YEAR_MAP: Record<string, { min: number; max: number }> = {
  "Primera":     { min: 0, max: 999 },
  "Reserva":     { min: 0, max: 999 },
  "Sub 21":      { min: 2004, max: 2006 },
  "Juveniles A": { min: 2007, max: 2008 },
  "Juveniles B": { min: 2009, max: 2010 },
  "Cadetes A":   { min: 2011, max: 2011 },
  "Cadetes B":   { min: 2012, max: 2012 },
  "Menores A":   { min: 2013, max: 2013 },
  "Menores B":   { min: 2014, max: 2014 },
  "Pre-mini":    { min: 2015, max: 2016 },
  "Mini":        { min: 2017, max: 2018 },
  "Escuelita":   { min: 2019, max: 2025 },
};

/* ── Helpers ── */
export const fn = (u: any) => ((u.first_name || u.nombre || "") + " " + (u.last_name || u.apellido || "")).trim();

export function calcDivision(fechaNac: string): Division | null {
  if (!fechaNac) return null;
  const year = new Date(fechaNac).getFullYear();
  for (const [div, range] of Object.entries(DIV_YEAR_MAP)) {
    if (range.min > 0 && year >= range.min && year <= range.max) return div as Division;
  }
  return "Primera";
}

/* ── Tabs ── */
export const TABS = [
  { id: "dashboard", l: "Dashboard", i: "📊", minLv: 1 },
  { id: "padron", l: "Padrón", i: "👥", minLv: 3 },
  { id: "lbf", l: "Lista de Buena Fe", i: "📋", minLv: 3 },
  { id: "staff", l: "Staff", i: "👤", minLv: 1 },
] as const;
export type TabId = typeof TABS[number]["id"];
