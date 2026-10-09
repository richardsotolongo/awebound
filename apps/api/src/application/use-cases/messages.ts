import type { ContactRequest, SubscribeRequest } from "@awebound/shared";
import { UnavailableError } from "../../domain/errors";
import type { ContactRepository, Logger, Mailer, SubscriberRepository } from "../ports";

/**
 * Stores a contact message and emails it to the store inbox (reply-to the sender), then sends the
 * sender an acknowledgement. Succeeds if the message was either stored or delivered, so one
 * outage never loses a message silently.
 */
export class SubmitContactMessage {
  constructor(
    private readonly messages: ContactRepository,
    private readonly mailer: Mailer,
    private readonly logger: Logger,
  ) {}

  async execute(request: ContactRequest, userId?: string): Promise<void> {
    const { website: _honeypot, ...input } = request;
    const message = await this.messages.save({ ...input, userId }).catch((err: unknown) => {
      this.logger.error({ err }, "contact message could not be stored");
      return null;
    });
    const record = message ?? {
      id: "unsaved",
      ...input,
      createdAt: new Date(),
    };

    let delivered = false;
    try {
      await this.mailer.sendContactNotification(record);
      delivered = true;
      if (message) await this.messages.markEmailed(message.id).catch(() => undefined);
    } catch (err) {
      this.logger.error({ err, messageId: record.id }, "contact notification failed");
    }

    if (!message && !delivered) {
      throw new UnavailableError(
        "Your message didn’t go through. Email us directly at contact@awebound.store.",
      );
    }

    await this.mailer.sendContactAcknowledgement(record).catch((err: unknown) => {
      this.logger.warn({ err, messageId: record.id }, "contact acknowledgement failed");
    });
  }
}

/** Adds an address to drop notes. Always answers the same way, so it never reveals who is subscribed. */
export class SubscribeToDropNotes {
  constructor(
    private readonly subscribers: SubscriberRepository,
    private readonly mailer: Mailer,
    private readonly logger: Logger,
  ) {}

  async execute(request: SubscribeRequest): Promise<void> {
    const isNew = await this.subscribers.add({ ...request, email: request.email.trim().toLowerCase() });
    if (!isNew) return;
    await this.mailer.sendSubscriberWelcome(request.email).catch((err: unknown) => {
      this.logger.warn({ err }, "subscriber welcome email failed");
    });
  }
}
