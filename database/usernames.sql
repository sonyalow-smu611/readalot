-- Scaffolded with AI assistance — see AI_USAGE.md
-- Usernames for every reader: firstname.word, like the demo readers' sofia.shelves.
-- Run after schema.sql in the Supabase SQL editor. Checked by server/tests/usernames.check.js.

-- "Dylan Tan" is dylan.<a reading word>; no display name, or no letters in it, is reader.<word>
create or replace function readalot_new_username(display_name text) returns text
language sql volatile as $$
  select coalesce(nullif(regexp_replace(lower(split_part(trim(coalesce(display_name, '')), ' ', 1)), '[^a-z]', '', 'g'), ''), 'reader')
    || '.'
    || (array['pages', 'shelves', 'reads', 'chapters', 'margins', 'books', 'bookmarks', 'novels', 'stories', 'spines', 'verses', 'tales', 'prose', 'quills', 'ink', 'folios'])[1 + floor(random() * 16)::int]
$$;

-- one nobody has: a few tries at a free firstname.word, then a number on the end (dylan.pages2)
create or replace function readalot_unique_username(display_name text) returns text
language plpgsql volatile as $$
declare
  candidate text;
  base text;
  n integer := 1;
begin
  for tries in 1..5 loop
    candidate := readalot_new_username(display_name);
    if not exists (select 1 from profiles where username = candidate) then
      return candidate;
    end if;
  end loop;
  base := candidate;
  loop
    n := n + 1;
    candidate := base || n;
    if not exists (select 1 from profiles where username = candidate) then
      return candidate;
    end if;
  end loop;
end
$$;

-- Readers can't call these through the API: answers from them would show which names private
-- readers hold.
revoke execute on function readalot_new_username(text), readalot_unique_username(text) from public, anon, authenticated;

-- a reader who joins later gets one when Welcome makes their profile. security definer: the reader
-- signing up can't see private profiles, but their names are taken too.
create or replace function readalot_give_username() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.username is null or new.username = '' then
    new.username := readalot_unique_username(new.display_name);
  end if;
  return new;
end
$$;

drop trigger if exists profiles_give_username on profiles;
create trigger profiles_give_username
  before insert on profiles
  for each row execute function readalot_give_username();

-- the readers who have none yet, one at a time so each sees the names given before it
do $$
declare
  reader record;
begin
  for reader in select id, display_name from profiles where username is null or username = '' order by created_at, id loop
    update profiles set username = readalot_unique_username(reader.display_name) where id = reader.id;
  end loop;
end
$$;
