-- IndexNow: each indexable page as it looked when it was last sent (a hash of what a reader sees),
-- so a run sends only pages that are new, changed or gone. Written only by the server with the
-- secret key; RLS is on with no policies and nothing is granted to anon/authenticated.

create table public.indexnow_pages (
  url          text primary key,
  fingerprint  text not null,
  submitted_at timestamptz not null default now()
);

alter table public.indexnow_pages enable row level security;

grant select, insert, update, delete on public.indexnow_pages to service_role;
