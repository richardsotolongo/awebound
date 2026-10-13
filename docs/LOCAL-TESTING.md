# Testing locally, step by step

How to run the site, the database and My Archive on your own machine, check a change the way the
repo expects, and push with confidence. Read this top to bottom the first time; after that, the
checklist at the end is the part you repeat.

## 1. Tools (once)

- Node 22 and pnpm 10: `corepack enable` picks up the version pinned in `package.json`.
- Docker Desktop, running (the local Supabase stack is a set of containers).
- Supabase CLI: `brew install supabase/tap/supabase` on macOS, `scoop install supabase` on Windows,
  or prefix every `supabase` command below with `npx supabase@latest`.
- A browser. There are no automated tests in this repo by design; the flows are checked by hand.

```bash
git clone git@github.com:richardsotolongo/awebound.git
cd awebound
pnpm install
```

## 2. Keys: where each one comes from

Nothing in this table is committed. Local values go in `apps/web/.env.local` (ignored by git);
production values go in Vercel and in the Supabase and Fourthwall dashboards.

| Variable                                              | Local value                                                                              | Production value                                                               | Needed for                               |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                                | `http://localhost:3000`                                                                  | `https://www.awebound.store`                                                   | links, share images                      |
| `NEXT_PUBLIC_SUPABASE_URL`                            | `http://127.0.0.1:54321` (from `supabase status`)                                        | Supabase → Project settings → API                                              | accounts                                 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`                | the publishable key `supabase status` prints (older CLIs print an "anon key"; both work) | same page                                                                      | accounts                                 |
| `SUPABASE_SECRET_KEY`                                 | the secret key `supabase status` prints (older CLIs: "service_role key")                 | same page, secret key                                                          | everything server-side                   |
| `FOURTHWALL_STOREFRONT_TOKEN`                         | the real one, or leave empty to use the catalog file                                     | Fourthwall admin → Settings → For developers → Storefront token                | live catalog and checkout                |
| `FOURTHWALL_WEBHOOK_SECRET`                           | any string you make up, for the fixture command: `openssl rand -hex 32`                  | the secret Fourthwall shows when you create the webhook (same page → Webhooks) | order history, Founding, the fixture     |
| `FOURTHWALL_API_USERNAME` / `FOURTHWALL_API_PASSWORD` | leave empty unless you want to test Refresh orders                                       | same page → Open API → Create API user                                         | reconcile, Refresh orders, claim lookups |
| `CRON_SECRET`                                         | `openssl rand -base64 32`                                                                | another random string, set in Vercel before the first deploy                   | the daily reconcile cron                 |
| `RESEND_API_KEY`                                      | leave empty: emails print in the `pnpm dev` terminal                                     | Resend → API keys (domain verified)                                            | real emails                              |
| `ARCHIVE_STORAGE_BUCKET`                              | leave empty (defaults to `archive-assets`)                                               | same                                                                           | wallpapers                               |

Google sign-in locally needs a Google Cloud OAuth client whose redirect URI is
`http://127.0.0.1:54321/auth/v1/callback`; put its id and secret in `supabase/.env` as
`SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` and `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET`. Email sign-in
needs nothing, so skip Google until you want to test that button specifically. If `supabase start`
complains that those two variables are unset, give them placeholder values.

