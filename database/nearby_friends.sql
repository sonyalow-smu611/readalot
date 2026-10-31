-- Scaffolded with AI assistance — see AI_USAGE.md
-- Nearby readers and friends (docs/specs/nearby-readers-and-friend-houses.md).
-- Run after xp_and_coins.sql. Safe to re-run.
--
-- discoverable is the one public/private setting: public shares your last rough area, private
-- doesn't. The rules that must hold whatever a client sends live here, in triggers.

alter table profiles add column if not exists location_asked_at timestamptz;
grant insert (location_asked_at) on profiles to authenticated;
grant update (location_asked_at) on profiles to authenticated;

-- A reader's last rough area: a square about 1 km wide (latitude and longitude times 100, rounded).
-- The exact position never reaches the database. No policies and no grants: only the server reads
-- this, and it never sends these numbers to another reader.
create table if not exists reader_areas (
  reader uuid primary key references profiles(id) on delete cascade,
  lat_cell integer not null,
  lng_cell integer not null,
  updated_at timestamptz not null default now()
);
create index if not exists reader_areas_by_cell on reader_areas (lat_cell, lng_cell);
alter table reader_areas enable row level security;
revoke all on reader_areas from anon, authenticated;

-- One row per pair of readers. pending: asked and waiting. accepted: friends. closed: declined or
-- removed, so the two no longer see each other nearby, and neither is told why. Each reader's
-- house spot for the other is kept on the row, so a friend keeps their spot.
create table if not exists friendships (
  id uuid primary key default gen_random_uuid(),
  requester uuid not null references profiles(id) on delete cascade,
  addressee uuid not null references profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'closed')),
  requester_spot smallint,
  addressee_spot smallint,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  check (requester <> addressee)
);
create unique index if not exists friendships_one_per_pair
  on friendships (least(requester, addressee), greatest(requester, addressee));
alter table friendships enable row level security;
revoke all on friendships from anon, authenticated;

-- Under-18s are always private.
create or replace function keep_minors_private() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.discoverable and exists (select 1 from profile_private where id = new.id and age < 18) then
    new.discoverable := false;
  end if;
  return new;
end;
$$;
drop trigger if exists keep_minors_private on profiles;
create trigger keep_minors_private before insert or update of discoverable on profiles
  for each row execute function keep_minors_private();

-- Welcome saves the profile first and the age after it, so the age has to take effect too.
create or replace function private_when_minor() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.age < 18 then
    update profiles set discoverable = false where id = new.id and discoverable;
  end if;
  return new;
end;
$$;
drop trigger if exists private_when_minor on profile_private;
create trigger private_when_minor after insert or update of age on profile_private
  for each row execute function private_when_minor();

-- Going private deletes your stored area straight away.
create or replace function forget_area_when_private() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from reader_areas where reader = new.id;
  return new;
end;
$$;
drop trigger if exists forget_area_when_private on profiles;
create trigger forget_area_when_private after update of discoverable on profiles
  for each row when (old.discoverable and not new.discoverable)
  execute function forget_area_when_private();

update profiles set discoverable = false
  where discoverable and id in (select id from profile_private where age < 18);
