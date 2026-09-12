import { NextResponse } from "next/server";
import { getCheck, updateCheck } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { secondLook } from "@/lib/research";

export const maxDuration = 120;

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const check = getCheck(id, user.id);
  if (!check) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (check.status !== "first_look" && check.status !== "unlocked") {
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
    check.payload.entitlementActive = false;
    check.updatedAt = new Date().toISOString();
    updateCheck(check);
    return NextResponse.json({ check, locked: true });
  }

  if (body.purchaseStatus === "expired") {
    check.payload.entitlementActive = false;
    check.status = "expired";
    check.updatedAt = new Date().toISOString();
    updateCheck(check);
    return NextResponse.json({ check, locked: true });
  }

  if (!body.entitled) {
    return NextResponse.json(
      { error: "second_look entitlement required" },
      { status: 402 },
    );
  }

  try {
    const { followUp, brief, metrics } = await secondLook(check.claim, check.payload);
    check.payload.followUp = followUp;
    check.payload.brief = brief;
    check.payload.metrics = metrics;
    check.payload.entitlementActive = true;
    check.status = "unlocked";
    check.updatedAt = new Date().toISOString();
    updateCheck(check);
    return NextResponse.json({ check });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unlock failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
