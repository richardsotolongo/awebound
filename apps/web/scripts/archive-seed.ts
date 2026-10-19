/**
 * Seeds the ten Archive designs from catalog.json and imports the editorial drafts as unpublished
 * draft rows. Idempotent: designs are refreshed, drafts are inserted only where none exist, and
 * nothing is published. Usage: pnpm --filter @awebound/web archive:seed
 */
import { requireEnv } from "./_env";

requireEnv("NEXT_PUBLIC_SUPABASE_URL");
requireEnv("SUPABASE_SECRET_KEY");

const { importDrafts, validateDraftsAgainstCatalog } = await import("../src/server/archive/drafts");

const checks = await validateDraftsAgainstCatalog();
for (const c of checks) {
  console.info(
    `${c.problems.length === 0 ? "ok     " : "MISMATCH"} ${c.designKey}${c.problems.length ? ": " + c.problems.join("; ") : ""}`,
  );
}
const report = await importDrafts(null);
console.info(
  `inserted ${report.inserted.length} draft(s), skipped ${report.skipped.length} (already present or mismatched).`,
);
if (report.mismatches.length > 0) {
  console.error("Fix the mismatches above (catalog.json is the source of truth) and run again.");
  process.exit(1);
}
