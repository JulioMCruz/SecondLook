"use client";

import Link from "next/link";
import { useT } from "@/components/LocaleProvider";
import type { CheckRecord } from "@/lib/types";

export default function BriefWrite({ check }: { check: CheckRecord }) {
  const { t } = useT();
  const brief = check.payload.brief;
  const stamp =
    brief?.verdict === "Fact" ? t.fact : brief?.verdict === "Hypothesis" ? t.hypothesis : t.unknown;
  const typed = brief?.summary || "";
  const done = Boolean(brief);

  if (!brief) return null;

  return (
    <section className="mt-6 rounded-2xl border border-[var(--green)] bg-white p-5">
      <p className="text-xs uppercase tracking-widest text-[var(--green)]">{t.nebiusWrites}</p>
      <p className="sl-serif mt-3 text-3xl font-medium tracking-tight text-[var(--green)] sl-stamp">
        {stamp}
      </p>
      <p className="mt-4 min-h-[4.5rem] text-base leading-7">
        {typed}
        {!done ? <span className="sl-caret">|</span> : null}
      </p>
      {check.payload.metrics ? (
        <p className="mt-3 font-mono text-[10px] tracking-wide text-[var(--muted)]">
          Nebius {check.payload.metrics.model} · {check.payload.metrics.nebiousMs} ms ·{" "}
          {check.payload.metrics.totalTokens} tokens
        </p>
      ) : null}
      {done ? (
        <Link
          href={`/app/${check.id}`}
          className="mt-5 inline-block rounded-full bg-[var(--green)] px-5 py-2.5 text-sm font-medium text-white"
        >
          {t.openReport}
        </Link>
      ) : null}
    </section>
  );
}
