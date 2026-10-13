-- Who may open the Archive admin pages. Server-only; granted from the command line
-- (pnpm --filter @awebound/web grant:admin <email>), never from the browser.

create table public.user_roles (
  user_id    uuid not null references auth.users (id) on delete cascade,
  role       text not null check (role in ('admin')),
  granted_by uuid references auth.users (id) on delete set null,   -- null = command line
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

alter table public.user_roles enable row level security;
grant select, insert, update, delete on public.user_roles to service_role;
