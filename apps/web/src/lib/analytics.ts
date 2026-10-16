import posthog, { type CaptureOptions } from "posthog-js";
import type events from "./analytics-events.json";

type Events = (typeof events)["$defs"];
export type EventName = keyof Events;
type EventProperties<E extends EventName> = {
  [K in keyof Events[E]["properties"]]: string | number | boolean | null;
};
type EventArgs<E extends EventName> = keyof Events[E]["properties"] extends never
  ? [properties?: undefined, options?: CaptureOptions]
  : [properties: EventProperties<E>, options?: CaptureOptions];

// Everything here is a no-op while PostHog hasn't started (no token, or the visitor opted out).

/** Sends an event declared in analytics-events.json, with exactly its properties. */
export function track<E extends EventName>(event: E, ...[properties, options]: EventArgs<E>) {
  if (posthog.__loaded) posthog.capture(event, properties, options);
}

export function captureError(error: unknown) {
  if (posthog.__loaded) posthog.captureException(error);
}

/**
 * Ties the visitor to their account by its id alone (no email or name reaches PostHog). Signing
 * out, on this device or everywhere, or switching accounts starts a new anonymous visitor.
 */
export function identify(userId: string | undefined) {
  if (!posthog.__loaded) return;
  const current = posthog._isIdentified() ? posthog.get_distinct_id() : undefined;
  if (current === userId) return;
  if (current) posthog.reset();
  if (userId) posthog.identify(userId);
}
