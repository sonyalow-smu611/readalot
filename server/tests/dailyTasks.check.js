// Scaffolded with AI assistance — see AI_USAGE.md
// Check for database/daily_tasks.sql (no test framework): runs it in a throwaway Postgres in Docker,
// after the files it builds on, and claims days as a reader would. Needs Docker running.
//   node server/tests/dailyTasks.check.js
import assert from "node:assert";
import { withPostgres } from "./dockerPostgres.js";

const READER = "00000000-0000-4000-8000-0000000000d1";

withPostgres("daily", ({ sql, runFile }) => {
  for (const file of ["schema.sql", "profiles_and_tour.sql", "xp_and_coins.sql", "daily_tasks.sql"]) runFile(file);
  sql(`insert into profiles (id, display_name, coins) values ('${READER}', 'Dee', 480)`);

  // as the signed-in reader: what the function gives back, read as JSON
  const asReader = (call) => JSON.parse(sql(`set request.jwt.claim.sub = '${READER}'; select ${call}`));
  const refused = (call, message) => assert.throws(() => asReader(call), message);
  const coins = () => Number(sql(`select coins from profiles where id = '${READER}'`));
  const daysAgo = (n) => `(now() at time zone 'Asia/Singapore')::date - ${n}`;

  // D1: a first look makes today's row, with no streak and both freezes
  const fresh = asReader("daily_today()");
  assert.equal(fresh.streak, 0);
  assert.equal(fresh.freezes, 2);
  assert.deepEqual(fresh.done, []);

  // D2: only the app's task ids count, each once
  refused("daily_done('hack')", /Unknown daily task/);
  asReader("daily_done('check-in')");
  assert.deepEqual(asReader("daily_done('check-in')").done, ["check-in"]);

  // D3: two tasks done isn't enough to claim
  asReader("daily_done('reading')");
  refused("claim_daily()", /Finish all three tasks/);

  // D4: three done: day 1 gives 50 coins and 20 XP, once
  asReader("daily_done('add-book')");
  const claim = asReader("claim_daily()");
  assert.equal(claim.n, 1);
  assert.equal(claim.coins, 50);
  assert.equal(claim.total_xp, 20);
  assert.equal(coins(), 530);
  assert.equal(claim.state.streak, 1);
  refused("claim_daily()", /already claimed/);
  assert.equal(coins(), 530);

  // D5: two days missed with two freezes: both used, the streak kept, and the panel told
  sql(`update daily_state set day = ${daysAgo(3)}, last_claim = ${daysAgo(3)}, streak = 3, freezes = 2`);
  const frozen = asReader("daily_today()");
  assert.equal(frozen.freezes, 0);
  assert.equal(frozen.streak, 3);
  assert.equal(frozen.notice.kind, "frozen");
  assert.deepEqual(frozen.done, []);

  // D6: two days missed with one freeze: the streak is lost
  sql(`update daily_state set day = ${daysAgo(3)}, last_claim = ${daysAgo(3)}, streak = 5, freezes = 1`);
  const lost = asReader("daily_today()");
  assert.equal(lost.streak, 0);
  assert.equal(lost.notice.kind, "lost");

  // D7: shown and the notice are saved; nobody but the functions can write the row
  assert.ok(asReader("daily_mark_shown()").shown);
  assert.equal(asReader("daily_dismiss_notice()").notice, null);
  assert.throws(() => sql(`set role authenticated; update daily_state set streak = 99`), /permission denied/);

  // D8: day 7 is a chest: the top reward, and a freeze back (never more than two)
  sql(`delete from xp_events where action = 'daily_claim';
    update daily_state set day = ${daysAgo(1)}, last_claim = ${daysAgo(1)}, streak = 6, freezes = 1, done = '{}'`);
  for (const task of ["check-in", "reading", "add-book"]) asReader(`daily_done('${task}')`);
  const seventh = asReader("claim_daily()");
  assert.equal(seventh.n, 7);
  assert.equal(seventh.chest, true);
  assert.equal(seventh.coins, 300);
  assert.equal(seventh.state.freezes, 2);
});
