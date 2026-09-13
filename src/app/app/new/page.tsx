"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import CheckCanvas from "@/components/CheckCanvas";
import PaywallButton from "@/components/PaywallButton";
import VoiceListen from "@/components/VoiceListen";
import { useT } from "@/components/LocaleProvider";
import type { CheckRecord } from "@/lib/types";

function NewCheckInner() {
  const { t } = useT();
  const router = useRouter();
  const params = useSearchParams();
  const existingId = params.get("id");
  const [claim, setClaim] = useState<string>(t.sampleClaim);
  const [check, setCheck] = useState<CheckRecord | null>(null);
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [running, setRunning] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then(async (r) => {
      if (!r.ok) {
        router.push("/login");
        return;
      }
      const data = await r.json();
      setEmail(data.user.email);
      setUserId(data.user.id);
    });
  }, [router]);

  useEffect(() => {
    if (!existingId) return;
    fetch(`/api/checks/${existingId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.check) {
          setCheck(d.check);
          setClaim(d.check.claim);
        }
      });
  }, [existingId]);

  async function start(e: FormEvent) {
    e.preventDefault();
    setError("");
    setRunning("01");
    const created = await fetch("/api/checks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claim }),
    });
    const createdData = await created.json();
    if (!created.ok) {
      setRunning(null);
      setError(createdData.error || "Could not create check");
      return;
    }
    setCheck(createdData.check);
    setRunning("01");
    const res = await fetch(`/api/checks/${createdData.check.id}/first-look`, {
      method: "POST",
    });
    const data = await res.json();
    setRunning(null);
    if (!res.ok) {
      setError(data.error || "First look failed");
      return;
    }
    setCheck(data.check);
  }

  async function afterPurchase(result: {
    entitled: boolean;
    purchaseStatus: "success" | "fail" | "cancel";
  }) {
    if (!check) return;
    setError("");
    if (!result.entitled) {
      const res = await fetch(`/api/checks/${check.id}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });
      const data = await res.json();
      if (data.check) setCheck(data.check);
      setError(
        result.purchaseStatus === "cancel"
          ? "Purchase cancelled. Follow-up stays locked."
          : "Purchase failed. Follow-up stays locked.",
      );
      return;
    }
    setRunning("03");
    const res = await fetch(`/api/checks/${check.id}/unlock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    });
    const data = await res.json();
    setRunning(null);
    if (!res.ok) {
      setError(data.error || "Unlock failed");
      return;
    }
    setCheck(data.check);
    router.push(`/app/${data.check.id}`);
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/app" className="text-sm text-[var(--muted)]">
          {t.backReceipts}
        </Link>
        <p className="text-xs text-[var(--muted)]">{email}</p>
      </div>

      <h1 className="sl-serif text-3xl font-medium tracking-tight">{t.newTitle}</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">{t.newBody}</p>

      <VoiceListen
        value={claim}
        onTranscript={setClaim}
        disabled={Boolean(running) || Boolean(check?.payload.firstLook)}
      />

      <form onSubmit={start} className="mt-6 space-y-3">
        <label className="block text-xs text-[var(--muted)]">
          {t.orType}
          <textarea
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--green)]"
          />
        </label>
        <button
          disabled={Boolean(running) || check?.status === "first_look"}
          className="rounded-full bg-[var(--green)] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {running ? t.lookingUp : check?.payload.firstLook ? t.firstSaved : t.runFirst}
        </button>
      </form>

      <div className="mt-6">
        <CheckCanvas check={check} running={running} />
      </div>

      {check?.payload.firstLook ? (
        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[var(--line)] bg-white p-4">
            <p className="text-xs uppercase tracking-wider text-[var(--muted)]">First look sources</p>
            <ul className="mt-3 space-y-2 text-sm">
              {check.payload.firstLook.sources.slice(0, 5).map((s) => (
                <li key={s.url}>
                  <a href={s.url} className="underline" target="_blank" rel="noreferrer">
                    {s.name}
                  </a>
                  <p className="text-xs text-[var(--muted)]">{s.snippet.slice(0, 140)}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            {check.payload.gap ? (
              <div className="rounded-2xl border border-dashed border-[var(--slot)] p-4">
                <p className="text-xs uppercase tracking-wider text-[var(--muted)]">Gap (teaser)</p>
                <p className="mt-2 text-sm font-medium">{check.payload.gap.label}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{check.payload.gap.reason}</p>
              </div>
            ) : null}
            {userId ? (
              <PaywallButton appUserId={userId} email={email} onResult={afterPurchase} />
            ) : null}
          </div>
        </section>
      ) : null}

      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
    </main>
  );
}

export default function NewCheckPage() {
  return (
    <Suspense>
      <NewCheckInner />
    </Suspense>
  );
}
