import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { acquireCheckLock, releaseCheckLock, getCheck, updateCheck } from "@/lib/db";
import { applyReportEmail, sendBriefReport } from "@/lib/email";
import { detectLocale, langCookieName } from "@/lib/i18n";
import { getSessionUser } from "@/lib/session";
import { hasSecondLook, publicCheck } from "@/lib/entitlements";
import { secondLook } from "@/lib/research";

export const maxDuration = 120;

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const check = await getCheck(id, user.id);
  if (!check) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (check.status !== "first_look" && check.status !== "unlocked" && check.status !== "expired") {
    return NextResponse.json({ error: "run first look first" }, { status: 400 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    entitled?: boolean;
    purchaseStatus?: "success" | "fail" | "cancel" | "expired";
  };

  if (body.purchaseStatus) {
    check.payload.lastPurchaseStatus = body.purchaseStatus;
  }

  if (body.purchaseStatus === "fail" || body.purchaseStatus === "cancel") {
    return NextResponse.json({ check: publicCheck(check, false), locked: true });
  }

  let acquired = false;
  try {
    const active = await hasSecondLook(user.id);
    if (!active) return NextResponse.json({error: "second_look entitlement required", check: publicCheck(check, false)}, {status: 402});
    if (check.payload.brief) return NextResponse.json({check: publicCheck(check, true)});
    acquired = await acquireCheckLock(check.id);
    if (!acquired) return NextResponse.json({error:"This assessment is already processing. Please reload shortly."}, {status:409});
    const latest = await getCheck(check.id, user.id);
    if (latest?.payload.brief) return NextResponse.json({check: publicCheck(latest, true)});
    const { followUp, brief, metrics } = await secondLook(check.claim, check.payload);
    check.payload.followUp = followUp;
    check.payload.brief = brief;
    check.payload.metrics = metrics;
    check.payload.entitlementActive = true;
    check.status = "unlocked";
    check.updatedAt = new Date().toISOString();
    await updateCheck(check);

    try {
      const jar = await cookies();
      const locale = check.payload.locale || detectLocale(jar.get(langCookieName())?.value);
      const emailed = await sendBriefReport({ to: user.email, locale, check });
      applyReportEmail(check, emailed);
      check.updatedAt = new Date().toISOString();
      await updateCheck(check);
      return NextResponse.json({ check, emailed });
    } catch (mailErr) {
      const message = mailErr instanceof Error ? mailErr.message : "email failed";
      check.payload.reportEmailError = message;
      await updateCheck(check);
      return NextResponse.json({ check, emailed: { sent: false, error: message } });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "unlock failed";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (acquired) await releaseCheckLock(check.id);
  }
}
