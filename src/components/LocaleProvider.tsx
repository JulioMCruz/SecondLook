"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { langCookieName, messages, type Locale, type Messages } from "@/lib/i18n";

type Ctx = {
  locale: Locale;
  t: Messages;
  setLocale: (next: Locale) => void;
};

const LocaleContext = createContext<Ctx | null>(null);

function writeCookie(locale: Locale) {
  document.cookie = `${langCookieName()}=${locale};path=/;max-age=31536000;samesite=lax`;
}

export default function LocaleProvider({
  initial,
  children,
}: {
  initial: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initial);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<Ctx>(
    () => ({
      locale,
      t: messages[locale] as Messages,
      setLocale: (next) => {
        setLocaleState(next);
        writeCookie(next);
      },
    }),
    [locale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useT() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useT outside LocaleProvider");
  return ctx;
}

export function LangSwitch() {
  const { locale, setLocale } = useT();
  return (
    <div className="flex items-center gap-1 text-xs font-medium tracking-wide">
      <button
        type="button"
        onClick={() => setLocale("es")}
        className={locale === "es" ? "text-[var(--ink)]" : "text-[var(--muted)]"}
      >
        ES
      </button>
      <span className="text-[var(--line)]">/</span>
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={locale === "en" ? "text-[var(--ink)]" : "text-[var(--muted)]"}
      >
        EN
      </button>
    </div>
  );
}
