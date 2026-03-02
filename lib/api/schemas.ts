import { z } from "zod";

const uuid = z.string().uuid();
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}/, "Fecha inválida (YYYY-MM-DD)");

/* ── Players ── */
export const PlayerCreateSchema = z.object({
  nombre: z.string().min(1, "nombre requerido"),
  apellido: z.string().min(1, "apellido requerido"),
  dni: z.string().min(1, "dni requerido"),
  fecha_nacimiento: dateStr,
  rama: z.enum(["A", "B", "C", "D", "E"]),
}).passthrough();

export const PlayerUpdateSchema = z.object({
  id: uuid,
}).passthrough();

/* ── Asistencia (sesiones) ── */
export const SesionCreateSchema = z.object({
  fecha: dateStr,
  division: z.string().min(1),
  rama: z.string().min(1),
  tipo_actividad: z.string().min(1),
  created_by: uuid,
}).passthrough();

export const SesionUpdateSchema = z.object({
  id: uuid,
}).passthrough();

/* ── Asistencia QR ── */
export const QRScanSchema = z.object({
  token: uuid,
  dni: z.string().min(1, "dni requerido"),
});

export const QRGenerateSchema = z.object({
  sesion_id: uuid,
});

/* ── Asistencia Registros ── */
export const RegistrosBulkSchema = z.object({
  sesion_id: uuid,
  registros: z.array(
    z.object({
      jugadora_id: uuid,
      presente: z.boolean(),
    }).passthrough()
  ),
});

/* ── Partidos ── */
export const PartidoCreateSchema = z.object({
  fecha: dateStr,
  rival: z.string().min(1, "rival requerido"),
  division: z.string().min(1),
  rama: z.string().min(1),
  created_by: uuid,
}).passthrough();

export const PartidoUpdateSchema = z.object({
  id: uuid,
}).passthrough();

/* ── Partidos Convocadas ── */
export const ConvocadasSchema = z.object({
  partido_id: uuid,
  jugadoras: z.array(
    z.object({
      jugadora_id: uuid,
    }).passthrough()
  ),
});

/* ── Partidos Eventos ── */
export const EventoCreateSchema = z.object({
  partido_id: uuid,
  jugadora_id: uuid,
  tipo: z.string().min(1),
}).passthrough();

/* ── Calendario ── */
export const CalendarioCreateSchema = z.object({
  titulo: z.string().min(1, "titulo requerido"),
  fecha: dateStr,
  created_by: uuid,
}).passthrough();

export const CalendarioUpdateSchema = z.object({
  id: uuid,
}).passthrough();

/* ── LBF ── */
export const LBFCreateSchema = z.object({
  nombre: z.string().min(1, "nombre requerido"),
  division: z.string().min(1),
  rama: z.enum(["A", "B", "C", "D", "E"]),
  creado_por: uuid,
}).passthrough();

export const LBFUpdateSchema = z.object({
  id: uuid,
}).passthrough();

/* ── Viajes ── */
export const ViajeCreateSchema = z.object({
  destino: z.string().min(1, "destino requerido"),
  fecha_ida: dateStr,
  fecha_vuelta: dateStr,
  motivo: z.enum(["torneo", "amistoso", "gira"]),
}).passthrough();

export const ViajeUpdateSchema = z.object({
  id: uuid,
}).passthrough();

/* ── Admin: Create User ── */
export const CreateUserSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Password mínimo 6 caracteres"),
  role: z.string().min(1, "role requerido"),
}).passthrough();
