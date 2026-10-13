-- My Archive: profiles follow auth.users' email and verification, and a shopper can only rename
-- themselves. Orders are linked by verified email, so the address can't be self-edited any more.

alter table public.profiles add column email_verified_at timestamptz;

revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

create index profiles_email_idx on public.profiles (lower(email));

create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
     set email = new.email,
         email_verified_at = new.email_confirmed_at
   where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_updated
  after update of email, email_confirmed_at on auth.users
  for each row execute function public.handle_user_email_change();

-- Same as 20261008000300, plus the verification timestamp.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, email_verified_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url',
    new.email_confirmed_at
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

update public.profiles p
   set email = u.email,
       email_verified_at = u.email_confirmed_at
  from auth.users u
 where u.id = p.id;
