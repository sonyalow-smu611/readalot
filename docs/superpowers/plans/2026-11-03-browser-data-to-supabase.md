# Browser Data to Supabase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Daily tasks, the notifications' read state and the demo readers' room furniture live in Supabase, and the browser-only chat is removed, so a reader's progress is the same on every device and Daily rewards are really saved.

**Architecture:** Daily tasks get a `daily_state` table that readers can only read; every change goes through `security definer` functions (`daily_today`, `daily_done`, `daily_mark_shown`, `daily_dismiss_notice`, `claim_daily`), the same pattern as `earn_xp`/`spend_coins` in `database/xp_and_coins.sql`, called from a new `client/src/services/daily.js` like `services/progress.js`. Notifications keep being built from Supabase data (requests, visits) and store two times on the profile: read up to, and cleared up to. Demo furniture moves from the client into `server/data/demoReaders.js` and the seed script.

**Tech Stack:** Vue 3 + Pinia, Express, Supabase (Postgres, RLS, RPC), Playwright.

**Spec:** this conversation's recommendation (no spec file): move Daily tasks, notifications' seen marker and demo furniture to Supabase, seed the demo readers' areas, drop the browser-only chat. The `demo-` books need no move: they only exist when the server runs without Supabase.

## Global Constraints

- Vue 3 `<script setup>`, plain JavaScript, no TypeScript. Components reach our API only through `client/src/services/`.
- Every new or changed file gets `// Scaffolded with AI assistance — see AI_USAGE.md` (`--` in SQL) and a row in `AI_USAGE.md`.
- **Team agreement first:** `PROJECT.md` bars AI from writing business logic and database functions unless the team agrees and it is recorded. `claim_daily()` is business logic. Task 0 is a gate.
- **No commits by the agent.** Each task ends with "Dylan reviews and commits".
- SQL files are run by hand in the Supabase SQL editor, and are safe to re-run (`if not exists`, `create or replace`).
- The day is the date in Singapore: `(now() at time zone 'Asia/Singapore')::date`, as `earn_xp` uses.
- Rewards stay as `client/src/town/daily.js` has them: coins `[50, 75, 100, 125, 150, 200, 300]`, XP `[20, 20, 30, 30, 40, 40, 75]`, day 7 onward gives the last; every 7th day is a chest that gives back one freeze, up to `MAX_FREEZES = 2`.
- Ownership: `town/` is Dylan's; `buildings/house/visitors.js` (Sonz), `components/people/ReaderChat.vue` and `services/chatApi.js` (Emiley), `database/`, `server/` and `tests/e2e/supabaseUser.js` are shared — the pull request names them for review.

## Review Focus

- A reader who claims on two tabs at once gets the reward once: `claim_daily()` refuses a second claim the same day (unique index), tested in Task 5.
- A reader who edits the browser can't claim without three tasks done: `claim_daily()` checks `done` on the server, tested in Task 5.
- A reader away for days sees the streak frozen or lost exactly as before: `daily_today()` mirrors `settle()`, tested in Task 5 with a `last_claim` three days back.
- Signed-in on a second device: notifications already read stay read and cleared ones stay gone, tested in Task 3.
- Supabase unreachable: the Daily button hides and the town still works, tested in Task 5.

---

### Task 0: Team agreement (gate)

- [ ] **Step 1:** Dylan asks the team to agree that AI writes `database/daily_tasks.sql` (including `claim_daily()`), `database/notifications_seen.sql` and the small server changes below.
- [ ] **Step 2:** Record it at the top of the new `AI_USAGE.md` section ("The team agreed that AI writes …"), as the nearby-readers section does. **Stop here if the team says no.**

### Task 1: Demo readers' furniture from the server

