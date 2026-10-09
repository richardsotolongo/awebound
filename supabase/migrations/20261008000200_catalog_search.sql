-- Shop search, filtering, sorting and facet counts, executed in Postgres.
-- The API calls these through supabase.rpc(). Semantics match the in-memory seed adapter:
--   q           full-text (websearch syntax) over name, code, Scripture and art, plus a name/code prefix match
--   categories  any of
--   collections any of
--   colors      products offered in any of these colors
--   sizes       products with any of these sizes in stock
--   min/max     product price in cents
-- Facets count products matching every filter except the facet's own dimension.

create or replace function public.filter_product_ids(
  p_q           text default null,
  p_categories  text[] default null,
  p_collections text[] default null,
  p_colors      text[] default null,
  p_sizes       text[] default null,
  p_min_cents   integer default null,
  p_max_cents   integer default null
)
returns setof uuid
language sql
stable
set search_path = ''
as $$
  select p.id
  from public.products p
  where p.is_published
    and (
      coalesce(btrim(p_q), '') = ''
      or p.search @@ websearch_to_tsquery('english', p_q)
      or p.name ilike '%' || btrim(p_q) || '%'
      or p.code ilike btrim(p_q) || '%'
    )
    and (p_categories is null or cardinality(p_categories) = 0 or p.category_slug = any (p_categories))
    and (p_collections is null or cardinality(p_collections) = 0 or p.collection_slug = any (p_collections))
    and (p_min_cents is null or p.price_cents >= p_min_cents)
    and (p_max_cents is null or p.price_cents <= p_max_cents)
    and (
      p_colors is null or cardinality(p_colors) = 0
      or exists (
        select 1 from public.product_variants v
        where v.product_id = p.id and v.color_name = any (p_colors)
      )
    )
    and (
      p_sizes is null or cardinality(p_sizes) = 0
      or exists (
        select 1 from public.product_variants v
        where v.product_id = p.id and v.size = any (p_sizes) and v.available
      )
    );
$$;

create or replace function public.search_products(
  p_q           text default null,
  p_categories  text[] default null,
  p_collections text[] default null,
  p_colors      text[] default null,
  p_sizes       text[] default null,
  p_min_cents   integer default null,
  p_max_cents   integer default null,
  p_sort        text default 'featured',
  p_limit       integer default 12,
  p_offset      integer default 0
)
returns table (product_id uuid, total_count bigint)
language sql
stable
set search_path = ''
as $$
  with matched as (
    select
      p.id,
      p.name,
      p.price_cents,
      p.featured,
      p.released_at,
      case
        when coalesce(btrim(p_q), '') = '' then 0
        else ts_rank(p.search, websearch_to_tsquery('english', p_q))
          + case when p.name ilike btrim(p_q) || '%' then 1 else 0 end
      end as rank
    from public.products p
    where p.id in (
      select public.filter_product_ids(p_q, p_categories, p_collections, p_colors, p_sizes, p_min_cents, p_max_cents)
    )
  )
  select m.id, count(*) over ()
  from matched m
  order by
    case when p_sort = 'featured' then m.rank end desc nulls last,
    case when p_sort = 'featured' then m.featured end desc,
    case when p_sort = 'newest' then m.released_at end desc,
    case when p_sort = 'price-asc' then m.price_cents end asc,
    case when p_sort = 'price-desc' then m.price_cents end desc,
    case when p_sort = 'name' then m.name end asc,
    m.released_at desc,
    m.name asc
  limit greatest(least(p_limit, 48), 1)
  offset greatest(p_offset, 0);
$$;

create or replace function public.catalog_facets(
  p_q           text default null,
  p_categories  text[] default null,
  p_collections text[] default null,
  p_colors      text[] default null,
  p_sizes       text[] default null,
  p_min_cents   integer default null,
  p_max_cents   integer default null
)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'categories', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'slug', c.slug, 'name', c.name, 'cut', c.cut, 'count', coalesce(n.count, 0)
      ) order by c.sort_order, c.name), '[]'::jsonb)
      from public.categories c
      left join lateral (
        select count(*) as count from public.products p
        where p.category_slug = c.slug
          and p.id in (select public.filter_product_ids(p_q, null, p_collections, p_colors, p_sizes, p_min_cents, p_max_cents))
      ) n on true
    ),
    'collections', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'slug', c.slug, 'name', c.name, 'pillar', c.pillar, 'count', coalesce(n.count, 0)
      ) order by c.sort_order, c.name), '[]'::jsonb)
      from public.collections c
      left join lateral (
        select count(*) as count from public.products p
        where p.collection_slug = c.slug
          and p.id in (select public.filter_product_ids(p_q, p_categories, null, p_colors, p_sizes, p_min_cents, p_max_cents))
      ) n on true
    ),
    'colors', (
      select coalesce(jsonb_agg(jsonb_build_object('name', x.color_name, 'token', x.color_token, 'count', x.count)
        order by x.color_name), '[]'::jsonb)
      from (
        select v.color_name, min(v.color_token) as color_token,
               count(distinct v.product_id) filter (
                 where v.product_id in (select public.filter_product_ids(p_q, p_categories, p_collections, null, p_sizes, p_min_cents, p_max_cents))
               ) as count
        from public.product_variants v
        join public.products p on p.id = v.product_id and p.is_published
        group by v.color_name
      ) x
    ),
    'sizes', (
      select coalesce(jsonb_agg(jsonb_build_object('size', x.size, 'count', x.count) order by x.size_rank, x.size), '[]'::jsonb)
      from (
        select v.size, min(v.size_rank) as size_rank,
               count(distinct v.product_id) filter (
                 where v.available
                   and v.product_id in (select public.filter_product_ids(p_q, p_categories, p_collections, p_colors, null, p_min_cents, p_max_cents))
               ) as count
        from public.product_variants v
        join public.products p on p.id = v.product_id and p.is_published
        group by v.size
      ) x
    ),
    'price', (
      select jsonb_build_object(
        'min', coalesce(floor(min(price_cents) / 100.0), 0)::int,
        'max', coalesce(ceil(max(price_cents) / 100.0), 0)::int
      )
      from public.products where is_published
    )
  );
$$;

grant execute on function public.filter_product_ids(text, text[], text[], text[], text[], integer, integer) to anon, authenticated, service_role;
grant execute on function public.search_products(text, text[], text[], text[], text[], integer, integer, text, integer, integer) to anon, authenticated, service_role;
grant execute on function public.catalog_facets(text, text[], text[], text[], text[], integer, integer) to anon, authenticated, service_role;
