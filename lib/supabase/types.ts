import type { Division, Rama, LbfStatus } from "@/lib/constants";

export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  created_at: string;
}

export interface HockeyRole {
  id: string;
  user_id: string;
  role: string;
  divisiones: string[];
  ramas: string[];
  active: boolean;
  created_at: string;
  profile?: Profile;
}

export type EstadoJugadora = "activa" | "suspendida" | "baja";

export interface Jugadora {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  fecha_nacimiento: string;
  division_efectiva: Division | null;
  division_manual: Division | null;
  rama: Rama;
  posicion: string | null;
  email: string | null;
  telefono: string | null;
  telefono_emergencia: string | null;
  contacto_emergencia: string | null;
  direccion: string | null;
  foto_url: string | null;
  socia: boolean;
  derecho_jugadora: boolean;
  cert_medico_estado: string;
  cert_medico_vencimiento: string | null;
  obra_social: string | null;
  grupo_sanguineo: string | null;
  observaciones: string | null;
  activa: boolean;
  estado: EstadoJugadora;
  fecha_alta: string | null;
  fecha_baja: string | null;
  motivo_baja: string | null;
  temporada: string | null;
  contacto_tutor_nombre: string | null;
  contacto_tutor_telefono: string | null;
  contacto_tutor_email: string | null;
  departamento: string | null;
  created_at: string;
  updated_at: string;
}

export interface JugadoraInsert extends Omit<Jugadora, "id" | "division_efectiva" | "created_at" | "updated_at"> {}

export interface LBF {
  id: string;
  nombre: string;
  division: Division;
  rama: Rama;
  estado: LbfStatus;
  fecha_partido: string | null;
  rival: string | null;
  sede: string | null;
  notas: string | null;
  creado_por: string;
  aprobado_por: string | null;
  aprobado_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LBFJugadora {
  id: string;
  lbf_id: string;
  jugadora_id: string;
  numero_camiseta: number | null;
  posicion: string | null;
  titular: boolean;
  orden: number;
  jugadora?: Jugadora;
}

export interface LBFHistorial {
  id: string;
  lbf_id: string;
  accion: string;
  detalle: string | null;
  user_id: string;
  created_at: string;
  profile?: Profile;
}

export interface JugadoraHistorial {
  id: string;
  jugadora_id: string;
  campo: string;
  valor_anterior: string | null;
  valor_nuevo: string | null;
  user_id: string;
  created_at: string;
  profile?: Profile;
}

/* ── Phase 2: Asistencia + Partidos + Calendario ── */
export interface AsistenciaSesion {
  id: string;
  fecha: string;
  division: string;
  rama: string;
  tipo_actividad: string;
  qr_token: string | null;
  qr_expires_at: string | null;
  estado: "abierta" | "cerrada";
  notas: string | null;
  created_by: string;
  created_at: string;
}

export interface AsistenciaRegistro {
  id: string;
  sesion_id: string;
  jugadora_id: string;
  presente: boolean;
  metodo: "manual" | "qr";
  hora: string | null;
  created_at: string;
}

export interface Partido {
  id: string;
  fecha: string;
  rival: string;
  sede: string;
  division: string;
  rama: string;
  competencia: string;
  goles_favor: number;
  goles_contra: number;
  resultado: "V" | "D" | "E" | null;
  notas: string | null;
  created_by: string;
  created_at: string;
}

export interface PartidoConvocada {
  id: string;
  partido_id: string;
  jugadora_id: string;
  titular: boolean;
  created_at: string;
}

export interface PartidoEvento {
  id: string;
  partido_id: string;
  jugadora_id: string;
  tipo: string;
  minuto: number | null;
  notas: string | null;
  created_at: string;
}

export interface CalendarioEvento {
  id: string;
  titulo: string;
  fecha: string;
  hora: string | null;
  tipo: string;
  division: string | null;
  rama: string | null;
  descripcion: string | null;
  recurrencia: string | null;
  recurrencia_fin: string | null;
  sesion_id: string | null;
  partido_id: string | null;
  created_by: string;
  created_at: string;
}

/* ── Phase 3: Viajes ── */
export type ViajeEstado = "borrador" | "pendiente" | "aprobado" | "cancelado";
export type ViajeMotivo = "torneo" | "amistoso" | "gira";

export interface Viaje {
  id: string;
  destino: string;
  fecha_ida: string;
  fecha_vuelta: string;
  motivo: ViajeMotivo;
  costo_transporte: number;
  costo_alojamiento: number;
  costo_alimentacion: number;
  costo_otros: number;
  estado: ViajeEstado;
  notas: string | null;
  creado_por: string;
  aprobado_por: string | null;
  aprobado_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ViajeJugadora {
  id: string;
  viaje_id: string;
  jugadora_id: string;
  created_at: string;
  jugadora?: Jugadora;
}

export interface ViajeStaff {
  id: string;
  viaje_id: string;
  user_id: string;
  rol: string;
  created_at: string;
  profile?: Profile;
}

export interface ViajeHistorial {
  id: string;
  viaje_id: string;
  accion: string;
  detalle: string | null;
  user_id: string;
  created_at: string;
  profile?: Profile;
}
