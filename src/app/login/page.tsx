"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { LangSwitch, useT } from "@/components/LocaleProvider";

function LoginForm() {
  const { t } = useT();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [devCode, setDevCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function requestCode(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || t.sendCodeFail);
      return;
    }
    if (data.devCode) setDevCode(data.devCode);
    setStage("code");
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/otp", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || t.invalidCode);
      return;
    }
    router.push("/app");
  }

  async function demo() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/demo", { method: "POST" });
    setBusy(false);
    if (!res.ok) {
      setError(t.demoFail);
      return;
    }
    router.push("/app");
  }

  useEffect(() => {
    if (params.get("demo") === "1") {
      const timer = window.setTimeout(() => void demo(), 0);
      return () => window.clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-6 py-16">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <img src="/logo.png" alt="" className="h-7 w-7 rounded object-cover object-[center_38%]" />
          SecondLook
        </p>
        <LangSwitch />
      </div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{t.loginTitle}</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">{t.loginBody}</p>

      {stage === "email" ? (
        <form onSubmit={requestCode} className="mt-8 space-y-4">
          <input
            aria-label="Email"
            autoComplete="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@business.com"
            className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 outline-none focus:border-[var(--green)]"
          />
          <button
            disabled={busy}
            className="w-full rounded-full bg-[var(--green)] py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            {busy ? t.sending : t.sendCode}
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="mt-8 space-y-4">
          <input
            aria-label={t.checkEmail}
            autoComplete="one-time-code"
            required
            minLength={6}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 tracking-[0.4em] outline-none focus:border-[var(--green)]"
          />
          {devCode ? (
            <p className="text-xs text-[var(--muted)]">
              {t.devCode} <span className="font-mono">{devCode}</span>
            </p>
          ) : (
            <p className="text-xs text-[var(--muted)]">{t.checkEmail}</p>
          )}
          <button
            disabled={busy}
            className="w-full rounded-full bg-[var(--green)] py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            {busy ? t.checking : t.continue}
          </button>
        </form>
      )}

      <button
        onClick={demo}
        disabled={busy}
        className="mt-4 w-full rounded-full border border-[var(--line)] py-3 text-sm font-medium"
      >
        {t.tryDemo}
      </button>
      {error ? <p role="alert" className="mt-4 text-sm text-red-700">{error}</p> : null}
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
