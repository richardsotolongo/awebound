# Deployment (Vercel)

The site is one Next.js app, deployed as **one Vercel project**:

| Vercel project | Root Directory | Framework preset | Domain               |
| -------------- | -------------- | ---------------- | -------------------- |
| `awebound-web` | `apps/web`     | Next.js          | `www.awebound.store` |

`apps/web/vercel.json` holds the install and build commands, so the only setting you must change by hand is the **Root Directory** (Vercel reads `vercel.json` from there and cannot set the Root Directory itself).

It runs two environments: production at `www.awebound.store` and stage at `stage.awebound.store`, each with its own Supabase project. Merges to `main` reach them only through two workflows (section 4).

## Why "No Output Directory named public" happens

That error means the project was imported at the repo root. The root `package.json` has no Next.js, so Vercel falls back to the "Other" preset, which expects a static `public` folder. Setting the Root Directory to `apps/web` fixes it.

## 1. Project settings

1. Vercel → the project → **Settings → Build and Deployment**.
2. **Root Directory**: `apps/web`. Leave "Include files outside the root directory in the Build Step" on (the app imports `packages/*`).
3. **Framework Preset**: Next.js.
4. **Build Command, Output Directory, Install Command**: turn every override off. `apps/web/vercel.json` sets install (`pnpm install --frozen-lockfile --filter @awebound/web...`) and build (`pnpm build`).
5. **Node.js Version** (same page): 22.x.

## 2. Environment variables

Settings → Environment Variables. [`apps/web/.env.example`](../apps/web/.env.example) lists every variable with a comment. The values below are Production's; Preview (stage and every other preview) gets stage values, listed in section 4.

```
NEXT_PUBLIC_SITE_URL=https://www.awebound.store
FOURTHWALL_STOREFRONT_TOKEN=<Fourthwall admin → Settings → For developers>
NEXT_PUBLIC_SUPABASE_URL=<Supabase → Project settings → API>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<same page>
SUPABASE_SECRET_KEY=<same page, secret key>
RESEND_API_KEY=<Resend → API keys>
EMAIL_FROM=Awebound <noreply@awebound.store>
FOURTHWALL_WEBHOOK_SECRET=<Fourthwall admin → Settings → For developers → Webhooks>
FOURTHWALL_API_USERNAME=<same page → Open API → Create API user>
FOURTHWALL_API_PASSWORD=<same>
CRON_SECRET=<a long random string; Vercel sends it to the daily crons>
ARCHIVE_STORAGE_BUCKET=archive-assets
NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=<PostHog → Project settings → Project token; Production only>
INDEXNOW_KEY=<openssl rand -hex 16; Production only>
```

