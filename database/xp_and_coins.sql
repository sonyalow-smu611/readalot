-- Scaffolded with AI assistance — see AI_USAGE.md
-- Reader levels and coins (docs/specs/tour-pixel-salon-xp.md, PR 3).
-- Run after profiles_and_tour.sql. Safe to re-run.
--
-- XP is one row per thing a reader did, in xp_events; their XP is the sum. Readers never write
-- XP or coins themselves: earn_xp() checks the limits and adds level-up coins, and spend_coins()
-- takes coins off for the Shop, refusing if there aren't enough.

alter table profiles add column if not exists coins integer not null default 480;

create table if not exists xp_events (
  id bigserial primary key,
  reader uuid not null references profiles(id) on delete cascade,
  action text not null,
  -- the book or reader it was about ('' for a cafe message)
  target text not null default '',
  -- the day in Singapore, for once-a-day limits
  day date not null,
  xp integer not null,
  created_at timestamptz not null default now()
);

-- once per book, and once per reader per day: the database refuses a repeat
create unique index if not exists xp_once_per_book on xp_events (reader, action, target)
  where action in ('add_book', 'start_book', 'finish_book', 'write_review');
create unique index if not exists xp_once_a_day on xp_events (reader, action, target, day)
  where action in ('visit_room', 'leave_note');
create index if not exists xp_by_reader on xp_events (reader, day);

alter table xp_events enable row level security;
drop policy if exists "read own xp" on xp_events;
create policy "read own xp" on xp_events for select to authenticated using (reader = auth.uid());
revoke insert, update, delete on xp_events from anon, authenticated;

-- Readers may change their own profile, but not their coins.
revoke insert, update on profiles from anon, authenticated;
grant insert (id, username, display_name, avatar_url, bio, favorite_genres, location_lat, location_lng,
  location_name, discoverable, last_active_at, avatar, character, tour_seen_at) on profiles to authenticated;
grant update (id, username, display_name, avatar_url, bio, favorite_genres, location_lat, location_lng,
  location_name, discoverable, last_active_at, avatar, character, tour_seen_at) on profiles to authenticated;

-- The XP a level starts at: level 2 at 100, and each level after costs 50 more than the one
-- before (level 3 at 250, level 4 at 450). The same sum as client/src/lib/levels.js.
create or replace function xp_for_level(lvl integer) returns integer
language sql immutable as $$
  select 100 * (lvl - 1) + 25 * (lvl - 1) * (lvl - 2)
$$;

create or replace function xp_level(total integer) returns integer
language sql immutable as $$
  select coalesce(max(l), 1) from generate_series(1, 500) l where xp_for_level(l) <= total
$$;

create or replace function earn_xp(p_action text, p_target text default '')
returns json
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  target text := coalesce(p_target, '');
  today date := (now() at time zone 'Asia/Singapore')::date;
  points integer;
  before_xp integer;
  before_level integer;
  after_level integer;
  bonus integer := 0;
  balance integer;
begin
  if me is null then
    raise exception 'Sign in to earn XP.';
  end if;
  points := case p_action
    when 'add_book' then 10
    when 'start_book' then 20
    when 'finish_book' then 100
    when 'write_review' then 40
    when 'visit_room' then 15
    when 'leave_note' then 10
    when 'send_message' then 5
  end;
  if points is null then
    raise exception 'Unknown XP action: %', p_action;
  end if;
  -- a reader who hasn't finished Welcome has no profile to add to yet
  if not exists (select 1 from profiles where id = me) then
    return null;
  end if;

  select coalesce(sum(xp), 0) into before_xp from xp_events where reader = me;

  -- up to 10 cafe messages a day count
  if p_action = 'send_message'
    and (select count(*) from xp_events where reader = me and action = p_action and day = today) >= 10 then
    points := 0;
  end if;

  if points > 0 then
    begin
      insert into xp_events (reader, action, target, day, xp) values (me, p_action, target, today, points);
    exception when unique_violation then
      points := 0;
    end;
  end if;

  before_level := xp_level(before_xp);
  after_level := xp_level(before_xp + points);
  -- each new level gives 25 x that level in coins
  if after_level > before_level then
    select sum(25 * l) into bonus from generate_series(before_level + 1, after_level) l;
  end if;
  update profiles set coins = coins + bonus where id = me returning coins into balance;

  return json_build_object(
    'xp', before_xp + points,
    'gained', points,
    'level', after_level,
    'level_up', after_level > before_level,
    'coins', balance,
    'coins_gained', bonus
  );
end
$$;

create or replace function my_progress()
returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'xp', coalesce((select sum(xp) from xp_events where reader = auth.uid()), 0),
    'coins', (select coins from profiles where id = auth.uid())
  )
$$;

create or replace function spend_coins(p_amount integer)
returns integer
language plpgsql security definer set search_path = public as $$
declare
  balance integer;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'A price must be more than 0.';
  end if;
  update profiles set coins = coins - p_amount
    where id = auth.uid() and coins >= p_amount
    returning coins into balance;
  if balance is null then
    raise exception 'Not enough coins.';
  end if;
  return balance;
end
$$;

revoke all on function earn_xp(text, text) from public;
revoke all on function my_progress() from public;
revoke all on function spend_coins(integer) from public;
grant execute on function earn_xp(text, text) to authenticated;
grant execute on function my_progress() to authenticated;
grant execute on function spend_coins(integer) to authenticated;
