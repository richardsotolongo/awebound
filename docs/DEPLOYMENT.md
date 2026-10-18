# Deployment

The site is one Next.js app in one Vercel project, `awebound-web`, with Root Directory `apps/web`. It runs in two environments, each with its own Supabase project:

| Environment | Git branch   | Address                | Supabase           |
| ----------- | ------------ | ---------------------- | ------------------ |
| Production  | `production` | `www.awebound.store`   | production project |
| Stage       | `stage`      | `stage.awebound.store` | `awebound-stage`   |

Every other branch, `main` included, builds a Vercel preview that uses the stage database.

## How a change ships

1. Feature branch → pull request → merge into `main`. `.github/workflows/ci.yml` lints, typechecks and builds every pull request and push to `main` that touches more than docs, and `migrations.yml` applies every migration from scratch when `supabase/` changes.
2. GitHub → Actions → **Deploy to Stage** → Run workflow (from `main` by default, or any branch, tag or commit). It applies new migrations to the stage Supabase project, then moves the `stage` branch to that commit. Vercel builds it at `https://stage.awebound.store`.
3. Check stage, then Actions → **Deploy to Prod** → Run workflow. It ships exactly what `stage` holds: new migrations to the production Supabase project, then a fast-forward of the `production` branch, which Vercel builds at `https://www.awebound.store`.

Never push to `stage` or `production` by hand. Migrations run before the new code is live, so a migration must work with the code that is already running: add columns and tables, and rename or drop only in a later deploy.

## Rollback

- Site: Vercel → Deployments → the previous production deployment → Instant Rollback. Vercel then holds new production deployments until you undo the rollback or promote one.
- Database: migrations don't roll back. Fix forward with a new migration, through stage.

## Vercel project settings

