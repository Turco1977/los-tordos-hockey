import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/server";
import { HOCKEY_ROLES } from "@/lib/constants";
import type { ZodSchema } from "zod";

type AuthError = { error: string; status: number };

function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export function authError(msg: string, status: number) {
  return NextResponse.json({ error: msg }, { status });
}

export function extractToken(req: NextRequest): string | AuthError {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer "))
    return { error: "No autorizado", status: 401 };
  return authHeader.slice(7);
}

export async function verifyUser(req: NextRequest) {
  const token = extractToken(req);
  if (typeof token !== "string") return token;

  const {
    data: { user },
  } = await anonClient().auth.getUser(token);
  if (!user) return { error: "Token inválido", status: 401 } as AuthError;
  return { user };
}

export async function verifyHockeyUser(req: NextRequest) {
  const result = await verifyUser(req);
  if ("error" in result) return result;

  const admin = createAdminClient();
  const { data: roles } = await admin
    .from("hockey_roles")
    .select("*")
    .eq("user_id", result.user.id)
    .eq("active", true);

  if (!roles || roles.length === 0) {
    return { error: "Sin rol de hockey asignado", status: 403 } as AuthError;
  }

  const maxLevel = Math.min(
    ...roles.map((r: any) => HOCKEY_ROLES[r.role]?.lv ?? 99)
  );

  return { user: result.user, roles, maxLevel, admin };
}

export async function requireLevel(req: NextRequest, maxAllowed: number) {
  const result = await verifyHockeyUser(req);
  if ("error" in result) return result;

  if (result.maxLevel > maxAllowed) {
    return {
      error: "No tenés permisos para esta acción",
      status: 403,
    } as AuthError;
  }

  return result;
}

export function isAuthError(
  result: any
): result is AuthError {
  return result && typeof result === "object" && "error" in result && "status" in result && !("user" in result);
}

export function validateBody<T>(schema: ZodSchema<T>, body: unknown) {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join(", ");
    return { error: msg, status: 400 } as AuthError;
  }
  return { data: parsed.data };
}
