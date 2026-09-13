"use client";

import BriefPreview from "@/components/BriefPreview";
import { briefText } from "@/lib/brief-export";
import EvidenceReport from "@/components/EvidenceReport";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useT } from "@/components/LocaleProvider";
import type { CheckRecord } from "@/lib/types";

export default function BriefPage() {
  const { t, locale } = useT();
  const es = locale === "es";
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [check, setCheck] = useState<CheckRecord | null>(null);
  const [demoSession,setDemoSession] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [emailFlash, setEmailFlash] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then(async r => {
      if (!r.ok) {router.push("/login");return;}
      const d=await r.json();setDemoSession(d.user?.email?.endsWith("@secondlook.app") || false);
    }).catch(()=>setLoadError("Connection failed. Reload to retry."));
    fetch(`/api/checks/${params.id}`)
      .then(async r => {const d=await r.json();if(!r.ok)throw Error(d.error||"Could not load assessment");return d;})
      .then((d) => setCheck(d.check || null)).catch(e=>setLoadError(e.message));
  }, [params.id, router]);

  if (loadError) return <main className="mx-auto max-w-3xl p-8"><p role="alert">{loadError}</p><Link href="/app" className="mt-4 inline-block underline">{t.backReceipts}</Link></main>;

  if (!check) {
    return <main className="px-6 py-10 text-sm text-[var(--muted)]">{t.loading}</main>;
  }

  const brief = check.payload.brief;
  const locked = !brief || check.payload.entitlementActive === false;

  async function copy() {
    if (!check || !brief || locked) return;
    try { await navigator.clipboard.writeText(briefText(check)); setCopied(true); } catch { setEmailFlash(es?"No se pudo copiar. Puedes descargar el informe.":"Copy failed. You can download the brief."); }
    setTimeout(() => setCopied(false), 1500);
  }

  async function emailAgain() {
    if (!check) return;
    setEmailing(true);
    setEmailFlash("");
    try {
      const res = await fetch(`/api/checks/${check.id}/email`, { method: "POST" });
      const data = await res.json();
      if (data.check) setCheck(data.check);
      if (!res.ok || !data.emailed?.sent) throw Error(data.error || data.emailed?.error || t.emailFail);
      setEmailFlash(t.emailedJustNow);
    } catch(e) {setEmailFlash(e instanceof Error?e.message:t.emailFail);} finally {setEmailing(false);}
  }

  function download() {
    if(!check || locked)return;
    const url=URL.createObjectURL(new Blob([briefText(check)],{type:"text/markdown;charset=utf-8"}));
    const link=document.createElement("a");link.href=url;link.download=`secondlook-${check.id.slice(-8)}.md`;link.click();URL.revokeObjectURL(url);
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/app" className="text-sm text-[var(--muted)]">
          {t.backReceipts}
        </Link>
        <div className="flex flex-wrap gap-2">
          <button disabled={locked} onClick={download} className="rounded-full border border-[var(--line)] px-4 py-2 text-sm disabled:opacity-50">{es?"Descargar informe":"Download brief"}</button>
          <button
            disabled={locked}
            onClick={copy}
            className="rounded-full border border-[var(--line)] px-4 py-2 text-sm"
          >
            {copied ? t.copied : t.copy}
          </button>
          {!locked && <BriefPreview check={check} demo={demoSession}/>}
        </div>
      </div>

      <p className="text-xs uppercase tracking-wider text-[var(--muted)]">{t.savedBrief}</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{check.claim}</h1>

      {!locked && brief?.findings ? <div className="mt-6"><EvidenceReport check={check}/></div> : null}
      {locked ? (
        <p className="mt-6 rounded-xl border border-[var(--line)] bg-white p-4 text-sm">
          {t.briefHidden} <Link href={`/app/new?id=${check.id}`} className="ml-2 underline">{es?"Revisar acceso":"Review access"}</Link>
        </p>
      ) : (
        <article className="mt-6 space-y-5 rounded-2xl border border-[var(--line)] bg-white p-6">
          {!brief.findings && <><p className="text-sm font-semibold uppercase tracking-wider text-[var(--green)]">
            {brief.verdict === "Fact"
              ? t.fact
              : brief.verdict === "Hypothesis"
                ? t.hypothesis
                : t.unknown}
          </p>
          <p className="leading-7">{brief.summary}</p>
          {brief.facts.length ? (
            <section>
              <h2 className="text-xs uppercase tracking-wider text-[var(--muted)]">{t.facts}</h2>
              <ul className="mt-2 list-disc pl-5 text-sm leading-6">
                {brief.facts.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </section>
          ) : null}
          {brief.hypotheses.length ? (
            <section>
              <h2 className="text-xs uppercase tracking-wider text-[var(--muted)]">{t.hypotheses}</h2>
              <ul className="mt-2 list-disc pl-5 text-sm leading-6">
                {brief.hypotheses.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </section>
          ) : null}
          {brief.unknowns.length ? (
            <section>
              <h2 className="text-xs uppercase tracking-wider text-[var(--muted)]">{t.unknowns}</h2>
              <ul className="mt-2 list-disc pl-5 text-sm leading-6">
                {brief.unknowns.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </section>
          ) : null}
          {brief.where.length ? (
            <section>
              <h2 className="text-xs uppercase tracking-wider text-[var(--muted)]">{t.whereLabel}</h2>
              <ul className="mt-2 list-disc pl-5 text-sm leading-6">
                {brief.where.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </section>
          ) : null}
          {brief.struggle ? (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm">
              {t.struggle}: {brief.struggleNote || t.struggleFallback}
            </p>
          ) : null}

          </>}
          {demoSession ? <div className="no-print rounded-xl bg-[#f2f6f1] p-4 text-sm">{es?"Sesión de demostración: descarga una copia del informe antes de salir.":"Demo session: download a copy of the brief before signing out."}</div> : <div className="no-print rounded-xl border border-[var(--line)] bg-[var(--paper,#f7f4ee)] px-4 py-3 text-sm">
            {check.payload.reportEmailedAt ? (
              <p>
                {t.emailed} {check.payload.reportEmailedTo}
                {check.payload.reportEmailCopiedToNotify ? ` · ${t.emailCopyNotify}` : ""}
              </p>
            ) : check.payload.reportEmailError ? (
              <p className="text-[var(--muted)]">{t.emailFail}</p>
            ) : (
              <p className="text-[var(--muted)]">{t.emailNotYet}</p>
            )}
            {check.payload.reportEmailError && !check.payload.reportEmailedAt ? (
              <p className="mt-1 text-xs text-red-700">{check.payload.reportEmailError}</p>
            ) : null}
            {emailFlash && <p role="status" className="mt-2 text-sm">{emailFlash}</p>}
            <button
              onClick={emailAgain}
              disabled={emailing}
              className="mt-3 rounded-full border border-[var(--line)] bg-white px-4 py-1.5 text-sm disabled:opacity-60"
            >
              {emailing ? t.emailing : t.emailMe}
            </button>
          </div>}
        </article>
      )}

      <section className="mt-8 space-y-3 text-sm">
        <h2 className="text-xs uppercase tracking-wider text-[var(--muted)]">{t.sourcesHeading}</h2>
        <p className="text-xs text-[var(--muted)]">{t.searchFree}</p>
        <ul className="space-y-1">
          {check.payload.firstLook?.sources.map((s) => (
            <li key={s.url}>
              <a className="underline" href={s.url} target="_blank" rel="noreferrer">
                {s.name}
              </a>
            </li>
          ))}
        </ul>
        {check.payload.followUp ? (
          <>
            <p className="pt-3 text-xs text-[var(--muted)]">{t.searchPaid}</p>
            <ul className="space-y-1">
              {check.payload.followUp.sources.map((s) => (
                <li key={s.url}>
                  <a className="underline" href={s.url} target="_blank" rel="noreferrer">
                    {s.name}
                  </a>
                </li>
              ))}
            </ul>
          </>
        ) : null}
        {check.payload.metrics ? (
          <p className="pt-4 text-xs text-[var(--muted)]">
            Nebius {check.payload.metrics.model} · {check.payload.metrics.nebiousMs} ms ·{" "}
            {check.payload.metrics.totalTokens} tokens · ~$
            {check.payload.metrics.estimatedUsd.toFixed(4)}
            <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 font-semibold">TEST</span>
          </p>
        ) : null}
      </section>
    </main>
  );
}
