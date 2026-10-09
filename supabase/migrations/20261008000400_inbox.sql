-- Contact messages and drop-notes subscribers. Written only by the server with the secret key;
-- RLS is on with no policies and nothing is granted to anon/authenticated, so the publishable key
-- can neither read nor write them.

create table public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users (id) on delete set null,
  name        text not null check (char_length(name) between 1 and 120),
  email       text not null check (char_length(email) <= 320),
  topic       text not null check (topic in ('order', 'sizing', 'returns', 'wholesale', 'press', 'other')),
  message     text not null check (char_length(message) between 1 and 4000),
  status      text not null default 'new' check (status in ('new', 'answered', 'closed')),
  emailed_at  timestamptz,
  created_at  timestamptz not null default now()
);

create index contact_messages_created_idx on public.contact_messages (created_at desc);

create table public.subscribers (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  source        text not null check (source in ('footer', 'product')),
  product_slug  text,
  created_at    timestamptz not null default now(),
  unsubscribed_at timestamptz
);

-- One row per address; the first source is kept.
create unique index subscribers_email_key on public.subscribers (lower(email));

alter table public.contact_messages enable row level security;
alter table public.subscribers enable row level security;

-- Supabase no longer grants table access by default, not even to service_role.
grant select, insert, update on public.contact_messages to service_role;
grant insert on public.subscribers to service_role;
