"use client";

import { useEffect, useState } from "react";
import type { Gap, SourceHit } from "@/lib/types";
import { useT } from "@/components/LocaleProvider";

function reduceMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function SourceStage({
  sources,
  gap,
  searching,
}: {
  sources: SourceHit[];
  gap?: Gap;
  searching?: boolean;
}) {
  const { t } = useT();
  const list = sources.slice(0, 8);
  const [n, setN] = useState(0);

  useEffect(() => {
    if (searching) {
      setN(0);
      return;
    }
    if (!list.length) return;
    if (reduceMotion()) {
      setN(list.length);
      return;
    }
    setN(0);
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setN(i);
      if (i >= list.length) window.clearInterval(id);
    }, 200);
    return () => window.clearInterval(id);
  }, [searching, list.map((s) => s.url).join("|")]);

  const shown = list.slice(0, n);
  const stampOn = !searching && n >= list.length && Boolean(gap);

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white p-4">
      <p className="text-xs uppercase tracking-wider text-[var(--muted)]">
        {searching ? t.searchingLive : t.sourcesLanding}
      </p>
      {searching ? (
        <p className="sl-serif mt-4 text-lg text-[var(--ink)]">{t.searchingLive}</p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm">
          {shown.map((s) => (
            <li key={s.url} className="sl-source-in">
              <a href={s.url} className="underline" target="_blank" rel="noreferrer">
                {s.name}
              </a>
              <p className="text-xs text-[var(--muted)]">{s.snippet.slice(0, 140)}</p>
            </li>
          ))}
        </ul>
      )}
      {stampOn && gap ? (
        <div className="sl-stamp mt-4 rounded-2xl border-2 border-[var(--green)] px-4 py-3">
          <p className="text-xs uppercase tracking-widest text-[var(--green)]">{t.stampGap}</p>
          <p className="mt-1 text-sm font-semibold">{gap.label}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">{gap.reason}</p>
        </div>
      ) : null}
    </div>
  );
}
