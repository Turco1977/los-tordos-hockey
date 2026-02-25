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
