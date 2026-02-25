"use client";
import { useState } from "react";
import { useC } from "@/lib/theme-context";
import { Card, Btn, Empty, useMobile } from "@/components/ui";
import { HOCKEY_ROLES, HOCKEY_ROLE_KEYS, DIVISIONES, RAMAS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { HockeyRole } from "@/lib/supabase/types";

export default function StaffManager({ staff, onRefresh, userLevel }: { staff: HockeyRole[]; onRefresh: () => void; userLevel: number }) {
  const { colors, cardBg } = useC();
  const mob = useMobile();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ email: "", password: "", first_name: "", last_name: "", role: HOCKEY_ROLE_KEYS[0], divisiones: [] as string[], ramas: [] as string[] });

  const sb = createClient();

  const toggleDiv = (d: string) => setForm(f => ({ ...f, divisiones: f.divisiones.includes(d) ? f.divisiones.filter(x => x !== d) : [...f.divisiones, d] }));
  const toggleRama = (r: string) => setForm(f => ({ ...f, ramas: f.ramas.includes(r) ? f.ramas.filter(x => x !== r) : [...f.ramas, r] }));

  const create = async () => {
    setErr(""); setSaving(true);
    const res = await fetch("/api/admin/create-user", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    setSaving(false);
    if (data.error) { setErr(data.error); return; }
    setShowForm(false);
    setForm({ email: "", password: "", first_name: "", last_name: "", role: HOCKEY_ROLE_KEYS[0], divisiones: [], ramas: [] });
    onRefresh();
  };

  const toggleActive = async (r: HockeyRole) => {
    await sb.from("hockey_roles").update({ active: !r.active }).eq("id", r.id);
    onRefresh();
  };

  if (userLevel > 1) return <Empty icon="🔒" title="Sin acceso" sub="Solo el Director Deportivo puede gestionar staff" />;

  const inputSt: React.CSSProperties = { width: "100%", padding: 8, borderRadius: 7, border: "1px solid " + colors.g3, fontSize: 12, boxSizing: "border-box" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: mob ? 16 : 20, fontWeight: 800, color: colors.nv }}>👤 Staff Hockey</h2>
        <Btn s="s" onClick={() => setShowForm(!showForm)}>{showForm ? "Cancelar" : "+ Nuevo Staff"}</Btn>
      </div>

      {showForm && (
        <Card style={{ marginBottom: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 12 }}>
            <div><label style={{ fontSize: 11, fontWeight: 600, color: colors.g5 }}>Email *</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputSt} /></div>
            <div><label style={{ fontSize: 11, fontWeight: 600, color: colors.g5 }}>Contraseña *</label><input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={inputSt} /></div>
            <div><label style={{ fontSize: 11, fontWeight: 600, color: colors.g5 }}>Nombre</label><input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} style={inputSt} /></div>
            <div><label style={{ fontSize: 11, fontWeight: 600, color: colors.g5 }}>Apellido</label><input value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} style={inputSt} /></div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: colors.g5 }}>Rol</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={inputSt}>
                {HOCKEY_ROLE_KEYS.map(k => <option key={k} value={k}>{HOCKEY_ROLES[k].i} {HOCKEY_ROLES[k].l}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: colors.g5, display: "block", marginBottom: 4 }}>Divisiones</label>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {DIVISIONES.map(d => (
                <button key={d} onClick={() => toggleDiv(d)} style={{ padding: "4px 10px", borderRadius: 16, border: "1px solid " + (form.divisiones.includes(d) ? colors.bl : colors.g3), background: form.divisiones.includes(d) ? colors.bl + "20" : "transparent", fontSize: 10, cursor: "pointer", color: form.divisiones.includes(d) ? colors.bl : colors.g5, fontWeight: 600 }}>{d}</button>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: colors.g5, display: "block", marginBottom: 4 }}>Ramas</label>
            <div style={{ display: "flex", gap: 4 }}>
              {RAMAS.map(r => (
                <button key={r} onClick={() => toggleRama(r)} style={{ padding: "4px 10px", borderRadius: 16, border: "1px solid " + (form.ramas.includes(r) ? colors.bl : colors.g3), background: form.ramas.includes(r) ? colors.bl + "20" : "transparent", fontSize: 10, cursor: "pointer", color: form.ramas.includes(r) ? colors.bl : colors.g5, fontWeight: 600 }}>{r}</button>
              ))}
            </div>
          </div>
          {err && <div style={{ marginTop: 8, fontSize: 11, color: colors.rd, fontWeight: 600 }}>{err}</div>}
          <div style={{ marginTop: 12 }}><Btn disabled={!form.email || !form.password || !form.role || saving} onClick={create}>{saving ? "Creando..." : "Crear Usuario"}</Btn></div>
        </Card>
      )}

      {staff.length === 0 ? <Empty icon="👤" title="Sin staff" sub="No hay roles de hockey asignados" /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {staff.map(r => {
            const meta = HOCKEY_ROLES[r.role];
            return (
              <Card key={r.id} style={{ padding: 12, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", opacity: r.active ? 1 : .5 }}>
                <span style={{ fontSize: 20 }}>{meta?.i || "👤"}</span>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: colors.nv }}>{r.profile ? `${(r.profile as any).first_name} ${(r.profile as any).last_name}` : r.user_id.slice(0, 8)}</div>
                  <div style={{ fontSize: 11, color: colors.g4 }}>{meta?.l || r.role}</div>
                </div>
                {r.divisiones.length > 0 && <div style={{ fontSize: 10, color: colors.g5 }}>{r.divisiones.join(", ")}</div>}
                {r.ramas.length > 0 && <div style={{ fontSize: 10, color: colors.bl }}>{r.ramas.join(", ")}</div>}
                <Btn s="s" v={r.active ? "r" : "s"} onClick={() => toggleActive(r)}>{r.active ? "Desactivar" : "Activar"}</Btn>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
