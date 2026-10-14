-- My Archive, orders: the checkout association made on our side, Fourthwall's orders and lines as
-- the canonical record, webhook events, reconciliation runs and past-order claims. Server-only.

-- Every checkout started on the site: the cart id Fourthwall was given, and who was signed in.
-- An order whose checkoutId matches links here; a session without a user is guest evidence.
create table public.checkout_sessions (
  id                         uuid primary key default gen_random_uuid(),
  cart_id                    text not null unique,
  user_id                    uuid references auth.users (id) on delete set null,
  user_email_at_checkout     text,
  email_verified_at_checkout boolean not null default false,
  lines                      jsonb not null default '[]',
  created_at                 timestamptz not null default now(),
  matched_order_id           text,
  matched_at                 timestamptz
);
create index checkout_sessions_user_idx on public.checkout_sessions (user_id, created_at desc);

create table public.provider_orders (
  id                  text primary key,                     -- Fourthwall order id
  friendly_id         text,
  checkout_id         text,
  email               text,                                 -- the customer identity the provider reports
  status_raw          text,
  payment_state       text not null default 'unknown'
                      check (payment_state in ('paid', 'revoked', 'pending', 'unknown')),
  source_type         text,
  test_mode           boolean not null default false,
  amounts             jsonb,
  total_cents         int,
  refunded_cents      int not null default 0,
  provider_created_at timestamptz,
  provider_updated_at timestamptz,
  paid_at             timestamptz,
  raw                 jsonb not null,
  first_seen_at       timestamptz not null default now(),
  last_event_at       timestamptz,
  last_reconciled_at  timestamptz,
  needs_review        boolean not null default false,
  review_reason       text,
  user_id             uuid references auth.users (id) on delete set null,
  link_method         text check (link_method in ('checkout_session', 'email_match', 'claim', 'owner')),
  linked_at           timestamptz,
  -- null = unknown, true = the cart was created while signed in, false = guest checkout
  registered_checkout boolean,
  checkout_session_id uuid references public.checkout_sessions (id) on delete set null,
  updated_at          timestamptz not null default now()
);
create index provider_orders_user_idx on public.provider_orders (user_id);
create index provider_orders_unlinked_email_idx on public.provider_orders (lower(email)) where user_id is null;
create index provider_orders_friendly_idx on public.provider_orders (friendly_id);
create index provider_orders_review_idx on public.provider_orders (needs_review) where needs_review;

create table public.provider_order_lines (
  id                text primary key,   -- order id : offer id : variant id
  order_id          text not null references public.provider_orders (id) on delete cascade,
  offer_id          text,
  offer_slug        text,
  offer_name        text,
  variant_id        text,
  product_slug      text,
  design_key        text references public.archive_designs (design_key) on delete set null,
  color             text,
  size              text,
  quantity          int not null default 1 check (quantity >= 0),
  refunded_quantity int not null default 0 check (refunded_quantity >= 0),
  eligible_quantity int not null default 0 check (eligible_quantity >= 0),
  unit_cents        int,
  line_state        text not null default 'active'
                    check (line_state in ('active', 'refunded', 'cancelled', 'adjusted')),
  adjusted_by       uuid references auth.users (id) on delete set null,
  adjusted_at       timestamptz,
  updated_at        timestamptz not null default now()
);
create index provider_order_lines_order_idx on public.provider_order_lines (order_id);
create index provider_order_lines_design_idx on public.provider_order_lines (design_key);

create table public.webhook_events (
  id           text primary key,          -- the provider's event id (deduplication)
  type         text not null,
  api_version  text,
  test_mode    boolean not null default false,
  shop_id      text,
  received_at  timestamptz not null default now(),
  processed_at timestamptz,
  status       text not null default 'received'
               check (status in ('received', 'processed', 'ignored', 'failed')),
  error        text,
  notes        jsonb,
  payload      jsonb not null,
  order_id     text
);
create index webhook_events_received_idx on public.webhook_events (received_at desc);

create table public.reconciliation_runs (
  id             uuid primary key default gen_random_uuid(),
  trigger        text not null check (trigger in ('cron', 'owner', 'user')),
  user_id        uuid references auth.users (id) on delete set null,
  started_at     timestamptz not null default now(),
  finished_at    timestamptz,
  orders_checked int not null default 0,
  orders_changed int not null default 0,
  listed_all     boolean not null default false,  -- the walk over the provider's order list completed
  cursor         jsonb,
  notes          jsonb,
  error          text
);
create index reconciliation_runs_started_idx on public.reconciliation_runs (started_at desc);

-- Linking a past (guest) order: a code goes to the email address on the order; the address itself
-- is stored only as a hash.
create table public.order_claims (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  order_id    text references public.provider_orders (id) on delete cascade,
  friendly_id text not null,
  email_hash  text not null,
  code_hash   text not null,
  expires_at  timestamptz not null,
  attempts    int not null default 0,
  status      text not null default 'pending'
              check (status in ('pending', 'verified', 'expired', 'failed', 'unmatched')),
  created_at  timestamptz not null default now(),
  verified_at timestamptz
);
create index order_claims_user_idx on public.order_claims (user_id, created_at desc);

-- What a shopper owns, by design: paid, real (not test), ordinary orders linked to them.
create view public.archive_entitlements with (security_invoker = true) as
  select o.user_id,
         l.design_key,
         sum(l.eligible_quantity)::int as quantity,
         min(o.paid_at) as first_paid_at
    from public.provider_order_lines l
    join public.provider_orders o on o.id = l.order_id
   where o.user_id is not null
     and o.payment_state = 'paid'
     and o.test_mode = false
     and o.source_type = 'ORDER'
     and l.design_key is not null
   group by o.user_id, l.design_key
  having sum(l.eligible_quantity) > 0;

create trigger provider_orders_set_updated_at
  before update on public.provider_orders
  for each row execute function public.set_updated_at();
create trigger provider_order_lines_set_updated_at
  before update on public.provider_order_lines
  for each row execute function public.set_updated_at();

alter table public.checkout_sessions enable row level security;
alter table public.provider_orders enable row level security;
alter table public.provider_order_lines enable row level security;
alter table public.webhook_events enable row level security;
alter table public.reconciliation_runs enable row level security;
alter table public.order_claims enable row level security;

grant select, insert, update, delete on public.checkout_sessions to service_role;
grant select, insert, update, delete on public.provider_orders to service_role;
grant select, insert, update, delete on public.provider_order_lines to service_role;
grant select, insert, update, delete on public.webhook_events to service_role;
grant select, insert, update, delete on public.reconciliation_runs to service_role;
grant select, insert, update, delete on public.order_claims to service_role;
grant select on public.archive_entitlements to service_role;
