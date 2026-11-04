-- Scaffolded with AI assistance — see AI_USAGE.md
-- When each reader last read and last cleared the town's notifications, so every device agrees
-- (client/src/town/notificationsStore.js): anything older than the first is read, anything older
-- than the second is gone from the list. Run after xp_and_coins.sql. Safe to re-run.

alter table profiles add column if not exists notifications_read_at timestamptz;
alter table profiles add column if not exists notifications_cleared_at timestamptz;

-- readers change their own (xp_and_coins.sql lets them update only the columns it names)
grant update (notifications_read_at, notifications_cleared_at) on profiles to authenticated;
