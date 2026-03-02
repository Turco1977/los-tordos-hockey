import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireLevel, isAuthError, authError, validateBody } from "@/lib/api/authServer";
import { QRScanSchema, QRGenerateSchema } from "@/lib/api/schemas";
import crypto from "crypto";

// GET: validate QR token (PUBLIC — no auth)
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "token requerido" }, { status: 400 });
  const sb = createAdminClient();
  const { data, error } = await sb.from("asistencia_sesiones").select("*").eq("qr_token", token).eq("estado", "abierta").single();
  if (error || !data) return NextResponse.json({ error: "Sesión no encontrada o cerrada" }, { status: 404 });
  if (data.qr_expires_at && new Date(data.qr_expires_at) < new Date()) {
    return NextResponse.json({ error: "QR expirado" }, { status: 410 });
  }
  return NextResponse.json({ sesion: data });
}

// POST: register attendance by DNI (PUBLIC — no auth, Zod validated)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const v = validateBody(QRScanSchema, body);
    if ("error" in v) return authError(v.error, v.status);

    const { token, dni } = v.data;
    const sb = createAdminClient();
    // Validate session
    const { data: sesion } = await sb.from("asistencia_sesiones").select("*").eq("qr_token", token).eq("estado", "abierta").single();
    if (!sesion) return NextResponse.json({ error: "Sesión no encontrada o cerrada" }, { status: 404 });
    if (sesion.qr_expires_at && new Date(sesion.qr_expires_at) < new Date()) {
      return NextResponse.json({ error: "QR expirado" }, { status: 410 });
    }
    // Find jugadora by DNI
    const { data: jugadora } = await sb.from("jugadoras").select("id,nombre,apellido").eq("dni", dni.trim()).single();
    if (!jugadora) return NextResponse.json({ error: "DNI no encontrado en el padrón" }, { status: 404 });
    // Check if already registered
    const { data: existing } = await sb.from("asistencia_registros").select("id").eq("sesion_id", sesion.id).eq("jugadora_id", jugadora.id).maybeSingle();
    if (existing) return NextResponse.json({ msg: "Ya registrada", jugadora });
    // Insert
    await sb.from("asistencia_registros").insert({
      sesion_id: sesion.id,
      jugadora_id: jugadora.id,
      presente: true,
      metodo: "qr",
      hora: new Date().toISOString(),
    });
    return NextResponse.json({ msg: "Presente registrado", jugadora });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT: generate QR token for a session (auth required, nivel 1-3)
export async function PUT(req: NextRequest) {
  try {
    const auth = await requireLevel(req, 3);
    if (isAuthError(auth)) return authError(auth.error, auth.status);

    const body = await req.json();
    const v = validateBody(QRGenerateSchema, body);
    if ("error" in v) return authError(v.error, v.status);

    const sb = createAdminClient();
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 min
    const { data, error } = await sb.from("asistencia_sesiones").update({ qr_token: token, qr_expires_at: expires }).eq("id", v.data.sesion_id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
