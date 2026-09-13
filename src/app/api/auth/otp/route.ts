import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { detectLocale, langCookieName } from "@/lib/i18n";
import { createHash, randomInt, randomUUID } from "node:crypto";
import { consumeRateLimit, deleteOtp, getOtp, saveOtp, upsertUser } from "@/lib/db";
import { sendLoginCode } from "@/lib/email";
import { setSessionCookie } from "@/lib/session";

function hashCode(email: string, code: string) {
  return createHash("sha256").update(`${email.toLowerCase()}:${code}`).digest("hex");
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { email?: string };
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }
  if (!(await consumeRateLimit(`otp-send:${email}`, 3, 10 * 60 * 1000))) return NextResponse.json({error:"Too many requests. Please try again in 10 minutes."}, {status:429});
  const code = String(randomInt(100000, 1000000));
  await saveOtp(email, hashCode(email, code), Date.now() + 10 * 60 * 1000);
  let sent = false;
  try {
    const result = await sendLoginCode(email, code, detectLocale((await cookies()).get(langCookieName())?.value, req.headers.get("accept-language")));
    sent = result.sent;
  } catch (err) {
    const message = err instanceof Error ? err.message : "email failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
  const showDev = !sent && process.env.NODE_ENV !== "production";
  return NextResponse.json({
    ok: true,
    sent,
    ...(showDev ? { devCode: code } : {}),
  });
}

export async function PUT(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { email?: string; code?: string };
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!(await consumeRateLimit(`otp-verify:${email}`, 8, 10 * 60 * 1000))) return NextResponse.json({error:"Too many attempts. Please try again in 10 minutes."}, {status:429});
  const row = await getOtp(email);
  if (!row || row.expiresAt < Date.now() || row.codeHash !== hashCode(email, code)) {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
  }
  await deleteOtp(email);
  const user = await upsertUser(`usr_${randomUUID()}`, email);
  await setSessionCookie(user.id);
  return NextResponse.json({ ok: true, user });
}