- **Build and Deployment**: Root Directory `apps/web`, with "Include files outside the root directory in the Build Step" on (the app imports `packages/*`); Framework Preset Next.js; the Build Command, Output Directory and Install Command overrides off, because `apps/web/vercel.json` sets the install (`pnpm install --frozen-lockfile --filter @awebound/web...`) and the build (`pnpm build`) and registers the two daily crons; Node.js 22.x.
- **Ignored Build Step** (optional, skips previews for commits that don't touch the app): `[ "$VERCEL_GIT_COMMIT_REF" != stage ] && [ "$VERCEL_GIT_COMMIT_REF" != production ] && git diff --quiet HEAD^ HEAD -- . ../../packages ../../pnpm-lock.yaml`. `stage` and `production` always build: a deploy can move them several commits at once, and `HEAD^` sees only the last.
- **Environments → Production → Branch Tracking**: `production`.
- **Domains**: `www.awebound.store` (primary), `awebound.store` (redirects to `www`) and `stage.awebound.store` (Preview, Git branch `stage`). DNS has the `A` record for the apex and the `CNAME` records for `www` and `stage` that Vercel shows.

## Environment variables

Settings → Environment Variables. [`apps/web/.env.example`](../apps/web/.env.example) describes each one, and `apps/web/src/lib/env.ts` (public) and `apps/web/src/server/env.ts` (server) validate them. Preview covers stage and every other preview.

| Variable                                                                                  | Production                        | Preview                        | What it does                                                                                                                     |
| ----------------------------------------------------------------------------------------- | --------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                                                                    | `https://www.awebound.store`      | `https://stage.awebound.store` | The address in canonicals, the sitemap, `llms.txt`, share images and email links. A production build fails while it is localhost |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` | production project                | stage project                  | Accounts, My Archive and stored messages (Supabase → Project settings → API)                                                     |
| `FOURTHWALL_STOREFRONT_TOKEN`                                                             | set                               | same                           | Live catalog and checkout (Fourthwall admin → Settings → For developers)                                                         |
| `FOURTHWALL_CHECKOUT_DOMAIN`                                                              | unset                             | unset                          | Optional custom checkout domain; defaults to `awebound-store-shop.fourthwall.com`                                                |
| `RESEND_API_KEY`                                                                          | set                               | same                           | Sends email. On Vercel, sending fails without it rather than dropping the message                                                |
| `EMAIL_FROM`                                                                              | `Awebound <hello@awebound.store>` | same                           | Sender of every email                                                                                                            |
| `FOURTHWALL_WEBHOOK_SECRET`, `FOURTHWALL_API_USERNAME`, `FOURTHWALL_API_PASSWORD`         | set                               | unset                          | My Archive orders; Fourthwall's webhook points at production ([ARCHIVE.md](ARCHIVE.md))                                          |
| `CRON_SECRET`                                                                             | set                               | unset                          | Bearer token Vercel sends to the daily crons, which run on production only; also a GitHub secret                                 |
| `ARCHIVE_STORAGE_BUCKET`                                                                  | unset                             | unset                          | Optional wallpaper bucket; defaults to `archive-assets`                                                                          |
| `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`                                                       | set                               | unset                          | Analytics, kept off previews so they don't count as visits                                                                       |
| `NEXT_PUBLIC_POSTHOG_HOST`                                                                | unset                             | unset                          | Optional; defaults to PostHog US Cloud                                                                                           |
| `INDEXNOW_KEY`                                                                            | set                               | unset                          | IndexNow key, public by design at `/indexnow-key.txt`                                                                            |

- `NEXT_PUBLIC_*` values are baked in at build time: redeploy after changing one.
- The shop lists every piece in `apps/web/src/server/content/catalog.json`. A piece whose Fourthwall product isn't public shows as a preview: it looks ready to order, but Check out shows a try-again message. A Fourthwall product with no content entry stays hidden. New Fourthwall products and prices reach the site within a minute.
- Contact messages go to `aweboundstore@gmail.com` (`CONTACT_EMAIL` in `apps/web/src/shared/messages.ts`), sent from `EMAIL_FROM` with replies going to the sender.
- Session replay stays off in code, whatever the PostHog project says.
- IndexNow tells Bing and the other engines that take it when a page is new, changed or gone. The daily `/api/indexnow` cron runs it, and so does `.github/workflows/indexnow.yml` right after each production deploy.
- The My Archive variables are optional: each feature stays unavailable until its variable is set, and the owner Health page says which is missing.

## Services that know the site's address

- Production Supabase → Authentication → URL configuration: Site URL `https://www.awebound.store`; redirect URLs `https://www.awebound.store` and `https://www.awebound.store/**` (sign-in returns to `/auth/callback` and `/auth/confirm` on the host the visitor is on).
- Stage Supabase, the same page: Site URL `https://stage.awebound.store`; redirect URLs `https://stage.awebound.store/**`, `https://*-<vercel-team>.vercel.app/**` (previews) and `http://localhost:3000/**`.
- Resend: `awebound.store` is verified (SPF, DKIM, DMARC), so `hello@awebound.store` can send.
- Google OAuth consent screen: privacy and terms URLs on `www.awebound.store`.

If the primary address changes, change `NEXT_PUBLIC_SITE_URL`, the Supabase Site URL and the Vercel primary domain together.

## GitHub secrets and variables

Settings → Secrets and variables → Actions:

| Name                                                       | Kind               | Used by                                                                                                 |
| ---------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------- |
| `CRON_SECRET`                                              | secret             | `indexnow.yml`; the same value as in Vercel                                                             |
| `SUPABASE_ACCESS_TOKEN`                                    | secret             | Both deploy workflows (Supabase → Account → Access tokens)                                              |
| `STAGE_SUPABASE_PROJECT_REF`, `STAGE_SUPABASE_DB_PASSWORD` | secret             | Deploy to Stage                                                                                         |
| `PROD_SUPABASE_PROJECT_REF`, `PROD_SUPABASE_DB_PASSWORD`   | secret             | Deploy to Prod. A lost password can be reset under Database settings; the site itself uses the API keys |
| `SITE_URL`                                                 | variable, optional | `indexnow.yml`; defaults to `https://www.awebound.store`                                                |

The project ref is in each project's dashboard address.

## Setting up stage

Once, in this order, so production never deploys by surprise:

1. **Stage Supabase project**: Supabase → New project `awebound-stage` on the free plan, in production's region; keep the database password. Set its URL configuration (above). Under Authentication → Emails, paste the templates from `supabase/templates/` and set SMTP to Resend, as in production: without custom SMTP Supabase only emails the project's own members, a few an hour. For Google sign-in, enable Google with production's client ID and secret, and add `https://<stage-ref>.supabase.co/auth/v1/callback` to the client's authorized redirect URIs in Google Cloud.
2. **Production's migration history**: `supabase link --project-ref <production ref>`, then `supabase migration list`. Every file in `supabase/migrations` should show a Remote version; record any applied by hand in the SQL editor with `supabase migration repair --status applied <version>`, so Deploy to Prod doesn't run it again.
3. **GitHub**: add the secrets above, then Branches → New branch `production` from `main`.
4. **Vercel**: set Production's Branch Tracking to `production` (from then on a push to `main` builds a preview only), add the `stage.awebound.store` domain, and give Preview its own values from the table above (for a variable shared with Production, untick Preview on it, then add it again for Preview only).
5. **Run Deploy to Stage.** It creates the tables, buckets and feature flags. Then seed the Archive designs and make yourself an admin; stage values set in front of a command take precedence over `.env.local`:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=<stage URL> SUPABASE_SECRET_KEY=<stage secret key> pnpm --filter @awebound/web archive:seed
   ```

   Sign in on stage once, then run `grant:admin <your email>` the same way.

6. Point your own `apps/web/.env.local` at stage, so local development never writes to production.

## Good to know

- A free Supabase project pauses after about a week without activity. If Deploy to Stage can't connect or stage can't sign in, restore the project from the Supabase dashboard.
- Stage is the real shop: it reads the live Fourthwall catalog and Check out opens the real checkout, so don't complete orders there. Its contact form emails the real inbox.
- Stage and previews send `X-Robots-Tag: noindex` (`apps/web/next.config.ts`), so search engines leave them out.
- Vercel's Deployment Protection may ask for a Vercel login on stage. Keep it to keep stage private, or turn it off under Settings → Deployment Protection.
- If Vercel refuses to build `stage` or `production` because of the commit's author, create a Deploy Hook for that branch (Settings → Git → Deploy Hooks) and call it at the end of the workflow.
- Rate limits are per server instance (in memory). A Vercel Firewall rate-limit rule is the real protection (see `docs/TODOS.md`).

## Checking a deploy

Walk through shop → product → bag → checkout (it should land on Fourthwall's checkout) and send a test contact message.

Then check what search engines and AI assistants read: `/robots.txt`, `/sitemap.xml` and `/llms.txt` should show the environment's own address and never `localhost`, and the home page should load with no errors in the browser console. On stage, sign in by email link and check that it comes back to `stage.awebound.store`.

IndexNow, on production: `/indexnow-key.txt` shows the key, and GitHub → Actions → IndexNow ends each run with a report of the pages checked, changed, gone and failed. When pages were sent, its `status` is 200 or 202 (202 means IndexNow is still checking the key). To see what a run would send without sending it, call `curl -H "Authorization: Bearer $CRON_SECRET" "https://www.awebound.store/api/indexnow?dry=1"`. Bing Webmaster Tools → IndexNow lists the pages it received.
