import {NextResponse} from "next/server";
import {randomUUID} from "node:crypto";
import {upsertUser} from "@/lib/db";
import {setSessionCookie} from "@/lib/session";

export async function POST() {
  const id = randomUUID();
  const user = await upsertUser(`usr_demo_${id}`, `demo-${id}@secondlook.app`);
  await setSessionCookie(user.id);
  return NextResponse.json({ok:true,user});
}
