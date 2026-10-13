-- My Archive, content: one design per Behold piece, its versioned editorial content (draft until the
-- owner approves and publishes it) and the wallpaper files. Server-only tables; the public site reads
-- only published public fields through the server.

create table public.archive_designs (
  design_key           text primary key check (design_key ~ '^[a-z0-9-]+:[a-z0-9-]+$'),
  product_slug         text not null unique,
  collection_slug      text not null,
  name                 text not null,
  scripture_reference  text not null,
  fourthwall_slug      text not null unique,
  fourthwall_offer_id  text unique,
  position             int not null,
  published_content_id uuid,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create table public.archive_design_content (
  id                    uuid primary key default gen_random_uuid(),
  design_key            text not null references public.archive_designs (design_key) on delete cascade,
  version               int not null,
  status                text not null default 'draft'
                        check (status in ('draft', 'approved', 'published', 'retired')),
  public_preview        text not null default '' check (char_length(public_preview) <= 300),
  biblical_context      text not null default '' check (char_length(biblical_context) <= 1500),
  context_reference     text not null default '' check (char_length(context_reference) <= 120),
  bible_url             text not null default '' check (bible_url = '' or bible_url ~ '^https://'),
  additional_bible_urls text[] not null default '{}',
  design_story          text not null default '' check (char_length(design_story) <= 3000),
  imagery_meaning       text not null default '' check (char_length(imagery_meaning) <= 2000),
  founder_note          text not null default '' check (char_length(founder_note) <= 2000),
  -- true until Richard approves the wording as his own
  founder_note_proposed boolean not null default true,
  share_copy            text not null default '' check (char_length(share_copy) <= 200),
  care_status           text not null default 'unconfirmed'
                        check (care_status in ('unconfirmed', 'verified')),
  care_instructions     text check (char_length(care_instructions) <= 1000),
  care_source           text check (char_length(care_source) <= 200),
  care_verified_at      timestamptz,
  care_verified_by      uuid references auth.users (id) on delete set null,
  notes                 text check (char_length(notes) <= 1000),
  created_by            uuid references auth.users (id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  approved_by           uuid references auth.users (id) on delete set null,
  approved_at           timestamptz,
  published_by          uuid references auth.users (id) on delete set null,
  published_at          timestamptz,
  retired_at            timestamptz,
  unique (design_key, version),
  check (status <> 'published' or (approved_at is not null and founder_note_proposed = false))
);

create unique index archive_design_content_one_published
  on public.archive_design_content (design_key) where status = 'published';
create unique index archive_design_content_one_open
  on public.archive_design_content (design_key) where status in ('draft', 'approved');

alter table public.archive_designs
  add constraint archive_designs_published_fk
  foreign key (published_content_id) references public.archive_design_content (id) on delete set null;

-- Wallpaper files. A file can arrive before the owner picks its design (design_key null); it can
-- only be published once assigned. The real pixel size and type are read from the bytes.
create table public.archive_assets (
  id             uuid primary key default gen_random_uuid(),
  design_key     text references public.archive_designs (design_key) on delete set null,
  format         text not null check (format in ('phone', 'desktop')),
  storage_bucket text not null,
  storage_path   text not null unique,
  mime           text not null check (mime in ('image/png', 'image/jpeg')),
  width          int not null check (width > 0),
  height         int not null check (height > 0),
  bytes          bigint not null check (bytes > 0),
  sha256         text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  title          text not null check (char_length(title) between 1 and 120),
  status         text not null default 'uploaded' check (status in ('uploaded', 'published', 'retired')),
  uploaded_by    uuid references auth.users (id) on delete set null,
  uploaded_at    timestamptz not null default now(),
  published_by   uuid references auth.users (id) on delete set null,
  published_at   timestamptz,
  retired_at     timestamptz,
  check (status <> 'published' or design_key is not null)
);

create unique index archive_assets_one_published
  on public.archive_assets (design_key, format) where status = 'published';

create trigger archive_designs_set_updated_at
  before update on public.archive_designs
  for each row execute function public.set_updated_at();
create trigger archive_design_content_set_updated_at
  before update on public.archive_design_content
  for each row execute function public.set_updated_at();

alter table public.archive_designs enable row level security;
alter table public.archive_design_content enable row level security;
alter table public.archive_assets enable row level security;

grant select, insert, update, delete on public.archive_designs to service_role;
grant select, insert, update, delete on public.archive_design_content to service_role;
grant select, insert, update, delete on public.archive_assets to service_role;

-- The private bucket for wallpapers. Guarded so the file also applies on a plain Postgres.
do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('archive-assets', 'archive-assets', false, 52428800, array['image/png', 'image/jpeg'])
    on conflict (id) do nothing;
  end if;
end
$$;
