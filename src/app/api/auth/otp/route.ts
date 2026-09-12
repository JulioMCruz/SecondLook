import { NextResponse } from "next/server";
import { createHash, randomInt, randomUUID } from "node:crypto";
import { deleteOtp, getOtp, saveOtp, upsertUser } from "@/lib/db";
import { setSessionCookie } from "@/lib/session";

function hashCode(email: string, code: string) {
  return createHash("sha256").update(`${email.toLowerCase()}:${code}`).digest("hex");
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { email?: string };
  const email = (body.email || "").trim().toLowerCase();
  if (!email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }
  const code = String(randomInt(100000, 1000000));
  saveOtp(email, hashCode(email, code), Date.now() + 10 * 60 * 1000);
  const dev = process.env.NODE_ENV !== "production";
  return NextResponse.json({
    ok: true,
    ...(dev ? { devCode: code } : {}),
  });
}

export async function PUT(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { email?: string; code?: string };
  const email = (body.email || "").trim().toLowerCase();
  const code = (body.code || "").trim();
  const row = getOtp(email);
  if (!row || row.expiresAt < Date.now() || row.codeHash !== hashCode(email, code)) {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
  }
  deleteOtp(email);
  const user = upsertUser(`usr_${randomUUID()}`, email);
  await setSessionCookie(user.id);
  return NextResponse.json({ ok: true, user });
}
