-- My Archive, free tools: Saved Pieces and Your Fit. Server-only (no policies); the server scopes
-- every query to the signed-in user.

create table public.saved_pieces (
  user_id      uuid not null references auth.users (id) on delete cascade,
  product_slug text not null check (product_slug ~ '^[a-z0-9-]{1,64}$'),
  created_at   timestamptz not null default now(),
  primary key (user_id, product_slug)
);

-- One preference per garment style (a size guide in catalog.json). Caps are one size and keep a
-- note only; the server checks a size against the guide's sizes.
create table public.fit_preferences (
  user_id       uuid not null references auth.users (id) on delete cascade,
  size_guide_id text not null check (size_guide_id ~ '^[a-z0-9-]{1,64}$'),
  size          text check (char_length(size) <= 16),
  note          text check (char_length(note) <= 80),
  updated_at    timestamptz not null default now(),
  primary key (user_id, size_guide_id)
);

create trigger fit_preferences_set_updated_at
  before update on public.fit_preferences
  for each row execute function public.set_updated_at();

alter table public.saved_pieces enable row level security;
alter table public.fit_preferences enable row level security;

grant select, insert, update, delete on public.saved_pieces to service_role;
grant select, insert, update, delete on public.fit_preferences to service_role;
