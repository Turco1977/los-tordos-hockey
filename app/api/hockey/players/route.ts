import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const sb = createAdminClient();
  const { data, error } = await sb.from("jugadoras").select("*").order("apellido");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sb = createAdminClient();

    // Check DNI uniqueness
    const { data: existing } = await sb.from("jugadoras").select("id").eq("dni", body.dni).maybeSingle();
    if (existing) {
      return NextResponse.json({ error: "Ya existe una jugadora con ese DNI" }, { status: 400 });
    }

    const { data, error } = await sb.from("jugadoras").insert(body).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // Audit log
    if (body._user_id) {
      await sb.from("jugadoras_historial").insert({
        jugadora_id: data.id,
        campo: "alta",
        valor_nuevo: `${body.nombre} ${body.apellido}`,
        user_id: body._user_id,
      });
    }

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, _user_id, _changes, ...updates } = body;
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

    const sb = createAdminClient();
    const { data, error } = await sb.from("jugadoras").update(updates).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // Audit log for each changed field
    if (_user_id && _changes) {
      const entries = Object.entries(_changes as Record<string, { from: any; to: any }>);
      for (const [campo, { from, to }] of entries) {
        await sb.from("jugadoras_historial").insert({
          jugadora_id: id,
          campo,
          valor_anterior: String(from ?? ""),
          valor_nuevo: String(to ?? ""),
          user_id: _user_id,
        });
      }
    }

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
