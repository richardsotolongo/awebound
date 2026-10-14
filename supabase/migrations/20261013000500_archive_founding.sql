-- Founding Member: the first 50 unique buyers who paid for an eligible order placed while signed in.
-- Places are allocated atomically here; the policy is documented in docs/ARCHIVE.md and mirrored in
-- apps/web/src/server/archive/founding-policy.ts (keep the constants equal).

create table public.founding_members (
  id             uuid primary key default gen_random_uuid(),
  -- a deleted account keeps its place taken: places are never recycled
  user_id        uuid unique references auth.users (id) on delete set null,
  order_id       text references public.provider_orders (id) on delete set null,
  paid_at        timestamptz not null,
  rank           int not null unique check (rank between 1 and 50),
  awarded_at     timestamptz not null default now(),
  awarded_by     text not null default 'system' check (awarded_by in ('system', 'reconcile', 'owner')),
  status         text not null default 'active' check (status in ('active', 'revoked')),
  revoked_reason text,
  revoked_by     uuid references auth.users (id) on delete set null,
  revoked_at     timestamptz
);

-- Buyers whose award is waiting: on canonical chronology (the last places), on evidence, or on room.
create table public.founding_candidates (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  order_id   text references public.provider_orders (id) on delete cascade,
  paid_at    timestamptz not null,
  reason     text not null check (reason in
               ('contested_window', 'email_mismatch', 'no_checkout_evidence', 'flag_off', 'cap_reached')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger founding_candidates_set_updated_at
  before update on public.founding_candidates
  for each row execute function public.set_updated_at();

-- Awards a place, or records why not. The advisory lock serializes concurrent webhooks; the unique
-- rank is the second guard. Places up to 45 are awarded at once (membership doesn't depend on
-- order among them); 46-50 wait for p_settled, which the reconciliation passes only after the
-- provider's order list confirmed chronology, so a delayed event never loses a place to a later
-- buyer. Ranks are never rewritten and a revoked row keeps its place.
create or replace function public.archive_award_founding(
  p_user_id uuid,
  p_order_id text,
  p_paid_at timestamptz,
  p_by text default 'system',
  p_settled boolean default false
)
returns table (awarded boolean, rank int, reason text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cap         constant int := 50;
  v_settle_from constant int := 45;
  v_count       int;
  v_rank        int;
begin
  perform pg_advisory_xact_lock(hashtext('archive_founding'));

  select m.rank into v_rank from public.founding_members m where m.user_id = p_user_id;
  if found then
    return query select false, v_rank, 'already_member'::text;
    return;
  end if;

  select count(*) into v_count from public.founding_members;
  if v_count >= v_cap then
    insert into public.founding_candidates (user_id, order_id, paid_at, reason)
    values (p_user_id, p_order_id, p_paid_at, 'cap_reached')
    on conflict (user_id) do update set reason = 'cap_reached', updated_at = now();
    return query select false, null::int, 'cap_reached'::text;
    return;
  end if;

  if v_count >= v_settle_from and not p_settled then
    insert into public.founding_candidates (user_id, order_id, paid_at, reason)
    values (p_user_id, p_order_id, p_paid_at, 'contested_window')
    on conflict (user_id) do update
      set paid_at = least(public.founding_candidates.paid_at, excluded.paid_at),
          order_id = excluded.order_id,
          reason = 'contested_window',
          updated_at = now();
    return query select false, null::int, 'contested_window'::text;
    return;
  end if;

  insert into public.founding_members (user_id, order_id, paid_at, rank, awarded_by)
  values (p_user_id, p_order_id, p_paid_at, v_count + 1, p_by);
  delete from public.founding_candidates where user_id = p_user_id;
  return query select true, v_count + 1, 'awarded'::text;
end;
$$;

revoke all on function public.archive_award_founding(uuid, text, timestamptz, text, boolean) from public;
grant execute on function public.archive_award_founding(uuid, text, timestamptz, text, boolean) to service_role;

alter table public.founding_members enable row level security;
alter table public.founding_candidates enable row level security;

grant select, insert, update, delete on public.founding_members to service_role;
grant select, insert, update, delete on public.founding_candidates to service_role;
