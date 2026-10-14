-- My Archive: per-feature readiness flags, the email foundations (consent, outbox) and the owner
-- audit log. Server-only. Custom email sending stays off until the owner turns a flag on.

create table public.feature_flags (
  key        text primary key check (key ~ '^[a-z_.]+$'),
  enabled    boolean not null default false,
  note       text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

insert into public.feature_flags (key, enabled, note) values
  ('archive.orders',           true,  'Order linking and history (needs FOURTHWALL_WEBHOOK_SECRET)'),
  ('archive.claims',           true,  'Link a past order by emailed code (needs RESEND_API_KEY)'),
  ('archive.founding',         true,  'Founding Member evaluation and seal'),
  ('archive.wallpapers',       true,  'Wallpaper downloads for published files'),
  ('archive.pdf',              true,  'Design card PDF'),
  ('archive.share',            true,  'Story share images'),
  ('email.preferences_ui',     false, 'Show the collection-updates consent in settings'),
  ('email.welcome',            false, 'Archive welcome email'),
  ('email.unlock',             false, 'Design unlocked email'),
  ('email.collection_updates', false, 'Collection updates campaign');

create table public.email_consents (
  user_id         uuid not null references auth.users (id) on delete cascade,
  topic           text not null check (topic in ('collection_updates')),
  consented       boolean not null default false,
  wording_version text not null,
  wording         text not null,
  source          text not null check (source in ('settings', 'owner')),
  consented_at    timestamptz,
  revoked_at      timestamptz,
  updated_at      timestamptz not null default now(),
  primary key (user_id, topic)
);

create table public.email_outbox (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users (id) on delete set null,
  to_email   text,
  template   text not null,
  payload    jsonb,
  status     text not null check (status in ('queued', 'sent', 'failed', 'skipped_disabled')),
  error      text,
  created_at timestamptz not null default now(),
  sent_at    timestamptz
);
create index email_outbox_status_idx on public.email_outbox (status, created_at);

create table public.owner_audit_log (
  id            uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users (id) on delete set null,   -- null = command line
  action        text not null,
  target_type   text not null,
  target_id     text,
  before        jsonb,
  after         jsonb,
  reason        text,
  created_at    timestamptz not null default now()
);
create index owner_audit_log_created_idx on public.owner_audit_log (created_at desc);

create trigger feature_flags_set_updated_at
  before update on public.feature_flags
  for each row execute function public.set_updated_at();
create trigger email_consents_set_updated_at
  before update on public.email_consents
  for each row execute function public.set_updated_at();

alter table public.feature_flags enable row level security;
alter table public.email_consents enable row level security;
alter table public.email_outbox enable row level security;
alter table public.owner_audit_log enable row level security;

grant select, insert, update, delete on public.feature_flags to service_role;
grant select, insert, update, delete on public.email_consents to service_role;
grant select, insert, update, delete on public.email_outbox to service_role;
grant select, insert on public.owner_audit_log to service_role;
