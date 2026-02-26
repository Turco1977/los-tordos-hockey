"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useC } from "@/lib/theme-context";
import { Card, Btn } from "@/components/ui";

export default function Login({ onLogin }: { onLogin: (user: any) => void }) {
  const { colors, cardBg } = useC();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ email: false, pass: false });

  const emailErr = touched.email && !email.trim() ? "Ingresá tu email" : touched.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "Email inválido" : "";
  const passErr = touched.pass && !pass ? "Ingresá tu contraseña" : "";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, pass: true });
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !pass) return;
    setErr(""); setLoading(true);
    const sb = createClient();
    const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
    setLoading(false);
    if (error) { setErr(error.message); return; }
    if (data.user) onLogin(data.user);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: `linear-gradient(160deg, ${colors.nv}, ${colors.rd})`, fontFamily: "Arial, sans-serif" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 56, marginBottom: 8 }}>🏑</div>
        <h1 style={{ margin: 0, fontSize: 24, color: "#fff", fontWeight: 800 }}>Los Tordos Hockey</h1>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: "rgba(255,255,255,.6)" }}>Panel de Gestión</p>
      </div>
      <Card style={{ width: "100%", maxWidth: 420, padding: 32, boxSizing: "border-box" }}>
        <form onSubmit={submit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: colors.g5, display: "block", marginBottom: 4 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, email: true }))}
              style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid " + colors.g3, fontSize: 13, boxSizing: "border-box", background: cardBg, color: colors.nv }}
            />
            {emailErr && <div style={{ fontSize: 11, color: colors.rd, marginTop: 4 }}>{emailErr}</div>}
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: colors.g5, display: "block", marginBottom: 4 }}>Contraseña</label>
            <input
              type="password"
              value={pass}
              onChange={e => setPass(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, pass: true }))}
              style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid " + colors.g3, fontSize: 13, boxSizing: "border-box", background: cardBg, color: colors.nv }}
            />
            {passErr && <div style={{ fontSize: 11, color: colors.rd, marginTop: 4 }}>{passErr}</div>}
          </div>
          {err && (
            <div style={{ marginBottom: 16, padding: 10, borderRadius: 8, background: "#FEE2E2", border: "1px solid #FCA5A5", color: colors.rd, fontSize: 12, fontWeight: 600 }}>
              {err}
            </div>
          )}
          <Btn v="r" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Ingresando..." : "Ingresar"}
          </Btn>
        </form>
      </Card>
    </div>
  );
}
