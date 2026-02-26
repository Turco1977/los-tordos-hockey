import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const sesionId = req.nextUrl.searchParams.get("sesion_id");
  if (!sesionId) return NextResponse.json({ error: "sesion_id requerido" }, { status: 400 });
  const sb = createAdminClient();
  const { data, error } = await sb.from("asistencia_registros").select("*").eq("sesion_id", sesionId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const { sesion_id, registros } = await req.json();
    if (!sesion_id || !registros) return NextResponse.json({ error: "sesion_id y registros requeridos" }, { status: 400 });
    const sb = createAdminClient();
    // Upsert: delete existing + insert new
    await sb.from("asistencia_registros").delete().eq("sesion_id", sesion_id);
    if (registros.length > 0) {
      const rows = registros.map((r: any) => ({
        sesion_id,
        jugadora_id: r.jugadora_id,
        presente: r.presente,
        metodo: r.metodo || "manual",
        hora: r.hora || null,
      }));
      const { error } = await sb.from("asistencia_registros").insert(rows);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const { data } = await sb.from("asistencia_registros").select("*").eq("sesion_id", sesion_id);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
