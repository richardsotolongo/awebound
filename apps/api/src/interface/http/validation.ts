import type { Request } from "express";
import type { z } from "zod";
import { ValidationError } from "../../domain/errors";

function toFields(error: z.ZodError): Record<string, string[]> {
  const fields: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    (fields[key] ??= []).push(issue.message);
  }
  return fields;
}

function parse<S extends z.ZodType>(schema: S, value: unknown, what: string): z.infer<S> {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new ValidationError(`Check the ${what} and try again.`, toFields(result.error));
  }
  return result.data;
}

/** Validates the JSON body against a shared schema. */
export const parseBody = <S extends z.ZodType>(schema: S, req: Request): z.infer<S> =>
  parse(schema, req.body ?? {}, "highlighted fields");

/** Validates the query string against a shared schema. */
export const parseQuery = <S extends z.ZodType>(schema: S, req: Request): z.infer<S> =>
  parse(schema, req.query, "filters");
