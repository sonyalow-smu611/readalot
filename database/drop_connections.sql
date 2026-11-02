-- Scaffolded with AI assistance — see AI_USAGE.md
-- Follows are gone: the profile's Add friend sends a friend request (the friendships table), and
-- nothing reads or writes connections any more. Run once in the Supabase SQL editor; safe to re-run.
-- No cascade: if anything still depended on connections, this stops with an error instead.
drop table if exists connections;
