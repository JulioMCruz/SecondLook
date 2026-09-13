import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { detectLocale, langCookieName } from "@/lib/i18n";
import { randomUUID } from "node:crypto";
import { hasSecondLook, publicCheck } from "@/lib/entitlements";
import { insertCheck, listChecks } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const checks = await listChecks(user.id);
  const active = checks.some(c => c.payload.brief) ? await hasSecondLook(user.id).catch(() => false) : false;
  return NextResponse.json({ checks: checks.map(c => publicCheck(c, active)) });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { claim?: string };
  const claim = typeof body.claim === "string" ? body.claim.trim().slice(0, 2000) : "";
  if (claim.length < 8) {
    return NextResponse.json({ error: "Paste a claim first" }, { status: 400 });
  }
  const now = new Date().toISOString();
  const record = {
    id: `chk_${randomUUID()}`,
    userId: user.id,
    claim,
    status: "draft" as const,
    payload: { claim, locale: detectLocale((await cookies()).get(langCookieName())?.value, req.headers.get("accept-language")) },
    createdAt: now,
    updatedAt: now,
  };
  await insertCheck(record);
  return NextResponse.json({ check: record });
}
