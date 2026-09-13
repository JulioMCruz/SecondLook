"use client";

import { useState } from "react";
import { ArrowUpRight, CheckCircle2, CircleHelp, Copy, FileCheck2, ShieldCheck, XCircle } from "lucide-react";
import { useT } from "./LocaleProvider";
import type { CheckRecord } from "@/lib/types";

export default function EvidenceReport({check}: {check: CheckRecord}) {
  const {locale} = useT();
  const es = locale === "es";
  const [copied, setCopied] = useState(false);
  const brief = check.payload.brief;
  if (!brief?.findings) return null;
  const sources = [...(check.payload.firstLook?.sources || []), ...(check.payload.followUp?.sources || [])];
  const byId = new Map(sources.map(s => [s.id, s]));
  const labels = {supported: es ? "Respaldado" : "Supported", contradicted: es ? "Contradicho" : "Contradicted", insufficient: es ? "Evidencia insuficiente" : "Insufficient evidence"};
  const icons = {supported: CheckCircle2, contradicted: XCircle, insufficient: CircleHelp};
  const counts = Object.keys(labels).map(status => ({status: status as keyof typeof labels, count: brief.findings!.filter(f => f.status === status).length}));
  async function copyQuestions() {
    try { await navigator.clipboard.writeText((brief?.questionsForSeller || []).map((q,i) => `${i + 1}. ${q}`).join("\n")); setCopied(true); } catch { setCopied(false); }
  }
  return <section className="space-y-6" aria-label={es ? "Expediente de evidencia" : "Evidence brief"}>
    <div className="rounded-2xl border border-[#b7cfc2] bg-white p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.16em] text-[var(--green)]"><FileCheck2 size={16}/>{es ? "Resumen ejecutivo" : "Executive brief"}</p><span className="text-xs text-[var(--muted)]">{new Date(check.updatedAt).toLocaleDateString(locale)}</span></div>
      <h2 className="mt-5 text-2xl font-semibold tracking-tight">{es ? "La evidencia, antes de decidir." : "The evidence before the decision."}</h2>
      <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--muted)]">{brief.summary}</p>
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">{counts.map(({status,count}) => <div key={status} className="rounded-xl bg-[#f6f8f6] px-4 py-3"><p className="text-2xl font-semibold tabular-nums">{count}</p><p className="mt-1 text-xs text-[var(--muted)]">{labels[status]}</p></div>)}</div>
    </div>
    <div className="space-y-4">{brief.findings.map((f,i) => {const Icon = icons[f.status]; return <article key={i} className="rounded-2xl border border-[var(--line)] bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-3"><p className="text-xs font-mono text-[var(--muted)]">{es ? "HALLAZGO" : "FINDING"} {String(i+1).padStart(2,"0")}</p><span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${f.status === "supported" ? "bg-emerald-50 text-emerald-800" : f.status === "contradicted" ? "bg-rose-50 text-rose-800" : "bg-amber-50 text-amber-900"}`}><Icon size={14}/>{labels[f.status]}</span></div>
      <h3 className="mt-3 text-lg font-semibold">{f.claim}</h3><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{f.explanation}</p>
      <div className="mt-4 space-y-3">{f.evidence.map((e,j) => {const source = byId.get(e.sourceId); if (!source) return null; return <div key={j} className="rounded-xl border border-[#e2e8e3] bg-[#f8faf8] p-4"><blockquote className="border-l-2 border-[var(--green)] pl-3 text-sm leading-6">“{e.excerpt}”</blockquote><a href={source.url} target="_blank" rel="noreferrer" className="mt-3 flex items-center gap-2 text-xs font-medium text-[var(--green)]"><span className="rounded border border-[#cddbd1] px-1.5 py-0.5 font-mono">{e.sourceId}</span>{source.name}<ArrowUpRight size={14}/></a><p className="mt-1 text-[11px] text-[var(--muted)]">{es ? "Extracto recuperado · verifica el contexto en la fuente" : "Retrieved excerpt · verify context at the source"}</p></div>;})}</div>
      {f.missingEvidence.length > 0 && <div className="mt-4 rounded-xl bg-amber-50/60 p-4"><p className="text-xs font-semibold text-amber-900">{es ? "Qué falta demostrar" : "What remains unproven"}</p><ul className="mt-2 list-disc space-y-1 pl-4 text-sm leading-6 text-amber-950">{f.missingEvidence.map((m,j)=><li key={j}>{m}</li>)}</ul></div>}
    </article>;})}</div>
    {brief.whatChanged && <div className="rounded-2xl border border-[var(--line)] bg-white p-6"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--green)]"><ShieldCheck size={16}/>{es ? "Qué aportó la segunda investigación" : "What the second look added"}</p><p className="mt-3 text-sm leading-7">{brief.whatChanged}</p></div>}
    {!!brief.questionsForSeller?.length && <div className="rounded-2xl bg-[#153d2d] p-6 text-white sm:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-semibold">{es ? "Tu próxima conversación, preparada." : "Your next conversation, prepared."}</h3><button onClick={copyQuestions} className="flex items-center gap-2 rounded-lg border border-white/30 px-3 py-2 text-xs"><Copy size={14}/>{copied ? (es ? "Copiado" : "Copied") : (es ? "Copiar preguntas" : "Copy questions")}</button></div><ol className="mt-5 space-y-4">{brief.questionsForSeller.map((q,i)=><li key={i} className="flex gap-3 text-sm leading-6"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs">{i+1}</span>{q}</li>)}</ol></div>}
    <details className="rounded-xl border border-[var(--line)] bg-white p-4 text-xs text-[var(--muted)]"><summary className="cursor-pointer font-medium">{es ? "Registro de investigación y métricas" : "Research record & metrics"}</summary><div className="mt-3 space-y-3"><p><b>Linkup · 1:</b> {check.payload.firstLook?.query}</p><p><b>Linkup · 2:</b> {check.payload.followUp?.query}</p><p>Nebius · {check.payload.metrics?.model} · {check.payload.metrics?.nebiousMs} ms · {check.payload.metrics?.totalTokens} tokens</p><p>{es ? "La coincidencia del extracto se valida contra el texto recuperado; no garantiza la veracidad de la fuente." : "Excerpt matching is validated against retrieved text; it does not guarantee the source is truthful."}</p></div></details>
  </section>;
}
