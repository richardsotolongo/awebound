# My Archive

The account area at `/account`: a free home for saved pieces and linked orders, and the full story, founder note and digital extras of every design a shopper has bought. This file is the owner's guide and the reference for how it works.

## What a visitor, a member and a buyer get

| Who                   | Gets                                                                                                                                                                                                                                                                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Public visitor        | A design's published public preview and "The passage in context" on its product page (`/shop/<address>#story`), and the discovery surfaces below, which say what an account and a purchase bring.                                                                                                                                          |
| Verified free account | My Archive: Saved Pieces (saved with the heart on any piece), Settings (name, email change, sign out everywhere, deletion), order history and the collection view with honest empty states. No full stories, founder notes, wallpapers, PDFs or share images come with signup, and there is no free wallpaper library.                     |
| Eligible buyer        | For each design bought in a paid, real order linked to the account: the full story, the imagery explanation, the note from Richard, the purchased variants, the published phone and desktop wallpapers, the design card PDF and the story images. One design never unlocks another. The purchaser owns the benefits, not a gift recipient. |
| Guest buyer           | Checkout and Fourthwall's order emails. After signing in with the email used at checkout the order links itself; a different email can be proved with a code sent to the address on the order. A guest order never earns the Founding seal.                                                                                                |
| Dedicated buyer       | **Idea Submissions**: after 5 purchases linked to the account, one design idea for an Awebound piece (an image, their idea, the verse and its biblical context, any of them), and one more for every 3 purchases after that. The chosen idea is made and its sender's piece is free. Details below.                                        |
| Founding Member       | The first 50 unique buyers whose paid order was placed while signed in. An understated seal on the Archive overview; no rank, count or perks in public. Policy below.                                                                                                                                                                      |

A wallpaper or a story shows once it is published, and nothing stands in for it before then. Care belongs to the product page, not the Archive: the cards, the design card PDF and the owner pages carry no care section.

## Discovery: where shoppers meet My Archive

Six places introduce My Archive. Wherever accounts are open they describe everything the Archive holds; what a person actually gets (cards, the buyer's welcome, the collection, the Founding seal) follows what is ready.

Readiness comes first (`apps/web/src/server/archive/readiness.ts`; the Health page shows it):

| Bit         | Needs                                                                                     | Gates                                                         |
| ----------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| orders      | database, `FOURTHWALL_WEBHOOK_SECRET`, flag                                               | order history, the "linked orders" benefit, Founding          |
| platformApi | API user                                                                                  | Refresh orders, reconcile, claim lookups, Founding settlement |
| claims      | orders, `RESEND_API_KEY` (in production; elsewhere the code prints to the terminal), flag | Link a past order                                             |
| founding    | orders, flag                                                                              | the Founding sentence and seal                                |
| content     | a published design                                                                        | full-story benefit, product page story section                |
| wallpapers  | database, bucket reachable, flag (and a published file for the benefit line)              | wallpaper downloads                                           |
| pdf / share | flag, the export fonts, a published design                                                | the PDF button and the story images                           |

Stage has no webhook secret or API user, so orders, claims, Founding and the Platform API are off there.

One public summary then decides every claim: `getArchiveOffer()` (`apps/web/src/server/archive/offer.ts`) turns readiness into booleans and is re-read at most once a minute, and `apps/web/src/features/archive/offer.ts` holds every sentence built from them.

| Offer bit    | True when                                                         | Turns on                                                                                                  |
| ------------ | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| accounts     | the Supabase public keys and the secret key are set               | every surface below; nothing shows while accounts are off                                                 |
| orders       | accounts and the readiness bit `orders`                           | the linked-orders line, the guest-order lines, the FAQ's linking answer                                   |
| claims       | orders and the readiness bit `claims`                             | the FAQ's "different email" answer (otherwise "write to us")                                              |
| stories      | orders and at least one published design                          | a buyer's own access (cards, the buyer's welcome); the explanations below show either way                 |
| wallpapers   | stories, the readiness bit `wallpapers` and a published wallpaper | the general wallpaper line; per design, only where that design has a published file                       |
| pdf / share  | stories and the readiness bit `pdf` / `share`                     | the design card and story image lines                                                                     |
| foundingOpen | orders, the readiness bit `founding` and fewer than 50 places     | the Founding sentence on sign-in and in the FAQ; no count is ever shown, and a failed count reads as full |

