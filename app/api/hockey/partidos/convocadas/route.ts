import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const partidoId = req.nextUrl.searchParams.get("partido_id");
  if (!partidoId) return NextResponse.json({ error: "partido_id requerido" }, { status: 400 });
  const sb = createAdminClient();
  const { data, error } = await sb.from("partido_convocadas").select("*").eq("partido_id", partidoId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const { partido_id, jugadoras } = await req.json();
    if (!partido_id || !jugadoras) return NextResponse.json({ error: "partido_id y jugadoras requeridos" }, { status: 400 });
    const sb = createAdminClient();
    // Replace: delete existing + insert new
    await sb.from("partido_convocadas").delete().eq("partido_id", partido_id);
    if (jugadoras.length > 0) {
      const rows = jugadoras.map((j: any) => ({
        partido_id,
        jugadora_id: j.jugadora_id,
        titular: j.titular ?? true,
      }));
      const { error } = await sb.from("partido_convocadas").insert(rows);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const { data } = await sb.from("partido_convocadas").select("*").eq("partido_id", partido_id);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });
  const sb = createAdminClient();
  const { error } = await sb.from("partido_convocadas").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
