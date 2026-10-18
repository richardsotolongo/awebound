-- Two follow-up emails, both off until the owner turns them on: one the morning after a paid guest
-- order, inviting the buyer to open the pieces in My Archive, and one reminder after a signed-in
-- checkout that wasn't finished. Reminders go unless the account turns them off in Settings, so the
-- consent topic is added here too.

insert into public.feature_flags (key, enabled, note) values
  ('email.guest_follow_up', false, 'The morning after a paid guest order: one email inviting the buyer into My Archive'),
  ('email.cart_reminder',   false, 'A day after a signed-in checkout that wasn''t finished: one reminder')
on conflict (key) do nothing;

alter table public.email_consents drop constraint email_consents_topic_check;
alter table public.email_consents
  add constraint email_consents_topic_check check (topic in ('collection_updates', 'cart_reminders'));
