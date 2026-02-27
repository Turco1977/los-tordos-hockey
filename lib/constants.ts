/* ── Theme Palette (same as Los Tordos) ── */
export const T={nv:"#0A1628",rd:"#C8102E",g1:"#F7F8FA",g2:"#E8ECF1",g3:"#CBD2DC",g4:"#8B95A5",g5:"#5A6577",gn:"#10B981",yl:"#F59E0B",bl:"#3B82F6",pr:"#8B5CF6"};
export const TD={nv:"#E2E8F0",rd:"#F87171",g1:"#0F172A",g2:"#1E293B",g3:"#334155",g4:"#94A3B8",g5:"#CBD5E1",gn:"#34D399",yl:"#FBBF24",bl:"#60A5FA",pr:"#A78BFA"};

/* ── Hockey Divisions ── */
export const DIVISIONES = [
  "Primera",
  "Segunda",
  "Cuartas",
  "Quinta",
  "Sexta",
  "Séptima",
  "Octava",
  "Novena",
  "Décima",
  "Pre Décima",
  "Mamis",
] as const;
export type Division = typeof DIVISIONES[number];

/* ── Hockey Branches (ramas) ── */
export const RAMAS = ["A", "B", "C", "D", "E"] as const;
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

/* ── Departamentos (Mendoza) ── */
export const DEPARTAMENTOS = [
  "Capital", "Godoy Cruz", "Guaymallén", "Las Heras", "Lavalle",
  "Luján de Cuyo", "Maipú", "San Martín", "Junín", "Rivadavia",
  "San Rafael", "General Alvear", "Malargüe", "Tupungato", "Tunuyán",
  "San Carlos", "Santa Rosa", "La Paz", "Otro",
] as const;

/* ── Estados de Jugadora ── */
export const ESTADO_JUG = { ACT: "activa", SUS: "suspendida", BAJA: "baja" } as const;

export const MOTIVOS_BAJA = [
  "No renovación de temporada",
  "Decisión personal",
  "Lesión prolongada",
  "Traslado",
  "Otro",
] as const;

/* ── Hockey Roles ── */
export const HOCKEY_ROLES: Record<string,{l:string;i:string;lv:number}> = {
  director_deportivo:  { l: "Director Deportivo", i: "🎯", lv: 1 },
  directora_hockey:    { l: "Directora Hockey", i: "🏑", lv: 2 },
  coordinador_pf:      { l: "Coordinador PF", i: "💪", lv: 2 },
  entrenador:          { l: "Entrenador/a", i: "📋", lv: 3 },
  pf:                  { l: "Preparador/a Físico", i: "🏋️", lv: 3 },
  desarrollo_motor:    { l: "Desarrollo Motor", i: "🧒", lv: 3 },
  desarrollo_tecnico:  { l: "Desarrollo Técnico", i: "⚡", lv: 3 },
  responsable_gym:     { l: "Responsable Gym", i: "🏠", lv: 3 },
  monitora:            { l: "Monitora", i: "👁️", lv: 4 },
};
export const HOCKEY_ROLE_KEYS = Object.keys(HOCKEY_ROLES);

