-- Scaffolded with AI assistance — see AI_USAGE.md
-- The town's daily tasks, with the rules client/src/town/daily.js shows: three tasks a day (the day
-- in Singapore), a reward for finishing them, a streak for claiming on days in a row, and freezes
-- that cover missed days. The team agreed that AI writes this file, claim_daily() included.
-- Run after xp_and_coins.sql in the Supabase SQL editor. Safe to re-run.
--
-- Readers only read their own row: every change goes through the functions below, which check it,
-- so the streak and the reward are the same on every device and can't be claimed twice.

create table if not exists daily_state (
  reader uuid primary key references profiles(id) on delete cascade,
  day date not null,
  -- the ids of today's tasks done (client/src/town/daily.js)
  done text[] not null default '{}',
  streak integer not null default 0,
  last_claim date,
  freezes integer not null default 2,
  -- what the panel tells the reader once: {"kind":"frozen","used":n,"streak":n} or {"kind":"lost","streak":n}
  notice jsonb,
  -- the day the panel last opened by itself
  shown date,
  updated_at timestamptz not null default now()
);

alter table daily_state enable row level security;
drop policy if exists "read own day" on daily_state;
create policy "read own day" on daily_state for select to authenticated using (reader = auth.uid());
revoke insert, update, delete on daily_state from anon, authenticated;

-- a day's reward is claimed once, whatever two tabs or two devices do
create unique index if not exists xp_daily_claim_once on xp_events (reader, day) where action = 'daily_claim';

create or replace function daily_json(s daily_state) returns json
language sql immutable as $$
  select json_build_object('day', s.day, 'done', s.done, 'streak', s.streak, 'last_claim', s.last_claim,
    'freezes', s.freezes, 'notice', s.notice, 'shown', s.shown)
$$;

-- The reader's row, made if missing and moved on to today: today's ticks cleared and, for each
-- whole day missed since the last claim, a freeze used, or the streak lost if there aren't enough.
-- Locked until the calling function ends, so two claims at once can't both see an unclaimed day.
create or replace function daily_settled(me uuid) returns daily_state
language plpgsql security definer set search_path = public as $$
declare
  today date := (now() at time zone 'Asia/Singapore')::date;
  s daily_state;
  missed integer;
begin
  if me is null then
    raise exception 'Sign in for your daily tasks.';
  end if;
  if not exists (select 1 from profiles where id = me) then
    raise exception 'Finish Welcome first.';
  end if;
  insert into daily_state (reader, day) values (me, today) on conflict (reader) do nothing;
  select * into s from daily_state where reader = me for update;
  if s.day = today then
    return s;
  end if;

  s.day := today;
  s.done := '{}';
  s.notice := null;
  if s.last_claim is not null and s.streak > 0 then
    missed := (today - s.last_claim) - 1;
    if missed > 0 and missed <= s.freezes then
      s.notice := jsonb_build_object('kind', 'frozen', 'used', missed, 'streak', s.streak);
      s.freezes := s.freezes - missed;
      -- as if they had claimed yesterday: the streak carries on
      s.last_claim := today - 1;
    elsif missed > 0 then
      s.notice := jsonb_build_object('kind', 'lost', 'streak', s.streak);
      s.streak := 0;
      s.last_claim := null;
    end if;
  end if;
  update daily_state
    set day = s.day, done = s.done, notice = s.notice, freezes = s.freezes, streak = s.streak,
      last_claim = s.last_claim, updated_at = now()
    where reader = me;
  return s;
end
$$;

-- Today's state, as the panel shows it.
create or replace function daily_today() returns json
language plpgsql security definer set search_path = public as $$
begin
  return daily_json(daily_settled(auth.uid()));
end
$$;

-- Ticks off one of the app's tasks for today.
create or replace function daily_done(p_task text) returns json
language plpgsql security definer set search_path = public as $$
declare
  s daily_state;
begin
  if p_task is null or p_task not in ('check-in', 'reading', 'visit-room', 'send-message', 'add-book', 'leave-note') then
    raise exception 'Unknown daily task: %', p_task;
  end if;
  s := daily_settled(auth.uid());
  if not (p_task = any (s.done)) then
    update daily_state set done = array_append(done, p_task), updated_at = now()
      where reader = s.reader returning * into s;
  end if;
  return daily_json(s);
end
$$;

-- The panel has opened by itself today.
create or replace function daily_mark_shown() returns json
language plpgsql security definer set search_path = public as $$
declare
  s daily_state;
begin
  s := daily_settled(auth.uid());
  update daily_state set shown = s.day, updated_at = now() where reader = s.reader returning * into s;
  return daily_json(s);
end
$$;

-- The reader has read the frozen or lost notice.
create or replace function daily_dismiss_notice() returns json
language plpgsql security definer set search_path = public as $$
declare
  s daily_state;
begin
  s := daily_settled(auth.uid());
  update daily_state set notice = null, updated_at = now() where reader = s.reader returning * into s;
  return daily_json(s);
end
$$;

-- Claims today's reward once all three tasks are done: coins and XP for day n of the streak (day 7
-- and on give the last), every 7th day a chest that gives back a freeze, plus 25 x each new level
-- in coins, as earn_xp() gives.
create or replace function claim_daily() returns json
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  reward_coins integer[] := array[50, 75, 100, 125, 150, 200, 300];
  reward_xp integer[] := array[20, 20, 30, 30, 40, 40, 75];
  s daily_state;
  n integer;
  gift_coins integer;
  gift_xp integer;
  chest boolean;
  before_xp integer;
  before_level integer;
  after_level integer;
  bonus integer := 0;
  balance integer;
begin
  s := daily_settled(me);
  if s.last_claim = s.day then
    raise exception 'Today''s reward is already claimed.';
  end if;
  if cardinality(s.done) < 3 then
    raise exception 'Finish all three tasks first.';
  end if;

  n := s.streak + 1;
  gift_coins := reward_coins[least(n, 7)];
  gift_xp := reward_xp[least(n, 7)];
  chest := n % 7 = 0;

  select coalesce(sum(xp), 0) into before_xp from xp_events where reader = me;
  begin
    insert into xp_events (reader, action, target, day, xp) values (me, 'daily_claim', '', s.day, gift_xp);
  exception when unique_violation then
    raise exception 'Today''s reward is already claimed.';
  end;
  before_level := xp_level(before_xp);
  after_level := xp_level(before_xp + gift_xp);
  if after_level > before_level then
    select sum(25 * l) into bonus from generate_series(before_level + 1, after_level) l;
  end if;
  update profiles set coins = coins + gift_coins + bonus where id = me returning coins into balance;

  update daily_state
    set streak = n, last_claim = s.day, notice = null, updated_at = now(),
      freezes = case when chest then least(2, s.freezes + 1) else s.freezes end
    where reader = me returning * into s;

  return json_build_object(
    'state', daily_json(s),
    'n', n,
    'coins', gift_coins,
    'xp', gift_xp,
    'chest', chest,
    'total_xp', before_xp + gift_xp,
    'balance', balance,
    'level_up', after_level > before_level
  );
end
$$;

revoke all on function daily_settled(uuid) from public;
revoke all on function daily_today() from public;
revoke all on function daily_done(text) from public;
revoke all on function daily_mark_shown() from public;
revoke all on function daily_dismiss_notice() from public;
revoke all on function claim_daily() from public;
grant execute on function daily_today() to authenticated;
grant execute on function daily_done(text) to authenticated;
grant execute on function daily_mark_shown() to authenticated;
grant execute on function daily_dismiss_notice() to authenticated;
grant execute on function claim_daily() to authenticated;
