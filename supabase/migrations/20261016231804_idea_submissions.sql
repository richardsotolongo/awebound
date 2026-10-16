-- Idea Submissions: design ideas sent from My Archive by shoppers with enough purchases, and the
-- owner's review of them. Server-only, like the rest of My Archive: RLS on, no policies, and only
-- the service role may read or write. The images live in a private bucket of their own.

create table public.idea_submissions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  -- Who to reach about it: the account's email and name when it was sent.
  email               text not null check (char_length(email) <= 320),
  name                text check (char_length(name) <= 120),
  idea                text check (char_length(idea) <= 4000),
  verse               text check (char_length(verse) <= 300),
  context             text check (char_length(context) <= 4000),
  image_path          text check (char_length(image_path) <= 300),
  image_mime          text check (image_mime in ('image/png', 'image/jpeg')),
  image_width         int,
  image_height        int,
  image_bytes         int,
  -- The paid purchases counted when it was sent (null for the owner's own test submissions).
  purchases_at_submit int,
  status              text not null default 'new'
                      check (status in ('new', 'reviewing', 'selected', 'declined')),
  owner_note          text check (char_length(owner_note) <= 2000),
  reviewed_by         uuid references auth.users (id) on delete set null,
  reviewed_at         timestamptz,
  emailed_at          timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  -- Every part is optional, but a submission carries at least one of them.
  constraint idea_submissions_not_empty check (
    image_path is not null
    or coalesce(idea, '') <> ''
    or coalesce(verse, '') <> ''
    or coalesce(context, '') <> ''
  )
);

create index idea_submissions_user_idx on public.idea_submissions (user_id, created_at desc);
create index idea_submissions_status_idx on public.idea_submissions (status, created_at desc);

create trigger idea_submissions_set_updated_at
  before update on public.idea_submissions
  for each row execute function public.set_updated_at();

alter table public.idea_submissions enable row level security;

grant select, insert, update, delete on public.idea_submissions to service_role;

-- The private bucket for submitted images (PNG or JPEG, up to 10 MB). Guarded so the file also
-- applies on a plain Postgres.
do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('idea-submissions', 'idea-submissions', false, 10485760, array['image/png', 'image/jpeg'])
    on conflict (id) do nothing;
  end if;
end
$$;
