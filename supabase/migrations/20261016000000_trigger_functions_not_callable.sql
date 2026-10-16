-- The two auth trigger functions run as SECURITY DEFINER and were callable through the API
-- (/rest/v1/rpc/...) by signed-out and signed-in users, which Supabase's security advisor flags.
-- They are only ever meant to run from their triggers on auth.users, which this doesn't affect.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_user_email_change() from public, anon, authenticated;
