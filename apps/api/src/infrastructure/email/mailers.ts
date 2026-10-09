import { Resend } from "resend";
import type { ContactMessage, Logger, Mailer } from "../../application/ports";
import { contactAcknowledgement, contactNotification, subscriberWelcome, type RenderedEmail } from "./templates";

interface MailerConfig {
  from: string;
  inbox: string;
  siteUrl: string;
}

abstract class TemplateMailer implements Mailer {
  constructor(protected readonly config: MailerConfig) {}

  protected abstract deliver(to: string, email: RenderedEmail, replyTo?: string): Promise<void>;

  sendContactNotification(message: ContactMessage): Promise<void> {
    return this.deliver(this.config.inbox, contactNotification(message, this.config.siteUrl), message.email);
  }

  sendContactAcknowledgement(message: ContactMessage): Promise<void> {
    return this.deliver(message.email, contactAcknowledgement(message, this.config.siteUrl), this.config.inbox);
  }

  sendSubscriberWelcome(email: string): Promise<void> {
    return this.deliver(email, subscriberWelcome(this.config.siteUrl), this.config.inbox);
  }
}

/** Sends through Resend's API. The sending domain (awebound.store) must be verified in Resend. */
export class ResendMailer extends TemplateMailer {
  private readonly resend: Resend;

  constructor(apiKey: string, config: MailerConfig) {
    super(config);
    this.resend = new Resend(apiKey);
  }

  protected async deliver(to: string, email: RenderedEmail, replyTo?: string): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: this.config.from,
      to,
      replyTo,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
    if (error) throw new Error(`Resend: ${error.name}: ${error.message}`);
  }
}

/** Development mailer: prints what would have been sent. */
export class ConsoleMailer extends TemplateMailer {
  constructor(
    config: MailerConfig,
    private readonly logger: Logger,
  ) {
    super(config);
  }

  protected async deliver(to: string, email: RenderedEmail, replyTo?: string): Promise<void> {
    this.logger.info({ mail: { to: to.replace(/(.).+(@.*)/, "$1…$2"), replyTo: replyTo ? "set" : "none", subject: email.subject } }, "email (console mailer)");
    console.info(`\n--- email: ${email.subject} ---\n${email.text}\n--- end ---\n`);
  }
}
