import "server-only";

/** Rows as Postgres returns them (no generated types exist; keep in step with supabase/migrations). */

export interface DesignRow {
  design_key: string;
  product_slug: string;
  collection_slug: string;
  name: string;
  scripture_reference: string;
  fourthwall_slug: string;
  fourthwall_offer_id: string | null;
  position: number;
  published_content_id: string | null;
  created_at: string;
  updated_at: string;
}

export type ContentStatus = "draft" | "approved" | "published" | "retired";

export interface ContentRow {
  id: string;
  design_key: string;
  version: number;
  status: ContentStatus;
  public_preview: string;
  biblical_context: string;
  context_reference: string;
  bible_url: string;
  additional_bible_urls: string[];
  design_story: string;
  imagery_meaning: string;
  founder_note: string;
  founder_note_proposed: boolean;
  share_copy: string;
  care_status: "unconfirmed" | "verified";
  care_instructions: string | null;
  care_source: string | null;
  care_verified_at: string | null;
  care_verified_by: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  approved_by: string | null;
  approved_at: string | null;
  published_by: string | null;
  published_at: string | null;
  retired_at: string | null;
}

export interface AssetRow {
  id: string;
  design_key: string | null;
  format: "phone" | "desktop";
  storage_bucket: string;
  storage_path: string;
  mime: "image/png" | "image/jpeg";
  width: number;
  height: number;
  bytes: number;
  sha256: string;
  title: string;
  status: "uploaded" | "published" | "retired";
  uploaded_by: string | null;
  uploaded_at: string;
  published_by: string | null;
  published_at: string | null;
  retired_at: string | null;
}

export interface CheckoutSessionRow {
  id: string;
  cart_id: string;
  user_id: string | null;
  user_email_at_checkout: string | null;
  email_verified_at_checkout: boolean;
  lines: unknown;
  created_at: string;
  matched_order_id: string | null;
  matched_at: string | null;
}

export type PaymentState = "paid" | "revoked" | "pending" | "unknown";
export type LinkMethod = "checkout_session" | "email_match" | "claim" | "owner";

export interface OrderRow {
  id: string;
  friendly_id: string | null;
  checkout_id: string | null;
  email: string | null;
  status_raw: string | null;
  payment_state: PaymentState;
  source_type: string | null;
  test_mode: boolean;
  amounts: unknown;
  total_cents: number | null;
  refunded_cents: number;
  provider_created_at: string | null;
  provider_updated_at: string | null;
  paid_at: string | null;
  raw: unknown;
  first_seen_at: string;
  last_event_at: string | null;
  last_reconciled_at: string | null;
  needs_review: boolean;
  review_reason: string | null;
  user_id: string | null;
  link_method: LinkMethod | null;
  linked_at: string | null;
  registered_checkout: boolean | null;
  checkout_session_id: string | null;
  updated_at: string;
}

export interface OrderLineRow {
  id: string;
  order_id: string;
  offer_id: string | null;
  offer_slug: string | null;
  offer_name: string | null;
  variant_id: string | null;
  product_slug: string | null;
  design_key: string | null;
  color: string | null;
  size: string | null;
  quantity: number;
  refunded_quantity: number;
  eligible_quantity: number;
  unit_cents: number | null;
  line_state: "active" | "refunded" | "cancelled" | "adjusted";
  adjusted_by: string | null;
  adjusted_at: string | null;
  updated_at: string;
}

export interface WebhookEventRow {
  id: string;
  type: string;
  api_version: string | null;
  test_mode: boolean;
  shop_id: string | null;
  received_at: string;
  processed_at: string | null;
  status: "received" | "processed" | "ignored" | "failed";
  error: string | null;
  notes: unknown;
  payload: unknown;
  order_id: string | null;
}

export interface ReconciliationRunRow {
  id: string;
  trigger: "cron" | "owner" | "user";
  user_id: string | null;
  started_at: string;
  finished_at: string | null;
  orders_checked: number;
  orders_changed: number;
  listed_all: boolean;
  cursor: unknown;
  notes: unknown;
  error: string | null;
}

export interface ClaimRow {
  id: string;
  user_id: string;
  order_id: string | null;
  friendly_id: string;
  email_hash: string;
  code_hash: string;
  expires_at: string;
  attempts: number;
  status: "pending" | "verified" | "expired" | "failed" | "unmatched";
  created_at: string;
  verified_at: string | null;
}

export interface FoundingRow {
  id: string;
  user_id: string | null;
  order_id: string | null;
  paid_at: string;
  rank: number;
  awarded_at: string;
  awarded_by: "system" | "reconcile" | "owner";
  status: "active" | "revoked";
  revoked_reason: string | null;
  revoked_by: string | null;
  revoked_at: string | null;
}

export type CandidateReason =
  "contested_window" | "email_mismatch" | "no_checkout_evidence" | "flag_off" | "cap_reached";

export interface CandidateRow {
  user_id: string;
  order_id: string | null;
  paid_at: string;
  reason: CandidateReason;
  created_at: string;
  updated_at: string;
}

export interface FlagRow {
  key: string;
  enabled: boolean;
  note: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface ConsentRow {
  user_id: string;
  topic: string;
  consented: boolean;
  wording_version: string;
  wording: string;
  source: "settings" | "owner";
  consented_at: string | null;
  revoked_at: string | null;
  updated_at: string;
}

export interface RoleRow {
  user_id: string;
  role: "admin";
  granted_by: string | null;
  granted_at: string;
}

export interface AuditRow {
  id: string;
  actor_user_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  before: unknown;
  after: unknown;
  reason: string | null;
  created_at: string;
}

export interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  email_verified_at: string | null;
}
