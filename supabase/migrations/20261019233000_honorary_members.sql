-- Honorary Founding Members (the owner's choice, October 2026): people the owner honors with the
-- seal's features beyond the first 50 buyers. A separate list, so the 50 numbered places and how
-- they are awarded (archive_award_founding) are untouched. No number; removal deletes the row
-- (the audit log keeps the history). Server-only, granted from Owner -> Founding by email.

create table public.honorary_members (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  reason     text not null check (char_length(reason) between 3 and 300),
  granted_by uuid references auth.users (id) on delete set null,
  granted_at timestamptz not null default now()
);

alter table public.honorary_members enable row level security;
grant select, insert, update, delete on public.honorary_members to service_role;
