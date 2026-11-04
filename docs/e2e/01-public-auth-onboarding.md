# E2E scenarios 01: landing page, authentication and Welcome

Suites: **LND** (landing, 10), **AUTH** (register, login, code, logout, guard, demo account, 17), **WEL** (Welcome, 6).
Master guide, accounts and rules: [../E2E_GUIDE.md](../E2E_GUIDE.md). Account codes (ACCT-NEW, ACCT-DEMO …) are defined in its C2.

**Scenario format.** Each scenario has: *Situation* (who and why), *Objective*, *Pre* (preconditions and data), numbered *Steps* with
the expected result after `→`, *DB* (database or backend changes, "none" if read-only), *Pass* (final criteria), and a priority in the
heading. 📸 = take a screenshot. Run signed-out scenarios in a fresh private window (so `localStorage` is empty) unless stated.
"Desktop" = 1440 × 900; "Phone" = 390 × 844.

---

## LND: Landing page

### LND-01 · First visit lands on the landing page · Critical
**Situation:** a new visitor opens the site. **Objective:** a signed-out first visit shows `/start`, not a login wall.
**Pre:** fresh browser profile; signed out; base URL `https://ikda-rust.vercel.app`.
1. Open `/` → the browser ends on `/start` (a redirect), title "Social media, but for book lovers" 📸.
2. Look at the hero → the IKDA sign, 읽다, the line "Social media, but for book lovers.", buttons **Sign up** and **See how it works**, a **Log in** link; the bar shows IKDA, Meet Maya, The town, Your character, Levels, How it works, FAQ, Sign up.
3. Open `/house` directly in the same fresh profile → ends on `/start` again (landing not yet marked seen).
**DB:** none. **Pass:** `/` and `/house` redirect to `/start`; hero and bar labels are exactly as listed; no console errors.

### LND-02 · Bar links scroll to each section · High
**Situation:** the visitor jumps around the page. **Objective:** every bar link scrolls to its section and is marked while in view.
**Pre:** `/start`, Desktop.
1. Press **Meet Maya** → the page scrolls to the Maya section; the link is marked and the dark highlight is under it.
2. Press **The town**, **Your character**, **Levels**, **How it works**, **FAQ** in turn → each section scrolls into view and its link is marked.
3. Press **IKDA** → back to the top.
4. Press **See how it works** in the hero → scrolls to the three steps.
**DB:** none. **Pass:** the section heading is visible after each press and only one link is marked at a time.

### LND-03 · The sky follows the scroll · Medium
**Situation:** the visitor scrolls slowly then fast. **Objective:** evening at the top becomes night at the bottom and back.
**Pre:** `/start`, Desktop.
1. Scroll to the top → daylight/evening sky with the map behind the hero 📸.
2. Scroll to the middle, then the bottom → the sun is gone, stars and a moon are visible, the far row of houses has lights on 📸.
3. Scroll back to the top → the sky returns to day and the lights go off.
**DB:** none. **Pass:** sky/houses visibly differ between top and bottom, and return when scrolling up.

### LND-04 · Meet Maya and The town tabs · Medium
**Situation:** the visitor explores what the app offers. **Objective:** the persona section and the four building tabs work.
**Pre:** `/start`.
1. In *Meet Maya* → "Maya, 19." with her character and a five-step path showing a place and XP per step.
2. In *The town* press each tab (Your house, Library, Cafe, Hair Salon) → each shows its scene and a short line.
3. Focus a tab and press **ArrowRight**, **ArrowLeft**, **End**, **Home** → focus and selection follow the keys.
4. Click a character or pile of books in a scene → it hops.
**DB:** none. **Pass:** four tabs, each with a distinct scene; keyboard navigation moves selection.

### LND-05 · Character studio on the landing page · Medium
**Situation:** the visitor tries the character maker before registering. **Objective:** the studio changes the character and the choice reappears later.
**Pre:** `/start`.
1. In *Your character* type `Sam` in **Your name in town** → the name shows under the stage.
2. Press tabs **Looks**, **Hair**, **Skin**, **Outfit** and pick parts → the stage character changes each time.
3. Press **Surprise me** → a random free look is applied.
4. Scroll to *Levels* → the badge shows the same character. Scroll to the last screen → the character stands at the door under the name `Sam` 📸.
**DB:** none. **Pass:** only free parts are offered; the character and name persist down the page.

