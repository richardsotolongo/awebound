# AGENTS.md — supabase

Postgres schema and auth email templates for the Awebound store. Used by the Supabase CLI locally and applied to the hosted project with `supabase db push`. The catalog is not here: Fourthwall supplies it.

## Layout

| Path               | Purpose                                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------------------------------- |
| `migrations/*.sql` | Ordered, append-only migrations. Never edit one that has been applied to a shared database; add a new file.    |
| `templates/*.html` | Supabase Auth email templates (magic link + code, confirmation).                                               |
| `config.toml`      | Local CLI config: auth, Google provider, Resend SMTP (off locally; the local mail catcher gets mail). No seed. |

## Schema in one glance

- `profiles` — 1:1 with `auth.users`, created by the `on_auth_user_created` trigger.
- `contact_messages`, `subscribers` — written only by the server with the secret key; RLS on with no policies.

## Rules

- Every table has RLS enabled.
- Grant table privileges explicitly in the same migration (`grant … to authenticated / service_role`). Supabase no longer grants them by default, not even to `service_role`; a missing grant shows up as `permission denied for table`.
- Functions use `set search_path = ''` and fully qualified names.
- Email templates use inline hex from `packages/brand/src/styles/tokens.css` (email clients can't read CSS variables) and the hosted PNG wordmark at `/email/wordmark-oxblood.png`. Keep copy in brand voice: sentence case, no exclamation marks.
- Validate SQL changes on a real Postgres before committing (a stub `auth` schema and the `anon`/`authenticated`/`service_role` roles are enough).
