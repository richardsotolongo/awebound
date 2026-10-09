import type { ContactRequest, SubscribeRequest } from "@awebound/shared";
import type { ContactMessage } from "./mailer";

export interface ContactRepository {
  save(input: Omit<ContactRequest, "website"> & { userId?: string }): Promise<ContactMessage>;
  markEmailed(id: string): Promise<void>;
}

export interface SubscriberRepository {
  /** Returns true when the address is new, false when it was already on the list. */
  add(input: SubscribeRequest): Promise<boolean>;
}
