"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { CheckRecord } from "@/lib/types";
import { LangSwitch, useT } from "@/components/LocaleProvider";

export default function AppHome() {
  const { t } = useT();
  const router = useRouter();
  const [checks, setChecks] = useState<CheckRecord[] | null>(null);
  const [email, setEmail] = useState("");
  const [keys, setKeys] = useState({ linkup: false, nebius: false, revenuecat: false });

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (r) => {
        if (!r.ok) {
          router.push("/login");
          return;
        }
        const data = await r.json();
        setEmail(data.user.email);
        setKeys(data.keys);
      })
      .catch(() => router.push("/login"));
    fetch("/api/checks")
      .then((r) => r.json())
      .then((d) => setChecks(d.checks || []))
      .catch(() => setChecks([]));
  }, [router]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">SecondLook</p>
          <p className="text-xs text-[var(--muted)]">{email}</p>
        </div>
        <div className="flex items-center gap-3">
          <LangSwitch />
          <Link
            href="/app/new"
            className="rounded-full bg-[var(--green)] px-4 py-2 text-sm font-medium text-white"
          >
            {t.speakClaim}
          </Link>
          <button onClick={logout} className="text-sm text-[var(--muted)]">
            {t.signOut}
          </button>
        </div>
      </header>

      {!keys.linkup || !keys.nebius || !keys.revenuecat ? (
        <p className="mt-6 rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--muted)]">
          {t.keysMissing}
          {!keys.linkup ? " Linkup" : ""}
          {!keys.nebius ? " Nebius" : ""}
          {!keys.revenuecat ? " RevenueCat Test Store" : ""}.
          First look and unlock need the matching env vars.
        </p>
      ) : null}

      <h1 className="mt-10 text-2xl font-semibold tracking-tight">{t.receipts}</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">{t.receiptsBody}</p>

      <ul className="mt-6 space-y-3">
        {checks === null ? <li className="text-sm text-[var(--muted)]">{t.loading}</li> : null}
        {checks?.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-[var(--line)] px-5 py-10 text-sm text-[var(--muted)]">
            {t.noChecks}
          </li>
        ) : null}
        {checks?.map((c) => (
          <li key={c.id}>
            <Link
              href={c.status === "unlocked" ? `/app/${c.id}` : `/app/new?id=${c.id}`}
              className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--line)] bg-white px-5 py-4"
            >
              <div>
                <p className="font-medium">{c.claim}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {new Date(c.createdAt).toLocaleString()} · {c.status.replace("_", " ")}
                </p>
              </div>
              <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs">
                {c.payload.brief?.verdict || (c.status === "first_look" ? "First look" : "Open")}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
