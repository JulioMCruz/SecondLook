import { NextResponse } from "next/server";
import { upsertUser } from "@/lib/db";
import { setSessionCookie } from "@/lib/session";

const DEMO_EMAIL = "judge@secondlook.app";
const DEMO_ID = "usr_demo_judge";

export async function POST() {
  const user = upsertUser(DEMO_ID, DEMO_EMAIL);
  await setSessionCookie(user.id);
  return NextResponse.json({ ok: true, user });
}
