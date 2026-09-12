import { NextResponse } from "next/server";
import { getCheck, updateCheck } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { firstLook } from "@/lib/research";

export const maxDuration = 120;

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const check = getCheck(id, user.id);
  if (!check) return NextResponse.json({ error: "not found" }, { status: 404 });
  try {
    const { pass, gap } = await firstLook(check.claim);
    check.payload.firstLook = pass;
    check.payload.gap = gap;
    check.status = "first_look";
    check.updatedAt = new Date().toISOString();
    updateCheck(check);
    return NextResponse.json({ check });
  } catch (err) {
    const message = err instanceof Error ? err.message : "first look failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
