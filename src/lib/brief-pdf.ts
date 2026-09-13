import { jsPDF } from "jspdf";
import type { CheckRecord } from "./types";

/** One generator for the preview, download and email attachment. */
export function briefPdf(check: CheckRecord): ArrayBuffer {
  const brief = check.payload.brief;
  if (!brief) throw new Error("Brief unavailable");
  const es = brief.locale === "es";
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const labels = es ? { supported: "Respaldado", contradicted: "Contradicho", insufficient: "Evidencia insuficiente" } : { supported: "Supported", contradicted: "Contradicted", insufficient: "Insufficient evidence" };
  const sources = [...(check.payload.firstLook?.sources || []), ...(check.payload.followUp?.sources || [])];
  const citedIds = new Set((brief.findings || []).flatMap(f => f.evidence.map(e => e.sourceId)));
  const references = sources.filter(s => citedIds.has(s.id || ""));
  const clean = (s: string) => s.replace(/[\u2010-\u2015]/g, "-").replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/[^\x20-\x7e\xa0-\xff\n]/g, " ");
  let y = 35;
  function chrome() {
    doc.setFillColor(22, 71, 53); doc.rect(0, 0, 210, 3, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(22, 71, 53); doc.text("SecondLook", 20, 17);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(100, 112, 104); doc.text(es ? "EXPEDIENTE DE EVIDENCIA" : "EVIDENCE BRIEF", 190, 17, { align: "right" });
    doc.setDrawColor(220, 227, 220); doc.line(20, 23, 190, 23);
  }
  function room(h: number) { if (y + h > 268) { doc.addPage(); chrome(); y = 35; } }
  function text(value: string, size = 10, bold = false, color = [43, 54, 47], indent = 0) {
    doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(size);
    const lines = doc.splitTextToSize(clean(value), 170 - indent) as string[];
    const height = size * 0.48;
    for (const line of lines) { room(height); doc.setTextColor(color[0], color[1], color[2]); doc.text(line, 20 + indent, y); y += height; }
    y += 3;
  }
  function heading(value: string) { room(22); y += 4; text(value, 12, true, [22, 71, 53]); }
  chrome();
  doc.setProperties({ title: "SecondLook - Evidence brief", subject: clean(check.claim), author: "SecondLook" });
  text(check.claim, 19, true);
  text(`${es ? "Registro" : "Record"}: ${check.id.slice(-8)}  |  ${check.updatedAt.slice(0, 10)}`, 8, false, [100, 112, 104]);
  heading(es ? "Resumen ejecutivo" : "Executive summary"); text(brief.summary, 11);
  for (const [index, finding] of (brief.findings || []).entries()) {
    heading(`${String(index + 1).padStart(2, "0")}  ${labels[finding.status]}`);
    text(finding.claim, 11, true); text(finding.explanation);
    for (const evidence of finding.evidence) {
      text(`"${evidence.excerpt}"`, 9, false, [67, 84, 72], 4);
      const source = sources.find(s => s.id === evidence.sourceId);
      if (source) text(`[${evidence.sourceId}] ${source.name}`, 8, true, [22, 71, 53], 4);
    }
    for (const missing of finding.missingEvidence) text(`${es ? "Falta" : "Missing"}: ${missing}`, 9);
  }
  if (!brief.findings?.length) for (const line of [...brief.facts, ...brief.hypotheses, ...brief.unknowns]) text(line);
  if (brief.whatChanged) { heading(es ? "Qué aportó la segunda búsqueda" : "What the second look added"); text(brief.whatChanged); }
  heading(es ? "Preguntas para el vendedor" : "Questions for the seller");
  (brief.questionsForSeller || []).forEach((q, i) => text(`${i + 1}. ${q}`));
  heading(es ? "Fuentes y trazabilidad" : "Sources and traceability");
  for (const source of references.length ? references : sources.slice(0, 12)) {
    room(18); text(`[${source.id || "Source"}] ${source.name}`, 9, true);
    if (/^https?:\/\//i.test(source.url)) {
      const startPage = doc.getNumberOfPages(); const startY = y - 3;
      text(source.url, 8, false, [22, 71, 53]);
      if (startPage === doc.getNumberOfPages()) doc.link(20, startY, 170, y - startY, { url: source.url });
    }
  }
  text(es ? "El registro completo de búsquedas permanece en tu espacio de trabajo." : "The complete search record remains available in your workspace.", 8, false, [100, 112, 104]);
  text(es ? "Los extractos coinciden con el texto recuperado; no garantizan la veracidad de la fuente. La falta de evidencia no demuestra falsedad." : "Excerpts match retrieved text; they do not guarantee source truthfulness. Missing evidence does not prove a claim false.", 8, false, [100, 112, 104]);
  for (let page = 1; page <= doc.getNumberOfPages(); page++) {
    doc.setPage(page); doc.setDrawColor(220, 227, 220); doc.line(20, 277, 190, 277); doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(100, 112, 104);
    doc.text("SecondLook | Burning Token 2026 | Test environment", 20, 284); doc.text(`${page} / ${doc.getNumberOfPages()}`, 190, 284, { align: "right" });
  }
  return doc.output("arraybuffer");
}
