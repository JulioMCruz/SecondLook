"use client";

import { useT } from "@/components/LocaleProvider";
import type { CheckRecord } from "@/lib/types";

export function processPhase(
  check: CheckRecord | null,
  running: string | null,
): 1 | 2 | 3 | 4 {
  if (check?.status === "unlocked" && check.payload.brief) return 4;
  if (check?.payload.firstLook && !running) return 3;
  if (running || check) return 2;
  return 1;
}

export default function ProcessGuide({
  check,
  running,
}: {
  check: CheckRecord | null;
  running: string | null;
}) {
  const { t } = useT();
  const phase = processPhase(check, running);
  const caption =
    phase === 1 ? t.uxNow1 : phase === 2 ? t.uxNow2run : phase === 3 ? t.uxNow3 : t.uxNowDone;

  return (
    <div className="mt-6">
      <ol className="grid grid-cols-3 gap-2">
        {t.uxSteps.map((step, i) => {
          const n = i + 1;
          const done = phase > n || phase === 4;
          const here = phase === n;
          return (
            <li
              key={step.n}
              className={`rounded-2xl border px-3 py-3 ${
                here
                  ? "border-[var(--green)] bg-white"
                  : done
                    ? "border-[var(--line)] bg-white"
                    : "border-dashed border-[var(--line)] bg-transparent"
              }`}
            >
              <p className="font-mono text-[10px] tracking-widest text-[var(--muted)]">
                {step.n}
                {done ? ` · ${t.uxDone}` : here ? ` · ${t.uxHere}` : ""}
              </p>
              <p className="mt-1 text-sm font-semibold">{step.t}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{step.d}</p>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]" aria-live="polite">
        {caption}
      </p>
    </div>
  );
}