The six places:

| Surface            | Where                                                                                       | What it says                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home introduction  | `/`, after the release wall (`features/home/archive-intro.tsx`)                             | "Wear the piece. Know its story.", one paragraph ("My Archive is your personal space for the Awebound pieces you love. Create a free account to save your favorites. Each design you buy unlocks its deeper story, a personal note from Richard and digital extras like phone and desktop wallpapers, all kept with its Scripture and biblical context, bringing you closer to the meaning behind what you wear.") and one button, **Create your free Archive** (`/sign-in?next=/account`) or **Open My Archive** (`/account`), beside a preview of By His Hem's card (the first published design if By His Hem isn't): the garment on its plate, its name, Scripture reference and published public preview, the parts a purchase opens named with a lock, and "A preview of the By His Hem card in My Archive." The card shows whenever accounts are open. With no published design, it previews the lead piece with its own public fields (name, reference, the sentence on what its art shows). An owner of that design reads "Open in your Archive" instead. |
| Product note       | `/shop/<address>`, under delivery and returns (`features/archive/product-archive-note.tsx`) | Every product page while accounts are open, under Add to bag and delivery: "Your piece continues in My Archive." and "Purchase this design to unlock the deeper story behind it, a founder’s note from Richard and digital extras like phone and desktop wallpapers, kept with its Scripture and biblical context." Signed out: **Create your free Archive**, back to the piece. Signed in: **Open My Archive**. An owner: "[Design] is in your Archive, with its story and a note from Richard." and **View this piece in My Archive**, straight to its card.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Sign in            | `/sign-in` (`features/archive/benefits-list.tsx`)                                           | Tiles with pictures drawn from the release's own pieces, in two groups: "Included with your account" (Save with the heart, On every device, Your orders together, Open to everyone with a verse and the guest-checkout line) and "With each design you buy" (The deeper design story, A founder’s note from Richard, Scripture and biblical context, Wallpapers and extras) with the line that signing up alone doesn't open them; then the Founding sentence while places remain. Protected content is pictured (a lock, the lines of a letter), never shown. The form comes first, at the top of the page, and says "Accounts are free. Guest checkout is always available."; the tiles follow beneath it, four across on wide screens.                                                                                                                                                                                                                                                                                                                         |
| Welcome            | `/account` (`features/archive/archive-welcome.tsx`)                                         | On bone paper, so it stands apart from Idea Submissions. A new account: one sentence (save with the heart, find it under Saved) and **Explore Behold**. A buyer: "[Design] is in your Archive." with **Open [design]** (or the collection, for several). Either way it lists what Your collection keeps for each design bought ("Each design you buy is kept in Your collection, with:" and the empty collection's six lines, `COLLECTION_HOLDS`) and links to Your collection. Always shown, with no Dismiss: with Your collection, Saved and Orders in the navigation, the welcome and Idea Submissions are the overview. No popup and no tour.                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Account navigation | every `/account` page (`features/archive/archive-nav.tsx`)                                  | **My Archive** and **Your collection** as the two red buttons, then a rule and Saved, Orders, Settings, and Owner for admins. An empty collection lists what each design brings to it (the deeper story, the meaning of its imagery, Richard's note, its Scripture and biblical context, phone and desktop wallpapers, the design card PDF and story images), then why it's empty.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Entry points       | header, phone menu, footer, FAQ                                                             | Header: "Sign in" or "Account". Phone menu, signed out: **Join Awebound** with "Free, and never needed to order. Members sign in here too." Footer: "My Archive" while accounts are on. FAQ, "Your Archive": built from the offer and re-rendered every minute.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

