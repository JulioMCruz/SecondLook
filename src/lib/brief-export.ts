import type { CheckRecord } from "./types";

export function briefText(check: CheckRecord) {
  const brief=check.payload.brief;
  if(!brief)return "";
  const es=brief.locale==="es";
  const labels=es?{supported:"Respaldado",contradicted:"Contradicho",insufficient:"Evidencia insuficiente"}:{supported:"Supported",contradicted:"Contradicted",insufficient:"Insufficient evidence"};
  const sources=[...(check.payload.firstLook?.sources || []),...(check.payload.followUp?.sources || [])];
  return [`# SecondLook — ${es?"Expediente de evidencia":"Evidence brief"}`,check.claim,brief.summary,
    ...(brief.findings || []).map(f=>[`## ${labels[f.status]}: ${f.claim}`,f.explanation,...f.evidence.map(e=>`> ${e.excerpt}\n\n${e.sourceId}: ${sources.find(s=>s.id===e.sourceId)?.url || ""}`),...f.missingEvidence.map(m=>`- ${m}`)].join("\n\n")),
    `## ${es?"Qué aportó la segunda búsqueda":"What the second look added"}`,brief.whatChanged || "",
    `## ${es?"Preguntas para la próxima conversación":"Questions for your next conversation"}`,...(brief.questionsForSeller || []).map((q,i)=>`${i+1}. ${q}`),
    `## ${es?"Registro":"Record"}`,`ID: ${check.id} · ${check.updatedAt}`,"RevenueCat Test Store — no real charge.",
    es?"Extractos contrastados con el texto recuperado. La coincidencia no garantiza la veracidad de la fuente.":"Excerpts matched to retrieved text. Matching does not guarantee source truthfulness.",
  ].filter(Boolean).join("\n\n");
}
