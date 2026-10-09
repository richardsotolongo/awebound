import type { ContactTopic } from "@awebound/shared";

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  topic: ContactTopic;
  message: string;
  createdAt: Date;
}

/**
 * Transactional email by intent. Adapters own the templates and the transport (Resend, console).
 * Auth emails (magic link, code) are sent by Supabase Auth through Resend SMTP, not through here.
 */
export interface Mailer {
  /** To the store inbox, reply-to the sender. */
  sendContactNotification(message: ContactMessage): Promise<void>;
  /** To the sender, confirming we received it. */
  sendContactAcknowledgement(message: ContactMessage): Promise<void>;
  /** To a new drop-notes subscriber. */
  sendSubscriberWelcome(email: string): Promise<void>;
}
