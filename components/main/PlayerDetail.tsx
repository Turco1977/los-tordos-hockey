"use client";
import { useState, useEffect } from "react";
import { useC } from "@/lib/theme-context";
import { Card, Btn, CertBadge, Spinner, useMobile } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import type { Jugadora, JugadoraHistorial } from "@/lib/supabase/types";

interface Acumulados { goles: number; amarillas: number; rojas: number; greenCards: number; partidos: number; enLBF: boolean }

export default function PlayerDetail({ jugadora: j, onEdit, onBack }: { jugadora: Jugadora; onEdit: () => void; onBack: () => void; userLevel: number }) {
  const { colors, cardBg, isDark } = useC();
  const mob = useMobile();
  const [hist, setHist] = useState<JugadoraHistorial[]>([]);
  const [loadingH, setLoadingH] = useState(true);
  const [acum, setAcum] = useState<Acumulados | null>(null);
  const [loadingA, setLoadingA] = useState(true);

  useEffect(() => {
    const sb = createClient();
    // History
    sb.from("jugadoras_historial").select("*, profile:profiles(first_name,last_name)").eq("jugadora_id", j.id).order("created_at", { ascending: false }).limit(50).then(({ data }) => {
      setHist((data || []) as any);
      setLoadingH(false);
    });
    // Acumulados: eventos + convocadas + LBF
    const fetchAcum = async () => {
      const [evRes, coRes, lbfRes] = await Promise.all([
        sb.from("partido_eventos").select("tipo").eq("jugadora_id", j.id),
        sb.from("partido_convocadas").select("id").eq("jugadora_id", j.id),
        sb.from("lbf_jugadoras").select("lbf_id, lbf:lbf(estado)").eq("jugadora_id", j.id),
      ]);
      const evs = evRes.data || [];
      const enLBF = (lbfRes.data || []).some((x: any) => x.lbf?.estado === "aprobada");
      setAcum({
        goles: evs.filter((e: any) => e.tipo === "gol").length,
        amarillas: evs.filter((e: any) => e.tipo === "amarilla").length,
        rojas: evs.filter((e: any) => e.tipo === "roja").length,
        greenCards: evs.filter((e: any) => e.tipo === "green_card").length,
        partidos: (coRes.data || []).length,
        enLBF,
      });
      setLoadingA(false);
    };
    fetchAcum();
  }, [j.id]);

  const row = (label: string, val: any) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid " + colors.g1, fontSize: 12 }}>
      <span style={{ color: colors.g5, fontWeight: 600 }}>{label}</span>
      <span style={{ color: colors.nv, fontWeight: 500, textAlign: "right" }}>{val ?? "-"}</span>
    </div>
  );

  const statBox = (label: string, value: number, icon: string, clr: string) => (
    <div style={{ textAlign: "center", padding: mob ? "10px 8px" : "14px 12px", background: isDark ? "rgba(255,255,255,.04)" : colors.g1, borderRadius: 10 }}>
      <div style={{ fontSize: 10, marginBottom: 2 }}>{icon}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: clr }}>{value}</div>
      <div style={{ fontSize: 9, color: colors.g5, fontWeight: 600 }}>{label}</div>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <div>
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: colors.bl, fontWeight: 600, padding: 0, marginBottom: 4 }}>← Volver</button>
          <h2 style={{ margin: 0, fontSize: mob ? 16 : 20, fontWeight: 800, color: colors.nv }}>{j.apellido}, {j.nombre}</h2>
        </div>
        <Btn s="s" onClick={onEdit}>Editar</Btn>
      </div>

      {/* Acumulados deportivos */}
      <Card style={{ marginBottom: 14, padding: mob ? "10px 12px" : "14px 16px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: colors.nv, marginBottom: 10 }}>Acumulados Deportivos</div>
        {loadingA ? <Spinner size={20} /> : acum ? (
          <div style={{ display: "grid", gridTemplateColumns: mob ? "repeat(3, 1fr)" : "repeat(6, 1fr)", gap: 8 }}>
            {statBox("Partidos", acum.partidos, "🏑", colors.bl)}
            {statBox("Goles", acum.goles, "⚽", colors.gn)}
            {statBox("Amarillas", acum.amarillas, "🟡", colors.yl)}
            {statBox("Rojas", acum.rojas, "🔴", colors.rd)}
            {statBox("Green Cards", acum.greenCards, "🟢", "#059669")}
            <div style={{ textAlign: "center", padding: mob ? "10px 8px" : "14px 12px", background: acum.enLBF ? "#D1FAE5" : (isDark ? "rgba(255,255,255,.04)" : colors.g1), borderRadius: 10 }}>
              <div style={{ fontSize: 10, marginBottom: 2 }}>📋</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: acum.enLBF ? "#166534" : colors.g4 }}>{acum.enLBF ? "SI" : "NO"}</div>
              <div style={{ fontSize: 9, color: acum.enLBF ? "#166534" : colors.g5, fontWeight: 600 }}>En LBF</div>
            </div>
          </div>
        ) : null}
      </Card>

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
