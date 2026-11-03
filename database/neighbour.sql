-- Scaffolded with AI assistance — see AI_USAGE.md
-- Pip the Librarian, the neighbour every reader can befriend (server/data/demoReaders.js), answers
-- the messages readers send them with a short friendly line. Run after reader_messages.sql, once
-- Pip's account exists (npm run seed:readers -w server). Safe to re-run.

create or replace function pip_replies() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  lines text[] := array[
    'Hi! Have you found a good book yet?',
    'Lovely to hear from you! The library''s help desk can find any book.',
    'Ooh, tell me what you''re reading now!',
    'Have you visited the cafe? There are readers like you there.',
    'Don''t forget your daily tasks: they keep your streak going!',
    'A good book and a cup of tea: perfect day.'
  ];
begin
  if new.receiver_id = '00000000-0000-4000-8000-000000000208' then
    insert into reader_messages (sender_id, receiver_id, content, created_at)
    -- a second later, so the reply comes after the message
    values (new.receiver_id, new.sender_id, lines[1 + floor(random() * array_length(lines, 1))::int],
      new.created_at + interval '1 second');
  end if;
  return new;
end
$$;

revoke all on function pip_replies() from public, anon, authenticated;

drop trigger if exists pip_replies on reader_messages;
create trigger pip_replies after insert on reader_messages
  for each row execute function pip_replies();
