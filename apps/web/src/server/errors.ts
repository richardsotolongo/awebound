import type { z } from "zod";

/** An error whose message is safe to show the shopper. */
export class UserError extends Error {
  constructor(
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
  }
}

/** What every Server Action returns. Next hides thrown messages in production, so errors are values. */
export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fields?: Record<string, string> };

export async function run<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (err) {
    if (err instanceof UserError) return { ok: false, error: err.message, fields: err.fields };
    console.error(err);
    return { ok: false, error: "Something went wrong on our side. Try again in a moment." };
  }
}

/** Parses untrusted input, turning zod issues into per-field messages. */
export function parse<S extends z.ZodType>(schema: S, input: unknown): z.infer<S> {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  const fields: Record<string, string> = {};
  for (const issue of result.error.issues) fields[String(issue.path[0])] ??= issue.message;
  throw new UserError("Check the highlighted fields.", fields);
}
