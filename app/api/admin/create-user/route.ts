import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, first_name, last_name, role, divisiones, ramas } = body;

    if (!email || !password || !role) {
      return NextResponse.json({ error: "Email, password y role son requeridos" }, { status: 400 });
    }

    const sb = createAdminClient();

    // Create auth user
    const { data: authData, error: authErr } = await sb.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name: first_name || "", last_name: last_name || "" },
    });

    if (authErr) {
      return NextResponse.json({ error: authErr.message }, { status: 400 });
    }

    const userId = authData.user.id;

    // Ensure profile exists
    await sb.from("profiles").upsert({
      id: userId,
      email,
      first_name: first_name || "",
      last_name: last_name || "",
    }, { onConflict: "id" });

    // Create hockey role
    const { error: roleErr } = await sb.from("hockey_roles").insert({
      user_id: userId,
      role,
      divisiones: divisiones || [],
      ramas: ramas || [],
      active: true,
    });

    if (roleErr) {
      return NextResponse.json({ error: roleErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, userId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
