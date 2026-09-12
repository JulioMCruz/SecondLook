import { NextResponse } from "next/server";
import { getCheck } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const check = getCheck(id, user.id);
  if (!check) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ check });
}
