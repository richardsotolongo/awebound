# Deployment (Vercel)

The site is one Next.js app, deployed as **one Vercel project**:

| Vercel project | Root Directory | Framework preset | Domain               |
| -------------- | -------------- | ---------------- | -------------------- |
| `awebound-web` | `apps/web`     | Next.js          | `www.awebound.store` |

`apps/web/vercel.json` holds the install and build commands, so the only setting you must change by hand is the **Root Directory** (Vercel reads `vercel.json` from there and cannot set the Root Directory itself).

## Why "No Output Directory named public" happens

That error means the project was imported at the repo root. The root `package.json` has no Next.js, so Vercel falls back to the "Other" preset, which expects a static `public` folder. Setting the Root Directory to `apps/web` fixes it.

## 1. Project settings

1. Vercel → the project → **Settings → Build and Deployment**.
2. **Root Directory**: `apps/web`. Leave "Include files outside the root directory in the Build Step" on (the app imports `packages/*`).
3. **Framework Preset**: Next.js.
4. **Build Command, Output Directory, Install Command**: turn every override off. `apps/web/vercel.json` sets install (`pnpm install --filter @awebound/web...`) and build (`pnpm build`).
5. **Node.js Version** (same page): 22.x.

## 2. Environment variables

Settings → Environment Variables. [`apps/web/.env.example`](../apps/web/.env.example) lists every variable with a comment. Apply them to Production and Preview.

```
NEXT_PUBLIC_SITE_URL=https://www.awebound.store
FOURTHWALL_STOREFRONT_TOKEN=<Fourthwall admin → Settings → For developers>
NEXT_PUBLIC_SUPABASE_URL=<Supabase → Project settings → API>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<same page>
SUPABASE_SECRET_KEY=<same page, secret key>
RESEND_API_KEY=<Resend → API keys>
EMAIL_FROM=Awebound <noreply@awebound.store>
CONTACT_INBOX=contact@awebound.store
SCRIPTURE_TRANSLATION=NIV
```

- `NEXT_PUBLIC_SITE_URL` is the one address search engines and AI assistants are told about: every canonical link, the sitemap, `llms.txt`, share images and the links in emails are built from it. It must be the live host exactly (`https://www.awebound.store`, with `www`). A production build fails while it is unset or localhost, so a deploy can't publish `localhost` addresses.
- `FOURTHWALL_STOREFRONT_TOKEN` connects the shop to Fourthwall. Without it (or for pieces not yet created in Fourthwall) the Behold pieces still look ready to order (the site's prices and images, Add to bag), but Check out shows a try-again message. After adding it or new Fourthwall products, the home page picks them up within a minute; redeploy if you want it immediately.
- The shop lists only products that are public in Fourthwall and match the brand content by slug (see `docs/TODOS.md` → Fourthwall).
- `RESEND_API_KEY` is required in production; without it the contact form can't email the inbox.
- `FOURTHWALL_CHECKOUT_DOMAIN` is optional (default `awebound-store-shop.fourthwall.com`); set it if you connect a custom shop domain in Fourthwall.
- `SCRIPTURE_TRANSLATION` picks the translation for Scripture quoted on the website: `NIV` (the default when unset) or `KJV`. Website use of the NIV needs Biblica's written permission; set `KJV` to keep NIV text off the public site until it's granted. Redeploy after changing it.
- `NEXT_PUBLIC_*` values are baked in at build time: redeploy after changing them.

## 3. Domains and DNS

1. `awebound-web` → Settings → Domains: add `www.awebound.store` (primary) and `awebound.store` (redirects to `www`). `NEXT_PUBLIC_SITE_URL` and the Supabase Site URL use the same host; if the primary ever changes, change all three together.
2. At your registrar, create the records Vercel shows (an `A` record for the apex and a `CNAME` for `www`), or move the domain's nameservers to Vercel.

Then update the services that know the site's address:

- Supabase → Authentication → URL configuration: Site URL `https://www.awebound.store`; redirect URLs `https://www.awebound.store` and `https://www.awebound.store/**` (sign-in returns to `/auth/callback` and `/auth/confirm` on the host the visitor is on).
- Resend: verify `awebound.store` (SPF, DKIM, DMARC) so `noreply@awebound.store` can send.
- Google OAuth consent screen: privacy and terms URLs on `www.awebound.store`.

## 4. Check a deploy

Walk through shop → product → bag → checkout (it should land on Fourthwall's checkout) and send a test contact message.

Then check what search engines and AI assistants read: `/robots.txt`, `/sitemap.xml` and `/llms.txt` should show `https://www.awebound.store` addresses and never `localhost`, and the home page should load with no errors in the browser console.

## Notes

- Every push to `main` deploys. To skip builds a commit didn't touch, set **Ignored Build Step** to `git diff --quiet HEAD^ HEAD -- . ../../packages ../../pnpm-lock.yaml`.
- Rate limits are per server instance (in memory). Add a Vercel Firewall rate-limit rule for real protection (see `docs/TODOS.md`).
