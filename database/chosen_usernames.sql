-- Scaffolded with AI assistance — see AI_USAGE.md
-- Usernames readers pick when they register (aalric.reads, mei_23) instead of a made-up one.
-- Register saves the pick on the account (auth user metadata `username`); when Welcome makes the
-- profile, the profile takes it, if it is still free. Run after usernames.sql in the Supabase SQL
-- editor.

-- 3 to 20 lowercase letters, numbers, dots and underscores
create or replace function readalot_valid_username(name text) returns boolean
language sql immutable as $$
  select coalesce(name ~ '^[a-z0-9._]{3,20}$', false)
$$;

-- Register asks before signing up whether a name is free. It answers only yes or no, never who
-- holds a name. security definer: private readers' names are taken too.
create or replace function readalot_username_free(name text) returns boolean
language sql stable security definer set search_path = public as $$
  select readalot_valid_username(name) and not exists (select 1 from profiles where username = name)
$$;

revoke execute on function readalot_username_free(text) from public;
grant execute on function readalot_username_free(text) to anon, authenticated;

-- The profile's username when Welcome makes it: the one picked at Register, if it is valid and
-- nobody took it in the meantime; otherwise a made-up firstname.word (usernames.sql).
create or replace function readalot_give_username() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  picked text;
begin
  if new.username is null or new.username = '' then
    select raw_user_meta_data ->> 'username' into picked from auth.users where id = new.id;
    if readalot_valid_username(picked) and not exists (select 1 from profiles where username = picked) then
      new.username := picked;
    else
      new.username := readalot_unique_username(new.display_name);
    end if;
  end if;
  return new;
end
$$;
