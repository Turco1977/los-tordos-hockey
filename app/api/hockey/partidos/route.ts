import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const sb = createAdminClient();
  const { data, error } = await sb.from("partidos").select("*").order("fecha", { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sb = createAdminClient();
    const { data, error } = await sb.from("partidos").insert({
      fecha: body.fecha,
      rival: body.rival,
      sede: body.sede || "local",
      division: body.division,
      rama: body.rama,
      competencia: body.competencia || "otro",
      goles_favor: 0,
      goles_contra: 0,
      notas: body.notas || null,
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
    const { data, error } = await sb.from("partidos").update(updates).eq("id", id).select().single();
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
  const { error } = await sb.from("partidos").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
