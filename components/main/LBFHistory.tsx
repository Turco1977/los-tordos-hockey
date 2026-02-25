"use client";
import { useState, useEffect } from "react";
import { useC } from "@/lib/theme-context";
import { Card, Spinner } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import type { LBFHistorial } from "@/lib/supabase/types";

export default function LBFHistory({ lbfId }: { lbfId: string }) {
  const { colors } = useC();
  const [hist, setHist] = useState<LBFHistorial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = createClient();
    sb.from("lbf_historial").select("*, profile:profiles(first_name,last_name)").eq("lbf_id", lbfId).order("created_at", { ascending: false }).limit(50).then(({ data }) => {
      setHist((data || []) as any);
      setLoading(false);
    });
  }, [lbfId]);

  return (
    <Card>
      <div style={{ fontSize: 12, fontWeight: 700, color: colors.nv, marginBottom: 10 }}>Historial de Cambios</div>
      {loading ? <Spinner size={20} /> : hist.length === 0 ? <div style={{ fontSize: 11, color: colors.g4 }}>Sin cambios</div> : (
        <div style={{ position: "relative", paddingLeft: 16 }}>
          <div style={{ position: "absolute", left: 5, top: 0, bottom: 0, width: 2, background: colors.g2 }} />
          {hist.map(h => (
            <div key={h.id} style={{ position: "relative", marginBottom: 12, paddingLeft: 12 }}>
              <div style={{ position: "absolute", left: -11, top: 4, width: 8, height: 8, borderRadius: "50%", background: colors.bl }} />
              <div style={{ fontSize: 11, fontWeight: 600, color: colors.nv }}>{h.accion}</div>
              {h.detalle && <div style={{ fontSize: 10, color: colors.g5 }}>{h.detalle}</div>}
              <div style={{ fontSize: 10, color: colors.g4 }}>{new Date(h.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} {h.profile ? `— ${(h.profile as any).first_name} ${(h.profile as any).last_name}` : ""}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
