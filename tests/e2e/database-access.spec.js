// Scaffolded with AI assistance — see AI_USAGE.md
// What the database lets a browser do on its own, with the public key: the rules in
// database/lock_down.sql. Only the Express API (service-role key) reads shelves and reviews, and
// XP is only for real things.
import { expect, test } from "./fixtures.js";
import { readXp, readerClient, visitorClient } from "./supabaseUser.js";

// Nothing comes back: either refused, or no rows the rules let through.
async function noRows(query) {
  const { data, error } = await query;
  return Boolean(error) || data.length === 0;
}

test("a visitor can't read anyone's shelf, reviews or books", async ({ reader }) => {
  const visitor = visitorClient();
  for (const table of ["user_books", "reviews", "books", "quotes", "saved_quotes"]) {
    expect(await noRows(visitor.from(table).select("*").limit(1)), table).toBe(true);
  }
  // signed in, the browser still goes through the API for these
  const client = readerClient(reader.session);
  expect(await noRows(client.from("user_books").select("*").limit(1))).toBe(true);
  expect(await noRows(client.from("reviews").select("*").limit(1))).toBe(true);
});

test("nobody runs another reader's daily tasks by their id", async ({ reader }) => {
  for (const client of [visitorClient(), readerClient(reader.session)]) {
    const { error } = await client.rpc("daily_settled", { me: reader.id });
    expect(error?.code).toBe("42501");
  }
});

test("XP needs a real book on your shelf or someone else's room", async ({ reader }) => {
  const client = readerClient(reader.session);
  for (const [action, target] of [["add_book", "no-such-book"], ["finish_book", "no-such-book"], ["write_review", "no-such-book"], ["visit_room", reader.id], ["visit_room", "no.such.reader"]]) {
    const { data, error } = await client.rpc("earn_xp", { p_action: action, p_target: target });
    expect(error, action).toBeNull();
    expect(data.gained, `${action} ${target}`).toBe(0);
  }
  expect(await readXp(reader.id)).toHaveLength(0);
});
