"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useT } from "@/components/LocaleProvider";
import type { CheckRecord } from "@/lib/types";

function reduceMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function useType(text: string, active: boolean, ms = 16) {
  const [out, setOut] = useState("");
  useEffect(() => {
    if (!active) return;
    if (reduceMotion()) {
      setOut(text);
      return;
    }
    setOut("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setOut(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, ms);
    return () => window.clearInterval(id);
  }, [text, active, ms]);
  return out;
}

export default function BriefWrite({ check }: { check: CheckRecord }) {
  const { t } = useT();
  const brief = check.payload.brief;
  const [showBody, setShowBody] = useState(false);
  const stamp =
    brief?.verdict === "Fact" ? t.fact : brief?.verdict === "Hypothesis" ? t.hypothesis : t.unknown;
  const typed = useType(brief?.summary || "", showBody, 14);
  const done = Boolean(brief) && showBody && typed.length >= (brief?.summary.length || 0);

  useEffect(() => {
    if (!brief) return;
    if (reduceMotion()) {
      setShowBody(true);
      return;
    }
    const id = window.setTimeout(() => setShowBody(true), 700);
    return () => window.clearTimeout(id);
  }, [brief]);

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
