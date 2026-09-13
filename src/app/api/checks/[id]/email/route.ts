import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { hasSecondLook } from "@/lib/entitlements";
import { getCheck, updateCheck } from "@/lib/db";
import { applyReportEmail, sendBriefReport } from "@/lib/email";
import { detectLocale, langCookieName } from "@/lib/i18n";
import { getSessionUser } from "@/lib/session";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const check = await getCheck(id, user.id);
  if (!check) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!check.payload.brief || !(await hasSecondLook(user.id).catch(() => false))) {
    return NextResponse.json({ error: "brief not unlocked" }, { status: 402 });
  }

  const jar = await cookies();
  const locale = detectLocale(jar.get(langCookieName())?.value);
  const emailed = await sendBriefReport({ to: user.email, locale, check });
  applyReportEmail(check, emailed);
  check.updatedAt = new Date().toISOString();
  await updateCheck(check);
  return NextResponse.json({ check, emailed });
}
