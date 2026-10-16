import "server-only";
import { z } from "zod";
import type { DraftFields } from "@/shared";
import raw from "../content/archive-suggestions.json";
import { bibleLink } from "../scripture";
import { approveDraft, listContentStatus, publishContent, rowToFields, saveDraft } from "./content";

/**
 * Suggested wording for a design's Archive content (archive-suggestions.json): rewrites of the
 * owner's own text in the brand voice and in the website's translation, plus its bible.com links
 * in that translation. The owner's editor offers them one design at a time, and the Content page
 * can apply them all at once; nothing is written to the database until the owner does either.
 * Server-only, like the drafts.
 */
const FieldsSchema = z.object({
  publicPreview: z.string().optional(),
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

type Text = z.infer<typeof FieldsSchema>;

/** As the editor holds them: every value a string, the extra Bible links one per line. */
export type SuggestedFields = Text & { bibleUrl?: string; additionalBibleUrls?: string };

const preparedOn = new Date(`${file.prepared_on}T12:00:00Z`).toLocaleDateString("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** The design's fields with the suggestion applied (null when nothing would change). */
function merged(designKey: string, working: DraftFields): DraftFields | null {
  const next: DraftFields = {
    ...working,
    ...(file.designs[designKey] ?? {}),
    bibleUrl: working.bibleUrl ? bibleLink(working.bibleUrl) : working.bibleUrl,
    additionalBibleUrls: working.additionalBibleUrls.map(bibleLink),
  };
  return JSON.stringify(next) === JSON.stringify(working) ? null : next;
}

/** What the editor offers for one design: only the fields that would change. */
export function suggestionFor(
  designKey: string,
  working: DraftFields | null,
): { preparedOn: string; fields: SuggestedFields } | null {
  if (!working) return null;
  const next = merged(designKey, working);
  if (!next) return null;
  const fields: SuggestedFields = {};
  for (const key of Object.keys(FieldsSchema.shape) as (keyof Text)[]) {
    if (next[key] !== working[key]) fields[key] = next[key];
  }
  if (next.bibleUrl !== working.bibleUrl) fields.bibleUrl = next.bibleUrl;
  if (next.additionalBibleUrls.join("\n") !== working.additionalBibleUrls.join("\n"))
    fields.additionalBibleUrls = next.additionalBibleUrls.join("\n");
  return { preparedOn, fields };
}

/** The designs whose open or published version would change, for the Content page. */
export async function pendingSuggestions(): Promise<{ name: string; slug: string }[]> {
  const rows = await listContentStatus();
  return rows.flatMap(({ design, latest, published }) => {
    const working = latest && latest.status !== "retired" ? latest : published;
    return working && merged(design.design_key, rowToFields(working))
      ? [{ name: design.name, slug: design.product_slug }]
      : [];
  });
}

/**
 * The owner's one-click route: every design with a suggestion gets it saved as a draft, approved
 * (its founder note is left exactly as the owner approved it) and published. Returns the keys.
 */
export async function applySuggestions(actor: string): Promise<string[]> {
  const rows = await listContentStatus();
  const changed: string[] = [];
  for (const { design, latest, published } of rows) {
    const working = latest && latest.status !== "retired" ? latest : published;
    if (!working) continue;
    const next = merged(design.design_key, rowToFields(working));
    if (!next) continue;
    await saveDraft(design.design_key, next, actor);
    await approveDraft(design.design_key, actor);
    changed.push(design.design_key);
  }
  return changed.length > 0 ? publishContent(changed, actor) : [];
}
