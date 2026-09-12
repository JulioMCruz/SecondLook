import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { insertCheck, listChecks } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ checks: await listChecks(user.id) });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { claim?: string };
  const claim = (body.claim || "").trim();
  if (claim.length < 8) {
    return NextResponse.json({ error: "Paste a claim first" }, { status: 400 });
  }
  const now = new Date().toISOString();
  const record = {
    id: `chk_${randomUUID()}`,
    userId: user.id,
    claim,
    status: "draft" as const,
    payload: { claim },
    createdAt: now,
    updatedAt: now,
  };
  await insertCheck(record);
  return NextResponse.json({ check: record });
}
