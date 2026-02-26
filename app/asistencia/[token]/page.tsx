"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

export default function QRAsistencia() {
  const { token } = useParams<{ token: string }>();
  const [status, sStatus] = useState<"loading" | "ready" | "success" | "error" | "expired">("loading");
  const [sesion, sSesion] = useState<any>(null);
  const [dni, sDni] = useState("");
  const [msg, sMsg] = useState("");
  const [jugadora, sJugadora] = useState<any>(null);

  useEffect(() => {
    if (!token) return;
    fetch("/api/hockey/asistencia/qr?token=" + token)
      .then(r => r.json())
      .then(d => {
        if (d.error) { sStatus(d.error.includes("expirado") ? "expired" : "error"); sMsg(d.error); }
        else { sSesion(d.sesion); sStatus("ready"); }
      })
      .catch(() => { sStatus("error"); sMsg("Error de conexión"); });
  }, [token]);

  const registrar = async () => {
    if (!dni.trim()) return;
    try {
      const res = await fetch("/api/hockey/asistencia/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, dni: dni.trim() }),
      });
      const data = await res.json();
      if (data.error) { sMsg(data.error); sStatus("error"); return; }
      sJugadora(data.jugadora);
      sMsg(data.msg);
      sStatus("success");
    } catch { sMsg("Error de conexión"); sStatus("error"); }
  };

  const bg = "#0A1628";
  const card = { background: "#1E293B", borderRadius: 16, padding: 24, maxWidth: 360, width: "90vw", textAlign: "center" as const };

  if (status === "loading") return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={card}>
        <div style={{ fontSize: 32 }}>🏑</div>
        <div style={{ color: "#94A3B8", fontSize: 14, marginTop: 8 }}>Cargando...</div>
      </div>
    </div>
  );

  if (status === "expired") return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={card}>
        <div style={{ fontSize: 32 }}>⏰</div>
        <div style={{ color: "#F59E0B", fontSize: 16, fontWeight: 700, marginTop: 8 }}>QR Expirado</div>
        <div style={{ color: "#94A3B8", fontSize: 12, marginTop: 4 }}>Pedí un nuevo QR a tu entrenador/a</div>
      </div>
    </div>
  );

  if (status === "error") return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={card}>
        <div style={{ fontSize: 32 }}>❌</div>
        <div style={{ color: "#F87171", fontSize: 14, fontWeight: 700, marginTop: 8 }}>{msg}</div>
      </div>
    </div>
  );

  if (status === "success") return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={card}>
        <div style={{ fontSize: 40 }}>✅</div>
        <div style={{ color: "#34D399", fontSize: 18, fontWeight: 800, marginTop: 8 }}>¡Presente!</div>
        {jugadora && <div style={{ color: "#E2E8F0", fontSize: 14, marginTop: 4 }}>{jugadora.nombre} {jugadora.apellido}</div>}
        <div style={{ color: "#94A3B8", fontSize: 11, marginTop: 8 }}>{msg}</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={card}>
        <div style={{ fontSize: 32 }}>🏑</div>
        <div style={{ color: "#E2E8F0", fontSize: 16, fontWeight: 800, marginTop: 8 }}>Los Tordos Hockey</div>
        <div style={{ color: "#94A3B8", fontSize: 12, marginTop: 4 }}>Registro de Asistencia</div>
        {sesion && <div style={{ color: "#60A5FA", fontSize: 11, marginTop: 8 }}>{sesion.division} • Rama {sesion.rama}</div>}
        <input
          value={dni} onChange={e => sDni(e.target.value)}
          placeholder="Ingresá tu DNI"
          type="text" inputMode="numeric"
          onKeyDown={e => e.key === "Enter" && registrar()}
          style={{ width: "100%", padding: "14px 16px", borderRadius: 10, border: "2px solid #334155", background: "#0F172A", color: "#E2E8F0", fontSize: 18, textAlign: "center", marginTop: 16, outline: "none" }}
          autoFocus
        />
        <button onClick={registrar} style={{ width: "100%", padding: "14px", borderRadius: 10, border: "none", background: "#10B981", color: "#fff", fontSize: 16, fontWeight: 700, marginTop: 12, cursor: "pointer" }}>
          ✅ Registrar Presente
        </button>
      </div>
    </div>
  );
}