/* ── Organigrama (estructura jerárquica) ── */
export interface OrgMember { nombre: string; role: string; rama?: string; divisiones?: string[] }
export const ORGANIGRAMA: { area: string; icon: string; color: string; members: OrgMember[] }[] = [
  { area: "Dirección", icon: "🎯", color: "#C8102E", members: [
    { nombre: "Franco Lucchini", role: "Director Deportivo" },
    { nombre: "Florencia Marquez", role: "Directora Hockey" },
  ]},
  { area: "Entrenadores Rama A", icon: "📋", color: "#3B82F6", members: [
    { nombre: "Franco Medici", role: "Entrenador", rama: "A", divisiones: ["Primera", "Quinta"] },
    { nombre: "Juan Ignacio González", role: "Entrenador", rama: "A", divisiones: ["Segunda", "Sexta"] },
    { nombre: "Laureano Muslera", role: "Entrenador", rama: "A", divisiones: ["Séptima", "Octava"] },
    { nombre: "Josefina Ojeda", role: "Entrenador", rama: "A", divisiones: ["Novena"] },
    { nombre: "Clara Urrutia", role: "Entrenador", rama: "A", divisiones: ["Décima"] },
    { nombre: "Milagros Perez Pontis", role: "Entrenador", rama: "A", divisiones: ["Pre Décima"] },
    { nombre: "Lucila Santucci", role: "Entrenador", rama: "A", divisiones: ["Pre Décima"] },
  ]},
  { area: "Entrenadores Rama B", icon: "📋", color: "#8B5CF6", members: [
    { nombre: "Juan Carballo", role: "Entrenador", rama: "B", divisiones: ["Primera", "Quinta"] },
    { nombre: "Juan López", role: "Entrenador", rama: "B", divisiones: ["Segunda", "Sexta"] },
    { nombre: "Gonzalo Franco", role: "Entrenador", rama: "B", divisiones: ["Séptima", "Octava"] },
    { nombre: "Carla González", role: "Entrenador", rama: "B", divisiones: ["Novena"] },
    { nombre: "Sol Cruceño", role: "Entrenador", rama: "B", divisiones: ["Décima"] },
  ]},
  { area: "Entrenadores Rama C", icon: "📋", color: "#10B981", members: [
    { nombre: "Franco Lucchini", role: "Entrenador", rama: "C", divisiones: ["Primera"] },
    { nombre: "Agustín Rubiño", role: "Entrenador", rama: "C", divisiones: ["Segunda", "Sexta"] },
    { nombre: "Valentina Neira", role: "Entrenador", rama: "C", divisiones: ["Quinta"] },
    { nombre: "Facundo Paredes", role: "Entrenador", rama: "C", divisiones: ["Séptima", "Octava"] },
    { nombre: "Agostina Fredes", role: "Entrenador", rama: "C", divisiones: ["Novena"] },
    { nombre: "Teresita Trabazo", role: "Entrenador", rama: "C", divisiones: ["Décima"] },
  ]},
  { area: "Entrenadores Rama D", icon: "📋", color: "#F59E0B", members: [
    { nombre: "Tamara Tejada", role: "Entrenador", rama: "D", divisiones: ["Quinta", "Sexta"] },
    { nombre: "Juan Andrés Famiglietti", role: "Entrenador", rama: "D", divisiones: ["Quinta", "Séptima"] },
    { nombre: "Manuela Quevedo", role: "Entrenador", rama: "D", divisiones: ["Octava"] },
    { nombre: "Nahir Uzair", role: "Entrenador", rama: "D", divisiones: ["Novena"] },
    { nombre: "Camila Lázzaro", role: "Entrenador", rama: "D", divisiones: ["Décima"] },
  ]},
  { area: "Entrenadores Rama E", icon: "📋", color: "#EC4899", members: [
    { nombre: "Milagros Baztan", role: "Entrenador", rama: "E", divisiones: ["Quinta"] },
    { nombre: "Pedro Alvarado", role: "Entrenador", rama: "E", divisiones: ["Mamis"] },
    { nombre: "Enzo Bataglia", role: "Entrenador", rama: "E", divisiones: ["Cuartas"] },
  ]},
  { area: "Desarrollo", icon: "⚡", color: "#6366F1", members: [
    { nombre: "Gilberto Guerci", role: "Desarrollo Motor" },
    { nombre: "Facundo Paredes", role: "Desarrollo Técnico" },
    { nombre: "Juan Ignacio González", role: "Desarrollo Técnico" },
  ]},
  { area: "Monitoras", icon: "👁️", color: "#14B8A6", members: [
    { nombre: "Florencia Herrera", role: "Monitora" },
    { nombre: "Camila Correa", role: "Monitora" },
    { nombre: "Amparo Blanco", role: "Monitora" },
  ]},
  { area: "Preparación Física", icon: "🏋️", color: "#F97316", members: [
    { nombre: "Matías Elías", role: "Coordinador PF" },
  ]},
  { area: "PF Rama A", icon: "🏋️", color: "#F97316", members: [
    { nombre: "Matías Elías", role: "PF", rama: "A", divisiones: ["Primera", "Segunda", "Quinta"] },
    { nombre: "Federico Ontivero", role: "PF", rama: "A", divisiones: ["Sexta", "Séptima", "Octava"] },
  ]},
  { area: "PF Rama B", icon: "🏋️", color: "#F97316", members: [
    { nombre: "Federico García", role: "PF", rama: "B", divisiones: ["Primera", "Segunda", "Quinta"] },
    { nombre: "Segundo Gelardi", role: "PF", rama: "B", divisiones: ["Sexta", "Séptima", "Octava"] },
  ]},
  { area: "PF Rama C", icon: "🏋️", color: "#F97316", members: [
    { nombre: "Emmanuel Morales", role: "PF", rama: "C", divisiones: ["Primera", "Segunda", "Quinta"] },
    { nombre: "Gilberto Guerci", role: "PF", rama: "C", divisiones: ["Sexta", "Séptima", "Octava"] },
  ]},
  { area: "PF Rama D", icon: "🏋️", color: "#F97316", members: [
    { nombre: "Juan Andrés Famiglietti", role: "PF", rama: "D", divisiones: ["Quinta", "Sexta"] },
    { nombre: "Carolina Armani", role: "PF", rama: "D", divisiones: ["Séptima", "Octava"] },
  ]},
  { area: "Gym", icon: "🏠", color: "#78716C", members: [
    { nombre: "Emmanuel Morales", role: "Responsable Gym" },
  ]},
];

/* ── Division age mapping (year cutoffs for 2026 season) ── */
export const DIV_YEAR_MAP: Record<string, { min: number; max: number }> = {
  "Primera":     { min: 0, max: 2008 },
  "Segunda":     { min: 0, max: 2008 },
  "Cuartas":     { min: 0, max: 9999 },
  "Quinta":      { min: 2009, max: 2010 },
  "Sexta":       { min: 2011, max: 2012 },
  "Séptima":     { min: 2013, max: 2013 },
  "Octava":      { min: 2014, max: 2014 },
  "Novena":      { min: 2015, max: 2016 },
  "Décima":      { min: 2017, max: 2018 },
  "Pre Décima":  { min: 2019, max: 2025 },
  "Mamis":       { min: 0, max: 9999 },
};

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

