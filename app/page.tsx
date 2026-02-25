"use client";
import { useState, useEffect, useCallback } from "react";
import { useTheme, darkCSS } from "@/lib/theme";
import { ThemeCtx } from "@/lib/theme-context";
import { useStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { fetchMyRoles, maxLevel } from "@/lib/api/auth";
import { useMobile, Toast, Spinner } from "@/components/ui";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import type { TabId } from "@/lib/constants";

import Login from "@/components/main/Login";
import Sidebar from "@/components/main/Sidebar";
import RoleSelector from "@/components/main/RoleSelector";
import Dashboard from "@/components/main/Dashboard";
import PlayerRegistry from "@/components/main/PlayerRegistry";
import PlayerForm from "@/components/main/PlayerForm";
import PlayerDetail from "@/components/main/PlayerDetail";
import LBFManager from "@/components/main/LBFManager";
import LBFSummary from "@/components/main/LBFSummary";
import Organigrama from "@/components/main/Organigrama";
import StaffManager from "@/components/main/StaffManager";
import type { Jugadora } from "@/lib/supabase/types";

export default function Page() {
  const theme = useTheme();
  const mob = useMobile();
  const sb = createClient();

  /* ── ALL hooks BEFORE early returns ── */
  const [authChecked, setAuthChecked] = useState(false);
  const [tab, setTab] = useState<TabId>("dashboard");
  const [playerView, setPlayerView] = useState<"list" | "detail" | "form" | "new">("list");
  const [selPlayer, setSelPlayer] = useState<Jugadora | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const store = useStore();
  const { user, profile, roles, activeRole, setUser, setProfile, setRoles, setActiveRole, jugadoras, lbfs, staff, fetchJugadoras, fetchLBFs, fetchStaff } = store;

  const userLevel = maxLevel(roles);

  const loadData = useCallback(async () => {
    await Promise.all([fetchJugadoras(), fetchLBFs(), fetchStaff()]);
  }, [fetchJugadoras, fetchLBFs, fetchStaff]);

  // Auth check
  useEffect(() => {
    sb.auth.getUser().then(async ({ data: { user: u } }) => {
      if (u) {
        setUser(u);
        const { data: p } = await sb.from("profiles").select("*").eq("id", u.id).single();
        if (p) setProfile(p as any);
        const r = await fetchMyRoles();
        setRoles(r);
        if (r.length > 0) setActiveRole(r[0]);
        await loadData();
      }
      setAuthChecked(true);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime subscriptions
  useEffect(() => {
    if (!user) return;
    const ch = sb.channel("hockey-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "jugadoras" }, () => fetchJugadoras())
      .on("postgres_changes", { event: "*", schema: "public", table: "lbf" }, () => fetchLBFs())
      .on("postgres_changes", { event: "*", schema: "public", table: "hockey_roles" }, () => fetchStaff())
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogin = async (u: any) => {
    setUser(u);
    const { data: p } = await sb.from("profiles").select("*").eq("id", u.id).single();
    if (p) setProfile(p as any);
    const r = await fetchMyRoles();
    setRoles(r);
    if (r.length > 0) setActiveRole(r[0]);
    await loadData();
  };

  const bulkUpload = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split("\n").filter(l => l.trim());
      if (lines.length < 2) { setToast({ msg: "CSV vacío o sin datos", type: "err" }); return; }

      // Auto-detect separator
      const sep = lines[0].includes(";") ? ";" : ",";
      const headers = lines[0].split(sep).map(h => h.replace(/"/g, "").trim().toLowerCase());

      // Detect format: "Apellido Nombre" column = PDR format
      const isPDR = headers.some(h => h.includes("apellido nombre"));

      const seen = new Set<string>();
      const rows: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(sep).map(v => v.replace(/"/g, "").trim());
        const obj: any = {};
        headers.forEach((h, idx) => { obj[h] = vals[idx] || ""; });

        let nombre = "", apellido = "", dni = "", fecha = "";

        if (isPDR) {
          // PDR format: "APELLIDO, NOMBRE" in one column
          dni = obj.dni || obj["dni"] || "";
          const an = obj["apellido nombre"] || "";
          const parts = an.split(",").map((s: string) => s.trim());
          apellido = parts[0] || "";
          nombre = parts[1] || "";
          // fecha DD/MM/YYYY -> YYYY-MM-DD
          const fr = obj["fecha nacimiento"] || "";
          const fp = fr.split("/");
          fecha = fp.length === 3 ? `${fp[2]}-${fp[1].padStart(2, "0")}-${fp[0].padStart(2, "0")}` : "";
        } else {
          nombre = obj.nombre || obj.name || "";
          apellido = obj.apellido || obj.surname || "";
          dni = obj.dni || "";
          fecha = obj.fecha_nacimiento || obj["fecha nac"] || obj.nacimiento || "";
        }

        if (!nombre || !apellido || !dni || !fecha || seen.has(dni)) continue;
        seen.add(dni);

        const lbfVal = (obj.lbf || "").toLowerCase();
        rows.push({
          nombre, apellido, dni, fecha_nacimiento: fecha,
          rama: obj.rama || "A",
          posicion: obj.posicion || null,
          socia: ["si","sí","true","1"].includes((obj.socia || "").toLowerCase()),
          derecho_jugadora: lbfVal === "si" || ["si","sí","true","1"].includes((obj.derecho || obj.derecho_jugadora || "").toLowerCase()),
          cert_medico_estado: obj.cert_medico_estado || "pendiente",
          cert_medico_vencimiento: obj.cert_medico_vencimiento || null,
          activa: (obj.estado || "").toLowerCase() !== "baja",
          observaciones: obj.observaciones || null,
        });
      }

      if (rows.length === 0) { setToast({ msg: "No se encontraron filas válidas", type: "err" }); return; }

      // Insert in batches of 100
      let ok = 0;
      for (let i = 0; i < rows.length; i += 100) {
        const batch = rows.slice(i, i + 100);
        const { error } = await sb.from("jugadoras").insert(batch);
        if (error) throw error;
        ok += batch.length;
      }
      setToast({ msg: `${ok} jugadora(s) cargadas`, type: "ok" });
      await fetchJugadoras();
    } catch (e: any) { setToast({ msg: e.message || "Error en carga masiva", type: "err" }); }
  };

  const delJugadoras = async (ids: string[]) => {
    try {
      const { error } = await sb.from("jugadoras").delete().in("id", ids);
      if (error) throw error;
      setToast({ msg: `${ids.length} jugadora(s) eliminada(s)`, type: "ok" });
      await fetchJugadoras();
    } catch (e: any) { setToast({ msg: e.message || "Error al eliminar", type: "err" }); }
  };

  const handleLogout = async () => {
    await sb.auth.signOut();
    setUser(null); setProfile(null); setRoles([]); setActiveRole(null);
  };

  const savePlayer = async (data: any) => {
    setSaving(true);
    try {
      const isEdit = !!selPlayer;
      const url = "/api/hockey/players";
      const body = isEdit
        ? { id: selPlayer!.id, ...data, _user_id: user?.id, _changes: getChanges(selPlayer!, data) }
        : { ...data, _user_id: user?.id };
      const res = await fetch(url, { method: isEdit ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      setToast({ msg: isEdit ? "Jugadora actualizada" : "Jugadora creada", type: "ok" });
      await fetchJugadoras();
      setPlayerView("list"); setSelPlayer(null);
    } catch (e: any) {
      setToast({ msg: e.message, type: "err" });
    }
    setSaving(false);
  };

  /* ── Early returns AFTER all hooks ── */
  if (!authChecked) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0A1628" }}><Spinner /></div>;
  if (!user) return <Login onLogin={handleLogin} />;

  const content = () => {
    switch (tab) {
      case "dashboard":
        return <Dashboard jugadoras={jugadoras} lbfs={lbfs} userLevel={userLevel} />;
      case "padron":
        if (playerView === "new") return <PlayerForm onSave={savePlayer} onCancel={() => setPlayerView("list")} saving={saving} />;
        if (playerView === "form" && selPlayer) return <PlayerForm jugadora={selPlayer} onSave={savePlayer} onCancel={() => setPlayerView("detail")} saving={saving} />;
        if (playerView === "detail" && selPlayer) return <PlayerDetail jugadora={selPlayer} onEdit={() => setPlayerView("form")} onBack={() => { setPlayerView("list"); setSelPlayer(null); }} userLevel={userLevel} />;
        return <PlayerRegistry jugadoras={jugadoras} onSelect={j => { setSelPlayer(j); setPlayerView("detail"); }} onNew={() => { setSelPlayer(null); setPlayerView("new"); }} onDel={delJugadoras} onBulk={bulkUpload} userLevel={userLevel} />;
      case "lbf":
        return (
          <>
            <LBFSummary jugadoras={jugadoras} />
            <LBFManager jugadoras={jugadoras} lbfs={lbfs} userId={user.id} userLevel={userLevel} onRefresh={fetchLBFs} />
          </>
        );
      case "organigrama":
        return <Organigrama />;
      case "staff":
        return <StaffManager staff={staff} onRefresh={fetchStaff} userLevel={userLevel} />;
      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
      <ThemeCtx.Provider value={{ colors: theme.colors, isDark: theme.isDark, cardBg: theme.cardBg }}>
        <style dangerouslySetInnerHTML={{ __html: darkCSS }} />
        <div style={{ display: "flex", minHeight: "100vh", background: theme.colors.g1, fontFamily: "Arial, sans-serif" }}>
          <Sidebar tab={tab} onTab={t => { setTab(t as TabId); setPlayerView("list"); setSelPlayer(null); }} userLevel={userLevel} profile={profile} onLogout={handleLogout} onToggleTheme={theme.toggle} isDark={theme.isDark} mob={mob} activeRole={activeRole} />
          <main style={{ flex: 1, padding: mob ? "16px 12px 80px" : "24px 28px", maxWidth: 1100, width: "100%" }}>
            <RoleSelector roles={roles} activeRole={activeRole} onSelect={setActiveRole} />
            {content()}
          </main>
        </div>
        {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      </ThemeCtx.Provider>
    </ErrorBoundary>
  );
}

function getChanges(old: Jugadora, updated: any): Record<string, { from: any; to: any }> {
  const changes: Record<string, { from: any; to: any }> = {};
  for (const key of Object.keys(updated)) {
    if (key.startsWith("_")) continue;
    const ov = (old as any)[key], nv = updated[key];
    if (String(ov ?? "") !== String(nv ?? "")) changes[key] = { from: ov, to: nv };
  }
  return changes;
}
