"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { CheckRecord } from "@/lib/types";

export default function BriefPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [check, setCheck] = useState<CheckRecord | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => {
      if (!r.ok) router.push("/login");
    });
    fetch(`/api/checks/${params.id}`)
      .then((r) => r.json())
      .then((d) => setCheck(d.check || null));
  }, [params.id, router]);

  if (!check) {
    return <main className="px-6 py-10 text-sm text-[var(--muted)]">Loading…</main>;
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

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8">
      <div className="no-print mb-6 flex items-center justify-between">
        <Link href="/app" className="text-sm text-[var(--muted)]">
          ← Receipts
        </Link>
        <div className="flex gap-2">
          <button
            onClick={copy}
            className="rounded-full border border-[var(--line)] px-4 py-2 text-sm"
          >
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            onClick={() => window.print()}
            className="rounded-full bg-[var(--green)] px-4 py-2 text-sm font-medium text-white"
          >
            Download PDF
          </button>
        </div>
      </div>

      <p className="text-xs uppercase tracking-wider text-[var(--muted)]">Saved brief</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{check.claim}</h1>

      {locked ? (
        <p className="mt-6 rounded-xl border border-[var(--line)] bg-white p-4 text-sm">
          Full brief is hidden. First look remains. Entitlement expired or purchase did not complete.
        </p>
      ) : (
        <article className="mt-6 space-y-5 rounded-2xl border border-[var(--line)] bg-white p-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-[var(--green)]">
            {brief.verdict}
          </p>
          <p className="leading-7">{brief.summary}</p>
          {brief.facts.length ? (
            <section>
              <h2 className="text-xs uppercase tracking-wider text-[var(--muted)]">Facts</h2>
              <ul className="mt-2 list-disc pl-5 text-sm leading-6">
                {brief.facts.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </section>
          ) : null}
          {brief.hypotheses.length ? (
            <section>
              <h2 className="text-xs uppercase tracking-wider text-[var(--muted)]">Hypotheses</h2>
              <ul className="mt-2 list-disc pl-5 text-sm leading-6">
                {brief.hypotheses.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </section>
          ) : null}
          {brief.unknowns.length ? (
            <section>
              <h2 className="text-xs uppercase tracking-wider text-[var(--muted)]">Unknowns</h2>
              <ul className="mt-2 list-disc pl-5 text-sm leading-6">
                {brief.unknowns.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </section>
          ) : null}
          {brief.where.length ? (
            <section>
              <h2 className="text-xs uppercase tracking-wider text-[var(--muted)]">Where</h2>
              <ul className="mt-2 list-disc pl-5 text-sm leading-6">
                {brief.where.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </section>
          ) : null}
          {brief.struggle ? (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm">
              Struggle case: {brief.struggleNote || "The product could not close this claim."}
            </p>
          ) : null}
        </article>
      )}

      <section className="mt-8 space-y-3 text-sm">
        <h2 className="text-xs uppercase tracking-wider text-[var(--muted)]">Sources</h2>
        <p className="text-xs text-[var(--muted)]">Search 1 (Linkup)</p>
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
            <p className="pt-3 text-xs text-[var(--muted)]">Search 2 follow-up (Linkup)</p>
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
