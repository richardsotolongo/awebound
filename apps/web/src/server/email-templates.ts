import { CONTACT_TOPIC_LABELS, type ContactTopic } from "@/shared";

/**
 * Transactional email templates. Email clients can't read CSS variables and strip SVG, so colors
 * are inline hex mirrored from packages/brand/src/styles/tokens.css and the wordmark is a hosted PNG.
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
const C = {
  warmBone: "#E8DDC9",
  paper: "#F8F2E7",
  line: "#CFC4B1",
  coal: "#151413",
  muted: "#4A443D",
  oxblood: "#782B35",
  bone: "#F0E6D2",
};

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function layout(siteUrl: string, eyebrow: string, body: string): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"></head>
<body style="margin:0;padding:0;background:${C.warmBone};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.warmBone};"><tr><td align="center" style="padding:48px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
<tr><td align="center" style="padding-bottom:32px;"><img src="${siteUrl}/email/wordmark-oxblood.png" width="200" height="93" alt="Awebound" style="display:block;border:0;"></td></tr>
<tr><td style="background:${C.paper};border:1px solid ${C.line};padding:40px 32px;font-family:Archivo,'Helvetica Neue',Arial,sans-serif;color:${C.coal};font-size:16px;line-height:26px;">
<p style="margin:0 0 12px;font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:${C.muted};">${eyebrow}</p>
${body}
</td></tr>
<tr><td align="center" style="padding-top:24px;font-family:Archivo,'Helvetica Neue',Arial,sans-serif;font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:${C.muted};">Bound in awe. Worn without shame.</td></tr>
</table></td></tr></table></body></html>`;
}

const p = (text: string) => `<p style="margin:0 0 16px;">${text}</p>`;

export function contactNotification(message: ContactMessage, siteUrl: string): RenderedEmail {
  const topic = CONTACT_TOPIC_LABELS[message.topic];
  const subject = `Contact: ${topic} — ${message.name}`;
  const html = layout(
    siteUrl,
    "New message from the website",
    [
      p(`<strong>${escapeHtml(message.name)}</strong> &lt;${escapeHtml(message.email)}&gt;`),
      p(`Topic: ${escapeHtml(topic)}`),
      `<div style="margin:0 0 16px;padding:16px;border-left:2px solid ${C.oxblood};white-space:pre-wrap;">${escapeHtml(message.message)}</div>`,
      `<p style="margin:0;font-size:14px;color:${C.muted};">Reply to this email to answer ${escapeHtml(message.name)} directly. Reference ${escapeHtml(message.id)}.</p>`,
    ].join(""),
  );
  const text = `New message from the website\n\nFrom: ${message.name} <${message.email}>\nTopic: ${topic}\n\n${message.message}\n\nReply to this email to answer directly. Reference ${message.id}.`;
  return { subject, html, text };
}

export function contactAcknowledgement(message: ContactMessage, siteUrl: string): RenderedEmail {
  const firstName = message.name.split(/\s+/)[0] ?? message.name;
  const subject = "We have your message";
  const html = layout(
    siteUrl,
    "Message received",
    [
      p(`${escapeHtml(firstName)}, thank you for writing to Awebound.`),
      p("A real person reads every message. Expect a reply within 72 hours."),
      `<p style="margin:0;font-size:14px;color:${C.muted};">For anything about an order, reply to this email with your order number.</p>`,
    ].join(""),
  );
  const text = `${firstName}, thank you for writing to Awebound.\n\nA real person reads every message. Expect a reply within 72 hours.\n\nFor anything about an order, reply to this email with your order number.`;
  return { subject, html, text };
}

export function subscriberWelcome(siteUrl: string): RenderedEmail {
  const subject = "You’re on the list";
  const html = layout(
    siteUrl,
    "Drop notes",
    [
      p("You’ll hear from us when a new drop is ready, and when checkout opens. Nothing else."),
      `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 0;"><tr><td style="background:${C.oxblood};border-radius:2px;"><a href="${siteUrl}/shop" style="display:inline-block;padding:15px 28px;font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:${C.bone};text-decoration:none;font-weight:600;">Shop the collection</a></td></tr></table>`,
    ].join(""),
  );
  const text = `You’ll hear from us when a new drop is ready, and when checkout opens. Nothing else.\n\nShop the collection: ${siteUrl}/shop`;
  return { subject, html, text };
}
