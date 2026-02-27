import type { Jugadora, JugadoraInsert } from "@/lib/supabase/types";
import { CERT_ST } from "@/lib/constants";

/** Build a blank jugadora form object */
export function emptyJugadora(): Omit<JugadoraInsert, "division_efectiva"> {
  return {
    nombre: "",
    apellido: "",
    dni: "",
    fecha_nacimiento: "",
    division_manual: null,
    rama: "A",
    posicion: null,
    email: null,
    telefono: null,
    telefono_emergencia: null,
    contacto_emergencia: null,
    direccion: null,
    foto_url: null,
    socia: false,
    derecho_jugadora: false,
    cert_medico_estado: CERT_ST.PEND,
    cert_medico_vencimiento: null,
    obra_social: null,
    grupo_sanguineo: null,
    observaciones: null,
    activa: true,
    estado: "activa",
    fecha_alta: new Date().toISOString().slice(0, 10),
    fecha_baja: null,
    motivo_baja: null,
    temporada: "2026",
    contacto_tutor_nombre: null,
    contacto_tutor_telefono: null,
    contacto_tutor_email: null,
    departamento: null,
  };
}

/** Jugadora → form data (strip computed fields) */
export function jugadoraToForm(j: Jugadora) {
  const { id, division_efectiva, created_at, updated_at, ...rest } = j;
  return rest;
}

/** Check if cert medico is expired */
export function isCertVencido(j: Jugadora): boolean {
  if (!j.cert_medico_vencimiento) return j.cert_medico_estado !== CERT_ST.VIG;
  return new Date(j.cert_medico_vencimiento) < new Date();
}

/** Can be added to LBF? */
export function canAddToLBF(j: Jugadora): { ok: boolean; reason?: string } {
  if (j.estado !== "activa") return { ok: false, reason: j.estado === "suspendida" ? "Jugadora suspendida" : "Jugadora dada de baja" };
  if (!j.derecho_jugadora) return { ok: false, reason: "Sin derecho de jugadora" };
  if (isCertVencido(j)) return { ok: false, reason: "Certificado médico vencido o pendiente" };
  if (j.cert_medico_estado !== CERT_ST.VIG) return { ok: false, reason: "Certificado médico no vigente" };
  return { ok: true };
}

/** Can be added to Viaje? (same blocking rules as LBF) */
export function canAddToViaje(j: Jugadora): { ok: boolean; reason?: string } {
  if (j.estado !== "activa") return { ok: false, reason: j.estado === "suspendida" ? "Jugadora suspendida" : "Jugadora dada de baja" };
  if (!j.derecho_jugadora) return { ok: false, reason: "Sin derecho de jugadora" };
  if (isCertVencido(j)) return { ok: false, reason: "Certificado médico vencido o pendiente" };
  if (j.cert_medico_estado !== CERT_ST.VIG) return { ok: false, reason: "Certificado médico no vigente" };
  return { ok: true };
}

/** Full name */
export function fullName(j: Jugadora): string {
  return `${j.apellido}, ${j.nombre}`;
}
