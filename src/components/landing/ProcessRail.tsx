"use client";

import { useReducedMotion } from "motion/react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useT } from "@/components/LocaleProvider";

type Phase = "idle" | "running" | "done" | "locked";

function phasesForTick(tick: number): Phase[] {
  if (tick <= 0) return ["idle", "idle", "idle", "locked"];
  if (tick === 1) return ["running", "idle", "idle", "locked"];
  if (tick === 2) return ["done", "running", "idle", "locked"];
  if (tick === 3) return ["done", "done", "running", "locked"];
  if (tick === 4) return ["done", "done", "done", "locked"];
  if (tick === 5) return ["done", "done", "done", "running"];
  return ["done", "done", "done", "done"];
}

export default function ProcessRail() {
  const { t } = useT();
  const reduce = useReducedMotion();
  const [tick, setTick] = useState(6);
  const STEPS = t.railSteps;

  useEffect(() => {
    if (reduce) {
      setTick(6);
      return;
    }
    setTick(0);
    const delays = [700, 1600, 2600, 4000, 5200, 6400];
    const timers = delays.map((ms, i) => window.setTimeout(() => setTick(i + 1), ms));
    return () => timers.forEach(clearTimeout);
  }, [reduce]);

  const phases = phasesForTick(tick);
  const caption = t.railCaptions[Math.min(tick, t.railCaptions.length - 1)] ?? t.railCaptions[0];
  const unlocked = phases.filter((p) => p === "done" || p === "running").length;
  const progress = Math.max(0, (unlocked - 1) / (STEPS.length - 1));

  return (
    <section className="px-6 py-8 md:py-12">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm leading-6 text-[var(--muted)]" aria-live="polite">
          {caption}
        </p>
        <div className="relative mt-8">
          <div className="absolute top-[1.35rem] right-8 left-8 hidden h-px bg-[var(--line)] md:block" aria-hidden />
          <motion.div
            className="absolute top-[1.35rem] left-8 hidden h-px origin-left bg-[var(--green)] md:block"
            aria-hidden
            animate={{ scaleX: reduce ? 1 : progress }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            style={{ width: "calc(100% - 4rem)" }}
          />
          <ol className="grid gap-3 md:grid-cols-4">
            {STEPS.map((step, i) => {
              const phase = phases[i];
              const active = phase === "running";
              return (
                <motion.li
                  key={step.title}
                  layout
                  animate={{
                    y: reduce ? 0 : active ? -6 : 0,
                    scale: reduce ? 1 : active ? 1.03 : 1,
                  }}
                  transition={{ type: "spring", stiffness: 320, damping: 28 }}
                  className={`relative rounded-2xl p-4 ${
                    phase === "running"
                      ? "glow-active bg-white"
                      : phase === "done"
                        ? "glow-done bg-white"
                        : phase === "locked"
                          ? "slot-dashed"
                          : "border border-[var(--line)] bg-white"
                  }`}
                >
                  <p className="font-mono text-[10px] tracking-widest text-[var(--muted)]">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-2 text-sm font-semibold">{step.title}</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                    {phase === "done" ? step.done : step.idle}
                  </p>
                  <p className="mt-3 text-[10px] uppercase tracking-wider text-[var(--muted)]">
                    {step.free ? t.free : phase === "locked" ? t.locked : t.paid}
                  </p>
                </motion.li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
