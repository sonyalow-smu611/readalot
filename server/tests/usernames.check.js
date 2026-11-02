// Scaffolded with AI assistance — see AI_USAGE.md
// Check for database/usernames.sql (no test framework): runs it in a throwaway Postgres in Docker,
// after schema.sql, and checks what the profiles table holds. Needs Docker running.
//   node server/tests/usernames.check.js
import assert from "node:assert";
import { withPostgres } from "./dockerPostgres.js";

withPostgres("usernames", ({ sql, runFile }) => {
  const usernameOf = (displayName) =>
    sql(`select username from profiles where display_name is not distinct from ${displayName === null ? "null" : `'${displayName}'`}`);

  runFile("schema.sql");
  runFile("profiles_and_tour.sql");
  sql("grant select, insert, update on profiles to authenticated");

  // U1: a blank username, missing or empty, becomes firstname.word, lowercase
  sql(`insert into profiles (id, display_name, username) values
    (gen_random_uuid(), 'Dylan Tan', null),
    (gen_random_uuid(), 'Mei Chen', ''),
    (gen_random_uuid(), null, null)`);
  runFile("usernames.sql");
  assert.match(usernameOf("Dylan Tan"), /^dylan\.[a-z]+$/);
  assert.match(usernameOf("Mei Chen"), /^mei\.[a-z]+$/);
  assert.match(usernameOf(null), /^reader\.[a-z]+$/);

  // U2: forty Dylans (more than there are words) each get their own, with a number when needed
  sql("delete from profiles");
  sql(`insert into profiles (id, display_name) select gen_random_uuid(), 'Dylan' from generate_series(1, 40)`);
  runFile("usernames.sql");
  const dylans = sql("select username from profiles").split("\n");
  assert.equal(dylans.length, 40);
  assert.equal(new Set(dylans).size, 40, "no two readers share a username");
  for (const name of dylans) assert.match(name, /^dylan\.[a-z]+\d*$/);

  // U3: a username a reader already has stays as it is
  sql("delete from profiles");
  sql(`insert into profiles (id, display_name, username) values
    (gen_random_uuid(), 'Sofia Lim', 'sofia.shelves'),
    (gen_random_uuid(), 'Sofia Tan', null)`);
  runFile("usernames.sql");
  assert.equal(usernameOf("Sofia Lim"), "sofia.shelves");
  const otherSofia = usernameOf("Sofia Tan");
  assert.match(otherSofia, /^sofia\.[a-z]+\d*$/);

  // U5: running the file again changes nothing
  runFile("usernames.sql");
  assert.equal(usernameOf("Sofia Lim"), "sofia.shelves");
  assert.equal(usernameOf("Sofia Tan"), otherSofia);

  // U4: a reader who joins afterwards gets one when their profile is made
  sql(`insert into profiles (id, display_name) values (gen_random_uuid(), 'Aasim Khan')`);
  sql(`insert into profiles (id, display_name, username) values (gen_random_uuid(), 'Emiley Ong', '')`);
  assert.match(usernameOf("Aasim Khan"), /^aasim\.[a-z]+\d*$/);
  assert.match(usernameOf("Emiley Ong"), /^emiley\.[a-z]+\d*$/);

  // U6: Welcome saves the profile as the reader, who can't see private profiles. A private reader
  // already holding every dylan.<word> must still not take a new Dylan's sign-up down.
  sql("delete from profiles");
  const words = ["pages", "shelves", "reads", "chapters", "margins", "books", "bookmarks", "novels", "stories", "spines", "verses", "tales", "prose", "quills", "ink", "folios"];
  sql(`insert into profiles (id, display_name, username, discoverable) values
    ${words.map((word) => `(gen_random_uuid(), 'Hidden', 'dylan.${word}', false)`).join(", ")}`);
  const newcomer = "00000000-0000-4000-8000-000000000001";
  sql(`set role authenticated; set request.jwt.claim.sub = '${newcomer}';
    insert into profiles (id, display_name) values ('${newcomer}', 'Dylan Tan')`);
  assert.match(usernameOf("Dylan Tan"), /^dylan\.[a-z]+\d+$/);

  // U7: a reader can't call the name lookup themselves to find out who holds which name
  assert.throws(
    () => sql(`set role authenticated; select readalot_unique_username('Dylan')`),
    /permission denied/
  );

  console.log("usernames.sql: all checks passed");
});