Public pages and their cached data carry only booleans, published public card fields (name, Scripture reference, public preview, biblical context) and wallpaper kinds. The full story, the imagery, Richard's note, asset ids and storage paths never reach them, and the product note's ownership check answers yes or no.

To walk the three states on a local stack (Docker running):

```bash
supabase start                                   # from the repo root; the migrations apply
# apps/web/.env.local: the local URL, publishable and secret keys, and any FOURTHWALL_WEBHOOK_SECRET
pnpm --filter @awebound/web archive:seed         # the ten designs, drafts unpublished
pnpm --filter @awebound/web build && pnpm --filter @awebound/web start
```

1. Signed out, nothing published: the home page previews the lead piece's card from its public fields, every product page has its note, sign-in shows both groups of tiles.
2. Publish a design or two (Owner → Content: approve, then publish). On the next visit the home card previews By His Hem's published card and its product page gains "The passage in context".
3. Sign in with the email code (local emails at http://localhost:54324): **Open My Archive** on the home page and on the product note, the new account's welcome.
4. `pnpm --filter @awebound/web archive:webhook -- --email <that address> --slug <published slug> --registered`: the note links to the card, and the buyer's welcome and the Founding seal appear.
5. `pnpm --filter @awebound/web archive:intake -- <png> --format phone --design <slug> --publish`: the wallpaper line appears for that design only, and its owner can download the file.

`--slug` and `--design` take a design's internal slug: `the-passage` for Fear Not, whose address in the shop and My Archive is `fear-not`.

## Owner guide (`/account/admin`, admins only)

Admins are accounts with the `admin` role. Grant the first one from the command line after that person has signed in once:

```bash
pnpm --filter @awebound/web grant:admin richard@example.com   # needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY in apps/web/.env.local
pnpm --filter @awebound/web revoke:admin richard@example.com
```

Every owner change is written to `owner_audit_log` and shown on the Audit page.

### Health

What is set (by name, never by value), the feature flags with a switch for each, order counts, the last webhook and reconciliation, the email outbox and the "Provider assumptions" panel (statuses, source types, API versions, checkout matches and the fields seen in real payloads). "Import the ten drafts" loads the editorial drafts as unpublished drafts. "Reconcile orders now" re-reads orders from Fourthwall's API (needs the API user). "Send queued emails" sends what waits in the outbox.

Flags (table `feature_flags`): the migration seeds `archive.orders`, `archive.claims`, `archive.founding`, `archive.wallpapers`, `archive.pdf` and `archive.share` on and every `email.*` flag off. A flag only allows a feature; the environment must also be ready (the readiness table above).

### Content: the ten drafts

1. **Import** them (Health or Content page, or `pnpm --filter @awebound/web archive:seed`) from `apps/web/src/server/content/archive-drafts.json`, which is server-only. Each becomes version 1, status `draft`, with `founder_note_proposed = true`. The import checks every draft against `catalog.json` (slug, name, Scripture reference, catalog code, garment, collection) and refuses a draft that disagrees.
2. **Review** on Content → the design: edit any field, "Save draft". Saving resets the approval. A saved or approved version is not on the site: the site, and the "What the public sees" and "What an owner sees" sections of the admin page, show the published version only.
3. **Approve**: tick "I’ve reviewed the founder note and it is my own wording", then Approve. Unsaved edits are saved first, so Approve never drops them. The founder notes are proposed copy written in Richard's voice; they stay unpublishable until he approves them as his own.
4. **Publish** one design, or "Publish all approved" on the Content page. Publish on a design saves and approves any unsaved edits first (with the review box ticked), so it is the one button that puts edits live. Publishing retires the previous published version and refreshes the public pages' cached Archive data at once (the `archive-public` cache tag and the page cache), so the home card and the product page show it on the next visit, and tells IndexNow about the pages that changed. The product page and the owned cards read the published version only.

**Suggested wording.** Where `apps/web/src/server/content/archive-suggestions.json` holds a rewrite of a design's fields, the design's editor shows it above the boxes with **Use the suggested wording**. Using it fills the boxes and nothing more; Save, Approve or Publish writes it, and **Put my wording back** undoes it before then. The panel hides once the boxes hold the suggested text. The Content page lists every design with a suggestion waiting; after reading them, **Use it for all and publish** saves, approves and publishes them all at once. Founder notes are never touched. The file is server-only, like the drafts.

What the public sees from a published card: the preview and the biblical context. What an owner sees: the full story, imagery, founder note, extras. These are two separate server responses; draft content never leaves the admin pages.

### Wallpapers

Each design takes a phone and a desktop wallpaper; a buyer downloads them as `behold-<address>-phone.png` and `behold-<address>-desktop.png`. Intake:

- **Admin → Assets**: choose the design (or "Unassigned"), the format and a title, then choose the file (or drop it on the dashed box). Every image file can be chosen. A PNG or JPEG goes as it is (its type read from its first bytes, so a file with no reported type still uploads); WebP, AVIF, GIF or HEIC (where the browser can open it, as Safari can) is redrawn as a PNG in the browser first, because the bucket takes PNG and JPEG only. The chosen file shows as a thumbnail with its size, with a warning when its shape doesn't match the format, and Upload stays pressable (without a file it says to choose one). The browser uploads straight to the private bucket (so Vercel's request limit never applies); the server then reads the real pixel size and type from the bytes, records the hash and size, and lists the file as uploaded. Assign it if needed, then **Publish**. The previous published file of that design and format retires. A landscape phone file or a portrait desktop file shows a warning. The Assets page shows each file as a small picture (a ten-minute signed link; click it for the full file) and flags a file whose bytes are also used for another design or format, so a wallpaper uploaded to the wrong design shows up at a glance.
- **Command line**, for a file on disk (such as those under `assets/wallpapers/`):

  ```bash
  pnpm --filter @awebound/web archive:intake -- assets/wallpapers/brand-phone.jpg --format phone            # unassigned
  pnpm --filter @awebound/web archive:intake -- path/to/behold-torn-veil-phone.png --format phone --design torn-veil --publish
  ```