**Files:**
- Modify: `server/data/demoReaders.js` (a `furniture` list on each reader that has some)
- Modify: `server/scripts/seedReaders.js` (upsert `room_furniture`)
- Modify: `server/src/services/roomFurniture.js` (without Supabase, a demo reader's room starts from that list)
- Modify: `client/src/buildings/house/visitors.js` (drop `FURNISHINGS` and the fallback)
- Test: `tests/e2e/visit-room.spec.js`

**Interfaces:**
- Produces: `DEMO_READERS[i].furniture: [{ uid, id, zone, x }]`, `uid` as `demo-<username>-<k>`; the same pieces `cleanPieces()` accepts.

- [ ] **Step 1:** Move each reader's list from `FURNISHINGS` in `visitors.js` onto that reader in `demoReaders.js`, adding `uid`.
- [ ] **Step 2:** In `seedReaders.js`, after `user_books`: `ok("room_furniture", supabase.from("room_furniture").upsert(readers with furniture → { owner_id: reader.id, pieces: reader.furniture, updated_at }))`.
- [ ] **Step 3:** In `roomFurniture.js`, `getPieces(ownerId)` without Supabase returns `demoRooms.get(ownerId) ?? DEMO_READERS.find((r) => r.id === ownerId)?.furniture ?? []`.
- [ ] **Step 4:** In `visitors.js`, `furnitureOf(readerId)` returns only the saved placed pieces; delete `FURNISHINGS`. Update the comment.
- [ ] **Step 5:** Run `npx playwright test tests/e2e/visit-room.spec.js tests/e2e/room-furniture.spec.js`. Expected: the tests that look for Emma's Moon poster and Wingback chair pass (demo API now serves them).
- [ ] **Step 6:** Build: `npm --workspace client run build`. Dylan reviews and commits.

### Task 2: Remove the browser-only chat

**Files:**
- Modify: `client/src/services/chatApi.js`
- Modify: `client/src/components/people/ReaderChat.vue`
- Test: `tests/e2e/reader-profile.spec.js` (new test)

**Interfaces:**
- Produces: `resolveChatRecipient(readerId) → { id }` (a Supabase account id), throwing `"This reader can't receive messages yet."` when the reader has no account; `getMessages(recipientId, senderId)` and `sendReaderMessage(recipientId, content, senderId)` without the `{ demo }` option.

- [ ] **Step 1: Write the failing test** `"a reader with no account can't be messaged, and says so"`: route `**/api/people/nobody.local` to `{ reader: { id: "nobody.local", userId: "not-a-uuid", displayName: "No Body", books: [], favoriteGenres: [] } }`, open their profile, press Message, expect the alert `"This reader can't receive messages yet."` and no textbox `"Message"`.
- [ ] **Step 2:** Run it. Expected: FAIL (today it opens a device-only chat).
- [ ] **Step 3:** Delete `DEMO_PREFIX`, `demoKey`, `readDemo` and both `demo` branches in `chatApi.js`; `resolveChatRecipient` throws the message above for a missing or non-UUID `userId` or "Reader not found". In `ReaderChat.vue` delete `demoMode`, its label text, its note and `.demo-note`; the existing error state shows the message.
- [ ] **Step 4:** Run `npx playwright test tests/e2e/reader-profile.spec.js tests/e2e/cafe-profile.spec.js tests/e2e/buttons.spec.js`. Expected: PASS.
- [ ] **Step 5:** Dylan reviews and commits.

### Task 3: Notifications' read and cleared state in Supabase

**Files:**
- Create: `database/notifications_seen.sql`
- Modify: `server/src/services/friends.js` (`incoming` items carry `at`)
- Modify: `client/src/services/auth.js` (save the two times)
- Modify: `client/src/town/notificationsStore.js` (no localStorage)
- Modify: `client/src/views/TownView.vue` (pass the profile's times to `start`)
- Test: `tests/e2e/notifications.spec.js`

**Interfaces:**
- Produces (SQL): `profiles.notifications_read_at timestamptz`, `profiles.notifications_cleared_at timestamptz`, both null by default, both granted `update` to `authenticated`.
- Produces (server): `friendsOf(me).incoming: [{ requestId, reader, at }]`, `at` = the friendship's `created_at`.
- Produces (client): `saveNotificationTimes(userId, { readAt?, clearedAt? })` in `services/auth.js`, the same shape as `markTourSeen`; `notificationsStore.start(id, { readAt, clearedAt })`.

- [ ] **Step 1: Write the failing test** `"read and cleared stay that way on another device"`: with `mockFriends` giving one visit from Emma, open the town, open the bell (marks read), close it; open a second page in a new context signed in as the same reader (`signInPage`) with the same mocks; expect `"Notifications, 0 new"` and the visit listed. Then press Clear on page 2, reload page 1, expect the list empty.
- [ ] **Step 2:** Run it. Expected: FAIL (`1 new` on the second device).
- [ ] **Step 3:** Write `notifications_seen.sql` (add both columns if not exists; `grant update (notifications_read_at, notifications_cleared_at) on profiles to authenticated`). Dylan runs it in the Supabase SQL editor.
- [ ] **Step 4:** Add `at: row.created_at` to `incoming` in `friendsOf`.
- [ ] **Step 5:** Rewrite the store's state without localStorage. Items are built on each `check()` from `nearby.incoming` (kind `request`, `at`), visits since the later of `clearedAt` and a week ago (kind `visit`), and friends coming online this visit (kind `online`, `at` now, kept for the session only). An item is `read` when `at <= readAt`, hidden when `at <= clearedAt`. It pops up once per session when `at > readAt`. `markRead()` sets `readAt` to now, `clear()` sets `clearedAt` to now; both save through `saveNotificationTimes` and keep working for the session if the save fails.
- [ ] **Step 6:** In `TownView.vue`, call `notifications.start(id, { readAt: profile.notifications_read_at, clearedAt: profile.notifications_cleared_at })`.
- [ ] **Step 7:** Run `npx playwright test tests/e2e/notifications.spec.js tests/e2e/friends-list.spec.js`. Expected: PASS, including the existing "pops up, once" test.
- [ ] **Step 8:** Dylan reviews and commits.

### Task 4: Daily tasks in the database

**Files:**
- Create: `database/daily_tasks.sql`
- Create: `server/tests/dailyTasks.check.js` (team pattern; needs Docker, which this Mac doesn't have, so a teammate with Docker runs it)

**Interfaces:**
- Produces table `daily_state (reader uuid primary key references profiles on delete cascade, day date not null, done text[] not null default '{}', streak int not null default 0, last_claim date, freezes int not null default 2, notice jsonb, shown date, updated_at timestamptz not null default now())`; RLS: a reader selects their own row; no insert, update or delete for `anon`/`authenticated`.
- Produces a unique index `xp_daily_claim_once on xp_events (reader, day) where action = 'daily_claim'`.
- Produces functions, each `security definer`, `search_path = public`, executable by `authenticated` only, each returning the row as JSON `{ day, done, streak, last_claim, freezes, notice, shown }`:
  - `daily_today()`: creates the row for today if missing, otherwise moves it to today like `settle()` in `client/src/town/daily.js` (clears `done` and `notice`; missed days = `today - last_claim - 1`; missed ≤ freezes → freezes −= missed, `last_claim = today - 1`, notice `{"kind":"frozen","used":missed,"streak":streak}`; else notice `{"kind":"lost","streak":streak}`, streak 0, `last_claim` null), saves and returns it.
  - `daily_done(p_task text)`: refuses ids other than `check-in`, `reading`, `visit-room`, `send-message`, `add-book`, `leave-note`; adds it to today's `done` once.
  - `daily_mark_shown()`: `shown = today`. `daily_dismiss_notice()`: `notice = null`.
  - `claim_daily()` returns `{ state, n, coins, xp, chest, total_xp, balance, level_up }`: refuses (`raise exception`) unless the row is today, `last_claim` isn't today, and `cardinality(done) >= 3`; `n = streak + 1`; reward from the arrays above at `least(n, 7)`; chest when `n % 7 = 0` (freezes `least(2, freezes + 1)`); inserts `xp_events (reader, 'daily_claim', '', today, xp)`; adds the coins plus any level-up coins (25 × each new level, as `earn_xp`) to `profiles.coins`.

- [ ] **Step 1: Write the check** in `dailyTasks.check.js` with `withPostgres("daily", …)`, after `schema.sql`, `profiles_and_tour.sql`, `xp_and_coins.sql`, `daily_tasks.sql`, setting `request.jwt.claim.sub` for `auth.uid()` as the other checks do. Assertions: a fresh reader's `daily_today()` has streak 0, freezes 2; `claim_daily()` with two tasks done raises; with three done gives `n = 1`, coins `+50`, `total_xp = 20`; a second `claim_daily()` the same day raises; a row with `last_claim` three days back and freezes 2 comes back from `daily_today()` with freezes 0 and notice kind `frozen`; with freezes 1 it comes back with streak 0 and notice kind `lost`; `daily_done('hack')` raises.
- [ ] **Step 2:** Write `daily_tasks.sql` to the interface above.
- [ ] **Step 3:** If Docker is available, run `node server/tests/dailyTasks.check.js` and expect no output and exit 0; otherwise note it for a teammate. Dylan runs `daily_tasks.sql` in the Supabase SQL editor.
- [ ] **Step 4:** Dylan reviews and commits.

### Task 5: The town's Daily tasks on Supabase

**Files:**
- Create: `client/src/services/daily.js`
- Modify: `client/src/town/daily.js` (drop `loadState`, `saveState`, `STORAGE_KEY`; add `fromRow`)
- Modify: `client/src/town/dailyStore.js`
- Modify: `client/src/views/TownView.vue:383-390`, `client/src/components/town/DailyDock.vue:148-156` (await the claim)
- Modify: `tests/e2e/supabaseUser.js` (`setDaily`), `tests/e2e/townFriends.js` (`skipDailyPanel`), and the specs that write `readalot-daily` to localStorage: `daily`, `friends`, `friends-list`, `nearby`, `notifications`, `town-map`, `town`
- Test: `tests/e2e/daily.spec.js`

**Interfaces:**
- Consumes: Task 4's functions.
- Produces: `services/daily.js` — `loadDaily()`, `markDailyDone(taskId)`, `markDailyShown()`, `dismissDailyNotice()`, `claimDaily()`, each `supabase.rpc(...)` returning `{ data, error }`, `missing()` when Supabase isn't configured (as `services/progress.js`).
- Produces: `fromRow(row) → { day, done, streak, lastClaim, freezes, notice, shown, offset: 0 }` in `town/daily.js`.
- Produces: store `start(id): Promise<void>`, `claim(): Promise<{ n, coins, xp, chest, totalXp, balance } | null>`, `collect(gift)` setting `progress.xp = gift.totalXp`, `progress.coins = gift.balance`, `progress.lastGain`; `error` ref, a message when a save or claim failed. The preview buttons (`previewDays`, `previewReset`) change only the local copy and say so in a comment.
- Produces (tests): `setDaily(readerId, state)` upserts the reader's `daily_state` row through `admin`; `skipDailyPanel(page, readerId)` becomes `skipDailyPanel(readerId)` doing `setDaily(readerId, { shown: today })`.

- [ ] **Step 1: Write the failing tests** in `daily.spec.js`: `"a claimed reward is saved: the coins and streak are there after a reload"` (all three done via `setDaily`, claim 50 coins, reload, expect `/1-day streak/` on the tab and the profile link's coins up by 50) and `"the streak is the same on another device"` (claim, then a new context signed in as the reader shows `reward claimed`). Change `setDaily` callers to the new helper.
- [ ] **Step 2:** Run them. Expected: FAIL (the reload loses the claim).
- [ ] **Step 3:** Write `services/daily.js`, `fromRow`, and the store: `start` loads with `loadDaily()`; `record(action)` updates `done` locally then calls `markDailyDone`; `markShown`/`dismissNotice` call theirs; `claim` calls `claimDaily()` and returns the gift or `null` with `error` set. With no state (signed out, or the load failed) `shouldShow` stays false and the Daily button hides.
- [ ] **Step 4:** In `TownView.vue` and `DailyDock.vue`, `const claimed = await daily.claim()`; on `null`, show `daily.error` with the existing `showNotice` (town) or the panel's notice line (dock).
- [ ] **Step 5:** Replace every localStorage `readalot-daily` write in the listed specs with `await skipDailyPanel(reader.id)` or `setDaily`.
- [ ] **Step 6:** Add `"with Supabase down the town still opens, without the Daily button"`: route `**/rest/v1/rpc/daily_today` to status 500, open the town, expect `townReady` and no `Daily tasks` button.
- [ ] **Step 7:** Run `npx playwright test tests/e2e/daily.spec.js` then the full suite `npx playwright test`. Expected: all pass except tests already listed as failing on `main`.
- [ ] **Step 8:** Build, add the `AI_USAGE.md` section (with Task 0's agreement), Dylan reviews and commits.

### Task 6: Seed the demo readers (Dylan runs it)

- [ ] **Step 1:** Dylan runs `npm run seed:readers -w server`. It writes to the shared Supabase project: the demo readers' profiles, areas near SMU, books, shelves and (after Task 1) furniture, and resets when each was last online.
- [ ] **Step 2:** Run `npx playwright test tests/e2e/nearby.spec.js tests/e2e/visit-room.spec.js`. Expected: "adding a demo reader gives them a house straight away" passes, and Emma's room shows her furniture from Supabase.

## Not in this plan

- `THEME_OF` in `visitors.js` (each demo reader's house look) is also written in the client. It's styling, not data, and stays.
- Device preferences (shelf order, lamps, hints, landing seen, cafe rotation) stay in the browser.
