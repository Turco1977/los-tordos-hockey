import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const sb = createAdminClient();
  const { data, error } = await sb.from("calendario_eventos").select("*").order("fecha", { ascending: true }).limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sb = createAdminClient();
    const { data, error } = await sb.from("calendario_eventos").insert({
      titulo: body.titulo,
      fecha: body.fecha,
      hora: body.hora || null,
      tipo: body.tipo || "otro",
      division: body.division || null,
      rama: body.rama || null,
      descripcion: body.descripcion || null,
      recurrencia: body.recurrencia || null,
      recurrencia_fin: body.recurrencia_fin || null,
      sesion_id: body.sesion_id || null,
      partido_id: body.partido_id || null,
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
    const { data, error } = await sb.from("calendario_eventos").update(updates).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });
  const sb = createAdminClient();
  const { error } = await sb.from("calendario_eventos").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