### LND-06 · Levels try-out · Low
**Situation:** the visitor taps actions to see XP. **Objective:** XP adds up and resets, nothing is saved.
**Pre:** `/start`, scrolled to *Levels*.
1. Press **Add a book** (+10), **Start reading** (+20), **Visit a room** (+15), **Leave a note** (+10), **Send a message** (+5), **Finish a book** (+100) → the XP total rises by those amounts and the bar fills; at 100 XP the level becomes 2.
2. Press **Start over** → XP and level reset.
3. Reload → still reset; sign-in state unchanged (signed out).
**DB:** none. **Pass:** the XP values match the numbers above; nothing persists after reload.

### LND-07 · FAQ cards · Low
**Situation:** the visitor reads the FAQ. **Objective:** each question opens and closes.
**Pre:** `/start`, at *FAQ*.
1. Press each of the six questions ("Is IKDA free?", "Do I need to download anything?", "Who can see my profile?", "What does IKDA mean?", "Where do the books come from?", "I only read a few books a year. Is it for me?") → the answer opens on its card.
2. Press an open question again → it closes.
**DB:** none. **Pass:** six questions; answers match the on-page text ("It comes from 읽다 (ikda)…").

### LND-08 · Sign up and Log in route correctly and remember the landing was seen · Critical
**Situation:** the visitor decides to register, later returns signed out. **Objective:** CTA buttons go to the right forms and later visits skip the landing.
**Pre:** fresh profile.
1. On `/start` press **Sign up** (hero) → `/register`.
2. Go back to `/start`, press the **Log in** link → `/login`.
3. Open `/` → ends on `/login` (not `/start`) because the landing is now marked seen.
4. Open the last screen's **Sign up** button (from `/start` via a private window) → `/register`.
**DB:** none. **Pass:** `localStorage` landing-seen flag set after step 1 or 2; `/` redirects to `/login` afterwards.

### LND-09 · The "town wakes up" intro after the landing page · Low
**Situation:** the visitor presses Sign up. **Objective:** the loading scene plays then fades into the form.
**Pre:** fresh profile.
1. Press **Sign up** on `/start` → a loading scene: night with lit windows, dawn, cars on the road, townsfolk, then the **IKDA** sign over a flipping pixel book 📸.
2. Wait 2 to 4 seconds → it fades into **Create your card**.
**DB:** none. **Pass:** the intro ends on `/register` without errors; with `prefers-reduced-motion` the motion is reduced (Low, optional).

### LND-10 · Landing page fits a phone with no sideways scroll · Medium
**Situation:** a visitor on a phone. **Objective:** no horizontal scrolling and readable layout.
**Pre:** Phone viewport, `/start`.
1. Scroll the whole page → no horizontal scrollbar at any point; nav links scroll to keep the marked one in view.
2. Press **Sign up** → reachable and tappable (at least 44 px).
**DB:** none. **Pass:** `document.documentElement.scrollWidth <= innerWidth` at each scroll stop. **Existing coverage:** `start.spec.js`.

---

## AUTH: Register, log in, code, log out, guard, demo account

### AUTH-01 · Register a new demo-domain reader (happy path) · Critical
**Situation:** a professor creates their own account without an inbox. **Objective:** register, confirm with `111111`, reach Welcome.
**Pre:** signed out; unique stamp `S`; email `qa.S@demo.ikda.app`, username `qa.S`, password `Maya1234`.
1. Open `/register` → heading **Create your card**, fields Email, Username, Password, Confirm password, button **Register** 📸.
2. Fill all four, press **Register** → the button says **Sending…**, then **Check your email** with the line "Demo account: no email is sent. Enter the code 111111." 📸.
3. Type `111111`, press **Confirm code** → **Code accepted**, then `/welcome`.
**DB:** `auth.users` has `qa.S@demo.ikda.app` with `email_confirmed_at` set and `raw_user_meta_data.username = "qa.S"`; no `profiles` row yet.
**Pass:** lands on Welcome step 1 of 6. **Cleanup:** delete the account. **Existing coverage:** `demo-account.spec.js`.

### AUTH-02 · Register validation: passwords, length, username · High
**Situation:** a reader makes typing mistakes. **Objective:** each rule shows its message and sends nothing.
**Pre:** `/register`.
1. Email `qa.v@demo.ikda.app`, username `qa.v`, Password `Maya1234`, Confirm `Maya9999`, **Register** → alert `Those passwords do not match.` and the cats duck.
2. Both passwords `abc` → alert `Use at least 6 characters.`
3. Fix passwords; username `ab` → `Usernames are 3 to 20 lowercase letters, numbers, dots or underscores.`
4. Username `UPPER case` is typed → the field shows `upper.case` (lowercased, space to dot).
5. Username `a`+21 characters → the field stops at 20 (maxlength).
6. Username `emma.reads` (taken) → `That username is taken. Try another.`
**DB:** none (no account made). **Pass:** every message is exact; the URL stays `/register`. **Existing coverage:** `auth.spec.js`.