A minimal `apps/web/.env.local` for Archive work:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<from supabase status>
SUPABASE_SECRET_KEY=<from supabase status>
FOURTHWALL_STOREFRONT_TOKEN=
FOURTHWALL_WEBHOOK_SECRET=<openssl rand -hex 32>
CRON_SECRET=<openssl rand -base64 32>
```

## 3. Start the database

```bash
supabase start      # first run downloads the images; later runs take seconds
supabase db reset   # drops the local database and applies supabase/migrations in order
supabase status     # prints the URL and keys for .env.local
```

Local addresses:

- API: http://127.0.0.1:54321
- Studio (tables, SQL editor): http://127.0.0.1:54323
- Mail catcher (every sign-in link and code lands here): http://127.0.0.1:54324

`supabase db reset` is the migration test: it must finish without an error and every table in
`supabase/AGENTS.md` must exist afterwards (Studio → Table editor). Run it again whenever you add or
change a migration. The Archive schema has no seed data; section 6 fills the designs and drafts.

Stop everything with `supabase stop` (keeps the data) or `supabase stop --no-backup` (wipes it).

## 4. Code checks (what CI would run if there were one)

From the repo root, before every push:

```bash
pnpm typecheck      # next typegen (route types) then tsc --noEmit, every package
pnpm lint           # ESLint everywhere, Next's rules for the web app
pnpm format:check   # Prettier; `pnpm format` rewrites
pnpm build          # the production build, the same one Vercel runs
```

All four must exit 0. A production build needs the public Supabase variables set in
`apps/web/.env.local` the way they are in section 2; without them `/account` builds as the "open
soon" state, which is also fine for a quick check.

About generated types: the app types its rows by hand (`apps/web/src/server/archive/types.ts`),
and nothing imports a generated file, so there is no generation step. If you want a reference to
compare against after a schema change, run
`supabase gen types typescript --local --schema public > /tmp/database.types.ts` and read it
next to `types.ts`.

## 5. Migrations

Rules from `supabase/AGENTS.md`: append-only; never edit a migration that reached a shared database;
RLS on every table; grants explicit; functions with `set search_path = ''`.

```bash
supabase migration new short_name          # creates supabase/migrations/<timestamp>_short_name.sql
# write the SQL, then
supabase db reset                          # applies everything from scratch
```

When the local reset is clean and the pages work, ship it to the hosted project:

```bash
supabase login
supabase link --project-ref <your project ref>   # Supabase dashboard → Project settings → General
supabase db push --dry-run                       # lists what would be applied
supabase db push                                 # applies the pending migrations
supabase config push                             # auth settings and the three email templates
```

`db push` only applies migrations the hosted project has not seen, so running it after each merge is
safe. Do this before (or at the latest together with) the deploy that needs the schema: a deployed
`/account` on a database without the Archive tables shows the site's error page to signed-in
visitors.

## 6. Seed the Archive and make yourself admin

```bash
pnpm dev                                          # http://localhost:3000, in its own terminal
pnpm --filter @awebound/web archive:seed          # ten design rows + the ten drafts, unpublished
```

Sign in once (section 7, steps 2 to 4), then:

```bash
pnpm --filter @awebound/web grant:admin you@example.com
```

The script needs the Supabase variables from `.env.local`; it prints the user id it granted. Revoke
with `revoke:admin`. The same two steps are what you run against production after the first deploy,
with `.env.local` pointed at the hosted project for the duration of the command.

## 7. Walk the UI

Each step says what you should see. Stop and fix at the first one that differs.

1. Signed out: `/account` redirects to `/sign-in?next=%2Faccount`; `/account/admin` too.
   `/sign-in` shows "Join Awebound", "Accounts are free. Guest checkout is always available." and
   under "Right away" two bullets, or three once `FOURTHWALL_WEBHOOK_SECRET` is set. No purchase
   bullets and no Founding sentence yet: nothing is published.
2. Enter your email, "Email me a sign-in link". The page shows the code field.
3. Open http://127.0.0.1:54324, find the email, copy the 6-digit code (or click the link).
4. You land on `/account`: "My Archive", the welcome paragraph, four panels with their empty states.
5. `/shop/thorns-to-lilies`: "Save this piece" under the bag controls; click it, it becomes
   "Remove from saved". `/account/saved` lists the piece; the overview shows one thumbnail.
6. `/account/fit`: pick a size for a tee, save; the caps take a note only. The overview shows it.
7. `/account/settings`: change your name; change your email (both inboxes are the mail catcher;
   confirm both). The "Email address" panel asks you to sign in again 15 minutes after sign-in.
8. Admin: `/account/admin` shows Health with the missing variables by name, the flags, and zero
   published designs. Content → open a design → "Approve" (tick the founder-note box) → "Publish".
   Repeat for one or two designs, or "Publish all approved" after approving them.
9. `/shop/thorns-to-lilies` now ends with "The passage in context" and the unlock line.
   `/sign-in` now lists "Read the full story and founder note behind each design you own."
10. `/account/collection`: the published designs are locked ("Own this design to unlock its full
    story and founder note."), the rest say "Story coming soon."
11. A purchase, without Fourthwall. In a third terminal:

    ```bash
    pnpm --filter @awebound/web archive:webhook -- --email you@example.com --slug thorns-to-lilies
    ```

    It signs a made-up `ORDER_PLACED` event with your `FOURTHWALL_WEBHOOK_SECRET` and posts it to
    the dev server, which links it to your account through the verified email (guest provenance).
    Expect `200 {"ok":true}` and the order id it printed. Then: `/account/orders` lists the order as
    "Payment confirmed"; `/account/collection` shows the design as "Owned"; its card shows the full
    story, the imagery, the note from Richard, your piece, the care line, "Your wallpaper is being
    prepared." and the downloads. "Download design card (PDF)" and "Create story image" produce real
    files. Admin → Orders shows the event as processed, with what the payload contained.

12. The Founding seal. Guest-provenance orders never qualify, so send one that looks like a checkout
    made while signed in (the command records the checkout session first):

    ```bash
    pnpm --filter @awebound/web archive:webhook -- --email you@example.com --slug by-his-hem --registered
    ```

    The overview now shows the Founding Member seal; Admin → Founding lists you at rank 1.

13. A refund. Re-send the first order as an update:

    ```bash
    pnpm --filter @awebound/web archive:webhook -- --email you@example.com --slug thorns-to-lilies \
      --order <the id from step 11> --type ORDER_UPDATED --status REFUNDED
    ```

    `/account/orders` says "Cancelled or refunded", the card is locked again, the seal from step 12
    stays (an ordinary refund never removes it).

14. Linking a past order: `/account/orders/link`, enter any order number. In development the code
    prints in the `pnpm dev` terminal instead of going out by email. Expect the uniform "If that
    order exists…" sentence whatever you type, and "That code didn't work" for a wrong code.
15. A test-mode event grants nothing: add `--test` to step 11's command with a new `--order` id; the
    order appears in Admin → Orders as test, and nothing unlocks.
16. A bad signature is refused:

    ```bash
    curl -i -X POST http://localhost:3000/api/fourthwall/webhook \
      -H 'content-type: application/json' -H 'x-fourthwall-hmac-sha256: nope' -d '{}'
    ```

    Expect 401. Without `FOURTHWALL_WEBHOOK_SECRET` in `.env.local` the answer is 503.

17. Wallpapers: register a PNG and publish it, then reload the owned card:

    ```bash
    pnpm --filter @awebound/web archive:intake -- path/to/file.png --format phone --design thorns-to-lilies --publish
    ```

    The card shows "Download the phone wallpaper (width x height)" with the real pixel size.

18. Exports without a database at all (useful while editing the PDF or the story image):

    ```bash
    pnpm --filter @awebound/web archive:render-check -- thorns-to-lilies
    ```

    Files land in `apps/web/.render-check/`; open them.

19. Phone width: repeat steps 1, 4, 5 and 11 with the browser at 375 px wide (responsive mode).
    Nothing should scroll sideways, one primary button per screen, no label above a heading.

To start over: `supabase db reset`, then section 6 again.

## 8. Before you push

```bash
pnpm typecheck && pnpm lint && pnpm format:check && pnpm build
supabase db reset        # when a migration changed
git status               # no .env files, no .render-check, no generated types
```

Then commit and push. Vercel builds a preview for every branch; the preview uses the production
Supabase project unless you give the Preview environment its own variables, so apply new migrations
with `supabase db push` before you sign in on a preview that needs them.

## 9. After a merge, in this order

1. `supabase db push` (and `supabase config push` when templates or auth settings changed).
2. Vercel variables, if any were added (`docs/DEPLOYMENT.md`).
3. Fourthwall: the webhook and the API user, once (`docs/ARCHIVE.md` → Setup).
4. Sign in on the live site, then `grant:admin` with `.env.local` pointed at production.
5. Admin → Health → "Import the ten drafts"; approve and publish when the copy is final.
