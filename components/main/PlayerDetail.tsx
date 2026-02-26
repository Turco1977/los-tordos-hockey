"use client";
import { useState, useEffect } from "react";
import { useC } from "@/lib/theme-context";
import { Card, Btn, CertBadge, Spinner, useMobile } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import type { Jugadora, JugadoraHistorial } from "@/lib/supabase/types";

export default function PlayerDetail({ jugadora: j, onEdit, onBack }: { jugadora: Jugadora; onEdit: () => void; onBack: () => void; userLevel: number }) {
  const { colors } = useC();
  const mob = useMobile();
  const [hist, setHist] = useState<JugadoraHistorial[]>([]);
  const [loadingH, setLoadingH] = useState(true);

  useEffect(() => {
    const sb = createClient();
    sb.from("jugadoras_historial").select("*, profile:profiles(first_name,last_name)").eq("jugadora_id", j.id).order("created_at", { ascending: false }).limit(50).then(({ data }) => {
      setHist((data || []) as any);
      setLoadingH(false);
    });
  }, [j.id]);

  const row = (label: string, val: any) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid " + colors.g1, fontSize: 12 }}>
      <span style={{ color: colors.g5, fontWeight: 600 }}>{label}</span>
      <span style={{ color: colors.nv, fontWeight: 500, textAlign: "right" }}>{val ?? "-"}</span>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <div>
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: colors.bl, fontWeight: 600, padding: 0, marginBottom: 4 }}>← Volver al padrón</button>
          <h2 style={{ margin: 0, fontSize: mob ? 16 : 20, fontWeight: 800, color: colors.nv }}>{j.apellido}, {j.nombre}</h2>
        </div>
        <Btn s="s" onClick={onEdit}>Editar</Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 14 }}>
        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, color: colors.nv, marginBottom: 8 }}>Datos Personales</div>
          {row("DNI", j.dni)}
          {row("Fecha Nacimiento", j.fecha_nacimiento)}
          {row("División", j.division_efectiva || j.division_manual)}
          {row("Rama", j.rama)}
          {row("Posición", j.posicion)}
          {row("Grupo Sanguíneo", j.grupo_sanguineo)}
        </Card>
        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, color: colors.nv, marginBottom: 8 }}>Contacto</div>
          {row("Email", j.email)}
          {row("Teléfono", j.telefono)}
          {row("Tel. Emergencia", j.telefono_emergencia)}
          {row("Contacto Emergencia", j.contacto_emergencia)}
          {row("Dirección", j.direccion)}
          {row("Departamento", j.departamento)}
        </Card>
        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, color: colors.nv, marginBottom: 8 }}>Contacto Tutor</div>
          {row("Nombre tutor", j.contacto_tutor_nombre)}
          {row("Teléfono tutor", j.contacto_tutor_telefono)}
          {row("Email tutor", j.contacto_tutor_email)}
        </Card>
        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, color: colors.nv, marginBottom: 8 }}>Administrativo</div>
          {row("Socia", j.socia ? "Sí" : "No")}
          {row("Derecho de Jugadora", j.derecho_jugadora ? "Sí" : "No")}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid " + colors.g1, fontSize: 12, alignItems: "center" }}>
            <span style={{ color: colors.g5, fontWeight: 600 }}>Cert. Médico</span>
            <CertBadge s={j.cert_medico_estado} />
          </div>
          {row("Cert. Vencimiento", j.cert_medico_vencimiento)}
          {row("Obra Social", j.obra_social)}
          {row("Estado", j.estado === "activa" ? "✅ Activa" : j.estado === "suspendida" ? "⚠️ Suspendida" : "❌ Baja")}
          {j.fecha_alta && row("Fecha de Alta", j.fecha_alta)}
          {j.estado === "baja" && row("Fecha de Baja", j.fecha_baja)}
          {j.motivo_baja && row("Motivo de Baja", j.motivo_baja)}
          {row("Temporada", j.temporada)}
        </Card>
        {j.observaciones && <Card><div style={{ fontSize: 12, fontWeight: 700, color: colors.nv, marginBottom: 8 }}>Observaciones</div><div style={{ fontSize: 12, color: colors.g5 }}>{j.observaciones}</div></Card>}
      </div>

      <Card style={{ marginTop: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: colors.nv, marginBottom: 10 }}>Historial de Cambios</div>
        {loadingH ? <Spinner size={20} /> : hist.length === 0 ? <div style={{ fontSize: 11, color: colors.g4 }}>Sin cambios registrados</div> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {hist.map(h => (
              <div key={h.id} style={{ fontSize: 11, padding: "6px 0", borderBottom: "1px solid " + colors.g1, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 4 }}>
                <span><strong>{h.campo}</strong>: {h.valor_anterior || "(vacío)"} → {h.valor_nuevo || "(vacío)"}</span>
                <span style={{ color: colors.g4 }}>{new Date(h.created_at).toLocaleDateString("es-AR")} {h.profile ? `por ${(h.profile as any).first_name}` : ""}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