### AUTH-03 · Register with an invalid or missing email, empty form · Medium
**Situation:** empty or malformed input. **Objective:** the browser or app blocks submission.
**Pre:** `/register`.
1. Press **Register** with everything empty → the browser asks for the first field; nothing sent.
2. Email `maya` (no @) → browser validation; stay on the page.
3. Email `a@demo.ikda.app@elsewhere.com` → blocked by browser validation (two @).
**DB:** none. **Pass:** no request to `/api/demo-auth/register` or Supabase (check the network panel).

### AUTH-04 · Duplicate registration · High
**Situation:** the professor registers the same email twice. **Objective:** a polite refusal.
**Pre:** AUTH-01 done (account exists, not logged in on this browser).
1. In a new private window open `/register`, same email, a different username, valid passwords, **Register** → alert `That email is already registered. Log in instead.`; no code screen.
**DB:** still exactly one `auth.users` row for the email. **Pass:** message exact; URL `/register`.

### AUTH-05 · Normal email keeps the real emailed code · Critical
**Situation:** a normal address must not bypass verification. **Objective:** no demo route, no `111111`.
**Pre:** `/register`; DevTools network open. **Use a fake non-team address and expect Supabase's own response; do not use anyone's real address.**
1. Register `ikda.check.S@example.com` with a valid username and password → the page calls Supabase `signUp` (a request to `.../auth/v1/signup`) and **not** `/api/demo-auth/register`.
2. If the code screen opens → no "Demo account" line; type `111111`, **Confirm code** → an error (Supabase: token expired or invalid); the URL stays `/verify`.
3. If Supabase refuses to send (rate limit or an unauthorised address) → an error shows on `/register`; that is also a pass.
**DB:** an unconfirmed `auth.users` row may be created for the address; delete it. **Pass:** no demo route call and `111111` never signs in. **Existing coverage:** `demo-account.spec.js` (mocked).

### AUTH-06 · Wrong and right code, resend countdown · High
**Situation:** the professor mistypes the code. **Objective:** errors don't lose the account; the right code works; resend behaves.
**Pre:** ACCT-NEW registered and on **Check your email** (demo-domain).
1. Type `123456`, **Confirm code** → alert `That code is not right. The demo code is 111111.`; still on `/verify`; the cats duck.
2. Observe the link under the form → **Resend in 30s**, counting down, disabled.
3. Clear the boxes (Backspace) then paste `111111` into the first box → all six fill.
4. **Confirm code** → **Code accepted**, then `/welcome`.
5. (Optional, 40 s later, on a fresh attempt) the link becomes **Resend code**; pressing it sends nothing for a demo address and restarts the countdown.
**DB:** as AUTH-01. **Pass:** exact messages; `Confirm code` is disabled until six digits are present.

### AUTH-07 · Reload on the code screen of a demo address · Medium
**Situation:** the professor reloads mid-way. **Objective:** no crash; a clear instruction.
**Pre:** demo-address registration at **Check your email**.
1. Reload the page → the pending sign-in survives (the screen still shows) but the in-memory password is gone.
2. Type `111111`, **Confirm code** → alert `Go back and log in again, then enter the code.`
3. Go to `/login`, log in with the email and password again, enter `111111` → signs in.
**DB:** none. **Pass:** message exact; the second attempt succeeds.

### AUTH-08 · Verify page without a pending sign-in · Low
**Situation:** someone opens `/verify` directly. **Objective:** it sends them to log in.
**Pre:** fresh private window.
1. Open `/verify` → ends on `/login` (or `/start` before the landing is marked seen).
**DB:** none. **Pass:** no code boxes shown.

### AUTH-09 · Log in with the demo account (happy path) · Critical
**Situation:** a presenter signs in as Jordan. **Objective:** password, then `111111`, then the town with Jordan's data.
**Pre:** ACCT-DEMO seeded; signed out.
1. `/login`: Email `demo@demo.ikda.app`, Password `Ikda-Demo-2026`, **Log in** → **Check your email** with the demo line 📸.
2. Type `111111`, **Confirm code** → **Code accepted**; the cats hop; the town opens (no Welcome, no walkthrough).
3. Check the badge → **Jordan Lee**, gold **4**, **600** coins 📸.
4. Check the top bar → `Friends, 2 online, 1 friend request` (within 5 minutes of the seed); the bell shows its count after a few seconds.
**DB:** none (login only; `last_active_at` may update). **Pass:** town is shown with Jordan's data. **Existing coverage:** `demo-account.spec.js`.

