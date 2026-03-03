import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireLevel, isAuthError, authError, validateBody } from "@/lib/api/authServer";
import { SesionCreateSchema, SesionUpdateSchema } from "@/lib/api/schemas";

export async function GET() {
  const sb = createAdminClient();
  const { data, error } = await sb.from("asistencia_sesiones").select("*").order("fecha", { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireLevel(req, 3);
    if (isAuthError(auth)) return authError(auth.error, auth.status);

    const body = await req.json();
    const v = validateBody(SesionCreateSchema, { ...body, created_by: auth.user.id });
    if ("error" in v) return authError(v.error, v.status);

    const sb = createAdminClient();
    const { data, error } = await sb.from("asistencia_sesiones").insert({
      fecha: body.fecha,
      division: body.division,
      rama: body.rama,
      tipo_actividad: body.tipo_actividad,
      notas: body.notas || null,
      estado: "abierta",
      created_by: auth.user.id,
    }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireLevel(req, 3);
    if (isAuthError(auth)) return authError(auth.error, auth.status);

    const body = await req.json();
    const v = validateBody(SesionUpdateSchema, body);
    if ("error" in v) return authError(v.error, v.status);

    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });
    const sb = createAdminClient();
    const { data, error } = await sb.from("asistencia_sesiones").update(updates).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireLevel(req, 3);
    if (isAuthError(auth)) return authError(auth.error, auth.status);

    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

    const sb = createAdminClient();
    await sb.from("asistencia_registros").delete().eq("sesion_id", id);
    const { error } = await sb.from("asistencia_sesiones").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
