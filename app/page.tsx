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
        return <PlayerRegistry jugadoras={jugadoras} onSelect={j => { setSelPlayer(j); setPlayerView("detail"); }} onNew={() => { setSelPlayer(null); setPlayerView("new"); }} userLevel={userLevel} />;
      case "lbf":
        return (
          <>
            <LBFSummary jugadoras={jugadoras} />
            <LBFManager jugadoras={jugadoras} lbfs={lbfs} userId={user.id} userLevel={userLevel} onRefresh={fetchLBFs} />
          </>
        );
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
