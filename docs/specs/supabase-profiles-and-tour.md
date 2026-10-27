# Spec: Real accounts on Supabase, saved profiles and a town-only first tour

Labels: `ready-for-agent`
Owner: Aalric (sign-in screens and shared auth code by team agreement). One PR; Dylan reviews
the `TownScene.js` camera change.

## Problem Statement

`.env` has no Supabase keys, so `services/auth.js` runs in "preview" mode: the signed-in user,
their profile and the tour's "seen" flag live in `sessionStorage` / `localStorage`. Close the tab
and the reader is gone; logging in again sends them back through Welcome to type their profile
again, and the tour may play again.

Even with keys, Welcome saves the profile into `auth.user_metadata`, which only the reader can
read. The cafe and people search read the `profiles` table, so real readers never show up there.

The first tour is ~35 steps across every building. New readers should get a short tour of the
town itself.

## Decisions (from the grilling session, 2026-10-27)

| Question | Decision |
|---|---|
| Supabase project | Aalric creates a new one. No existing users, so nothing to migrate. |
| Where the profile lives | `profiles` table (public fields) + new `profile_private` table (gender, age, religion), both with RLS. `user_metadata` is no longer written. |
| Who is "new" | A reader with no `profiles` row. The row is created by upsert when Welcome is saved, so "has a row" means "profile complete". This covers people who left Welcome halfway. |
| Tour scope | Town buildings only: welcome → house → library → cafe → salon → friends' houses. The HUD and in-building steps are removed. |
| Camera | Each Next zooms **out** to show the town, pans, then zooms **in** on the next building. Reduced motion jumps straight there. |
| Skip | A Skip button ends the tour and counts as seen. |
| "Seen" flag | `profiles.tour_seen_at timestamptz`, so the tour plays once per person on any device. |
| Preview mode | Removed. The app needs Supabase keys to run. |
| E2E sign-in | A test-only helper uses the service-role key to create a confirmed user, signs in with a password and gives the page the session. Tests never go through the email code. |

## Data

New SQL in `database/profiles_and_tour.sql` (run after `schema.sql` on the new project):

- `profiles` gains `character jsonb`, `avatar text` (the emoji) and `tour_seen_at timestamptz`.
  `profiles.id` is the reader's auth user id but has **no** foreign key to `auth.users`: the seed
  script makes demo readers with no login, and `user_books` points at them. The policies match on
  `auth.uid() = id` instead.
- `profile_private (id uuid primary key references profiles on delete cascade, gender text,
  age int, religion text)`.
- RLS:
  - `profiles`: any signed-in reader can select rows that are `discoverable` or their own. Only
    the owner can insert or update their own row.
  - `profile_private`: only the owner can select, insert or update.

Field mapping (store ↔ column): `name ↔ display_name`, `favouriteGenres ↔ favorite_genres`,
`location ↔ location_name`, `discoverable`, `avatar`, `character`.

## Client changes

- `services/auth.js`: remove the preview branches and `PREVIEW_KEY`. `authConfigured()` false
  means the login screen shows an error ("Supabase keys missing, see .env.example") instead of
  pretending. Add `loadProfile(userId)` (reads both tables), `saveProfile(details)` (upserts both
  tables) and `markTourSeen()`.
- `services/supabase.js`: no stub client. Throw a clear error if the keys are missing.
- `stores/user.js`:
  - `applySession` sets id and email only. `restore()` and the auth watcher then call
    `loadProfile`.
  - `profileComplete` becomes "a profiles row was found" (a `hasProfile` flag), not "name is set".
  - The tour starts when the profile is complete and `tour_seen_at` is null. Drop `TOUR_PENDING`,
    `expectTour` and the `localStorage` "seen" key.
  - `GUIDE_STEPS` shrinks to the six town steps. `closeGuide()` (Done or Skip) calls
    `markTourSeen()`.
- `router/index.js`: the guard waits for the profile load as well as the session, so a returning
  reader goes straight to the town without Welcome flashing first.
- `WelcomeView.vue`: `finish()` calls the new `saveProfile`. `VerifyView.vue` no longer calls
  `expectTour`.
- Tour card: add a **Skip tour** button next to Next.
- `town/TownScene.js` (Dylan): `focusPlace(id, { tour: true })` zooms out to `minZoom`, pans, then
  zooms in to a tour zoom on the building. With reduced motion it centres and sets the zoom with
  no animation. `TownMap`/`TownView` pass the option while a tour step is showing.

## Tests

- `tests/e2e/helpers/supabaseUser.js`: creates a confirmed user with the admin API (service-role
  key), optionally with a profile row, signs in with a password and puts the session into the
  page's storage before the app loads. Deletes the user afterwards.
- `tests/e2e/onboarding.spec.js`:
  1. New reader: lands on Welcome, fills it in, sees "Welcome to Readalot Town", clicks Next
     through every building, finishes on the map. Reloading shows no tour.
  2. Skip: a new reader skips at step 2; reloading shows no tour.
  3. Returning reader (has a profile row): opens `/` and sees the town with no Welcome and no tour.
- The other specs' sign-in steps switch to the helper.
- Without the keys, e2e tests are skipped with a message instead of failing.
- The test API server still runs with no Supabase (in-memory demo shelf, as before).
  `server/src/middleware/auth.js` now treats every request as the demo user when the server has
  no Supabase, so the browser's real token doesn't get a 401.
- Welcome shows "Try again" if the profile could not be loaded, so a returning reader on a bad
  connection isn't asked to fill it in again (and doesn't overwrite their saved profile).

## Out of scope

- Moving the bookshelf, coins or rooms onto Supabase (other specs).
- Location capture on Welcome.
- A "replay tour" button in the salon (possible follow-up).
