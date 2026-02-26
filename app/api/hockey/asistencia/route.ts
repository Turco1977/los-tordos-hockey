import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const sb = createAdminClient();
  const { data, error } = await sb.from("asistencia_sesiones").select("*").order("fecha", { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sb = createAdminClient();
    const { data, error } = await sb.from("asistencia_sesiones").insert({
      fecha: body.fecha,
      division: body.division,
      rama: body.rama,
      tipo_actividad: body.tipo_actividad,
      notas: body.notas || null,
      estado: "abierta",
      created_by: body.created_by,
    }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
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
