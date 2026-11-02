// Scaffolded with AI assistance — see AI_USAGE.md
// Check for database/drop_connections.sql (no test framework): follows (the connections table)
// are gone, friends are kept. Runs in a throwaway Postgres in Docker. Needs Docker running.
//   node server/tests/dropConnections.check.js
import assert from "node:assert";
import { withPostgres } from "./dockerPostgres.js";

withPostgres("drop-connections", ({ sql, runFile }) => {
  const count = (table) => sql(`select count(*) from ${table}`);
  const exists = (table, database) => sql(`select to_regclass('public.${table}') is not null`, database) === "t";

  // a database made before this change: connections, with a follow in it, beside a friendship
  runFile("schema.sql");
  runFile("profiles_and_tour.sql");
  runFile("nearby_friends.sql");
  sql(`create table if not exists connections (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references profiles(id) on delete cascade,
    target_user_id uuid references profiles(id) on delete cascade,
    created_at timestamptz default now(),
    unique (user_id, target_user_id))`);
  sql(`insert into profiles (id, display_name, username) values
    ('00000000-0000-4000-8000-000000000001', 'Sonya', 'sonya.pages'),
    ('00000000-0000-4000-8000-000000000002', 'Emma Tan', 'emma.reads')`);
  sql(`insert into connections (user_id, target_user_id) values
    ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002')`);
  sql(`insert into friendships (requester, addressee, status, accepted_at) values
    ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', 'accepted', now())`);

  // F2: connections goes; profiles and friendships stay as they were
  runFile("drop_connections.sql");
  assert.equal(exists("connections"), false, "connections is dropped");
  assert.equal(count("profiles"), "2");
  assert.equal(count("friendships"), "1");

  // running it again is fine
  runFile("drop_connections.sql");
  assert.equal(count("friendships"), "1");

  // a new project made from schema.sql never has it
  sql("create database fresh");
  runFile("schema.sql", "fresh");
  assert.equal(exists("profiles", "fresh"), true);
  assert.equal(exists("connections", "fresh"), false, "schema.sql doesn't make connections");

  console.log("drop_connections.sql: all checks passed");
});
