"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useT } from "@/components/LocaleProvider";
import type { CheckRecord } from "@/lib/types";

export default function BriefPage() {
  const { t } = useT();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [check, setCheck] = useState<CheckRecord | null>(null);
  const [copied, setCopied] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [emailFlash, setEmailFlash] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then((r) => {
      if (!r.ok) router.push("/login");
    });
    fetch(`/api/checks/${params.id}`)
      .then((r) => r.json())
      .then((d) => setCheck(d.check || null));
  }, [params.id, router]);

  if (!check) {
    return <main className="px-6 py-10 text-sm text-[var(--muted)]">{t.loading}</main>;
  }

  const brief = check.payload.brief;
  const locked = !brief || check.payload.entitlementActive === false;

  async function copy() {
    if (!check || !brief) return;
    await navigator.clipboard.writeText(
      `${check.claim}\n\n${brief.verdict}\n${brief.summary}\n`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function emailAgain() {
    if (!check) return;
    setEmailing(true);
    setEmailFlash("");
    const res = await fetch(`/api/checks/${check.id}/email`, { method: "POST" });
    const data = await res.json();
    setEmailing(false);
    if (data.check) setCheck(data.check);
    if (data.emailed?.sent || data.emailed?.copiedToNotify) {
      setEmailFlash(t.emailedJustNow);
      setTimeout(() => setEmailFlash(""), 2000);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8">
      <div className="no-print mb-6 flex items-center justify-between">
        <Link href="/app" className="text-sm text-[var(--muted)]">
          {t.backReceipts}
        </Link>
        <div className="flex gap-2">
          <button
            onClick={copy}
            className="rounded-full border border-[var(--line)] px-4 py-2 text-sm"
          >
            {copied ? t.copied : t.copy}
          </button>
          <button
            onClick={() => window.print()}
            className="rounded-full bg-[var(--green)] px-4 py-2 text-sm font-medium text-white"
          >
            {t.pdf}
          </button>
        </div>
      </div>

      <p className="text-xs uppercase tracking-wider text-[var(--muted)]">{t.savedBrief}</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{check.claim}</h1>

      {locked ? (
        <p className="mt-6 rounded-xl border border-[var(--line)] bg-white p-4 text-sm">
          {t.briefHidden}
        </p>
      ) : (
        <article className="mt-6 space-y-5 rounded-2xl border border-[var(--line)] bg-white p-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-[var(--green)]">
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

          <div className="no-print rounded-xl border border-[var(--line)] bg-[var(--paper,#f7f4ee)] px-4 py-3 text-sm">
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
            <button
              onClick={emailAgain}
              disabled={emailing}
              className="mt-3 rounded-full border border-[var(--line)] bg-white px-4 py-1.5 text-sm disabled:opacity-60"
            >
              {emailing ? t.emailing : emailFlash || t.emailMe}
            </button>
          </div>
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
