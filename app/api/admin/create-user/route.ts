import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireLevel, isAuthError, authError, validateBody } from "@/lib/api/authServer";
import { CreateUserSchema } from "@/lib/api/schemas";

export async function POST(req: NextRequest) {
  try {
    // Only Director Deportivo (level 1) can create users
    const auth = await requireLevel(req, 1);
    if (isAuthError(auth)) return authError(auth.error, auth.status);

    const body = await req.json();
    const v = validateBody(CreateUserSchema, body);
    if ("error" in v) return authError(v.error, v.status);

    const { email, password, first_name, last_name, role, divisiones, ramas } = body;

    const sb = createAdminClient();

    // Create or find auth user
    let userId: string;
    const { data: authData, error: authErr } = await sb.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name: first_name || "", last_name: last_name || "" },
    });

    if (authErr) {
      // If user already exists, look them up
      if (authErr.message.includes("already been registered")) {
        const { data: { users } } = await sb.auth.admin.listUsers();
        const existing = users.find((u: any) => u.email === email);
        if (!existing) return NextResponse.json({ error: "User exists but not found" }, { status: 400 });
        userId = existing.id;
      } else {
        return NextResponse.json({ error: authErr.message }, { status: 400 });
      }
    } else {
      userId = authData.user.id;
    }

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
