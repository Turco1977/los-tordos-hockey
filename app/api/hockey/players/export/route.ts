import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const sb = createAdminClient();
  const url = new URL(req.url);
  const division = url.searchParams.get("division");
  const rama = url.searchParams.get("rama");

  let query = sb.from("jugadoras").select("*").eq("activa", true).order("apellido");
  if (division) query = query.eq("division_efectiva", division);
  if (rama) query = query.eq("rama", rama);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Build CSV
  const headers = ["Apellido","Nombre","DNI","Fecha Nac.","División","Rama","Posición","Socia","Derecho","Cert. Médico"];
  const rows = (data || []).map((j: any) => [
    j.apellido, j.nombre, j.dni, j.fecha_nacimiento,
    j.division_efectiva || j.division_manual || "",
    j.rama, j.posicion || "",
    j.socia ? "Sí" : "No", j.derecho_jugadora ? "Sí" : "No",
    j.cert_medico_estado,
  ]);
  const csv = [headers, ...rows].map(r => r.map((c: string) => `"${(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");

  return new NextResponse("\uFEFF" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="padron-hockey-${new Date().toISOString().slice(0,10)}.csv"`,
    },
  });
}
