# Supabase audit

Audit of how Readalot / IKDA uses Supabase, done on 2026-11-03 against branch `alric` (up to date
with `main`). It covers the code in `client/`, `server/` and `database/`, and live probes against
the team's Supabase project. The deployed app at ikda-rust.vercel.app uses the same project.

**How to read the evidence levels**
- **Live-verified:** checked by a request or test against the real Supabase project.
- **Code-reviewed:** read and traced in the code, not run.
- **Not verified:** could not be checked; the reason is given.

## A. Executive summary

The app's own code uses Supabase carefully:
- The server checks every sign-in token and limits each change to the signed-in reader's rows.
- No secret key reaches the browser.
- The tables added later (`profile_private`, `daily_state`, `friendships`, `reader_areas`,
  `room_notes`, `saved_mood_quotes`, `reader_messages`, `xp_events`) are locked down properly.

The database, however, had three real holes, all **live-verified**:

1. **Critical.** `books`, `user_books`, `reviews`, `quotes`, `featured_quotes` and `saved_quotes`
   (all from `schema.sql`) have no row level security.
   - Anyone holding the public key reads every reader's shelf and every review, with no sign-in. That
     includes private readers. The public key is shipped in the website, so anyone can get it.
   - On a default Supabase project those tables also take inserts, updates and deletes from the
     public key. I could not test writing to the shared database (see H).
2. **Medium.** `daily_settled(uuid)` can be run by anyone, signed out or in, for any reader's id.
   - It returns that reader's daily-task row (streak, freezes, tasks done) and moves their day on.
   - Reader ids are shown to every signed-in reader by `/api/people`.
3. **Medium.** `earn_xp()` gives XP for any made-up target, so a reader can earn unlimited XP, and
   with it the coins each new level gives. A test earned 10 XP for a book that doesn't exist.

There is a fix for all three in `database/lock_down.sql`. It was **applied on 2026-11-03 and verified**
(see F): the public key is now refused on those tables and on `daily_settled`, made-up XP targets earn
nothing, and the live API still serves a signed-in reader's shelf, readers, friends and saved quotes.

## B. Architecture

```
Browser (Vue)                         Express API (server/, on Vercel as api/index.js)
  services/supabase.js  ── anon key ──►  Supabase Auth (sign-in, email codes, sessions)
     ├─ auth.js: profiles, profile_private (own row only, by RLS)
     ├─ progress.js / daily.js: RPCs earn_xp, spend_coins, my_progress, daily_*, claim_daily
     ├─ chatApi.js: reader_messages (RLS: sender/receiver only)
     └─ api.js ── Bearer access token ──► routes/* ── service-role key ──► every other table
                                           (middleware/auth.js checks the token with auth.getUser)
```

