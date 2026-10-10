import { CONTACT_TOPIC_LABELS, type ContactTopic } from "@/shared";

/**
 * Transactional email templates. Every email uses `layout` (the Supabase sign-in templates in
 * supabase/templates/ copy the same markup). Built for the widest client support: tables only,
 * nothing styled on <body>, padding instead of margins, bgcolor attributes, no rounded corners.
 * Colors are inline hex from packages/brand/src/styles/tokens.css: email clients ignore CSS variables.
 * Copy follows the brand voice: sentence case, short, no exclamation marks.
 */

export interface ContactMessage {
  /** Database id, or "unsaved" when the message couldn't be stored. */
  id: string;
  name: string;
  email: string;
  topic: ContactTopic;
  message: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

/** sendEmail attaches the wordmark inline under this content id. */
export const LOGO_CID = "wordmark";

const C = {
  warmBone: "#E8DDC9",
  paper: "#F8F2E7",
  line: "#CFC4B1",
  coal: "#151413",
  muted: "#4A443D",
  oxblood: "#782B35",
  bone: "#F0E6D2",
};
const FONT = "Manrope,'Helvetica Neue',Helvetica,Arial,sans-serif";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** One line of the card. Line height follows the font size; `gap` is the space below. */
export function row(
  html: string,
  { size = 16, color = C.coal, gap = 16, bold = false, caps = false } = {},
) {
  const extra = (bold ? "font-weight:bold;" : "") + (caps ? "letter-spacing:2px;" : "");
  return `<tr><td style="padding:0 0 ${gap}px;font-family:${FONT};font-size:${size}px;line-height:${Math.round(size * 1.6)}px;color:${color};${extra}">${caps ? html.toUpperCase() : html}</td></tr>`;
}

export const eyebrow = (text: string) =>
  row(text, { size: 12, color: C.muted, gap: 12, caps: true });

export const lead = (html: string) => row(html, { size: 20, gap: 16 });
export const small = (html: string) => row(html, { size: 14, color: C.muted, gap: 0 });

export function button(label: string, href: string) {
  return `<tr><td style="padding:8px 0 24px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="${C.oxblood}" style="background-color:${C.oxblood};padding:14px 28px;"><a href="${href}" style="font-family:${FONT};font-size:13px;line-height:16px;letter-spacing:2px;font-weight:bold;color:${C.bone};text-decoration:none;">${label.toUpperCase()}</a></td></tr></table></td></tr>`;
}

/** A quoted block, e.g. the shopper's own message. Line breaks become <br>. */
function quote(text: string) {
  return `<tr><td style="padding:0 0 20px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-left:2px solid ${C.oxblood};padding:4px 0 4px 16px;font-family:${FONT};font-size:15px;line-height:24px;color:${C.coal};">${escapeHtml(text).replace(/\r?\n/g, "<br>")}</td></tr></table></td></tr>`;
}

/**
 * The shared frame: wordmark, the paper card, the brand line and an optional note under the card.
 * `logoSrc` is `cid:wordmark` for Resend; the Supabase templates use the hosted PNG.
 */
export function layout({
  title,
  logoSrc,
  rows,
  note,
}: {
  title: string;
  logoSrc: string;
  rows: string[];
  note?: string;
}): string {
  const noteRow = note
    ? `<tr><td align="center" style="padding:12px 16px 0;font-family:${FONT};font-size:12px;line-height:18px;color:${C.muted};">${note}</td></tr>`
    : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>${escapeHtml(title)}</title>
</head>
<body>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.warmBone}" style="background-color:${C.warmBone};">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
<tr><td align="center" style="padding:0 0 28px;"><img src="${logoSrc}" width="200" height="93" alt="Awebound" style="display:block;border:0;font-family:Georgia,serif;font-size:30px;font-weight:bold;color:${C.oxblood};"></td></tr>
<tr><td bgcolor="${C.paper}" style="background-color:${C.paper};border:1px solid ${C.line};padding:36px 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${rows.join("\n")}
</table>
</td></tr>
<tr><td align="center" style="padding:24px 16px 0;font-family:${FONT};font-size:12px;line-height:18px;letter-spacing:2px;color:${C.muted};">BOUND IN AWE. WORN WITHOUT SHAME.</td></tr>
${noteRow}
</table>
</td></tr>
</table>
</body>
</html>`;
}

const LOGO = `cid:${LOGO_CID}`;

const firstName = (name: string) =>
  (name.trim().split(/\s+/)[0] ?? "").replace(/^./, (c) => c.toUpperCase());

export function contactNotification(message: ContactMessage): RenderedEmail {
  const topic = CONTACT_TOPIC_LABELS[message.topic];
  const subject = `Contact: ${topic} — ${message.name}`;
  const name = escapeHtml(message.name);
  const html = layout({
    title: subject,
    logoSrc: LOGO,
    rows: [
      eyebrow("New message"),
      lead(`${name} wrote about ${escapeHtml(topic.toLowerCase())}.`),
      row(`${name} &lt;${escapeHtml(message.email)}&gt;`, { size: 14, color: C.muted }),
      quote(message.message),
      small(`Reply to this email to answer ${name} directly. Reference ${escapeHtml(message.id)}.`),
    ],
  });
  const text = `New message from the website\n\nFrom: ${message.name} <${message.email}>\nTopic: ${topic}\n\n${message.message}\n\nReply to this email to answer directly. Reference ${message.id}.`;
  return { subject, html, text };
}

export function contactAcknowledgement(message: ContactMessage): RenderedEmail {
  const first = firstName(message.name);
  const topic = CONTACT_TOPIC_LABELS[message.topic];
  const subject = "We have your message";
  const html = layout({
    title: subject,
    logoSrc: LOGO,
    rows: [
      eyebrow("Message received"),
      lead(`${escapeHtml(first)}, thank you for writing to us.`),
      row("We’ll reply within 72 hours. Here’s what you sent:"),
      row(escapeHtml(topic), { size: 14, color: C.muted, gap: 8, bold: true }),
      quote(message.message),
      small("About an order? Reply to this email with your order number."),
    ],
  });
  const text = `${first}, thank you for writing to us.\n\nWe’ll reply within 72 hours. Here’s what you sent:\n\n${topic}\n${message.message}\n\nAbout an order? Reply to this email with your order number.`;
  return { subject, html, text };
}

export function subscriberWelcome(siteUrl: string): RenderedEmail {
  const subject = "You’re on the list";
  const html = layout({
    title: subject,
    logoSrc: LOGO,
    rows: [
      eyebrow("Drop notes"),
      lead("You’re on the list."),
      row("You’ll hear from us when a new release is ready. Nothing else."),
      button("See the pieces", `${siteUrl}/shop`),
      small("Don’t want these? Reply with “stop” and we’ll take you off the list."),
    ],
  });
  const text = `You’re on the list.\n\nYou’ll hear from us when a new release is ready. Nothing else.\n\nSee the pieces: ${siteUrl}/shop\n\nDon’t want these? Reply with “stop” and we’ll take you off the list.`;
  return { subject, html, text };
}

export function accountDeleted(): RenderedEmail {
  const subject = "Your Awebound account is deleted";
  const html = layout({
    title: subject,
    logoSrc: LOGO,
    rows: [
      eyebrow("Account deleted"),
      lead("Your Awebound account is deleted."),
      row(
        "We removed your sign-in, your profile and your drop-notes subscription. Orders you placed stay with Fourthwall, our checkout partner, for receipts and returns.",
      ),
      small("If you didn’t ask for this, reply to this email and we’ll look into it."),
    ],
  });
  const text = `Your Awebound account is deleted.\n\nWe removed your sign-in, your profile and your drop-notes subscription. Orders you placed stay with Fourthwall, our checkout partner, for receipts and returns.\n\nIf you didn’t ask for this, reply to this email and we’ll look into it.`;
  return { subject, html, text };
}
