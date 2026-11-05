-- Scaffolded with AI assistance — see AI_USAGE.md
-- When each reader last opened their own notice board, so every device agrees which notes are new
-- (client/src/stores/notesSeen.js): a note left after it is new, highlighted on the corkboard and
-- in the board, and in the town's bell. Run after notifications_seen.sql. Safe to re-run.

alter table profiles add column if not exists notes_read_at timestamptz;

-- readers change their own (xp_and_coins.sql lets them update only the columns it names)
grant update (notes_read_at) on profiles to authenticated;
