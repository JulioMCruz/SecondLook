"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

function LoginForm() {
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
      setError(data.error || "Could not send code");
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
      setError(data.error || "Invalid code");
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
      setError("Demo login failed");
      return;
    }
    router.push("/app");
  }

  if (params.get("demo") === "1" && !busy && stage === "email") {
    // fall through; user still clicks
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-6 py-16">
      <p className="text-sm font-semibold">SecondLook</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">Email and a 6-digit code. No password. No wallet.</p>

      {stage === "email" ? (
        <form onSubmit={requestCode} className="mt-8 space-y-4">
          <input
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
            {busy ? "Sending…" : "Send code"}
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="mt-8 space-y-4">
          <input
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
              Dev code (email not configured): <span className="font-mono">{devCode}</span>
            </p>
          ) : (
            <p className="text-xs text-[var(--muted)]">Check your email for the 6-digit code.</p>
          )}
          <button
            disabled={busy}
            className="w-full rounded-full bg-[var(--green)] py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            {busy ? "Checking…" : "Continue"}
          </button>
        </form>
      )}

      <button
        onClick={demo}
        disabled={busy}
        className="mt-4 w-full rounded-full border border-[var(--line)] py-3 text-sm font-medium"
      >
        Try with demo
      </button>
      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
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
