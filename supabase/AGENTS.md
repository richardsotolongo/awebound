# AGENTS.md — supabase

Postgres schema and auth email templates for the Awebound store. Used by the Supabase CLI locally; the Deploy to Stage and Deploy to Prod workflows apply new migrations to the stage and production projects with `supabase db push`, so a migration must work with the code already running. The catalog is not here: Fourthwall supplies it.

## Layout

| Path               | Purpose                                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------------------------------- |
| `migrations/*.sql` | Ordered, append-only migrations. Never edit one that has been applied to a shared database; add a new file.    |
| `templates/*.html` | Supabase Auth email templates (magic link + code, confirmation).                                               |
| `config.toml`      | Local CLI config: auth, Google provider, Resend SMTP (off locally; the local mail catcher gets mail). No seed. |

## Schema in one glance

- `profiles` — 1:1 with `auth.users`, created by the `on_auth_user_created` trigger.
- `contact_messages`, `subscribers` — written only by the server with the secret key; RLS on with no policies.
- My Archive (`2026101300*`): `saved_pieces`, `fit_preferences` (unused since Your Fit was removed); `archive_designs`, `archive_design_content` (versioned, draft → approved → published), `archive_assets` (wallpapers in the private `archive-assets` bucket); `checkout_sessions`, `provider_orders`, `provider_order_lines`, `webhook_events`, `reconciliation_runs`, `order_claims` and the `archive_entitlements` view; `founding_members`, `founding_candidates` and `archive_award_founding()`; `feature_flags`, `email_consents`, `email_outbox`, `owner_audit_log`; `user_roles`. All server-only (RLS on, no policies, `service_role` grants). `profiles` now follows `auth.users` (email, `email_verified_at`) and `authenticated` may update `full_name` only.
- `indexnow_pages` — each indexable page's fingerprint when IndexNow was last told about it (server-only, like the Archive tables).
- `idea_submissions` — Idea Submissions from My Archive (image path and size, idea, verse, context, purchases when sent, the owner's status and note); images in the private `idea-submissions` bucket (PNG or JPEG, 10 MB). Server-only.

## Rules

- Every table has RLS enabled.
- Grant table privileges explicitly in the same migration (`grant … to authenticated / service_role`). Supabase no longer grants them by default, not even to `service_role`; a missing grant shows up as `permission denied for table`.
- Functions use `set search_path = ''` and fully qualified names.
- Email templates use inline hex from `packages/brand/src/styles/tokens.css` (email clients can't read CSS variables) and the hosted PNG wordmark at `/email/wordmark-oxblood.png`. Keep copy in brand voice: sentence case, no exclamation marks.
- Validate SQL changes on a real Postgres before committing (a stub `auth` schema and the `anon`/`authenticated`/`service_role` roles are enough).
