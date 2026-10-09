import { Resend } from "resend";
import type { RenderedEmail } from "./email-templates";
import { serverEnv } from "./env";

const resend = serverEnv.RESEND_API_KEY ? new Resend(serverEnv.RESEND_API_KEY) : null;

/**
 * Sends through Resend (the awebound.store domain must be verified there). Without a key, development
 * prints the email instead and production fails, so a message is never silently dropped.
 */
export async function sendEmail(to: string, email: RenderedEmail, replyTo?: string) {
  if (!resend) {
    if (process.env.NODE_ENV === "production") throw new Error("RESEND_API_KEY is not set");
    console.info(`\n--- email: ${email.subject} ---\n${email.text}\n--- end ---\n`);
    return;
  }
  const { error } = await resend.emails.send({
    from: serverEnv.EMAIL_FROM,
    to,
    replyTo,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
  if (error) throw new Error(`Resend: ${error.name}: ${error.message}`);
}
