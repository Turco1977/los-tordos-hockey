"use client";
import { useState, useEffect } from "react";
import { useC } from "@/lib/theme-context";
import { Btn, useMobile } from "@/components/ui";
import { DIVISIONES, RAMAS, POSICIONES, calcDivision } from "@/lib/constants";
import { emptyJugadora, jugadoraToForm } from "@/lib/mappers";
import { createClient } from "@/lib/supabase/client";
import type { Jugadora } from "@/lib/supabase/types";

export default function PlayerForm({ jugadora, onSave, onCancel, saving }: { jugadora?: Jugadora | null; onSave: (data: any) => Promise<void>; onCancel: () => void; saving?: boolean }) {
  const { colors, cardBg } = useC();
  const mob = useMobile();
  const isEdit = !!jugadora;
  const [form, setForm] = useState<any>(() => jugadora ? jugadoraToForm(jugadora) : emptyJugadora());
  const [dniErr, setDniErr] = useState("");
  const [err, setErr] = useState("");

  const upd = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const divPreview = form.fecha_nacimiento ? calcDivision(form.fecha_nacimiento) : null;

  const checkDni = async () => {
    if (!form.dni || (isEdit && jugadora?.dni === form.dni)) { setDniErr(""); return; }
    const sb = createClient();
    const { data } = await sb.from("jugadoras").select("id").eq("dni", form.dni).maybeSingle();
    setDniErr(data ? "DNI ya registrado" : "");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (dniErr) return;
    if (!form.nombre || !form.apellido || !form.dni || !form.fecha_nacimiento) { setErr("Nombre, apellido, DNI y fecha de nacimiento son obligatorios"); return; }
    try { await onSave(form); } catch (ex: any) { setErr(ex.message || "Error al guardar"); }
  };

  const labelSt: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: colors.g5, display: "block", marginBottom: 3 };
  const inputSt: React.CSSProperties = { width: "100%", padding: 8, borderRadius: 7, border: "1px solid " + colors.g3, fontSize: 12, boxSizing: "border-box" };
  const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 12 };

  return (
    <form onSubmit={submit}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.nv, marginBottom: 16 }}>{isEdit ? "Editar Jugadora" : "Nueva Jugadora"}</h3>

      <div style={{ background: cardBg, borderRadius: 12, padding: 16, border: "1px solid " + colors.g2, marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: colors.nv, marginBottom: 10 }}>Datos Personales</div>
        <div style={grid}>
          <div><label style={labelSt}>Nombre *</label><input value={form.nombre} onChange={e => upd("nombre", e.target.value)} style={inputSt} required /></div>
          <div><label style={labelSt}>Apellido *</label><input value={form.apellido} onChange={e => upd("apellido", e.target.value)} style={inputSt} required /></div>
          <div>
            <label style={labelSt}>DNI *</label>
            <input value={form.dni} onChange={e => upd("dni", e.target.value)} onBlur={checkDni} style={{ ...inputSt, borderColor: dniErr ? "#C8102E" : colors.g3 }} required />
            {dniErr && <span style={{ fontSize: 10, color: "#C8102E" }}>{dniErr}</span>}
          </div>
          <div>
            <label style={labelSt}>Fecha Nacimiento *</label>
            <input type="date" value={form.fecha_nacimiento} onChange={e => upd("fecha_nacimiento", e.target.value)} style={inputSt} required />
            {divPreview && <span style={{ fontSize: 10, color: colors.bl }}>División: {divPreview}</span>}
          </div>
          <div><label style={labelSt}>Grupo Sanguíneo</label><input value={form.grupo_sanguineo || ""} onChange={e => upd("grupo_sanguineo", e.target.value)} style={inputSt} /></div>
        </div>
      </div>

      <div style={{ background: cardBg, borderRadius: 12, padding: 16, border: "1px solid " + colors.g2, marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: colors.nv, marginBottom: 10 }}>Contacto</div>
        <div style={grid}>
          <div><label style={labelSt}>Email</label><input type="email" value={form.email || ""} onChange={e => upd("email", e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>Teléfono</label><input value={form.telefono || ""} onChange={e => upd("telefono", e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>Teléfono Emergencia</label><input value={form.telefono_emergencia || ""} onChange={e => upd("telefono_emergencia", e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>Contacto Emergencia</label><input value={form.contacto_emergencia || ""} onChange={e => upd("contacto_emergencia", e.target.value)} style={inputSt} /></div>
          <div style={{ gridColumn: mob ? "auto" : "1/-1" }}><label style={labelSt}>Dirección</label><input value={form.direccion || ""} onChange={e => upd("direccion", e.target.value)} style={inputSt} /></div>
        </div>
      </div>

      <div style={{ background: cardBg, borderRadius: 12, padding: 16, border: "1px solid " + colors.g2, marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: colors.nv, marginBottom: 10 }}>Deportivo</div>
        <div style={grid}>
          <div>
            <label style={labelSt}>Rama</label>
            <select value={form.rama} onChange={e => upd("rama", e.target.value)} style={inputSt}>
              {RAMAS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label style={labelSt}>Posición</label>
            <select value={form.posicion || ""} onChange={e => upd("posicion", e.target.value || null)} style={inputSt}>
              <option value="">Sin definir</option>
              {POSICIONES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={labelSt}>División manual (override)</label>
            <select value={form.division_manual || ""} onChange={e => upd("division_manual", e.target.value || null)} style={inputSt}>
              <option value="">Auto (por edad)</option>
              {DIVISIONES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div style={{ background: cardBg, borderRadius: 12, padding: 16, border: "1px solid " + colors.g2, marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: colors.nv, marginBottom: 10 }}>Administrativo</div>
        <div style={grid}>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
              <input type="checkbox" checked={form.socia} onChange={e => upd("socia", e.target.checked)} /> Socia
            </label>
            <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
              <input type="checkbox" checked={form.derecho_jugadora} onChange={e => upd("derecho_jugadora", e.target.checked)} /> Derecho de Jugadora
            </label>
            <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
              <input type="checkbox" checked={form.activa} onChange={e => upd("activa", e.target.checked)} /> Activa
            </label>
          </div>
          <div>
            <label style={labelSt}>Cert. Médico Estado</label>
            <select value={form.cert_medico_estado} onChange={e => upd("cert_medico_estado", e.target.value)} style={inputSt}>
              <option value="pendiente">Pendiente</option>
              <option value="vigente">Vigente</option>
              <option value="vencido">Vencido</option>
            </select>
          </div>
          <div><label style={labelSt}>Cert. Médico Vencimiento</label><input type="date" value={form.cert_medico_vencimiento || ""} onChange={e => upd("cert_medico_vencimiento", e.target.value || null)} style={inputSt} /></div>
          <div><label style={labelSt}>Obra Social</label><input value={form.obra_social || ""} onChange={e => upd("obra_social", e.target.value)} style={inputSt} /></div>
          <div style={{ gridColumn: mob ? "auto" : "1/-1" }}><label style={labelSt}>Observaciones</label><textarea value={form.observaciones || ""} onChange={e => upd("observaciones", e.target.value)} style={{ ...inputSt, minHeight: 60 }} /></div>
        </div>
      </div>

      {err && <div style={{ marginBottom: 12, fontSize: 12, color: "#C8102E", fontWeight: 600 }}>{err}</div>}
      <div style={{ display: "flex", gap: 8 }}>
        <Btn onClick={onCancel} v="g">Cancelar</Btn>
        <Btn disabled={saving || !!dniErr} style={{ opacity: saving ? .5 : 1 }}>{saving ? "Guardando..." : isEdit ? "Guardar Cambios" : "Crear Jugadora"}</Btn>
      </div>
    </form>
  );
}
