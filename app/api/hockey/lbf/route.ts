import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireLevel, isAuthError, authError, validateBody } from "@/lib/api/authServer";
import { LBFCreateSchema, LBFUpdateSchema } from "@/lib/api/schemas";

export async function GET() {
  const sb = createAdminClient();
  const { data, error } = await sb.from("lbf").select("*").order("ano", { ascending: false }).order("division").order("rama");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireLevel(req, 3);
    if (isAuthError(auth)) return authError(auth.error, auth.status);

    const body = await req.json();
    const v = validateBody(LBFCreateSchema, { ...body, creado_por: auth.user.id });
    if ("error" in v) return authError(v.error, v.status);

    const sb = createAdminClient();
    const nombre = `LBF ${body.ano} - ${body.division} ${body.rama}`;
    const insertData = { ...body, nombre, creado_por: auth.user.id };
    const { data, error } = await sb.from("lbf").insert(insertData).select().single();
    if (error) {
      // Unique constraint violation (ano, division, rama)
      if (error.code === "23505") return NextResponse.json({ error: `Ya existe una LBF para ${body.division} ${body.rama} en ${body.ano}` }, { status: 409 });
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Audit
    await sb.from("lbf_historial").insert({
      lbf_id: data.id,
      accion: "creada",
      detalle: `LBF "${nombre}" creada`,
      user_id: auth.user.id,
    });

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
    const v = validateBody(LBFUpdateSchema, body);
    if ("error" in v) return authError(v.error, v.status);

    const { id, _user_id, _action, ...updates } = body;
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

    const sb = createAdminClient();

    // If approving, set aprobado_por and aprobado_at from verified user
    if (updates.estado === "aprobada") {
      updates.aprobado_por = auth.user.id;
      updates.aprobado_at = new Date().toISOString();
    }

    const { data, error } = await sb.from("lbf").update(updates).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // Audit
    if (_action) {
      await sb.from("lbf_historial").insert({
        lbf_id: id,
        accion: _action,
        detalle: updates.estado ? `Estado cambiado a ${updates.estado}` : _action,
        user_id: auth.user.id,
      });
    }

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireLevel(req, 2);
    if (isAuthError(auth)) return authError(auth.error, auth.status);

    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });
    const sb = createAdminClient();
    const { error } = await sb.from("lbf").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