/* ── Helpers ── */
export const fn = (u: any) => ((u.first_name || u.nombre || "") + " " + (u.last_name || u.apellido || "")).trim();

export function calcDivision(fechaNac: string): Division | null {
  if (!fechaNac) return null;
  const year = new Date(fechaNac).getFullYear();
  for (const [div, range] of Object.entries(DIV_YEAR_MAP)) {
    if (range.min > 0 && range.max < 9999 && year >= range.min && year <= range.max) return div as Division;
  }
  return "Primera";
}

/* ── Phase 2 Constants ── */
export const TIPO_ACTIVIDAD = [
  { k: "entrenamiento", l: "Entrenamiento", i: "🏋️" },
  { k: "partido", l: "Partido", i: "⚽" },
  { k: "amistoso", l: "Amistoso", i: "🤝" },
  { k: "torneo", l: "Torneo", i: "🏆" },
  { k: "evaluacion", l: "Evaluación", i: "📝" },
  { k: "gimnasio", l: "Gimnasio", i: "💪" },
] as const;

export const COMPETENCIA_TIPOS = [
  { k: "ahl", l: "AHL" },
  { k: "metropolitano", l: "Metropolitano" },
  { k: "torneo_local", l: "Torneo Local" },
  { k: "amistoso", l: "Amistoso" },
  { k: "nacional", l: "Nacional" },
  { k: "otro", l: "Otro" },
] as const;

export const EVENTO_TIPOS = [
  { k: "gol", l: "Gol", i: "⚽", c: "#10B981" },
  { k: "amarilla", l: "Amarilla", i: "🟡", c: "#F59E0B" },
  { k: "roja", l: "Roja", i: "🔴", c: "#DC2626" },
  { k: "green_card", l: "Green Card", i: "🟢", c: "#059669" },
  { k: "penal", l: "Penal", i: "🥅", c: "#8B5CF6" },
] as const;

export const CALENDARIO_TIPOS = [
  { k: "entrenamiento", l: "Entrenamiento", c: "#3B82F6" },
  { k: "partido", l: "Partido", c: "#C8102E" },
  { k: "torneo", l: "Torneo", c: "#8B5CF6" },
  { k: "evaluacion", l: "Evaluación", c: "#F59E0B" },
  { k: "reunion", l: "Reunión", c: "#10B981" },
  { k: "otro", l: "Otro", c: "#6B7280" },
] as const;

export const RESULTADO_COLORS: Record<string, { bg: string; c: string }> = {
  V: { bg: "#D1FAE5", c: "#065F46" },
  D: { bg: "#FEE2E2", c: "#991B1B" },
  E: { bg: "#FEF3C7", c: "#92400E" },
};

/* ── Viajes Status ── */
export const VIAJE_ST = { BORR: "borrador", PEND: "pendiente", APR: "aprobado", CANC: "cancelado" } as const;
export type ViajeStatus = typeof VIAJE_ST[keyof typeof VIAJE_ST];
export const VIAJE_SC: Record<string,{l:string;c:string;bg:string;i:string}> = {
  [VIAJE_ST.BORR]: { l: "Borrador", c: T.g5, bg: "#F3F4F6", i: "📝" },
  [VIAJE_ST.PEND]: { l: "Pendiente", c: T.yl, bg: "#FEF3C7", i: "🟡" },
  [VIAJE_ST.APR]:  { l: "Aprobado", c: T.gn, bg: "#D1FAE5", i: "✅" },
  [VIAJE_ST.CANC]: { l: "Cancelado", c: T.rd, bg: "#FEE2E2", i: "❌" },
};
export const VIAJE_MOTIVOS = [
  { k: "torneo", l: "Torneo", i: "🏆" },
  { k: "amistoso", l: "Amistoso", i: "🤝" },
  { k: "gira", l: "Gira", i: "🌍" },
] as const;

/* ── Tabs ── */
export const TABS = [
  { id: "dashboard", l: "Dashboard", i: "📊", minLv: 1 },
  { id: "padron", l: "Padrón", i: "👥", minLv: 3 },
  { id: "planteles", l: "Planteles", i: "🏅", minLv: 3 },
  { id: "lbf", l: "Lista de Buena Fe", i: "📋", minLv: 3 },
  { id: "viajes", l: "Viajes", i: "🚌", minLv: 3 },
  { id: "organigrama", l: "Organigrama", i: "🏗️", minLv: 3 },
  { id: "asistencia", l: "Asistencia", i: "🏑", minLv: 3 },
  { id: "partidos", l: "Partidos", i: "⚽", minLv: 3 },
  { id: "calendario", l: "Calendario", i: "📅", minLv: 3 },
] as const;
export type TabId = typeof TABS[number]["id"];
