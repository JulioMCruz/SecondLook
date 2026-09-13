import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { saveContact } from "@/lib/db";
import { sendContactMails } from "@/lib/email";

function clean(value: unknown, max: number) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      name?: string;
      email?: string;
      message?: string;
      website?: string;
    };

    if (clean(body.website, 200)) {
      return NextResponse.json({ ok: true });
    }

    const name = clean(body.name, 80);
    const email = clean(body.email, 120).toLowerCase();
    const message = String(body.message || "").trim().slice(0, 4000);

    if (name.length < 2) {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }
    if (!email.includes("@") || !email.includes(".")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }
    if (message.length < 8) {
      return NextResponse.json({ error: "Write a short note" }, { status: 400 });
    }

    const createdAt = new Date().toISOString();
    await saveContact({
      id: `ct_${randomUUID()}`,
      name,
      email,
      message,
      createdAt,
    });

    const mail = await sendContactMails({ name, email, message, createdAt });
    return NextResponse.json({
      ok: true,
      notified: mail.notified,
      autoresponder: mail.autoresponder,
      ...(mail.notifyError || mail.autoError
        ? { mailHint: mail.notifyError || mail.autoError }
        : {}),
    });
  } catch (err) {
    const text = err instanceof Error ? err.message : "contact failed";
    return NextResponse.json({ error: text }, { status: 500 });
  }
}