- **Browser client:** one client, made in `client/src/services/supabase.js` with
  `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. The anon key's JWT role is `anon`
  (live-verified).
- **Server client:** one client, made in `server/src/services/supabase.js` with the service-role
  key from the root `.env` or Vercel's environment variables. That key skips RLS, so the server
  itself enforces who may do what.
- **Not used:** Storage, Realtime, Edge Functions, OAuth. None of them appear in the code.
- **Database changes:** hand-run SQL files in `database/`, pasted into the SQL editor. There is no
  `supabase/` folder and no migration history, so the order is written at the top of each file.
  Checks: `server/tests/*.check.js` (they need Docker).

## C. Feature coverage

| Feature | Supabase component | Read | Write | RLS/Security | E2E test | Status |
|---|---|---|---|---|---|---|
| Register / log in / email code | Auth (`signUp`, `signInWithPassword`, `signInWithOtp`, `verifyOtp`) | ✓ | ✓ | Supabase Auth | `auth`, `onboarding` (pass) | PASS |
| Pick a username on Register | `readalot_username_free` RPC, trigger `readalot_give_username` | ✓ | ✓ | RPC answers only yes/no (live) | `auth` (rules only) | PARTIAL: the taken-name path isn't e2e-tested |
| Session restore / route guard | `auth.getSession`, `onAuthStateChange` | ✓ | – | guard waits for `restore()` before any page | `onboarding` (pass) | PASS |
| Log out | `auth.signOut` | – | ✓ | – | `salon` (pass) | PASS |
| Welcome / Edit profile | `profiles`, `profile_private` (browser, RLS) | ✓ | ✓ | own row; coins not writable (live) | `salon`, `progress` (pass) | PASS |
| Under-18s stay private | triggers `keep_minors_private`, `private_when_minor` | – | ✓ | trigger | `nearby` (pass) | PASS |
| XP, levels, coins | `earn_xp`, `my_progress`, `spend_coins`, `xp_events` | ✓ | ✓ | **made-up targets earn XP (live)** | `progress` (pass), `database-access` (fails until fix) | FAIL → fix written |
| Daily tasks and streak | `daily_*` RPCs, `daily_state` | ✓ | ✓ | **`daily_settled` open to anyone (live)** | `daily` (logic passes; button-position tests fail, unrelated) | FAIL → fix written |
| My shelf (add, move, remove) | `user_books`, `books` via API | ✓ | ✓ | API scopes by `req.user.id` (code); **table open to public key (live)** | `bookshelf`, `my-shelf`, `shelve-book` (pass, but the test server has no Supabase) | FAIL → fix written |
| Reviews | `reviews` via API | ✓ | ✓ | API deletes own only (code); **table open (live)** | `reviews` (pass, in memory) | FAIL → fix written |
| Book quotes | `quotes` via API | ✓ | ✓ | **table open (live)**; POST doesn't validate text | none | FAIL → fix written |
| Saved mood quotes | `saved_mood_quotes` via API | ✓ | ✓ | RLS, no grants (live: 401 for anon) | `mood-result` (pass) | PASS |
| Readers / reader profiles | `profiles` + `user_books` + `books` via API | ✓ | – | discoverable only (code) | `reader-profile`, `visit-room` (pass) | PASS |
| Friends and requests | `friendships` via API | ✓ | ✓ | answer only as addressee, remove only own (code); no browser access (live) | `friends` (pass on rerun) | PASS |
| Nearby readers | `reader_areas` via API | ✓ | ✓ | rough cells only, no browser access (live) | `nearby` (pass) | PASS |
| Reader chat | `reader_messages` (browser, RLS) | ✓ | ✓ | sender/receiver only (code + RLS) | `friends` chat (pass on rerun) | PARTIAL: browser inserts skip the API's rate limit |
| Notice board notes | `room_notes` via API | ✓ | ✓ | author or owner deletes (code); no browser access (live) | `room`, `visit-room` (pass) | PASS |
| Room furniture | `room_furniture` via API | ✓ | ✓ | owner only (code) | `furniture` (pass) | PASS |
| Notifications | `profiles.notifications_*` | ✓ | ✓ | own row | `notifications` (pass) | PASS |
| Demo readers seed | `server/scripts/seedReaders.js`, service role | – | ✓ | server-only script | none (run by hand) | PASS (run successfully earlier) |
| File storage | – | – | – | – | – | NOT APPLICABLE |
| Realtime / Edge Functions / OAuth | – | – | – | – | – | NOT APPLICABLE |
| Password reset / account deletion | – | – | – | – | – | NOT APPLICABLE (not built; see H) |

## D. Database and security findings

| # | Severity | Object | Finding | Evidence |
|---|---|---|---|---|
| 1 | Critical | `books`, `user_books`, `reviews`, `quotes`, `featured_quotes`, `saved_quotes` | Made in `schema.sql` with no `enable row level security`. The anon key reads every row: user_books 67, reviews 14, books 19. Writes are very likely also open on Supabase's default grants. | Live read probe. Write probe not allowed (H). |
| 2 | Medium | `daily_settled(uuid)` | `revoke ... from public` doesn't remove Supabase's direct grants to `anon` and `authenticated`. Anyone can run it for any reader's id. | Live: the anon call reached the function body (`Sign in for your daily tasks.`, not `42501`). The e2e test ran it for another reader's id. |
| 3 | Medium | `earn_xp(text, text)` | Book targets aren't checked against the shelf, and room targets aren't checked against real readers. That means unlimited XP and level-up coins. | Live e2e: `add_book` for `no-such-book` gained 10 XP. |
| 4 | Low | `earn_xp`, `spend_coins`, `my_progress`, `daily_*` | Callable by `anon` (the same grant problem as #2). They refuse because `auth.uid()` is null, so nothing leaks. | Live: `my_progress` answered `{"xp":0,"coins":null}` to anon. |
| 5 | Low | `profiles` select policy | Signed-in readers can read **every column** of discoverable profiles directly: `coins`, `location_asked_at`, and `location_lat`/`location_lng`. Today only the seeded demo readers have exact coordinates; real readers' areas live in `reader_areas`. | Code-reviewed. |
| 6 | Low | `profiles.username` | Readers may update their own username directly. That skips the 3–20 character rule (still unique). | Code-reviewed (`xp_and_coins.sql` grants). |
| 7 | Low | `reader_messages` | The browser inserts messages directly, so the API's one-message-per-1.5-seconds limit doesn't apply. Length is still enforced by a check constraint. | Code-reviewed. |
| 8 | Low | `POST /api/books/:id/quotes` | No validation of `quoteText`: a missing one becomes a 500, not a 400. | Code-reviewed. |
| 9 | Info | `requireUser` | Falls back to `DEMO_USER_ID` when no token is sent. It is **not** set on Vercel production. | Live-verified the env var names on Vercel, not their values. |
| 10 | Info | migrations | No ordered migration history. `schema.sql` is "run once", and later files say what they need first. A fresh database can be built from the files, but only by following those comments. | Code-reviewed. |

**Credentials (live-verified):**
- The browser key is the `anon` role.
- The service-role key is only in the root `.env`, which git ignores, and in Vercel's environment
  variables.
- No secret is in the built client bundle.
- No key is in git.

## E. Authentication and storage

Authentication is done:

- **Register, log in and the email code:** sign-up → email code → `verifyOtp` → session.
- **Log in signs out first:** after checking the password, log in signs out and asks for a code, so a
  password alone never gives a session.
- **Session restore:** the router waits for `user.restore()` before choosing a page, so signed-out
  visitors never see a private page flash.
- **Signing out** clears the people store and the session.
- **API requests** send the current access token. The Supabase client refreshes it.
- **Profiles** are created at Welcome. The code treats "has a row" as "profile complete", so a reader
  who quits Welcome simply sees it again.

The demo sign-up in the working tree is someone else's uncommitted work, so it is not audited here:
`server/src/routes/demoAuth.js`, and the edits in `client/src/services/auth.js` and `VerifyView.vue`.

Storage: not used.

## F. Bugs found and fixes applied

| Severity | Object | Root cause | Fix (in `database/lock_down.sql`) | Verification |
|---|---|---|---|---|
| Critical | 6 tables from `schema.sql` | RLS never enabled | Enable RLS; revoke all from `anon` and `authenticated`. Only the API, with the service-role key, uses these tables; the browser never queries them (checked with grep). | `database-access.spec.js` › "a visitor can't read…": **fails now, should pass once applied** |
| Medium | `daily_settled(uuid)` | Revoked from `public` only | Revoke execute from `anon` and `authenticated` | › "nobody runs another reader's daily tasks…": **fails now** |
| Low | other RPCs | Same | Revoke execute from `anon` | Same test file (covered by the run) |
| Medium | `earn_xp` | No check that the target is real | New `xp_target_ok()`: the book must be on your shelf (with the right status), or reviewed by you; the room must be another reader's. Otherwise 0 XP. | › "XP needs a real book…": **fails now**. The existing `progress.spec.js` room-visit test still holds, because `emma.reads` is a real reader. |

**Applied 2026-11-03** (pasted into the SQL editor by Aalric). After applying:
- `npx playwright test tests/e2e/database-access.spec.js tests/e2e/progress.spec.js tests/e2e/daily.spec.js:76`
  ran 9 tests: **9 passed**.
- Live probes with the anon key: `user_books`, `reviews`, `books` and `daily_settled` are refused
  (`42501`).
- A throwaway signed-in reader against https://ikda-rust.vercel.app: `/api/user-books`,
  `/api/people`, `/api/friends` and `/api/saved-quotes` each answered 200 with the right data.

The statuses in C written before the fix ("FAIL → fix written") are now fixed and verified.

**Also added:**
- `tests/e2e/database-access.spec.js`
- `visitorClient()` in `tests/e2e/supabaseUser.js`

**Note:** the e2e test server runs without Supabase, so the shelf tests keep books in memory. After
the fix, the shelf XP checks still pass in the e2e run, because no test earns XP from the shelf.
On the real app, the shelf saves first and earns XP after (`stores/bookshelf.js`), so the new check
sees the saved row.

## G. Test results

| Suite | Command | Result |
|---|---|---|
| Full Playwright e2e | `npx playwright test` | 425 run: **411 passed, 14 failed** (4.5 min) |
| Rerun of the 11 non-security failures | `npx playwright test <those tests>` | 29 run: 21 passed, 8 failed |
| Server checks | `npm --workspace server run check` | passed (compatibility, dailyQuote) |
| SQL checks | `node server/tests/*.check.js` | **not run:** Docker isn't running on this laptop |
| Client build | `npm --workspace client run build` | passed |
| Lint / type check | – | none set up in the repo (plain JS, no TypeScript) |

**The 14 failures:**
- **3 are the new security tests.** They fail because the holes are real and the fix isn't applied.
- **8 always fail, all about where the Daily button sits:**
  - `daily.spec.js:76`, `:220`, `:275` (×3), `:293`, `:302`
  - `reader-profile.spec.js:276`

  They come from the latest commit on main (`0e647c8`, which moved the Daily button and rewrote these
  tests), not from Supabase.
- **4 failed once and passed on rerun (flaky under load):**
  - `onboarding.spec.js:42`
  - `friends.spec.js:60`
  - `bookshelf.spec.js:262`
  - `room.spec.js:213`

## H. Remaining issues and blockers

- **Possible past tampering:** before the fix, the open tables may have been writable by anyone. It
  can't be ruled out that rows were changed; the data looked normal.
- **Product decisions:**
  - Password reset and account deletion don't exist.
  - Any signed-in reader can message any other reader; friendship isn't required.
  - Profiles show every column to other signed-in readers (finding 5).
- **Fragile database setup:** no migration tool. A fresh database means running the `database/` files
  in the order their comments give.
- **E2E coverage gap:** the e2e server runs without Supabase, so shelf, reviews and quotes are only
  tested against in-memory data, not real Supabase writes.

## I. Final assessment

- **Production-ready (Supabase):** for a coursework demo, yes. Findings 1–3 are fixed and verified
  live; what remains is Low (D 4–8) or a product decision (H). It is not a public launch: there is no
  password reset, account deletion or moderation.
- **Verified end to end:**
  - **Partly.** Auth, profile, XP, daily tasks, friends, nearby, notes, furniture and chat run
    against real Supabase in the e2e suite.
  - Shelf, reviews and quotes are only verified through the API against memory.
- **Secure at the API boundary:** yes. Every write route scopes by the checked user id (code-reviewed).
- **Secure at the database boundary:** yes, after `lock_down.sql`. The Low findings remain.
- **Data handling:** consistent:
  - Errors from Supabase calls are checked and thrown, or shown.
  - The XP and coin rules live in the database, not the browser.
  - Unique indexes stop double claims and double reviews.
