import assert from "node:assert/strict";
import { test } from "node:test";

const BASE = process.env.BASE_URL || "https://secondlook.juliomcruz.workers.dev";
const CLAIM =
  process.env.TEST_CLAIM ||
  "All my competitors already answer WhatsApp with AI in Miami.";

const cookies = new Map();

function cookieHeader() {
  return [...cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

function storeCookies(res) {
  const raw = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  for (const entry of raw) {
    const pair = entry.split(";")[0];
    const eq = pair.indexOf("=");
    if (eq > 0) cookies.set(pair.slice(0, eq), pair.slice(eq + 1));
  }
}

async function api(path, opts = {}) {
  const headers = {
    ...(opts.body ? { "content-type": "application/json" } : {}),
    ...(opts.headers || {}),
  };
  const jar = cookieHeader();
  if (jar) headers.cookie = jar;
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers,
  });
  storeCookies(res);
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 300) };
  }
  return { res, json };
}

test("health: all sponsor keys live", async () => {
  const { res, json } = await api("/api/health");
  assert.equal(res.status, 200);
  assert.equal(json.product, "SecondLook");
  assert.equal(json.keys.linkup, true, "LINKUP_API_KEY");
  assert.equal(json.keys.nebius, true, "NEBIUS_API_KEY");
  assert.equal(json.keys.revenuecat, true, "NEXT_PUBLIC_REVENUECAT_TEST_STORE_API_KEY");
  assert.equal(json.keys.resend, true, "RESEND_API_KEY");
});

test("landing is up", async () => {
  const res = await fetch(BASE, { redirect: "follow" });
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.match(html, /SecondLook/);
});

test("checks require a session", async () => {
  const { res, json } = await api("/api/checks");
  assert.equal(res.status, 401);
  assert.equal(json.error, "unauthorized");
});

test("demo login sets a session", async () => {
  const { res, json } = await api("/api/auth/demo", { method: "POST" });
  assert.equal(res.status, 200);
  assert.equal(json.ok, true);
  assert.ok(json.user?.id);
  assert.equal(json.user.email, "judge@secondlook.app");
  assert.ok(cookies.has("sl_session"), "sl_session cookie");
});

test("me returns demo user", async () => {
  const { res, json } = await api("/api/auth/me");
  assert.equal(res.status, 200);
  assert.equal(json.user.email, "judge@secondlook.app");
  assert.equal(json.keys.revenuecat, true);
});

test("short claim is rejected", async () => {
  const { res } = await api("/api/checks", {
    method: "POST",
    body: JSON.stringify({ claim: "hi" }),
  });
  assert.equal(res.status, 400);
});

let checkId = "";

test("create a check", async () => {
  const { res, json } = await api("/api/checks", {
    method: "POST",
    body: JSON.stringify({ claim: CLAIM }),
  });
  assert.equal(res.status, 200, json.error);
  assert.equal(json.check.status, "draft");
  assert.equal(json.check.claim, CLAIM);
  checkId = json.check.id;
  assert.match(checkId, /^chk_/);
});

test("list includes the new check", async () => {
  const { res, json } = await api("/api/checks");
  assert.equal(res.status, 200);
  assert.ok(json.checks.some((c) => c.id === checkId));
});

test("first look calls Linkup and stores a gap", { timeout: 180_000 }, async () => {
  const { res, json } = await api(`/api/checks/${checkId}/first-look`, {
    method: "POST",
  });
  assert.equal(res.status, 200, json.error);
  assert.equal(json.check.status, "first_look");
  assert.ok(json.check.payload.firstLook?.sources?.length >= 1, "Linkup sources");
  assert.ok(json.check.payload.gap?.followUpQuery, "gap follow-up query");
});

test("unlock without entitlement is 402", async () => {
  const { res, json } = await api(`/api/checks/${checkId}/unlock`, {
    method: "POST",
    body: JSON.stringify({ entitled: false }),
  });
  assert.equal(res.status, 402);
  assert.match(json.error, /second_look/);
});

test("failed purchase stays locked", async () => {
  const { res, json } = await api(`/api/checks/${checkId}/unlock`, {
    method: "POST",
    body: JSON.stringify({ entitled: false, purchaseStatus: "fail" }),
  });
  assert.equal(res.status, 200, json.error);
  assert.equal(json.locked, true);
  assert.equal(json.check.payload.lastPurchaseStatus, "fail");
  assert.equal(json.check.payload.entitlementActive, false);
  assert.equal(json.check.status, "first_look");
});

test("unlock with entitlement runs follow-up + Nebius brief", { timeout: 180_000 }, async () => {
  const { res, json } = await api(`/api/checks/${checkId}/unlock`, {
    method: "POST",
    body: JSON.stringify({ entitled: true, purchaseStatus: "success" }),
  });
  assert.equal(res.status, 200, json.error);
  assert.equal(json.check.status, "unlocked");
  assert.equal(json.check.payload.entitlementActive, true);
  assert.ok(json.check.payload.followUp?.sources, "second Linkup pass");
  assert.ok(json.check.payload.brief?.verdict, "Nebius brief");
  assert.ok(["Fact", "Hypothesis", "Unknown"].includes(json.check.payload.brief.verdict));
  assert.ok(json.check.payload.metrics?.model, "Nebius metrics");
});