- Delivery: a buyer's download is a 60-second signed link issued only after the server checks the entitlement; storage paths never appear in public markup or JSON. A design without a published file shows no Wallpapers section.

### Mappings

The Mappings page lists, per design, the catalog code, slug, Fourthwall slug, the live Fourthwall id and state (once the products are public and the storefront token is set), the stored offer id and the size guide. Product-to-design mapping is explicit: an order line maps by Fourthwall offer id, else by Fourthwall slug (the first match stores the id). Fear Not keeps its internal slug `the-passage` (its Archive records, saved hearts, orders and image folder use it); the shop and My Archive reach it at `fear-not`, and its Fourthwall slug is `fear-not-hoodie`. Guides are the owner's own: the Middleweight Oversized T-shirt (Thorns to Lilies, By His Hem, Stone in Motion), the Organic Oversized T-shirt (To Live Is Christ, Still the Storm), the Premium Relaxed Hoodie (the three hoodies), the Low-Profile Adjustable Cap (Lamb’s Mark) and the Mid-Profile Snapback Cap (Signature Cap).

### Orders

The Orders page shows every order the webhook or reconciliation recorded (emails as a hash prefix and domain), its payment state, how it was linked, whether the checkout was registered or guest, lines with eligible units, the webhook event log and reconciliation runs. Tools: relink an order to an account (or unlink), adjust eligible units per line with a reason (partial refunds without per-line data land here as "needs review"), mark reviewed.

### Ideas (Idea Submissions)

Shoppers send design ideas from the Idea Submissions tile, the My Archive overview's only tile (under the welcome; Your collection, Saved and Orders are in the navigation above), in the feature color with a gold rule. The rules are in `apps/web/src/shared/ideas.ts` and the server enforces them (`server/archive/ideas.ts`):

