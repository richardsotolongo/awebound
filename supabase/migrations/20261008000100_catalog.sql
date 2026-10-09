-- Catalog: categories, collections (the three A3 families), products, variants and images.
-- Products keep provider columns so a fulfillment provider (Printful, Printify, Fourthwall, Apliiq)
-- can sync into this table later without changing the storefront.

create table public.categories (
  slug        text primary key check (slug ~ '^[a-z0-9-]+$'),
  name        text not null,
  cut         text not null,              -- singular cut label: Tee, Oversized tee, Tank, Cap
  sort_order  integer not null default 0
);
comment on table public.categories is 'Garment categories used for shop tabs and filters.';

create table public.collections (
  slug          text primary key check (slug ~ '^[a-z0-9-]+$'),
  name          text not null,
  family_code   char(1) not null unique,  -- lookbook family letter: R, B, T
  pillar        text not null,
  story         text not null,
  scripture_ref text not null,
  sort_order    integer not null default 0
);
comment on table public.collections is 'The A3 families: Royal Heritage, Broken Bond, Rolled Away.';

create table public.products (
  id                  uuid primary key default gen_random_uuid(),
  code                text not null unique check (code ~ '^A3-[A-Z][0-9]{2}$'),
  slug                text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name                text not null,
  collection_slug     text not null references public.collections (slug) on update cascade,
  category_slug       text not null references public.categories (slug) on update cascade,
  price_cents         integer not null check (price_cents >= 0),
  currency            char(3) not null default 'USD',
  scripture_ref       text not null,
  -- Copy, following the product description template in the brand voice guide.
  story_art           text not null,
  story_front         text not null,
  story_back          text not null,
  story_inks          text not null,
  story_paraphrase    text not null,
  story_fit           text not null,
  story_material      text,
  featured            boolean not null default false,
  is_published        boolean not null default true,
  released_at         date not null default current_date,
  -- Fulfillment provider linkage, filled by a future sync job.
  provider            text check (provider in ('printful', 'printify', 'fourthwall', 'apliiq')),
  provider_product_id text,
  search              tsvector generated always as (
    setweight(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(code, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(scripture_ref, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(story_art, '') || ' ' || coalesce(story_back, '')), 'C')
  ) stored,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (provider, provider_product_id)
);
comment on table public.products is 'Sellable designs. Prices in seed data are placeholders.';

create index products_search_idx on public.products using gin (search);
create index products_name_trgm_idx on public.products using gin (name extensions.gin_trgm_ops);
create index products_collection_idx on public.products (collection_slug);
create index products_category_idx on public.products (category_slug);
create index products_listing_idx on public.products (is_published, featured desc, released_at desc);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create table public.product_variants (
  id                  uuid primary key default gen_random_uuid(),
  product_id          uuid not null references public.products (id) on delete cascade,
  sku                 text not null unique,
  color_name          text not null,
  color_token         text not null,      -- brand token, e.g. garment-faded-black
  size                text not null,
  size_rank           integer not null default 0,
  available           boolean not null default true,
  price_cents         integer check (price_cents >= 0),   -- null = product price
  provider_variant_id text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (product_id, color_name, size)
);

create index product_variants_product_idx on public.product_variants (product_id);
create index product_variants_color_idx on public.product_variants (color_name);
create index product_variants_size_idx on public.product_variants (size);

create trigger product_variants_set_updated_at
  before update on public.product_variants
  for each row execute function public.set_updated_at();

create table public.product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  url         text not null,
  alt         text not null,
  view        text not null check (view in ('back', 'front', 'detail')),
  sort_order  integer not null default 0
);

create index product_images_product_idx on public.product_images (product_id, sort_order);

-- Row level security: the catalog is public to read when published; writes go through the service role.
alter table public.categories enable row level security;
alter table public.collections enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;

create policy "Categories are public" on public.categories
  for select to anon, authenticated using (true);

create policy "Collections are public" on public.collections
  for select to anon, authenticated using (true);

create policy "Published products are public" on public.products
  for select to anon, authenticated using (is_published);

create policy "Variants of published products are public" on public.product_variants
  for select to anon, authenticated using (
    exists (select 1 from public.products p where p.id = product_id and p.is_published)
  );

create policy "Images of published products are public" on public.product_images
  for select to anon, authenticated using (
    exists (select 1 from public.products p where p.id = product_id and p.is_published)
  );
