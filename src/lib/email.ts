import { Resend } from "resend";
import { briefReportEmail, contactAutoEmail, contactNotifyEmail } from "@/lib/email-templates";
import type { Brief, CheckRecord } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

function fromAddress() {
  const raw = process.env.EMAIL_FROM || "";
  if (!raw || raw.toLowerCase().includes("@example.com")) {
    return ["SecondLook <", "onboarding", "@", "resend", ".", "dev>"].join("");
  }
  return raw;
}

function notifyAddress() {
  return process.env.CONTACT_NOTIFY_EMAIL || "julio.cruz@eb-ms.net";
}

export async function sendLoginCode(email: string, code: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { sent: false as const, reason: "missing_key" as const };

  const resend = new Resend(key);
  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: email,
    subject: "Your SecondLook login code",
    text: `Your code is ${code}. It expires in 10 minutes.\n\nIf you did not request this, ignore the email.`,
  });
  if (error) {
    throw new Error(error.message || "Resend send failed");
  }
  return { sent: true as const };
}

export async function sendContactMails(input: {
  name: string;
  email: string;
  message: string;
  createdAt: string;
}) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return { notified: false, autoresponder: false, reason: "missing_key" as const };
  }

  const resend = new Resend(key);
  const from = fromAddress();
  const notify = notifyAddress();
  const alert = contactNotifyEmail(input);
  const auto = contactAutoEmail({ ...input, notify });

  const notifyResult = await resend.emails.send({
    from,
    to: notify,
    replyTo: input.email,
    subject: alert.subject,
    html: alert.html,
    text: alert.text,
  });

  const autoResult = await resend.emails.send({
    from,
    to: input.email,
    replyTo: notify,
    subject: auto.subject,
    html: auto.html,
    text: auto.text,
  });

  return {
    notified: !notifyResult.error,
    autoresponder: !autoResult.error,
    notifyError: notifyResult.error?.message,
    autoError: autoResult.error?.message,
  };
}

function isDemoInbox(email: string) {
  return /@secondlook\.app$/i.test(email);
}

export async function sendBriefReport(input: {
  to: string;
  locale: Locale;
  check: CheckRecord;
}) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return { sent: false, copiedToNotify: false, to: input.to, error: "missing_key" as const };
  }

  const brief = input.check.payload.brief as Brief | undefined;
  if (!brief) {
    return { sent: false, copiedToNotify: false, to: input.to, error: "no_brief" as const };
  }

  const mail = briefReportEmail({
    locale: input.locale,
    claim: input.check.claim,
    checkId: input.check.id,
    verdict: brief.verdict,
    summary: brief.summary,
    facts: brief.facts ?? [],
    hypotheses: brief.hypotheses ?? [],
    unknowns: brief.unknowns ?? [],
    where: brief.where ?? [],
    struggle: Boolean(brief.struggle),
    struggleNote: brief.struggleNote,
    model: input.check.payload.metrics?.model,
    durationMs: input.check.payload.metrics?.nebiousMs,
    tokens: input.check.payload.metrics?.totalTokens,
    usd: input.check.payload.metrics?.estimatedUsd,
    firstSources: (input.check.payload.firstLook?.sources ?? []).map((s) => ({
      name: s.name,
      url: s.url,
    })),
    followSources: (input.check.payload.followUp?.sources ?? []).map((s) => ({
      name: s.name,
      url: s.url,
    })),
    testPurchase: true,
  });

  const resend = new Resend(key);
  const from = fromAddress();
  const notify = notifyAddress();

  const primary = await resend.emails.send({
    from,
    to: input.to,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });

  let copiedToNotify = false;
  let copyError: string | undefined;
  const shouldCopy =
    (isDemoInbox(input.to) || Boolean(primary.error)) &&
    notify.toLowerCase() !== input.to.toLowerCase();

  if (shouldCopy) {
    const copySubject = isDemoInbox(input.to)
      ? `${mail.subject} · demo ${input.to}`
      : `${mail.subject} · undelivered ${input.to}`;
    const copy = await resend.emails.send({
      from,
      to: notify,
      subject: copySubject,
      html: mail.html,
      text: mail.text,
    });
    copiedToNotify = !copy.error;
    copyError = copy.error?.message;
  }

  return {
    sent: !primary.error,
    copiedToNotify,
    to: input.to,
    error: primary.error?.message || copyError,
  };
}

export type BriefEmailResult = Awaited<ReturnType<typeof sendBriefReport>>;

export function applyReportEmail(check: CheckRecord, emailed: BriefEmailResult) {
  check.payload.reportEmailedTo = emailed.to;
  check.payload.reportEmailCopiedToNotify = emailed.copiedToNotify;
  if (emailed.sent || emailed.copiedToNotify) {
    check.payload.reportEmailedAt = new Date().toISOString();
  }
  check.payload.reportEmailError = emailed.sent ? undefined : emailed.error;
}
