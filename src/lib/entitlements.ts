import type { CheckRecord } from "./types";

export async function hasSecondLook(userId: string): Promise<boolean> {
  // Use the same project's public SDK key: never an unrelated project's secret.
  const key = process.env.NEXT_PUBLIC_REVENUECAT_TEST_STORE_API_KEY;
  if (!key) return false;
  const response = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, {
    headers: { Authorization: `Bearer ${key}` }, cache: "no-store", signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("Could not verify purchase. Please retry.");
  const data = await response.json() as {subscriber?: {entitlements?: Record<string, {expires_date?: string | null}>}};
  const entitlement = data.subscriber?.entitlements?.second_look;
  if (!entitlement) return false;
  return entitlement.expires_date === null || (typeof entitlement.expires_date === "string" && Date.parse(entitlement.expires_date) > Date.now());
}

export function publicCheck(check: CheckRecord, active: boolean): CheckRecord {
  const result = structuredClone(check);
  if (!active) {
    delete result.payload.brief;
    delete result.payload.followUp;
    delete result.payload.metrics;
    result.payload.entitlementActive = false;
    if (result.status === "unlocked") result.status = "expired";
  } else result.payload.entitlementActive = true;
  return result;
}

export async function visibleCheck(check: CheckRecord): Promise<CheckRecord> {
  if (!check.payload.brief && !check.payload.followUp) return check;
  const active = await hasSecondLook(check.userId).catch(() => false);
  return publicCheck(check, active);
}
