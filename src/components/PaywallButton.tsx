"use client";

import { Purchases, type Package } from "@revenuecat/purchases-js";
import { useCallback, useEffect, useState } from "react";
import { useT } from "@/components/LocaleProvider";

const ENTITLEMENT = "second_look";

type Props = {
  appUserId: string;
  email: string;
  onResult: (result: {
    entitled: boolean;
    purchaseStatus: "success" | "fail" | "cancel";
  }) => void;
};

let configuredFor: string | null = null;

function ensureConfigured(appUserId: string) {
  const key = process.env.NEXT_PUBLIC_REVENUECAT_TEST_STORE_API_KEY;
  if (!key) throw new Error("RevenueCat Test Store key missing");
  if (configuredFor === appUserId && Purchases.isConfigured()) {
    return Purchases.getSharedInstance();
  }
  const purchases = Purchases.configure({ apiKey: key, appUserId });
  configuredFor = appUserId;
  return purchases;
}

export default function PaywallButton({ appUserId, email, onResult }: Props) {
  const { t, locale } = useT();
  const es = locale === "es";
  const [offer, setOffer] = useState<Package | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(false);
  const ready = Boolean(process.env.NEXT_PUBLIC_REVENUECAT_TEST_STORE_API_KEY);

  const load = useCallback(async () => {
    if (!ready) { setLoading(false); return; }
    setLoading(true); setError("");
    try {
      const purchases = ensureConfigured(appUserId);
      setActive(await purchases.isEntitledTo(ENTITLEMENT));
      const offerings = await purchases.getOfferings();
      const pkg = offerings.current?.availablePackages[0] ?? null;
      setOffer(pkg);
      if (!pkg) setError(es ? "La oferta de prueba no está disponible. Reintenta en unos momentos." : "The test offer is unavailable. Please retry shortly.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load offer");
    } finally { setLoading(false); }
  }, [appUserId, ready, es]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function buy() {
    setBusy(true);
    setError("");
    try {
      const purchases = ensureConfigured(appUserId);
      if (active) { onResult({entitled:true,purchaseStatus:"success"}); return; }
      if (!offer) throw new Error("No Test Store package");
      await purchases.purchase({ rcPackage: offer, customerEmail: email });
      const entitled = await purchases.isEntitledTo(ENTITLEMENT);
      onResult({ entitled, purchaseStatus: entitled ? "success" : "fail" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "purchase failed";
      const cancelled = /cancel/i.test(message);
      onResult({ entitled: false, purchaseStatus: cancelled ? "cancel" : "fail" });
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  async function failPurchase() {
    onResult({ entitled: false, purchaseStatus: "fail" });
  }

  if (!ready) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-white p-4 text-sm">
        <span className="mr-2 rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold">TEST</span>
        {t.payNoKey}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--line)] bg-white p-4">
      <div className="flex items-center gap-2">
        <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold">TEST</span>
        <p className="text-sm font-medium">{t.payTitle}</p>
      </div>
      <p className="mt-2 text-sm text-[var(--muted)]">{t.payBody}</p>
      {offer ? (
        <p className="mt-2 text-xs text-[var(--muted)]">
          {t.payOffer}: {offer.webBillingProduct.title} · {offer.webBillingProduct.currentPrice.formattedPrice}
        </p>
      ) : (
        <p className="mt-2 text-xs text-[var(--muted)]">{loading ? t.payLoading : (es ? "Oferta no disponible" : "Offer unavailable")}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={buy}
          disabled={busy || (!offer && !active)}
          className="rounded-full bg-[var(--green)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {busy ? t.payBusy : active ? (es ? "Continuar con mi acceso" : "Continue with my access") : t.payBuy}
        </button>
        <button
          onClick={failPurchase}
          className="rounded-full border border-[var(--line)] px-4 py-2 text-sm"
        >
          {t.payFailSim}
        </button>
      </div>
      {error ? <div role="alert" className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-900"><p>{error}</p><button onClick={load} disabled={loading} className="mt-2 font-semibold underline">{es ? "Reintentar" : "Retry"}</button></div> : null}
    </div>
  );
}
