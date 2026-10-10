-- Self-serve account deletion removes the shopper's drop-notes row (matched by email), so the
-- server needs to read and delete subscribers. Profiles go with auth.users (on delete cascade).
grant select, delete on public.subscribers to service_role;
