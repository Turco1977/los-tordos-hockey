import type { Jugadora, LBF, LBFJugadora, Partido } from "@/lib/supabase/types";
import { fullName } from "@/lib/mappers";
import { CONVOCATORIA_TIPOS } from "@/lib/constants";

/* ── CSV Export ── */
export function jugadorasToCSV(jugadoras: Jugadora[]): string {
  const headers = ["Apellido","Nombre","DNI","Fecha Nac.","División","Rama","Posición","Socia","Derecho","Cert. Médico","Estado"];
  const rows = jugadoras.map(j => [
    j.apellido, j.nombre, j.dni, j.fecha_nacimiento,
    j.division_efectiva || j.division_manual || "",
    j.rama, j.posicion || "",
    j.socia ? "Sí" : "No", j.derecho_jugadora ? "Sí" : "No",
    j.cert_medico_estado, j.activa ? "Activa" : "Inactiva",
  ]);
  return [headers, ...rows].map(r => r.map(c => `"${(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Simple PDF (print-based) ── */
export function printLBF(lbf: LBF, jugadoras: (LBFJugadora & { jugadora?: Jugadora })[]) {
  const titulares = jugadoras.filter(j => j.titular).sort((a, b) => a.orden - b.orden);
  const suplentes = jugadoras.filter(j => !j.titular).sort((a, b) => a.orden - b.orden);

  const html = `<!DOCTYPE html><html><head><title>LBF - ${lbf.nombre}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 40px; color: #0A1628; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  h2 { font-size: 14px; color: #5A6577; margin-top: 24px; }
  .meta { font-size: 12px; color: #5A6577; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
  th { text-align: left; padding: 6px 8px; background: #F7F8FA; border-bottom: 2px solid #E8ECF1; font-weight: 700; }
  td { padding: 6px 8px; border-bottom: 1px solid #E8ECF1; }
  .footer { margin-top: 40px; font-size: 10px; color: #8B95A5; border-top: 1px solid #E8ECF1; padding-top: 12px; }
  @media print { body { padding: 20px; } }
</style></head><body>
<h1>Lista de Buena Fe: ${lbf.nombre}</h1>
<div class="meta">
  ${lbf.division} - Rama ${lbf.rama}<br/>
  Temporada ${lbf.ano}${lbf.entrenadora ? ` | Entrenador/a: ${lbf.entrenadora}` : ""}
</div>
<h2>Titulares (${titulares.length})</h2>
<table><thead><tr><th>#</th><th>Camiseta</th><th>Jugadora</th><th>DNI</th><th>Posición</th></tr></thead><tbody>
${titulares.map((j, i) => `<tr><td>${i + 1}</td><td>${j.numero_camiseta || "-"}</td><td>${j.jugadora ? fullName(j.jugadora) : "-"}</td><td>${j.jugadora?.dni || "-"}</td><td>${j.posicion || "-"}</td></tr>`).join("")}
</tbody></table>
<h2>Suplentes (${suplentes.length})</h2>
<table><thead><tr><th>#</th><th>Camiseta</th><th>Jugadora</th><th>DNI</th><th>Posición</th></tr></thead><tbody>
${suplentes.map((j, i) => `<tr><td>${i + 1}</td><td>${j.numero_camiseta || "-"}</td><td>${j.jugadora ? fullName(j.jugadora) : "-"}</td><td>${j.jugadora?.dni || "-"}</td><td>${j.posicion || "-"}</td></tr>`).join("")}
</tbody></table>
<div class="footer">Los Tordos Hockey - Generado el ${new Date().toLocaleDateString("es-AR")}</div>
</body></html>`;

  const w = window.open("", "_blank");
  if (w) {
    w.document.write(html);
    w.document.close();
    w.print();
  }
}

/* ── Share LBF via WhatsApp ── */
export function shareLBFWhatsApp(lbf: LBF, jugadoras: (LBFJugadora & { jugadora?: Jugadora })[]) {
  const titulares = jugadoras.filter(j => j.titular).sort((a, b) => a.orden - b.orden);
  const suplentes = jugadoras.filter(j => !j.titular).sort((a, b) => a.orden - b.orden);

  let text = `🏑 *Lista de Buena Fe*\n`;
  text += `*${lbf.nombre}*\n`;
  text += `${lbf.division} - Rama ${lbf.rama}\n`;
  text += `📅 Temporada ${lbf.ano}\n`;
  if (lbf.entrenadora) text += `📋 Entrenador/a: ${lbf.entrenadora}\n`;
  text += `\n*Titulares (${titulares.length}):*\n`;
  titulares.forEach((j, i) => {
    text += `${i + 1}. ${j.jugadora ? fullName(j.jugadora) : "-"}${j.numero_camiseta ? ` (#${j.numero_camiseta})` : ""}\n`;
  });
  if (suplentes.length > 0) {
    text += `\n*Suplentes (${suplentes.length}):*\n`;
    suplentes.forEach((j, i) => {
      text += `${i + 1}. ${j.jugadora ? fullName(j.jugadora) : "-"}${j.numero_camiseta ? ` (#${j.numero_camiseta})` : ""}\n`;
    });
  }
  text += `\n_Los Tordos Hockey - ${new Date().toLocaleDateString("es-AR")}_`;

  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
}

/* ── Share Convocatoria via WhatsApp ── */
export function shareConvocatoriaWhatsApp(partido: Partido, convocadas: Jugadora[]) {
  const tipo = CONVOCATORIA_TIPOS.find(c => c.k === partido.competencia);
  const tipoLabel = tipo ? `${tipo.i} ${tipo.l}` : partido.competencia;
  const fmtD = (d: string) => { const p = d.slice(0, 10).split("-"); return p[2] + "/" + p[1] + "/" + p[0]; };

  let text = `📣 *Convocatoria*\n`;
  text += `*${tipoLabel}*\n`;
  if (partido.rival) text += `vs ${partido.rival}\n`;
  text += `📅 ${fmtD(partido.fecha)}\n`;
  text += `${partido.division} - Rama ${partido.rama}\n`;
  text += `${partido.sede === "local" ? "🏠 Local" : "✈️ Visitante"}\n`;
  if (partido.notas) text += `\n📝 ${partido.notas}\n`;
  text += `\n*Convocadas (${convocadas.length}):*\n`;
  convocadas.forEach((j, i) => {
    text += `${i + 1}. ${fullName(j)}${j.posicion ? ` (${j.posicion})` : ""}\n`;
  });
  text += `\n_Los Tordos Hockey - ${new Date().toLocaleDateString("es-AR")}_`;

  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
}
