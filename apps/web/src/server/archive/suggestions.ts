import "server-only";
import { z } from "zod";
import raw from "../content/archive-suggestions.json";

/**
 * Suggested wording for a design's Archive content (archive-suggestions.json): rewrites of the
 * owner's own text in the brand voice. The owner's editor offers them; nothing is written to the
 * database until the owner saves, approves or publishes. Server-only, like the drafts.
 */
const FieldsSchema = z.object({
  biblicalContext: z.string().optional(),
  designStory: z.string().optional(),
  imageryMeaning: z.string().optional(),
  shareCopy: z.string().optional(),
});
const FileSchema = z.object({
  prepared_on: z.string(),
  designs: z.record(z.string(), FieldsSchema),
});
const file = FileSchema.parse(raw);

export type SuggestedFields = z.infer<typeof FieldsSchema>;

export function suggestionFor(
  designKey: string,
): { preparedOn: string; fields: SuggestedFields } | null {
  const fields = file.designs[designKey];
  const preparedOn = new Date(`${file.prepared_on}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  return fields ? { preparedOn, fields } : null;
}