### AUTH-10 · Wrong password and wrong email · High
**Situation:** the presenter mistypes. **Objective:** errors and no code screen.
**Pre:** `/login`.
1. Demo email + password `not-the-password`, **Log in** → alert `Invalid login credentials`; the cats duck; stays on `/login`.
2. Email `nobody.here@demo.ikda.app` + any 6+ character password → the same error (no hint whether the email exists).
3. Password `abc` → `Use at least 6 characters.`; empty email → browser validation.
**DB:** none. **Pass:** never reaches `/verify`.

### AUTH-11 · Wrong code for the demo login, then recover · High
**Situation:** the presenter mistypes `111111`. **Objective:** error; recover without logging in again.
**Pre:** at **Check your email** after a correct demo login.
1. Type `000000`, **Confirm code** → `That code is not right. The demo code is 111111.`
2. Clear and type `111111` → signs in.
**DB:** none. **Pass:** no session until the right code.

### AUTH-12 · Show/hide password and the mascots · Low
**Situation:** the visitor checks their typing. **Objective:** the eye toggles type and the mascots react.
**Pre:** `/login` or `/register`.
1. Type a password; the eye button is labelled **Show password** (`aria-pressed=false`) → press it → the field type becomes text, label **Hide password**; the cats and books cover their eyes 📸.
2. Press again → hidden, mascots uncover.
3. On Register the Confirm password field follows the same toggle.
4. Move the pointer and click into each field → the mascots' eyes follow; floating books are pushed by the cursor.
**DB:** none. **Pass:** type toggles; label flips. **Existing coverage:** `auth.spec.js` (toggle).

### AUTH-13 · Session survives a reload; log out; Back does not re-enter · Critical
**Situation:** the presenter refreshes, then logs out. **Objective:** persistence and a real sign-out.
**Pre:** ACCT-DEMO signed in on `/`.
1. Press F5 → the town reloads still signed in (no login page flash after the loader).
2. Open `/salon`, tab **Profile**, press **Log out** → a dialog **Close this book?** with **Stay** and **Log out**.
3. Press **Stay** → dialog closes, still signed in.
4. Press **Log out**, then confirm in the dialog → the landing page or login page.
5. Press the browser **Back** button → you are **not** returned to the town; you stay on a guest page.
6. Open `/house` → redirected to `/login`.
**DB:** none (Supabase session ended). **Pass:** steps 5 and 6 never show signed-in content. **Existing coverage:** `salon.spec.js`.

### AUTH-14 · Route guard for signed-in readers on guest pages · High
**Situation:** a signed-in reader opens `/login` or `/start`. **Objective:** the guard sends them home.
**Pre:** ACCT-DEMO signed in.
1. Open `/login`, `/register`, `/start`, `/verify` in turn → each ends on `/`.
2. Open `/welcome` → ends on `/` (profile complete).
3. Open `/nonexistent/path` → ends on `/`.
**DB:** none. **Pass:** all redirects land on the town. **Existing coverage:** `onboarding.spec.js`.

### AUTH-15 · Incomplete profile is forced to Welcome · High
**Situation:** a reader closed the browser mid-registration. **Objective:** every page sends them to Welcome until finished.
**Pre:** ACCT-DEMO-FRESH registered and confirmed but Welcome not finished (close the tab at Welcome).
1. Log in again (password, `111111`) → lands on `/welcome`, not the town.
2. Open `/`, `/house`, `/library`, `/salon` directly → each ends on `/welcome`.
3. Finish Welcome (WEL-01) → then `/` opens.
**DB:** no `profiles` row until step 3. **Pass:** no page other than Welcome opens before the profile exists.

### AUTH-16 · Login of a demo-domain reader created by registration · High
**Situation:** the professor logs back into the account they created. **Objective:** password then `111111` works for self-made accounts.
**Pre:** AUTH-01 account with Welcome finished; signed out.
1. Log in with `qa.S@demo.ikda.app` / `Maya1234` → demo code screen.
2. Wrong password variant `Wrong-pass1` → `Invalid login credentials`.
3. Right password, `111111` → the town (returning reader, no Welcome).
**DB:** none. **Pass:** reaches the town as `Qa Tester`.

