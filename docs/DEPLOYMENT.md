# Deployment (Vercel)

The repo holds two apps, so it deploys as **two Vercel projects from the same GitHub repo**:

| Vercel project | Root Directory | Framework preset | Domain               |
| -------------- | -------------- | ---------------- | -------------------- |
| `awebound-web` | `apps/web`     | Next.js          | `awebound.store`     |
| `awebound-api` | `apps/api`     | Other            | `api.awebound.store` |

Each app carries a `vercel.json` with its install and build commands, so the only setting you must change by hand is the **Root Directory** (Vercel reads `vercel.json` from there and cannot set the Root Directory itself).

## Why "No Output Directory named public" happens

That error means the project was imported at the repo root. The root `package.json` has no Next.js, so Vercel falls back to the "Other" preset, which expects a static `public` folder. Setting the Root Directory to `apps/web` fixes it.

## 1. Fix the existing project (it becomes the web project)

1. Vercel → the project → **Settings → Build and Deployment**.
2. **Root Directory**: `apps/web`. Leave "Include files outside the root directory in the Build Step" on (the app imports `packages/*`).
3. **Framework Preset**: Next.js.
4. **Build Command, Output Directory, Install Command**: turn every override off. `apps/web/vercel.json` sets install (`pnpm install --filter @awebound/web...`) and build (`pnpm build`); Next.js needs no output directory.
5. **Node.js Version** (same page): 22.x.
6. Add the web environment variables (below), then **Deployments → Redeploy**.

Rename the project to `awebound-web` if you like (Settings → General); the CORS pattern below assumes that name.

## 2. Create the API project

1. **Add New → Project**, import `richardsotolongo/awebound` again.
2. **Root Directory**: `apps/api`. **Framework Preset**: Other. Leave build, output and install overrides off.
3. Add the API environment variables (below) and deploy.

`pnpm build:vercel` bundles the Express app and every dependency into one function using Vercel's Build Output API (`apps/api/.vercel/output`, see `apps/api/tsup.vercel.config.ts`). All paths route to that function. Check it at `https://<api-domain>/health`.

## 3. Environment variables

The full, commented list is in [`/.env.example`](../.env.example), split into a WEB block and an API block. Paste each block into its project (Settings → Environment Variables → you can paste a whole `.env` block at once), fill the empty keys, and apply to Production and Preview.

Minimum to go live:

**awebound-web**

```
NEXT_PUBLIC_SITE_URL=https://awebound.store
NEXT_PUBLIC_API_URL=https://api.awebound.store
```

Plus `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for accounts. `NEXT_PUBLIC_*` values are baked in at build time: redeploy the web project after changing them.

**awebound-api**

```
NODE_ENV=production
WEB_ORIGIN=https://awebound.store,https://www.awebound.store,https://awebound-web-*.vercel.app
PUBLIC_SITE_URL=https://awebound.store
TRUST_PROXY=1
RESEND_API_KEY=re_...
CATALOG_SOURCE=fourthwall
COMMERCE_PROVIDER=fourthwall
FOURTHWALL_STOREFRONT_TOKEN=ptkn_...
FOURTHWALL_CHECKOUT_DOMAIN=your-shop.fourthwall.com
```

- `RESEND_API_KEY` is required in production. Without it the API answers every request with `500 misconfigured` and the function log names the missing variable.
- Until the Fourthwall shop is ready, use `CATALOG_SOURCE=seed` and `COMMERCE_PROVIDER=none`: the site shows the sample catalog and "Checkout opens soon".
- Add `SUPABASE_URL` and `SUPABASE_SECRET_KEY` for accounts and to keep contact messages and drop-note sign-ups in the database (without Supabase they are only emailed or held in memory).

## 4. Domains and DNS

1. `awebound-web` → Settings → Domains: add `awebound.store` and `www.awebound.store` (redirect `www` to the apex).
2. `awebound-api` → Settings → Domains: add `api.awebound.store`.
3. At your registrar, create the records Vercel shows for each domain (an `A` record for the apex and `CNAME` records for `www` and `api`), or move the domain's nameservers to Vercel.

Then update the services that know the site's address:

- Supabase → Authentication → URL configuration: Site URL `https://awebound.store`; redirect URLs `https://awebound.store/auth/callback` and `https://awebound.store/auth/confirm`.
- Resend: verify `awebound.store` (SPF, DKIM, DMARC) so `hello@awebound.store` can send.
- Google OAuth consent screen: privacy and terms URLs on `awebound.store`.

## 5. Order of a first launch

1. Deploy the API; open `/health` and `/v1/products`.
2. Set `NEXT_PUBLIC_API_URL` on the web project; redeploy the web project.
3. Add the domains; update `NEXT_PUBLIC_SITE_URL`, `WEB_ORIGIN`, `PUBLIC_SITE_URL` if they changed; redeploy both.
4. Walk through shop → product → bag → checkout (it should land on Fourthwall's checkout) and send a test contact message.

## Notes

- Every push to `main` deploys both projects. To skip builds a commit didn't touch, set **Ignored Build Step** in each project to `git diff --quiet HEAD^ HEAD -- . ../../packages ../../pnpm-lock.yaml`.
- Rate limits are per function instance (in memory). That's fine at launch; see `docs/TODOS.md` for a shared store.
- Running the API somewhere else (Render, Railway, Fly) still works: `pnpm --filter @awebound/api build`, then `node apps/api/dist/main.js`.
