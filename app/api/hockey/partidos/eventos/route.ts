import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const partidoId = req.nextUrl.searchParams.get("partido_id");
  if (!partidoId) return NextResponse.json({ error: "partido_id requerido" }, { status: 400 });
  const sb = createAdminClient();
  const { data, error } = await sb.from("partido_eventos").select("*").eq("partido_id", partidoId).order("minuto");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sb = createAdminClient();
    const { data, error } = await sb.from("partido_eventos").insert({
      partido_id: body.partido_id,
      jugadora_id: body.jugadora_id,
      tipo: body.tipo,
      minuto: body.minuto || null,
      notas: body.notas || null,
    }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    // Auto-update score if it's a goal
    if (body.tipo === "gol") {
      const { data: evts } = await sb.from("partido_eventos").select("tipo").eq("partido_id", body.partido_id).eq("tipo", "gol");
      const goles = evts?.length || 0;
      await sb.from("partidos").update({ goles_favor: goles }).eq("id", body.partido_id);
    }
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const partidoId = req.nextUrl.searchParams.get("partido_id");
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });
  const sb = createAdminClient();
  const { data: evt } = await sb.from("partido_eventos").select("tipo,partido_id").eq("id", id).single();
  const { error } = await sb.from("partido_eventos").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  // Re-count goals
  if (evt?.tipo === "gol" && (partidoId || evt.partido_id)) {
    const pid = partidoId || evt.partido_id;
    const { data: evts } = await sb.from("partido_eventos").select("tipo").eq("partido_id", pid).eq("tipo", "gol");
    await sb.from("partidos").update({ goles_favor: evts?.length || 0 }).eq("id", pid);
  }
  return NextResponse.json({ ok: true });
}
