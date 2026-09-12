"use client";

import { useEffect, useState } from "react";

const STEPS = [
  { id: 1, title: "Look up", free: true, idle: "Live web search", done: "Sources on file" },
  { id: 2, title: "Save findings", free: true, idle: "Stored on your account", done: "First look kept" },
  { id: 3, title: "Find the gap", free: false, idle: "Locked until second look", done: "The hole to chase" },
  { id: 4, title: "Follow-up", free: false, idle: "Second search", done: "Counter-evidence" },
  { id: 5, title: "Brief", free: false, idle: "Fact / Hypothesis / Unknown", done: "Receipt you keep" },
] as const;

type Phase = "idle" | "running" | "done" | "locked";

function reducedMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function phasesForTick(tick: number): { phases: Phase[]; caption: string } {
  if (tick <= 0) {
    return {
      phases: ["idle", "idle", "locked", "locked", "locked"],
      caption: "Paste a market claim.",
    };
  }
  if (tick === 1) {
    return {
      phases: ["running", "idle", "locked", "locked", "locked"],
      caption: "First look searches the live web. Free.",
    };
  }
  if (tick === 2) {
    return {
      phases: ["done", "running", "locked", "locked", "locked"],
      caption: "Findings stay on your account.",
    };
  }
  if (tick === 3) {
    return {
      phases: ["done", "done", "locked", "locked", "locked"],
      caption: "The gap is visible. Follow-up stays locked.",
    };
  }
  if (tick === 4) {
    return {
      phases: ["done", "done", "running", "locked", "locked"],
      caption: "Pay unlocks the second look. Test Store in this build.",
    };
  }
  if (tick === 5) {
    return {
      phases: ["done", "done", "done", "running", "locked"],
      caption: "Follow-up hunts the hole the first pass missed.",
    };
  }
  return {
    phases: ["done", "done", "done", "done", "done"],
    caption: "You keep a Fact / Hypothesis / Unknown receipt.",
  };
}

export default function ProcessWalkthrough() {
  const [tick, setTick] = useState(6);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (reducedMotion()) {
      setTick(6);
      setReady(true);
      return;
    }
    setTick(0);
    setReady(true);
    const delays = [800, 1800, 2800, 4000, 5200, 6400];
    const timers = delays.map((ms, i) => window.setTimeout(() => setTick(i + 1), ms));
    return () => timers.forEach(clearTimeout);
  }, []);

  const { phases, caption } = phasesForTick(tick);

  return (
    <section className="sl-reveal relative mt-16" data-sl-reveal>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
        How SecondLook works
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight">Watch one claim go through the canvas.</h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]" aria-live="polite">
        {ready ? caption : "Paste a market claim."}
      </p>

      <ol className="mt-6 grid gap-3 sm:grid-cols-5">
        {STEPS.map((step, i) => {
          const phase = phases[i];
          return (
            <li
              key={step.id}
              className={`sl-step rounded-2xl p-3 ${
                phase === "running"
                  ? "glow-active bg-white"
                  : phase === "done"
                    ? "glow-done bg-white"
                    : phase === "locked"
                      ? "slot-dashed"
                      : "border border-[var(--line)] bg-white"
              }`}
            >
              <p className="font-mono text-[10px] tracking-widest text-[var(--muted)]">#{String(step.id).padStart(2, "0")}</p>
              <p className="mt-1 text-sm font-semibold">{step.title}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                {phase === "done" ? step.done : step.idle}
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--line)]">
                <div
                  className={`sl-bar h-full bg-[var(--green)] ${phase === "running" ? "sl-bar-run" : ""}`}
                  style={{
                    width: phase === "done" ? "100%" : phase === "running" ? "55%" : "0%",
                  }}
                />
              </div>
              <p className="mt-2 text-[10px] uppercase tracking-wider text-[var(--muted)]">
                {step.free ? "Free" : phase === "locked" ? "Locked" : "Paid"}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
