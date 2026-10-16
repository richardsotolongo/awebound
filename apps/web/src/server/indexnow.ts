import "server-only";
import { createHash } from "node:crypto";
import { siteUrl } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { serverEnv } from "./env";
import { indexablePages } from "./indexable";

/** IndexNow's shared endpoint: Bing, Yandex, Seznam, Naver and Yep all receive what it gets. */
const ENDPOINT = "https://api.indexnow.org/indexnow";
/** The most URLs one submission may carry. */
const MAX_URLS = 10_000;
/** Where the key file is served (app/indexnow-key.txt). At the root, it covers the whole host. */
export const KEY_PATH = "/indexnow-key.txt";

export interface IndexNowReport {
  dryRun: boolean;
  /** Why nothing was checked or sent. */
  skipped?: string;
  /** Pages looked at: every indexable page and every page sent before. */
  checked: number;
  /** New or changed pages: sent, or in a dry run, the ones that would be. */
  changed: string[];
  /** Pages sent before that now answer 404, 410 or a redirect, so engines drop or move them. */
  gone: string[];
  /** Indexable pages that didn't load. They're tried again on the next run. */
  failed: string[];
  /** IndexNow's answer: 200 received, 202 received while the key is still being checked. */
  status?: number;
  /** What each page looks like now, in a dry run. */
  fingerprints?: Record<string, string>;
}

interface Look {
  status: number;
  /** A hash of what a reader sees, or null when the page didn't answer 200. */
  fingerprint: string | null;
}

/**
 * Loads a page as a visitor would and hashes its title, description and body text. Markup,
 * scripts and build hashes are left out, so a deploy that changes nothing a reader sees changes
 * nothing here.
 */
async function look(url: string): Promise<Look> {
  try {
    const res = await fetch(url, {
      redirect: "manual",
      cache: "no-store",
      headers: { "user-agent": "Awebound-IndexNow" },
      signal: AbortSignal.timeout(15_000),
    });
    if (res.status !== 200) return { status: res.status, fingerprint: null };
    const html = await res.text();
    const text = [
      html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1],
      html.match(/<meta name="description" content="([^"]*)"/i)?.[1],
      html
        .match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1]
        ?.replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, " ")
        .replace(/<[^>]*>/g, " "),
    ]
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    return { status: 200, fingerprint: createHash("sha256").update(text).digest("hex") };
  } catch {
    return { status: 0, fingerprint: null };
  }
}

const isGone = (status: number) =>
  status === 404 || status === 410 || (status >= 300 && status < 400);

/** Each page sent before, with its fingerprint then. */
async function sentPages(): Promise<Map<string, string>> {
  if (!supabaseAdmin) return new Map();
  const { data, error } = await supabaseAdmin.from("indexnow_pages").select("url, fingerprint");
  if (error) throw new Error(`IndexNow ledger read failed: ${error.message}`);
  const rows = (data ?? []) as { url: string; fingerprint: string }[];
  return new Map(rows.map((r) => [r.url, r.fingerprint]));
}

/**
 * Tells IndexNow about every indexable page that is new, changed or gone since it was last sent,
 * in one submission. Safe to run at any time and from any event: when nothing a reader sees has
 * changed, nothing is sent. A failed submission leaves the record as it was, so the next run
 * sends the same pages again.
 */
export async function syncIndexNow({ dryRun = false } = {}): Promise<IndexNowReport> {
  const report: IndexNowReport = { dryRun, checked: 0, changed: [], gone: [], failed: [] };
  const key = serverEnv.INDEXNOW_KEY;
  if (!dryRun && !key) return { ...report, skipped: "INDEXNOW_KEY is not set" };
  if (!dryRun && !supabaseAdmin) return { ...report, skipped: "Supabase is not configured" };

  const listed = (await indexablePages()).map((p) => `${siteUrl}${p.path}`);
  const sent = await sentPages();
  const urls = [...new Set([...listed, ...sent.keys()])];
  const looks = new Map(
    await Promise.all(urls.map(async (url) => [url, await look(url)] as const)),
  );
  const now = (url: string) => looks.get(url)!;

  report.checked = urls.length;
  report.changed = listed.filter((u) => now(u).fingerprint && now(u).fingerprint !== sent.get(u));
  report.failed = listed.filter((u) => !now(u).fingerprint);
  const isListed = new Set(listed);
  report.gone = [...sent.keys()].filter((u) => !isListed.has(u) && isGone(now(u).status));
  if (dryRun) {
    const fingerprints = Object.fromEntries(listed.map((u) => [u, now(u).fingerprint ?? ""]));
    return { ...report, fingerprints };
  }
  if (report.changed.length === 0 && report.gone.length === 0) return report;

  const urlList = [...report.changed, ...report.gone].slice(0, MAX_URLS);
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: new URL(siteUrl).host,
      key,
      keyLocation: `${siteUrl}${KEY_PATH}`,
      urlList,
    }),
    signal: AbortSignal.timeout(30_000),
  });
  report.status = res.status;
  if (res.status !== 200 && res.status !== 202) {
    const body = (await res.text().catch(() => "")).slice(0, 300);
    console.error(`[indexnow] ${res.status} for ${urlList.length} URLs: ${body}`);
    return report;
  }

  const included = new Set(urlList);
  const submittedAt = new Date().toISOString();
  const rows = report.changed
    .filter((url) => included.has(url))
    .map((url) => ({ url, fingerprint: now(url).fingerprint!, submitted_at: submittedAt }));
  const db = supabaseAdmin!;
  if (rows.length > 0) {
    const { error } = await db.from("indexnow_pages").upsert(rows);
    if (error) throw new Error(`IndexNow ledger write failed: ${error.message}`);
  }
  const dropped = report.gone.filter((url) => included.has(url));
  if (dropped.length > 0) {
    const { error } = await db.from("indexnow_pages").delete().in("url", dropped);
    if (error) throw new Error(`IndexNow ledger write failed: ${error.message}`);
  }
  console.info(`[indexnow] sent ${urlList.length} URLs (${res.status})`);
  return report;
}

/** When each page was last sent, for the sitemap's lastmod. Empty when the record can't be read. */
export async function indexNowDates(): Promise<Map<string, string>> {
  if (!supabaseAdmin) return new Map();
  const { data, error } = await supabaseAdmin.from("indexnow_pages").select("url, submitted_at");
  if (error) {
    console.error(`[indexnow] dates unavailable: ${error.message}`);
    return new Map();
  }
  const rows = (data ?? []) as { url: string; submitted_at: string }[];
  return new Map(rows.map((r) => [r.url, r.submitted_at]));
}
