import { randomUUID } from "node:crypto";
import type { ContactRequest, SubscribeRequest } from "@awebound/shared";
import type { ContactMessage, ContactRepository, Logger, SubscriberRepository } from "../../application/ports";

/** Development stand-ins used when Supabase isn't configured. Data lives only as long as the process. */
export class InMemoryContactRepository implements ContactRepository {
  readonly messages: ContactMessage[] = [];

  constructor(private readonly logger: Logger) {}

  async save(input: Omit<ContactRequest, "website"> & { userId?: string }): Promise<ContactMessage> {
    const message: ContactMessage = {
      id: randomUUID(),
      name: input.name,
      email: input.email,
      topic: input.topic,
      message: input.message,
      createdAt: new Date(),
    };
    this.messages.push(message);
    this.logger.info({ id: message.id, topic: message.topic }, "contact message kept in memory (no Supabase)");
    return message;
  }

  async markEmailed(): Promise<void> {}
}

export class InMemorySubscriberRepository implements SubscriberRepository {
  private readonly emails = new Set<string>();

  constructor(private readonly logger: Logger) {}

  async add(input: SubscribeRequest): Promise<boolean> {
    const key = input.email.toLowerCase();
    if (this.emails.has(key)) return false;
    this.emails.add(key);
    this.logger.info({ source: input.source }, "subscriber kept in memory (no Supabase)");
    return true;
  }
}
