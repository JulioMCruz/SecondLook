import { Resend } from "resend";
import { loginCodeEmail, briefReportEmail, contactAutoEmail, contactNotifyEmail } from "@/lib/email-templates";
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

export async function sendLoginCode(email: string, code: string, locale: Locale = "en") {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { sent: false as const, reason: "missing_key" as const };

  const resend = new Resend(key);
  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: email,
    ...loginCodeEmail(code, locale),
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
  if (isDemoInbox(input.to)) return {sent:false,copiedToNotify:false,to:input.to,error:"Demo session: report saved on screen. Sign in with email for delivery."};
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
    findings: brief.findings,
    questionsForSeller: brief.questionsForSeller,
    sources: [...(input.check.payload.firstLook?.sources || []), ...(input.check.payload.followUp?.sources || [])],
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

  const primary = await resend.emails.send({
    from,
    to: input.to,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });

  return {
    sent: !primary.error,
    copiedToNotify: false,
    to: input.to,
    error: primary.error?.message,
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