### AUTH-17 · Demo bypass cannot be abused · Critical
**Situation:** a hostile visitor tries the bypass. **Objective:** only demo-domain addresses with the right password work.
**Pre:** API reachable.
1. `POST /api/demo-auth/register` with `{"email":"x@gmail.com","password":"abcdef","username":"abc.def"}` → HTTP 403.
2. Same with `a@demo.ikda.app@gmail.com` → 403. Empty body → 403.
3. Demo email with a 3-character password → 400; username `A B` → 400.
4. Log in as a normal (non-demo) account's email and enter `111111` at its real code step → refused.
5. Log in as `emma.reads@demo.ikda.app` with a guessed password → `Invalid login credentials` (sample readers have random passwords).
**DB:** no new `auth.users` rows. **Pass:** every case refused. **Existing coverage:** `server/tests/demoAuth.check.js`.

---

## WEL: Welcome

**Pre for all WEL:** ACCT-NEW-style reader at `/welcome` (registered and confirmed, profile not yet saved).

### WEL-01 · Complete Welcome (happy path) · Critical
**Situation:** a new reader sets up their card. **Objective:** six steps save a complete profile and open the town.
1. Step 1 **Your name** (counter "1 of 6"): type `Qa Tester`, **Next** → step 2.
2. **Gender**: choose Woman, **Next** → step 3.
3. **Age**: `21`, **Next** → step 4.
4. **Religion**: choose Prefer not to say, **Next** → step 5.
5. **Genres**: pick Fantasy and Mystery, **Next** → step 6.
6. **Pick your character**: press each of the five presets (the big character hops in and is alive), choose one, **Finish** → the button says **Saving…**, then the camera zooms into the town 📸.
**DB:** `profiles` row for the user: `display_name = "Qa Tester"`, `favorite_genres = {Fantasy,Mystery}`, `character` = the chosen preset's JSON (`v:1`, `base`, `hair`, …), `avatar` set; `profile_private`: `gender = "Woman"`, `age = 21`, `religion = "Prefer not to say"`; `profiles.coins = 480`; `tour_seen_at` is null; the `username` equals the one picked at Register (or a made-up one if taken meanwhile).
**Pass:** town opens, badge shows `Qa Tester` and level 1; the walkthrough starts (TOUR-01).

### WEL-02 · Validation on every step · High
1. Step 1 empty, **Next** → `Add your name to continue.`; the box focus remains.
2. Step 1 with only spaces → the same message.
3. Step 2 with nothing chosen → `Choose one to continue.`
4. Step 3: `abc`, `12`, `121`, `-5`, `20.5` → each shows `Enter an age from 13 to 120.`; `13` and `120` are accepted.
5. Step 4 with nothing chosen → `Choose one, including prefer not to say.` (the religion step is **required**).
6. Step 5 with none chosen → `Pick at least one genre.`
**DB:** none until Finish. **Pass:** exact messages; cannot advance past an invalid step.

### WEL-03 · Back keeps answers · Medium
1. Fill steps 1 to 3, press **Back** twice → step 1 shows the typed name; step 2 still shows the choice.
2. **Next** forward → answers retained. **Back** is not shown on step 1.
**DB:** none. **Pass:** no answer is lost by going back.

### WEL-04 · Under-18 reader is forced private · High
**Situation:** a 16-year-old registers. **Objective:** the minimum is 13 and under-18s are never public.
1. Complete Welcome with age `16`.
2. In the town the public/private chip says **PRIVATE** and cannot be turned to public (or shows the under-18 note); the location prompt is not shown.
3. Salon → Profile → the **Public profile and location** switch is locked.
**DB:** `profile_private.age = 16`; `profiles.discoverable = false` (trigger `keep_minors_private`); no `reader_areas` row.
**Pass:** private in all places. **Existing coverage:** `nearby.spec.js`.

### WEL-05 · Welcome after a failed profile load · Low
**Situation:** the profile lookup fails. **Objective:** a retry, not a dead end. **(unverified)**
**Pre:** block `/rest/v1/profiles*` in DevTools, then log in a returning reader.
1. The Welcome page shows an error with **Try again**.
2. Unblock the request and press **Try again** → the town opens (the reader had a profile).
**DB:** none. **Pass:** no duplicate profile created.

### WEL-06 · Welcome character choice persists as the town sprite · Medium
1. Choose the third preset, **Finish** → in the town the player badge face and the walking character match that preset.
2. Reload → still the same character. Open the Salon → the stage character is the same look.
**DB:** `profiles.character.base` equals the preset id. **Pass:** the same character in badge, map, Salon and after reload.
