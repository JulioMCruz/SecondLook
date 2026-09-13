import { NextResponse } from "next/server";
import { voiceToClaim } from "@/lib/nebius";
import { getSessionUser } from "@/lib/session";

export const maxDuration = 60;

const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("audio");
  if (!(file instanceof File) || file.size < 800) {
    return NextResponse.json({ error: "Record a short clip of the claim" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Clip is too long. Speak one sentence." }, { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const filename = file.name || "claim.webm";
  const mime = file.type || "audio/webm";

  try {
    const result = await voiceToClaim(bytes, filename, mime);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "voice failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