- **Locked** until the account has 5 purchases. A purchase is one paid, real (not test) order linked to the account with at least one line still eligible, so an order refunded or cancelled in full stops counting. Signing in is what links orders, so only purchases on the account count (a guest order counts once it links by email or a claim). While locked, the tile shows the purchases so far as five gold marks; the reason (why it's locked and how it opens) takes the place of the tile's words while a mouse rests on it, or on a tap on a phone, or from the "Why it’s locked" button by keyboard.
- **Open**: 5 purchases open the first submission; every 3 more open another (8 for the second, 11 for the third). Every submission counts, whatever its status.
- **The form** (`/account/ideas`): an image (PNG or JPEG up to 10 MB; other image types are converted in the browser), their idea, the verse it represents and the biblical context. All optional, at least one required, plus a box confirming the design is theirs to share. The image goes straight from the browser to the private `idea-submissions` bucket with a one-time signed URL; the server checks it from its bytes and the purchases again before it records anything. The sender's own ideas list underneath with a plain status (Received, Being reviewed, Chosen, Not chosen this time); the owner's note never reaches them.
- **The inbox** (Owner → Ideas, with a "(N new)" count in the owner navigation): newest first, filtered by status. Each card shows the image (one-hour signed link; Full size opens it), the name and email from the account, the purchases when sent and now, and the words; set the status (New, Reviewing, Selected, Declined) and a private note, then Save (audited). Every submission is also emailed to aweboundstore@gmail.com with the image attached; reply there to reach the sender. Mark the chosen idea **Selected**: its sender's piece is free (arranged by hand, for example with a Fourthwall giveaway link or a refunded order).
- **The owner** has it open from the start, to try the form: the owner's ideas are marked "Owner test" and never counted. A switch under the tile (and at the top of the Ideas page, `?view=customer`), shown to the owner only, flips between **Owner (open)** and **Customer (locked)** to see exactly what customers see.
- Deleting an account deletes its submissions and their images. The Privacy page names what is collected.

### Founding

Members, candidates with the reason they wait, places used, the policy. Tools: revoke or restore a seal, award one by hand, and "Settle contested places" (places 46 to 50; enabled after a complete walk of Fourthwall's order list within 24 hours).

## Founding Member policy

Constants: `FOUNDING_CAP = 50`, `FOUNDING_SETTLE_FROM = 45` in `apps/web/src/server/archive/founding-policy.ts` and in `supabase/migrations/20261013000500_archive_founding.sql` (change both together).

- A place needs a paid, real (not test), ordinary (`ORDER` source) order whose cart was created while the buyer was signed in (a `checkout_sessions` row with their user id matched the order's `checkoutId`), a verified account email, and the same email on the order. Google accounts qualify through the same flow.
- Guest purchases never qualify and never consume a place; a guest order claimed later stays guest. A later separate purchase made while signed in can qualify if a place remains. Several orders from one member use one place.
- Ordering is by the provider's payment time (`paid_at`, the order's `createdAt` the first time it is seen paid) with the provider's order id as tie-break; never by sign-up time or event arrival.
- Allocation is one SQL function under an advisory lock with a unique rank, so concurrent webhooks cannot exceed 50. Places 1 to 45 are awarded as payments confirm; 46 to 50 wait as `contested_window` candidates until the reconciliation has walked Fourthwall's order list, then settle in payment order. Nothing ever re-ranks an awarded seal.
- Incomplete evidence (no checkout session, email mismatch, flag off, cap reached) records a candidate with its reason instead of an award.
- Default for the refund edge: an earned seal stays as historical recognition after an ordinary refund and its place is not recycled; the refunded design's story and downloads still close. Erroneous or fraudulent awards are revoked by the owner, audited.
- A deleted account keeps its place taken. No public counters, discounts, points or leaderboards.

## Order pipeline

1. **Checkout**: `startCheckout` (`apps/web/src/server/bag.ts`) creates the Fourthwall cart with the documented `items` field only and records `checkout_sessions(cart_id, user_id or null, email at checkout, lines)`.
2. **Webhook** `POST /api/fourthwall/webhook`: verifies `X-Fourthwall-Hmac-SHA256` (base64 HMAC-SHA256 of the raw body) with `FOURTHWALL_WEBHOOK_SECRET`, answers 503 while the secret is unset (so Fourthwall retries), stores every event once by id, handles `ORDER_PLACED` and `ORDER_UPDATED` (everything else is stored as ignored), parses both the flat and the `data.order` payload shapes, upserts the order and its lines, links it, evaluates benefits and Founding, and records what the payload contained.
3. **Linking precedence**: an existing link stays; then the checkout session whose cart id equals the order's `checkoutId` (registered evidence when it had a user, guest evidence otherwise; an email that differs from the account's flags the order for review while benefits still unlock); then an account whose verified email equals the order's email (guest provenance); else unlinked. When an account opens the Archive overview, Your collection or Orders, unlinked orders with its verified email link themselves.
4. **Payment meaning**: `apps/web/src/server/archive/payment-state.ts` maps Fourthwall statuses to paid / revoked / pending / unknown. Unknown grants nothing and is listed on the Health page; add a new status to the right set when one appears. Revoked orders close every line; partial refunds with per-line data remove those units, without it the order waits for review with its benefits intact.
5. **Reconciliation**: `GET /api/fourthwall/reconcile` with `Authorization: Bearer <CRON_SECRET>` (Vercel cron, daily at 06:00 UTC in `apps/web/vercel.json`), the owner's "Reconcile orders now", and a buyer's "Refresh orders" (their own orders, rate-limited). It re-reads orders that are pending, unknown, marked for review, never reconciled or not reconciled for 7 days, and walks the provider's order list for orders that never arrived, then settles Founding's contested places.
6. **Claims**: order number → a 6-digit code to the email on the order (Resend), 15 minutes, 5 attempts, stored as hashes; the response never says whether the order exists.

## Connecting services

- **Database**: the Stage migrations and Deploy to Prod workflows apply the migrations ([DEPLOYMENT.md](DEPLOYMENT.md)). They create the private `archive-assets` and `idea-submissions` buckets and seed the flags.
- **Supabase → Authentication → Emails**: paste the three templates from `supabase/templates/` (`magic-link.html`, `confirmation.html`, `email-change.html`). `supabase/config.toml` is for the local stack only.
- **Fourthwall** (production only): Settings → For developers → Webhooks, `https://www.awebound.store/api/fourthwall/webhook` for `ORDER_PLACED` and `ORDER_UPDATED`, its secret in `FOURTHWALL_WEBHOOK_SECRET`; Open API → Create API user, in `FOURTHWALL_API_USERNAME` and `FOURTHWALL_API_PASSWORD`.
- **Vercel**: the variables in [DEPLOYMENT.md](DEPLOYMENT.md), including `CRON_SECRET` for the daily reconcile cron in `vercel.json`.
- **Admins**: `grant:admin` once the person has signed in (above).
- **Designs**: `archive:seed` or Health → "Import the ten drafts", then review, approve and publish.
- **Wallpapers**: the Assets page or `archive:intake`.

## What the code assumes about Fourthwall's order data

The Health page shows what real orders contain. If one of these turns out wrong, the last column says what changes.

| Assumption                                                     | Where it shows                                            | If wrong                                                               |
| -------------------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------- |
| `order.checkoutId` equals the Storefront cart id               | Health → checkout matches hit/miss; logs `[archive:link]` | orders link by email only; ask Fourthwall for the supported identifier |
| Status strings (`CONFIRMED`, `CANCELLED`, …)                   | Health → statuses seen; `payment-state.ts`                | edit the sets; reconcile re-derives states                             |
| Per-line `quantity` and refund fields                          | Health → quantityKnown, fields seen                       | quantities default to 1; partial refunds wait for review               |
| `data.order` vs flat payload, `testMode`, `source.type` values | Health → source types, API versions                       | the parser accepts both; new source types grant nothing until mapped   |
| `GET /order` paging                                            | logs `[archive:platform]`; reconciliation notes           | reconciliation falls back to per-order reads; settlement waits         |
| `paid_at` = the order's `createdAt`                            | `orders.ts`                                               | prefer a payment timestamp once one is seen                            |