- `NEXT_PUBLIC_SITE_URL` is the one address search engines and AI assistants are told about: every canonical link, the sitemap, `llms.txt`, share images and the links in emails are built from it. It must be the live host exactly (`https://www.awebound.store`, with `www`). A production build fails while it is unset or localhost, so a deploy can't publish `localhost` addresses.
- `FOURTHWALL_STOREFRONT_TOKEN` connects the shop to Fourthwall. Without it (or for pieces not yet created in Fourthwall) the Behold pieces still look ready to order (the site's prices and images, Add to bag), but Check out shows a try-again message. After adding it or new Fourthwall products, the home page picks them up within a minute; redeploy if you want it immediately.
- The shop lists only products that are public in Fourthwall and match the brand content by slug (see `docs/TODOS.md` → Fourthwall).
- `RESEND_API_KEY` is required in production; without it the contact form can't email the inbox. Contact messages always go to `aweboundstore@gmail.com` (`CONTACT_EMAIL` in `apps/web/src/shared/messages.ts`, the address shown everywhere on the site); `CONTACT_INBOX` is no longer read, so delete it from Vercel if it was set. Emails are sent from `EMAIL_FROM` (`noreply@awebound.store`), with replies going to the sender of a contact message or to `aweboundstore@gmail.com`.
- `FOURTHWALL_CHECKOUT_DOMAIN` is optional (default `awebound-store-shop.fourthwall.com`); set it if you connect a custom shop domain in Fourthwall.
- Scripture on the website is always the King James Version (`TRANSLATION` in `apps/web/src/server/scripture.ts`, the owner's decision of October 16, 2026). `SCRIPTURE_TRANSLATION` is no longer read: delete it from Vercel if it was set.
- `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` turns on analytics. Set it for **Production only**, so preview deploys don't count as visits; without it nothing is sent. `NEXT_PUBLIC_POSTHOG_HOST` is optional (PostHog US Cloud by default). Session replay stays off in code whatever the PostHog project says.
- `NEXT_PUBLIC_*` values are baked in at build time: redeploy after changing them.
- The My Archive variables are optional: each feature stays unavailable until its variable is set, and the owner Health page says which is missing. `vercel.json` registers the daily `/api/fourthwall/reconcile` cron; set `CRON_SECRET` before the first deploy that carries it. Setup steps for the webhook, the API user, the first admin and the drafts are in [ARCHIVE.md](ARCHIVE.md).
- `INDEXNOW_KEY` turns on IndexNow, which tells Bing and the other engines that take it when a page is new, changed or gone. Generate it once with `openssl rand -hex 16` and set it for **Production only**. The key is public by design: it is served at `/indexnow-key.txt`. IndexNow also needs Supabase and the `indexnow_pages` table (`supabase db push`). `vercel.json` registers a daily `/api/indexnow` cron, which the Hobby plan allows (one run a day per cron). For a sync right after each production deploy, add the same `CRON_SECRET` value as a repository secret in GitHub (Settings → Secrets and variables → Actions → New repository secret, named `CRON_SECRET`). `.github/workflows/indexnow.yml` then calls `/api/indexnow` once Vercel reports the deployment. If the site ever moves to another address, set a repository variable `SITE_URL` there too.

## 3. Domains and DNS

1. `awebound-web` → Settings → Domains: add `www.awebound.store` (primary) and `awebound.store` (redirects to `www`). `NEXT_PUBLIC_SITE_URL` and the Supabase Site URL use the same host; if the primary ever changes, change all three together.
2. At your registrar, create the records Vercel shows (an `A` record for the apex and a `CNAME` for `www`), or move the domain's nameservers to Vercel.

Then update the services that know the site's address (stage has its own, in section 4):

- Supabase (the production project) → Authentication → URL configuration: Site URL `https://www.awebound.store`; redirect URLs `https://www.awebound.store` and `https://www.awebound.store/**` (sign-in returns to `/auth/callback` and `/auth/confirm` on the host the visitor is on).
- Resend: verify `awebound.store` (SPF, DKIM, DMARC) so `noreply@awebound.store` can send.
- Google OAuth consent screen: privacy and terms URLs on `www.awebound.store`.

## 4. Stage and production

Work reaches the live site in three steps:

1. Feature branch → pull request → merge into `main`. `.github/workflows/ci.yml` lints, typechecks and builds every pull request and push to `main`, and `migrations.yml` applies every migration from scratch when `supabase/` changes. Vercel builds each branch as a preview.
2. GitHub → Actions → **Deploy to Stage** → Run workflow (from `main` by default, or any branch, tag or commit). It applies new migrations to the stage Supabase project, then moves the `stage` branch to that commit. Vercel builds it at `https://stage.awebound.store`.
3. Check stage, then Actions → **Deploy to Prod** → Run workflow. It ships exactly what `stage` holds: new migrations to the production Supabase project, then a fast-forward of the `production` branch, which Vercel builds at `https://www.awebound.store`.

| Branch                   | Moved by        | Vercel     | Address                | Supabase   |
| ------------------------ | --------------- | ---------- | ---------------------- | ---------- |
| `main`, feature branches | you             | Preview    | `*.vercel.app`         | stage      |
| `stage`                  | Deploy to Stage | Preview    | `stage.awebound.store` | stage      |
| `production`             | Deploy to Prod  | Production | `www.awebound.store`   | production |

Never push to `stage` or `production` by hand. Migrations run before the new code is live, so a migration must work with the code that is already running: add columns and tables, and rename or drop only in a later deploy.

### One-time setup

**Stage Supabase project.** Supabase → New project `awebound-stage` on the free plan, in production's region. Keep the database password.

- Authentication → URL configuration: Site URL `https://stage.awebound.store`; redirect URLs `https://stage.awebound.store/**`, `https://*-<vercel-team>.vercel.app/**` (previews) and `http://localhost:3000/**`.
- Authentication → Emails: paste the templates from `supabase/templates/` and set SMTP to Resend, as in production. Without custom SMTP Supabase only emails the project's own members, a few an hour.
- Google sign-in (optional): enable Google with production's client ID and secret, and add `https://<stage-ref>.supabase.co/auth/v1/callback` to the client's authorized redirect URIs in Google Cloud.
- The first Deploy to Stage run creates the tables, buckets and feature flags. Then seed the Archive designs; stage values set in front of the command take precedence over `.env.local`:

  ```bash
  NEXT_PUBLIC_SUPABASE_URL=<stage URL> SUPABASE_SECRET_KEY=<stage secret key> pnpm --filter @awebound/web archive:seed
  ```

  Sign in on stage once, then run `grant:admin <your email>` the same way.

- Point your own `apps/web/.env.local` at stage too, so local development never writes to production.

**Production's migration history.** Before the first Deploy to Prod, run `supabase link --project-ref <production ref>`, then `supabase migration list`: every file in `supabase/migrations` should show a Remote version. If one was applied by hand in the SQL editor, record it with `supabase migration repair --status applied <version>` so the workflow doesn't run it again.

**GitHub secrets** (Settings → Secrets and variables → Actions → New repository secret):

| Secret                                                     | Where                                                                                                |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `SUPABASE_ACCESS_TOKEN`                                    | Supabase → Account → Access tokens                                                                   |
| `STAGE_SUPABASE_PROJECT_REF`, `STAGE_SUPABASE_DB_PASSWORD` | The stage project: the ref is in its dashboard address; the password is the one you kept             |
| `PROD_SUPABASE_PROJECT_REF`, `PROD_SUPABASE_DB_PASSWORD`   | The production project. A lost password can be reset under Database settings; the site uses API keys |

**Vercel**, in this order, so production never deploys by surprise:

1. GitHub → Branches → New branch `production` from `main`.
2. Vercel → Settings → Environments → Production → Branch Tracking: `production` (was `main`). From now on a push to `main` builds a preview only.
3. Settings → Domains → add `stage.awebound.store` for Preview, Git branch `stage`, and add the `CNAME` record Vercel shows at the registrar (nothing to add when the nameservers are Vercel's).
4. Settings → Environment Variables: give Preview its own values. For a variable shared today, untick Preview on it, then add it again for Preview only.

   | Variable                                                                                  | Production                   | Preview                                 |
   | ----------------------------------------------------------------------------------------- | ---------------------------- | --------------------------------------- |
   | `NEXT_PUBLIC_SITE_URL`                                                                    | `https://www.awebound.store` | `https://stage.awebound.store`          |
   | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` | production project           | stage project                           |
   | `RESEND_API_KEY`, `EMAIL_FROM`, `FOURTHWALL_STOREFRONT_TOKEN`, `ARCHIVE_STORAGE_BUCKET`   | set                          | the same values                         |
   | `FOURTHWALL_WEBHOOK_SECRET`, `FOURTHWALL_API_USERNAME`, `FOURTHWALL_API_PASSWORD`         | set                          | unset (the webhook stays on production) |
   | `CRON_SECRET`, `INDEXNOW_KEY`, `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`                        | set                          | unset (crons run on production only)    |

5. Run Deploy to Stage.

### Rollback

- Site: Vercel → Deployments → the previous production deployment → Instant Rollback. Vercel then holds new production deployments until you undo the rollback or promote one.
- Database: migrations don't roll back. Fix forward with a new migration, through stage.

### Good to know

- A free Supabase project pauses after about a week without activity. If Deploy to Stage can't connect or stage can't sign in, restore the project from the Supabase dashboard.
- Stage is the real shop: it reads the live Fourthwall catalog and Check out opens the real checkout, so don't complete orders there. Its contact form emails the real inbox.
- Stage and previews send `X-Robots-Tag: noindex` (`apps/web/next.config.ts`), so search engines leave them out.
- Vercel's Deployment Protection may ask for a Vercel login on stage. Keep it to keep stage private, or turn it off under Settings → Deployment Protection.
- If Vercel refuses to build `stage` or `production` because of the commit's author, create a Deploy Hook for that branch (Settings → Git → Deploy Hooks) and call it at the end of the workflow.

## 5. Check a deploy

Walk through shop → product → bag → checkout (it should land on Fourthwall's checkout) and send a test contact message.

Then check what search engines and AI assistants read: `/robots.txt`, `/sitemap.xml` and `/llms.txt` should show `https://www.awebound.store` addresses and never `localhost`, and the home page should load with no errors in the browser console.

IndexNow: `/indexnow-key.txt` should show the key. In GitHub → Actions → IndexNow, the run after the deploy should end with a report whose `status` is 200 or 202 (202 means the key is still being checked, which is normal the first time). To see what a run would send without sending it, call `curl -H "Authorization: Bearer $CRON_SECRET" "https://www.awebound.store/api/indexnow?dry=1"`. Bing Webmaster Tools → IndexNow lists the pages it received.

## Notes

- To skip previews for commits that don't touch the app, set **Ignored Build Step** to `[ "$VERCEL_GIT_COMMIT_REF" != stage ] && [ "$VERCEL_GIT_COMMIT_REF" != production ] && git diff --quiet HEAD^ HEAD -- . ../../packages ../../pnpm-lock.yaml`. `stage` and `production` always build: a deploy can move them several commits at once, and `HEAD^` sees only the last.
- Rate limits are per server instance (in memory). Add a Vercel Firewall rate-limit rule for real protection (see `docs/TODOS.md`).
