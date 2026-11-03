-- Scaffolded with AI assistance — see AI_USAGE.md
-- Security fixes from the Supabase audit (SUPABASE_AUDIT.md). Run after every other file in
-- database/, in the Supabase SQL editor. Safe to re-run.
--
-- 1. schema.sql made books, user_books, reviews, quotes, featured_quotes and saved_quotes without
--    row level security, so the public (anon) key read every reader's shelf and reviews, private
--    readers' too. Only the Express API uses these tables, with the service-role key (which skips
--    these rules), so the browser gets no access at all.
-- 2. revoke ... from public doesn't take back what Supabase grants anon and authenticated
--    directly, so daily_settled(uuid) ran for any reader's id, signed out or in. The functions that
--    are meant for signed-in readers now run for signed-in readers only.
-- 3. earn_xp() gave XP (and level-up coins) for any made-up target: a book now has to be on the
--    reader's shelf (or reviewed by them), and a room has to be another reader's.

-- 1 -------------------------------------------------------------------------------------------
alter table books enable row level security;
alter table user_books enable row level security;
alter table reviews enable row level security;
alter table quotes enable row level security;
alter table featured_quotes enable row level security;
alter table saved_quotes enable row level security;
revoke all on books, user_books, reviews, quotes, featured_quotes, saved_quotes from anon, authenticated;

-- 2 -------------------------------------------------------------------------------------------
revoke execute on function daily_settled(uuid) from anon, authenticated;
revoke execute on function earn_xp(text, text), my_progress(), spend_coins(integer),
  daily_today(), daily_done(text), daily_mark_shown(), daily_dismiss_notice(), claim_daily()
  from anon;

-- 3 -------------------------------------------------------------------------------------------
-- Whether a reader may earn XP for this action and target: the thing it's about has to exist.
create or replace function xp_target_ok(me uuid, p_action text, target text) returns boolean
language sql stable security definer set search_path = public as $$
  select case p_action
    when 'add_book' then exists (select 1 from user_books where user_id = me and book_id = target)
    when 'start_book' then exists (select 1 from user_books where user_id = me and book_id = target
      and status in ('reading', 'read'))
    when 'finish_book' then exists (select 1 from user_books where user_id = me and book_id = target
      and status = 'read')
    when 'write_review' then exists (select 1 from reviews where user_id = me and book_id = target)
    -- a room is named by its reader's username (or account id), and isn't your own
    when 'visit_room' then exists (select 1 from profiles where (username = target or id::text = target) and id <> me)
    when 'leave_note' then exists (select 1 from profiles where (username = target or id::text = target) and id <> me)
    else true
  end
$$;
revoke execute on function xp_target_ok(uuid, text, text) from public, anon, authenticated;

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
  -- nothing for a book that isn't on your shelf or a room that isn't someone else's
  if not xp_target_ok(me, p_action, target) then
    points := 0;
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
revoke all on function earn_xp(text, text) from public, anon;
grant execute on function earn_xp(text, text) to authenticated;
