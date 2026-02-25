"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Login({ onLogin }: { onLogin: (user: any) => void }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    const sb = createClient();
    const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
    setLoading(false);
    if (error) { setErr(error.message); return; }
    if (data.user) onLogin(data.user);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0A1628", fontFamily: "Arial, sans-serif" }}>
      <form onSubmit={submit} style={{ background: "#fff", borderRadius: 16, padding: 40, width: 360, maxWidth: "90vw", boxShadow: "0 8px 32px rgba(0,0,0,.3)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🏑</div>
          <h1 style={{ margin: 0, fontSize: 22, color: "#0A1628", fontWeight: 800 }}>Los Tordos Hockey</h1>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#8B95A5" }}>Panel de Gestión</p>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#5A6577", display: "block", marginBottom: 4 }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #CBD2DC", fontSize: 13, boxSizing: "border-box" }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#5A6577", display: "block", marginBottom: 4 }}>Contraseña</label>
          <input type="password" value={pass} onChange={e => setPass(e.target.value)} required style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #CBD2DC", fontSize: 13, boxSizing: "border-box" }} />
        </div>
        {err && <div style={{ marginBottom: 12, fontSize: 11, color: "#C8102E", fontWeight: 600 }}>{err}</div>}
        <button type="submit" disabled={loading} style={{ width: "100%", padding: 12, borderRadius: 8, border: "none", background: "#0A1628", color: "#fff", fontSize: 14, fontWeight: 700, cursor: loading ? "wait" : "pointer", opacity: loading ? .6 : 1 }}>
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
