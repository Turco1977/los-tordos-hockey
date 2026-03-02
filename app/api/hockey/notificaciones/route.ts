import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireLevel, isAuthError, authError } from "@/lib/api/authServer";

export async function GET(req: NextRequest) {
  const auth = await requireLevel(req, 4);
  if (isAuthError(auth)) return authError(auth.error, auth.status);

  const sb = createAdminClient();
  const { data, error } = await sb.from("notificaciones").select("*").eq("user_id", auth.user.id).order("created_at", { ascending: false }).limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const auth = await requireLevel(req, 4);
  if (isAuthError(auth)) return authError(auth.error, auth.status);

  const { id, all } = await req.json();
  const sb = createAdminClient();

  if (all) {
    // Mark all as read
    const { error } = await sb.from("notificaciones").update({ leida: true }).eq("user_id", auth.user.id).eq("leida", false);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  } else if (id) {
    const { error } = await sb.from("notificaciones").update({ leida: true }).eq("id", id).eq("user_id", auth.user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
