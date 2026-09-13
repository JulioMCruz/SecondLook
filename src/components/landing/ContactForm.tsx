"use client";

import { FormEvent, useState } from "react";
import { useT } from "@/components/LocaleProvider";

export default function ContactForm() {
  const { t } = useT();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<"full" | "saved" | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message, website }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      notified?: boolean;
      autoresponder?: boolean;
    };
    setBusy(false);
    if (!res.ok && !data.ok) {
      setError(data.error || t.contactFail);
      return;
    }
    setDone(data.autoresponder ? "full" : "saved");
    setName("");
    setEmail("");
    setMessage("");
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-white px-5 py-6">
        <p className="sl-serif text-2xl font-medium">{t.contactGotIt}</p>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          {done === "full" ? t.contactFull : t.contactSaved}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          {t.contactName}
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-3 outline-none focus:border-[var(--green)]"
            autoComplete="name"
          />
        </label>
        <label className="block text-sm">
          {t.contactEmail}
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-3 outline-none focus:border-[var(--green)]"
            autoComplete="email"
          />
        </label>
      </div>
      <label className="hidden">
        Website
        <input value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" />
      </label>
      <label className="block text-sm">
        {t.contactNote}
        <textarea
          required
          minLength={8}
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-3 outline-none focus:border-[var(--green)]"
          placeholder={t.contactPlaceholder}
        />
      </label>
      <button
        disabled={busy}
        className="sl-cta-glow min-h-11 rounded-full bg-[var(--green)] px-6 py-3 text-sm font-medium text-white disabled:opacity-60"
      >
        {busy ? t.contactSending : t.contactSend}
      </button>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <p className="text-xs text-[var(--muted)]">{t.contactFoot}</p>
    </form>
  );
}
