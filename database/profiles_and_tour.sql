-- Scaffolded with AI assistance — see AI_USAGE.md
-- Saved profiles and the first tour (docs/specs/supabase-profiles-and-tour.md).
-- Run after schema.sql. Safe to re-run.
--
-- A reader's profile row is created when they finish Welcome, so "has a row" means "profile
-- complete". profiles.id is the reader's auth user id; seeded readers have ids with no login,
-- so there is no foreign key to auth.users and the policies match on auth.uid() instead.

alter table profiles add column if not exists avatar text;
alter table profiles add column if not exists character jsonb;
alter table profiles add column if not exists tour_seen_at timestamptz;

-- Only the reader can see these, never other readers.
create table if not exists profile_private (
  id uuid primary key references profiles(id) on delete cascade,
  gender text,
  age integer,
  religion text
);

-- The server uses the service-role key, which skips these policies.
alter table profiles enable row level security;
alter table profile_private enable row level security;

drop policy if exists "read discoverable or own profile" on profiles;
create policy "read discoverable or own profile" on profiles
  for select to authenticated
  using (discoverable or id = auth.uid());

drop policy if exists "create own profile" on profiles;
create policy "create own profile" on profiles
  for insert to authenticated
  with check (id = auth.uid());

drop policy if exists "update own profile" on profiles;
create policy "update own profile" on profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "own private details" on profile_private;
create policy "own private details" on profile_private
  for all to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
