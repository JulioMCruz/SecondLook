const PAPER = "#f7f4ee";
const INK = "#1a1a1a";
const MUTED = "#6b6560";
const LINE = "#d9d2c5";
const GREEN = "#1f6b4a";
const CREAM = "#fffdf8";
const SITE = "https://secondlook.juliomcruz.workers.dev";

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function nl2br(value: string) {
  return escapeHtml(value).replace(/\n/g, "<br/>");
}

function shell(inner: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>SecondLook</title>
</head>
<body style="margin:0;padding:0;background:${PAPER};color:${INK};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${PAPER};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;width:100%;">
          <tr>
            <td style="padding:0 0 16px 0;font-family:Georgia,'Times New Roman',serif;font-size:18px;color:${INK};">
              SecondLook
            </td>
          </tr>
          <tr>
            <td style="background:${CREAM};border:1px solid ${LINE};">
              <div style="height:4px;background:${GREEN};line-height:4px;font-size:0;">&nbsp;</div>
              ${inner}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 4px 0 4px;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;font-size:12px;line-height:18px;color:${MUTED};">
              SecondLook files one claim at a time. This is not a newsletter.
              <br/>
              <a href="${SITE}" style="color:${GREEN};text-decoration:none;">${SITE.replace("https://", "")}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function contactNotifyEmail(input: {
  name: string;
  email: string;
  message: string;
  createdAt: string;
}) {
  const when = new Date(input.createdAt).toUTCString();
  const html = shell(`
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td style="padding:28px 28px 8px 28px;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${MUTED};">
          Landing · new note
        </td>
      </tr>
      <tr>
        <td style="padding:0 28px 8px 28px;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:32px;color:${INK};">
          ${escapeHtml(input.name)} wrote in.
        </td>
      </tr>
      <tr>
        <td style="padding:0 28px 20px 28px;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;font-size:14px;line-height:22px;color:${MUTED};">
          Reply to this email to reach them. The note is also stored on the account database.
        </td>
      </tr>
      <tr>
        <td style="padding:0 28px 20px 28px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid ${LINE};">
            <tr>
              <td style="padding:12px 16px;border-bottom:1px solid ${LINE};font-family:ui-sans-serif,system-ui,sans-serif;font-size:12px;color:${MUTED};">Name</td>
              <td style="padding:12px 16px;border-bottom:1px solid ${LINE};font-family:ui-sans-serif,system-ui,sans-serif;font-size:13px;color:${INK};">${escapeHtml(input.name)}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;border-bottom:1px solid ${LINE};font-family:ui-sans-serif,system-ui,sans-serif;font-size:12px;color:${MUTED};">Email</td>
              <td style="padding:12px 16px;border-bottom:1px solid ${LINE};font-family:ui-sans-serif,system-ui,sans-serif;font-size:13px;color:${INK};">
                <a href="mailto:${escapeHtml(input.email)}" style="color:${GREEN};text-decoration:none;">${escapeHtml(input.email)}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 16px;font-family:ui-sans-serif,system-ui,sans-serif;font-size:12px;color:${MUTED};">When</td>
              <td style="padding:12px 16px;font-family:ui-sans-serif,system-ui,sans-serif;font-size:13px;color:${INK};">${escapeHtml(when)}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:0 28px 28px 28px;">
          <p style="margin:0 0 8px 0;font-family:ui-sans-serif,system-ui,sans-serif;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${GREEN};">Message</p>
          <div style="padding:16px;background:${PAPER};border:1px dashed ${LINE};font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:24px;color:${INK};">
            ${nl2br(input.message)}
          </div>
        </td>
      </tr>
    </table>
  `);

  const text = [
    `SecondLook · new note from the landing`,
    ``,
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `When: ${when}`,
    ``,
    input.message,
    ``,
    `Reply to this email to reach them.`,
    SITE,
  ].join("\n");

  return {
    subject: `SecondLook · note from ${input.name}`,
    html,
    text,
  };
}

export function contactAutoEmail(input: {
  name: string;
  email: string;
  message: string;
  notify: string;
}) {
  const first = input.name.split(" ")[0] || input.name;
  const html = shell(`
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td style="padding:28px 28px 8px 28px;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${MUTED};">
          Receipt · your note
        </td>
      </tr>
      <tr>
        <td style="padding:0 28px 8px 28px;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:32px;color:${INK};">
          We logged it, ${escapeHtml(first)}.
        </td>
      </tr>
      <tr>
        <td style="padding:0 28px 20px 28px;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;font-size:14px;line-height:22px;color:${MUTED};">
          This is the copy of what you sent from the SecondLook landing. Julio has the same note and will reply from
          <a href="mailto:${escapeHtml(input.notify)}" style="color:${GREEN};text-decoration:none;">${escapeHtml(input.notify)}</a>.
        </td>
      </tr>
      <tr>
        <td style="padding:0 28px 8px 28px;font-family:ui-sans-serif,system-ui,sans-serif;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${GREEN};">
          What happens next
        </td>
      </tr>
      <tr>
        <td style="padding:0 28px 20px 28px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding:8px 0;font-family:ui-sans-serif,system-ui,sans-serif;font-size:13px;line-height:20px;color:${INK};">1. Your note is on file.</td>
            </tr>
            <tr>
              <td style="padding:8px 0;font-family:ui-sans-serif,system-ui,sans-serif;font-size:13px;line-height:20px;color:${INK};">2. Julio was notified at the same time as this email.</td>
            </tr>
            <tr>
              <td style="padding:8px 0;font-family:ui-sans-serif,system-ui,sans-serif;font-size:13px;line-height:20px;color:${INK};">3. If you want a human, reply on this thread — not another deck.</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:0 28px 24px 28px;">
          <p style="margin:0 0 8px 0;font-family:ui-sans-serif,system-ui,sans-serif;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${MUTED};">Your message</p>
          <div style="padding:16px;background:${PAPER};border:1px dashed ${LINE};font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:24px;color:${INK};">
            ${nl2br(input.message)}
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:0 28px 28px 28px;">
          <a href="${SITE}" style="display:inline-block;background:${GREEN};color:#ffffff;font-family:ui-sans-serif,system-ui,sans-serif;font-size:13px;text-decoration:none;padding:12px 20px;border-radius:999px;">
            Open SecondLook
          </a>
        </td>
      </tr>
    </table>
  `);

  const text = [
    `Hi ${first},`,
    ``,
    `We logged the note you sent from SecondLook.`,
    `Julio has a copy and will reply from ${input.notify}.`,
    ``,
    `What happens next`,
    `1. Your note is on file.`,
    `2. Julio was notified at the same time as this email.`,
    `3. Reply on this thread if you want a human.`,
    ``,
    `Your message:`,
    input.message,
    ``,
    SITE,
  ].join("\n");

  return {
    subject: "SecondLook · we logged your note",
    html,
    text,
  };
}

type BriefMail = {
  locale: "en" | "es";
  claim: string;
  checkId: string;
  verdict: string;
  summary: string;
  facts: string[];
  hypotheses: string[];
  unknowns: string[];
  where: string[];
  struggle: boolean;
  struggleNote?: string;
  model?: string;
  durationMs?: number;
  tokens?: number;
  usd?: number;
  firstSources: { name: string; url: string }[];
  followSources: { name: string; url: string }[];
  testPurchase: boolean;
};

function listSection(title: string, items: string[]) {
  if (!items.length) return "";
  const rows = items
    .slice(0, 8)
    .map(
      (item) =>
        `<tr><td style="padding:6px 0;font-family:ui-sans-serif,system-ui,sans-serif;font-size:13px;line-height:20px;color:${INK};">• ${escapeHtml(item)}</td></tr>`,
    )
    .join("");
  return `
    <tr>
      <td style="padding:16px 28px 0 28px;font-family:ui-sans-serif,system-ui,sans-serif;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${GREEN};">${escapeHtml(title)}</td>
    </tr>
    <tr>
      <td style="padding:4px 28px 0 28px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${rows}</table>
      </td>
    </tr>`;
}

function sourceSection(title: string, sources: { name: string; url: string }[]) {
  if (!sources.length) return "";
  const rows = sources
    .slice(0, 6)
    .map((s) => {
      const href = escapeHtml(s.url);
      return `<tr><td style="padding:5px 0;font-family:ui-sans-serif,system-ui,sans-serif;font-size:12px;line-height:18px;">
        <a href="${href}" style="color:${GREEN};text-decoration:none;">${escapeHtml(s.name || s.url)}</a>
      </td></tr>`;
    })
    .join("");
  return `
    <tr>
      <td style="padding:16px 28px 0 28px;font-family:ui-sans-serif,system-ui,sans-serif;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${MUTED};">${escapeHtml(title)}</td>
    </tr>
    <tr>
      <td style="padding:4px 28px 8px 28px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${rows}</table>
      </td>
    </tr>`;
}

export function briefReportEmail(input: BriefMail) {
  const es = input.locale === "es";
  const receiptUrl = `${SITE}/app/${encodeURIComponent(input.checkId)}`;
  const usd =
    typeof input.usd === "number" && Number.isFinite(input.usd)
      ? `~$${input.usd.toFixed(4)}`
      : "";
  const meta = [input.model, input.durationMs ? `${input.durationMs} ms` : "", input.tokens ? `${input.tokens} tokens` : "", usd]
    .filter(Boolean)
    .join(" · ");

  const copy = es
    ? {
        kicker: "Recibo · brief pagado",
        title: "Tu brief ya está en el archivo.",
        body: "Pagaste para quedártelo. Test Store o no: el archivo es el mismo que en Tus recibos.",
        test: "TEST STORE",
        claim: "El claim",
        facts: "Hechos",
        hypotheses: "Hipótesis",
        unknowns: "Lo desconocido",
        where: "Dónde",
        struggle: "No se pudo cerrar",
        search1: "Búsqueda 1 · Linkup",
        search2: "Búsqueda 2 · follow-up",
        open: "Abrir el recibo",
        subject: `SecondLook · tu brief · ${input.verdict}`,
        footer: "SecondLook archiva un claim a la vez. Esto no es un newsletter.",
      }
    : {
        kicker: "Receipt · paid brief",
        title: "Your brief is on file.",
        body: "You paid to keep this. Test Store or not: this is the same file as in Your receipts.",
        test: "TEST STORE",
        claim: "The claim",
        facts: "Facts",
        hypotheses: "Hypotheses",
        unknowns: "Unknowns",
        where: "Where",
        struggle: "Could not close",
        search1: "Search 1 · Linkup",
        search2: "Search 2 · follow-up",
        open: "Open the receipt",
        subject: `SecondLook · your brief · ${input.verdict}`,
        footer: "SecondLook files one claim at a time. This is not a newsletter.",
      };

  const html = shell(`
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td style="padding:28px 28px 8px 28px;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${MUTED};">
          ${escapeHtml(copy.kicker)}${input.testPurchase ? ` · ${copy.test}` : ""}
        </td>
      </tr>
      <tr>
        <td style="padding:0 28px 8px 28px;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:32px;color:${INK};">
          ${escapeHtml(copy.title)}
        </td>
      </tr>
      <tr>
        <td style="padding:0 28px 20px 28px;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;font-size:14px;line-height:22px;color:${MUTED};">
          ${escapeHtml(copy.body)}
        </td>
      </tr>
      <tr>
        <td style="padding:0 28px 8px 28px;font-family:ui-sans-serif,system-ui,sans-serif;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${GREEN};">
          ${escapeHtml(input.verdict)}
        </td>
      </tr>
      <tr>
        <td style="padding:0 28px 16px 28px;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:26px;color:${INK};">
          ${nl2br(input.summary)}
        </td>
      </tr>
      <tr>
        <td style="padding:0 28px 8px 28px;">
          <p style="margin:0 0 8px 0;font-family:ui-sans-serif,system-ui,sans-serif;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${MUTED};">${escapeHtml(copy.claim)}</p>
          <div style="padding:16px;background:${PAPER};border:1px dashed ${LINE};font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:24px;color:${INK};">
            ${nl2br(input.claim)}
          </div>
        </td>
      </tr>
      ${listSection(copy.facts, input.facts)}
      ${listSection(copy.hypotheses, input.hypotheses)}
      ${listSection(copy.unknowns, input.unknowns)}
      ${listSection(copy.where, input.where)}
      ${
        input.struggle
          ? `<tr><td style="padding:16px 28px 0 28px;">
              <div style="padding:12px 16px;background:#fff7ed;border:1px solid ${LINE};font-family:ui-sans-serif,system-ui,sans-serif;font-size:13px;line-height:20px;color:${INK};">
                ${escapeHtml(copy.struggle)}${input.struggleNote ? `: ${escapeHtml(input.struggleNote)}` : ""}
              </div>
            </td></tr>`
          : ""
      }
      ${sourceSection(copy.search1, input.firstSources)}
      ${sourceSection(copy.search2, input.followSources)}
      ${
        meta
          ? `<tr><td style="padding:16px 28px 0 28px;font-family:ui-sans-serif,system-ui,sans-serif;font-size:11px;line-height:18px;color:${MUTED};">${escapeHtml(meta)}</td></tr>`
          : ""
      }
      <tr>
        <td style="padding:24px 28px 28px 28px;">
          <a href="${escapeHtml(receiptUrl)}" style="display:inline-block;background:${GREEN};color:#ffffff;font-family:ui-sans-serif,system-ui,sans-serif;font-size:13px;text-decoration:none;padding:12px 20px;border-radius:999px;">
            ${escapeHtml(copy.open)}
          </a>
        </td>
      </tr>
    </table>
  `);

  const text = [
    copy.kicker + (input.testPurchase ? ` · ${copy.test}` : ""),
    "",
    copy.title,
    copy.body,
    "",
    input.verdict,
    input.summary,
    "",
    `${copy.claim}: ${input.claim}`,
    "",
    input.facts.length ? `${copy.facts}\n${input.facts.map((f) => `- ${f}`).join("\n")}` : "",
    input.hypotheses.length ? `${copy.hypotheses}\n${input.hypotheses.map((f) => `- ${f}`).join("\n")}` : "",
    input.unknowns.length ? `${copy.unknowns}\n${input.unknowns.map((f) => `- ${f}`).join("\n")}` : "",
    input.struggle && input.struggleNote ? `${copy.struggle}: ${input.struggleNote}` : "",
    meta,
    "",
    receiptUrl,
  ]
    .filter((line) => line !== "")
    .join("\n");

  return { subject: copy.subject, html, text };
}
