"use client";

import { Purchases, type Package } from "@revenuecat/purchases-js";
import { useCallback, useEffect, useState } from "react";

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
  const [offer, setOffer] = useState<Package | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const ready = Boolean(process.env.NEXT_PUBLIC_REVENUECAT_TEST_STORE_API_KEY);

  const load = useCallback(async () => {
    if (!ready) return;
    try {
      const purchases = ensureConfigured(appUserId);
      const offerings = await purchases.getOfferings();
      const pkg = offerings.current?.availablePackages[0] ?? null;
      setOffer(pkg);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load offer");
    }
  }, [appUserId, ready]);

  useEffect(() => {
    load();
  }, [load]);

  async function buy() {
    setBusy(true);
    setError("");
    try {
      const purchases = ensureConfigured(appUserId);
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
        RevenueCat Test Store key is not set. Cannot run a real test purchase.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--line)] bg-white p-4">
      <div className="flex items-center gap-2">
        <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold">TEST</span>
        <p className="text-sm font-medium">Unlock the second look</p>
      </div>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Test Store purchase. Follow-up search + brief stay locked until entitlement{" "}
        <code>second_look</code> is active.
      </p>
      {offer ? (
        <p className="mt-2 text-xs text-[var(--muted)]">
          Offer: {offer.webBillingProduct.title} · {offer.webBillingProduct.currentPrice.formattedPrice}
        </p>
      ) : (
        <p className="mt-2 text-xs text-[var(--muted)]">Loading Test Store offer…</p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={buy}
          disabled={busy || !offer}
          className="rounded-full bg-[var(--green)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {busy ? "Opening Test Store…" : "Test purchase"}
        </button>
        <button
          onClick={failPurchase}
          className="rounded-full border border-[var(--line)] px-4 py-2 text-sm"
        >
          Simulate fail
        </button>
      </div>
      {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
