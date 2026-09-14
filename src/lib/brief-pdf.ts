import { jsPDF } from "jspdf";
import type { CheckRecord } from "./types";

/** One editorial document for the preview, download and email attachment. */
export function briefPdf(check: CheckRecord): ArrayBuffer {
  const brief = check.payload.brief;
  if (!brief) throw new Error("Brief unavailable");
  const es = brief.locale === "es";
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const labels = es
    ? { supported: "Respaldado", contradicted: "Contradicho", insufficient: "Evidencia insuficiente" }
    : { supported: "Supported", contradicted: "Contradicted", insufficient: "Insufficient evidence" };
  const sources = [...(check.payload.firstLook?.sources || []), ...(check.payload.followUp?.sources || [])];
  const findings = brief.findings || [];
  const clean = (s: string) => s.replace(/[\u2010-\u2015]/g, "-").replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/[^\x20-\x7e\xa0-\xff\n]/g, " ");
  const left = 22, width = 166, bottom = 267;
  let y = 39;
  let sectionTitle = "";
  let sectionNumber = "";
  const muted = [91, 98, 94], ink = [30, 36, 32];

  function header() {
    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...ink as [number, number, number]);
    doc.text("SecondLook", left, 18);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...muted as [number, number, number]);
    doc.text(es ? "INFORME DE EVIDENCIA" : "EVIDENCE BRIEF", 188, 18, { align: "right" });
    doc.setDrawColor(205, 209, 206); doc.line(left, 25, 188, 25);
  }
  function newPage(continued = false) {
    doc.addPage(); header(); y = 39;
    if (continued) {
      doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...ink as [number, number, number]);
      doc.text(`${sectionNumber}  ${sectionTitle} (${es ? "continuación" : "continued"})`, left, y);
      y += 10;
    }
  }
  function room(h: number) { if (y + h > bottom) newPage(true); }
  function text(value: string, size = 10.5, bold = false, color = ink, indent = 0, link?: string) {
    doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(size);
    const lines = doc.splitTextToSize(clean(value), width - indent) as string[];
    const lineHeight = size * 0.49;
    for (const line of lines) {
      room(lineHeight);
      // A page header changes the font; restore it for every continued line.
      doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(size); doc.setTextColor(...color as [number, number, number]);
      doc.text(line, left + indent, y);
      if (link) doc.link(left + indent, y - lineHeight * .8, Math.min(width - indent, doc.getTextWidth(line)), lineHeight, { url: link });
      y += lineHeight;
    }
    y += 3;
  }
  function heading(value: string) { room(22); y += 3; text(value, 11, true); }
  function section(number: string, title: string, lead: string) {
    sectionNumber = number; sectionTitle = title;
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...muted as [number, number, number]);
    doc.text(`${number} / ${es ? "INFORME" : "REPORT"}`, left, y); y += 11;
    doc.setFont("times", "bold"); doc.setFontSize(25); doc.setTextColor(...ink as [number, number, number]);
    doc.text(title, left, y); y += 10;
    text(lead, 10, false, muted); y += 5;
  }
  function divider() { room(7); doc.setDrawColor(219, 222, 219); doc.line(left, y, 188, y); y += 7; }

  doc.setProperties({ title: "SecondLook - Evidence brief", subject: clean(check.claim), author: "SecondLook" });
  header();
  section("01", es ? "Resumen ejecutivo" : "Executive Summary", es ? "La afirmación, el resultado y los límites de la evidencia." : "The claim, the finding and the limits of the evidence.");
  text(`${es ? "Registro" : "Record"} ${check.id.slice(-8)}  |  ${check.updatedAt.slice(0, 10)}`, 8, false, muted);
  heading(es ? "Afirmación evaluada" : "Claim under review");
  text(check.claim, 14, true);
  heading(es ? "Resumen de la evaluación" : "Assessment summary");
  text(brief.summary, 11);
  if (findings.length) {
    heading(es ? "Resultados" : "Findings at a glance");
    for (const [index, finding] of findings.entries()) {
      room(20); divider();
      text(`${String(index + 1).padStart(2, "0")}  ${labels[finding.status]}`, 10, true);
      text(finding.claim, 10, false, muted);
    }
  } else {
    for (const line of [...brief.facts, ...brief.hypotheses, ...brief.unknowns]) text(line);
  }
  if (brief.whatChanged) { heading(es ? "Qué aportó la segunda búsqueda" : "What the second look added"); text(brief.whatChanged); }
  heading(es ? "Cómo interpretar el resultado" : "Reading the result");
  text(es ? "La falta de evidencia no demuestra falsedad. Una afirmación respaldada tampoco determina si una compra es adecuada para tu negocio." : "Missing evidence does not prove a claim false. A supported claim does not determine whether a purchase is right for your business.", 9, false, muted);

  newPage();
  section("02", es ? "Evidencia y fuentes" : "Evidence & Sources", es ? "Pasajes citados y su relación con cada hallazgo." : "Quoted passages and their relationship to each finding.");
  for (const [index, finding] of findings.entries()) {
    heading(`${String(index + 1).padStart(2, "0")}  ${labels[finding.status]}`);
    text(finding.claim, 11, true); text(finding.explanation);
    for (const evidence of finding.evidence) {
      const source = sources.find(s => s.id === evidence.sourceId);
      room(27); divider();
      const relation = es ? { supports: "Respalda", contradicts: "Contradice", context: "Contexto" } : { supports: "Supports", contradicts: "Contradicts", context: "Context" };
      text(`[${evidence.sourceId}] ${relation[evidence.relation]}`, 9, true);
      text(`"${evidence.excerpt}"`, 10, false, ink, 3);
      if (source) {
        text(source.name, 8.5, true, muted, 3);
        if (/^https?:\/\//i.test(source.url)) text(source.url, 8, false, muted, 3, source.url);
      }
    }
  }
  if (!findings.length) {
    for (const source of sources.slice(0, 12)) {
      heading(`[${source.id || "Source"}] ${source.name}`);
      if (/^https?:\/\//i.test(source.url)) text(source.url, 9, false, muted, 0, source.url);
    }
  }
  heading(es ? "Alcance de las citas" : "Citation scope");
  text(es ? "Los extractos coinciden con el texto recuperado; no garantizan la veracidad de la fuente. Se conservan en el idioma original. El registro completo de búsquedas permanece en tu espacio de trabajo." : "Excerpts match retrieved text; they do not guarantee source truthfulness. Quotes remain in their original language. The complete search record remains available in your workspace.", 9, false, muted);

  newPage();
  section("03", es ? "Preguntas para el proveedor" : "Questions for the Vendor", es ? "Lleva estas preguntas a tu próxima conversación." : "Bring these questions to your next vendor conversation.");
  const questions = brief.questionsForSeller || [];
  for (const [index, question] of questions.entries()) {
    room(28); text(`${String(index + 1).padStart(2, "0")}`, 10, true, muted);
    text(question, 12); divider();
  }
  if (!questions.length) text(es ? "Este expediente no incluye preguntas sugeridas." : "No suggested questions are included in this record.");
  const missing = [...new Set(findings.flatMap(f => f.missingEvidence))];
  if (missing.length) {
    heading(es ? "Evidencia que falta" : "Evidence still needed");
    missing.forEach((item, index) => text(`${index + 1}. ${item}`, 10));
  }
  heading(es ? "Conserva el contexto" : "Keep the context");
  text(es ? "Comparte las preguntas junto con la afirmación y sus fuentes. El informe registra la evidencia disponible en esta evaluación; no sustituye la decisión del comprador." : "Share the questions together with the claim and its sources. This brief records the evidence available for this assessment; it does not replace the buyer's decision.", 10, false, muted);
  for (let page = 1; page <= doc.getNumberOfPages(); page++) {
    doc.setPage(page); doc.setDrawColor(205, 209, 206); doc.line(left, 277, 188, 277);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...muted as [number, number, number]);
    doc.text(`SecondLook | ${check.id.slice(-8)} | ${es ? "Entorno de prueba" : "Test environment"}`, left, 284);
    doc.text(`${page} / ${doc.getNumberOfPages()}`, 188, 284, { align: "right" });
  }
  return doc.output("arraybuffer");
}
