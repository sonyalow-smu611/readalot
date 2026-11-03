# E2E scenarios 02: the 52-step walkthrough

Suite **TOUR** (14 scenarios). The step table (all 52 steps, their pages, what they say and ask) is in
[../E2E_GUIDE.md](../E2E_GUIDE.md), section A7. Source of truth in code: `client/src/lib/walkthrough.js` (steps),
`client/src/components/GuideTour.vue` (the bubble), `client/src/stores/user.js` (state: `guideStep`, `nextGuide`, `backGuide`,
`skipGuideSection`, `closeGuide`, `replayGuide`). Format and accounts: see the header of
[01-public-auth-onboarding.md](01-public-auth-onboarding.md) and C2 of the master guide.

**Important for the executor.** This feature was added in the latest working tree by another teammate and **has not been run in this
documentation phase**: every step below is read from the code and marked **(unverified)** until you see it. The bubble is a region named
**Walkthrough**; its counter reads `N of 52 · <Section>`; buttons are **Back**, **Next** (last step: **Done**), **Skip this part**,
**Skip tour**. A step with an **ask** moves on by itself when the reader does it (tapping the target, or reaching the page named). Pip is
`pip.ikda`. The sections are: Town (steps 1 to 10), Your house (11 to 23), Library (24 to 33), Cafe (34 to 42), Salon (43 to 52).

**Selectors.** Targets carry `data-tour="<name>"` (a place on the map: `data-tour-spot="house|library|cafe|salon|friend-spot-N"`). Names used:
`town-badge`, `town-weather`, `town-daily`, `town-places`, `town-friends`, `town-bell`, `town-privacy`, `town-zoom`, `window`, `clock`, `quote`
(the corkboard), `chair`, `menu` (the room menu button), `menu-mood`, `menu-shop`, `menu-inventory`, `coins`, `search-results`, `reader-message`,
`salon-studio-tab`/`salon-profile-tab` (built as `salon-<tab>-tab`), `library-genre`, `library-bestsellers`, `profile-quotes`, `profile-replay`,
`profile-logout`. Four of these are generated in code (`menu`, `library-genre`, `library-bestsellers`, `salon-profile-tab`), so a plain text search for them
in `client/src` finds only the generators.

**Pre for every TOUR scenario unless stated:** ACCT-NEW with Welcome just finished (so `tour_seen_at` is null). Desktop.

---

### TOUR-01 · The walkthrough starts by itself after Welcome · Critical
**Situation:** a new reader finishes Welcome. **Objective:** the tour opens in the town, once.
1. Press **Finish** on Welcome → the town opens and, after the camera settles, the **Walkthrough** region appears with `1 of 52 · Town` and the text "Hi, it's you! I'm your character in IKDA Town…" 📸.
2. Note the buttons → **Next** and **Skip this part** / **Skip tour** are shown; **Back** is **not** shown on step 1.
3. Open a second browser as the same reader before finishing → the tour has not been marked seen yet.
**DB:** `profiles.tour_seen_at` is null while the tour is open. **Pass:** exactly one bubble, step 1, no other overlay.

### TOUR-02 · Town section, steps 1 to 10 (including the asks) · Critical
**Situation:** the reader follows the character round the HUD. **Objective:** every HUD target is circled and the two asks work.
1. Press **Next** through steps 1 to 2 → step 2 circles the player badge (level, ring, coin).
2. Step 3 (weather) shows the ask "Tap it to try another sky." → press the weather chip (not Next) → the sky changes **and** the tour advances to step 4.
3. Steps 4 to 9 (daily, places, friends, bell, privacy, map) → each circles its HUD control in turn; for each, the counter increments.
4. Step 10 (`to-house`): the camera glides to your house; the ask is "Tap your house, then go in." → tap the house, then press the enter button on its place card → the page becomes `/house` and the tour advances to step 11 📸.
**DB:** none. **Pass:** counter reads `11 of 52 · Your house` on `/house`; ring positions match each control (check each screenshot).

### TOUR-03 · Your house section, steps 11 to 23 · Critical
**Pre:** continue TOUR-02 (on step 11) or start at step 11 via **Back/Next**.
1. Steps 11 to 15 (room, window, clock, corkboard, chair) → each is circled; step 12 targets the window, 14 the corkboard, 15 the chair's book.
2. Step 16 (`shelf`), ask "Tap the bookshelf to open My Shelf." → tap the bookshelf → `/house/shelf`, tour moves to 17.
3. Step 17 (`my-shelf`) explains three shelves and "Finishing a book earns 100 XP" → **Next** returns to `/house` for step 18.
4. Step 18 (`menu`), ask "Tap it to open it." → tap the **Room menu** button → advances.
5. Steps 19 to 21 (`mood`, `shop`, `inventory`): the room menu is opened for you; each item is circled in turn.
6. Step 22 (`coins`) circles the coin count. Step 23 (`to-library`), ask "Tap the library, then go in." → back on `/`, tap the library and enter → `/library`, step 24.
**DB:** none. **Pass:** no step circles an empty spot; the menu does not stay open after step 21 blocking later targets. **(unverified)**

### TOUR-04 · Library section, steps 24 to 33 (real data: a book is added) · Critical
1. Step 24 (`desk`), ask "Tap the help desk." → tap it → the search bar opens; step 25 (`search`) asks to search.
2. Type `The Hobbit`, press Enter → `/search?q=The%20Hobbit`; step 26 asks to tap a book.
3. Tap a result → its card opens; step 27 explains the card (summary, rating, reviews).
4. Step 28 (`add-book`), ask "Add it to your shelf." → press **Add to To be read** → the card confirms and the tour moves on.
5. Steps 29 to 32 (`bookcases`, `bestsellers`, `scanner`, `library-places`) circle the hall parts in turn.
6. Step 33 (`to-cafe`), ask "Tap the cafe, then go in." → `/`, tap the cafe and enter → `/cafe`.
**DB:** `user_books` gains The Hobbit with `status = want_to_read`; `xp_events` gains `add_book` (10 XP) for the book id; XP total 10.
**Pass:** the book is on the shelf; XP 10; the tour continues at step 34. If Google Books fails, retry once; record a failure only if it persists. **(unverified)**

### TOUR-05 · Cafe section with Pip, steps 34 to 42 · Critical
**Pre:** `database/neighbour.sql` applied and `pip.ikda` seeded (otherwise record "Pip's reply" as blocked, not failed).
1. Step 34 (`cafe`) → the cafe loads with readers and match scores. Step 35 (`meet-pip`), ask "Tap Pip to say hi." → click Pip the Librarian → Pip's profile page `/people/pip.ikda` opens; step 36 explains the profile.
2. Step 37 (`add-pip`), ask "Send Pip a friend request." → press **Add friend** → it changes to **Added as friend** (Pip accepts at once); the tour advances to 38 ("Pip said yes!").
3. Step 38 (`message-pip`), ask "Tap Message and send Pip a hello." → press **Message** → the chat opens; step 39 (`chat`) says to type and send.
4. Type `Hello Pip!` and press **SEND →** → the message shows; within a few seconds Pip's reply appears (one of the six lines, e.g. "Hi! Have you found a good book yet?").
5. Step 40 (`visit-pip`), ask "Visit Pip's room." → press **Visit Pip's room** → `/people/pip.ikda/room`; step 41 notes the welcome note → open the corkboard to see "Welcome to town, neighbour! … — Pip" on **your** board.
6. Step 42 (`friend-house`): back on `/`, Pip has a house plot with a name tag and a green dot 📸.
**DB:** `friendships` row (you ↔ Pip) `status = accepted` with a house spot; `room_notes` row `owner_id = you`, `author_id = Pip`, content "Welcome to town, neighbour! Pop by the library any time. — Pip"; `reader_messages` two rows (yours to Pip, Pip's reply); `xp_events`: `send_message` (5) and `visit_room` (15) added.
**Pass:** friend + message + reply + note + house all present; XP now 10 + 5 + 15 = 30. **(unverified)**

### TOUR-06 · Salon section, steps 43 to 52, and the end · Critical
1. Step 43 (`to-salon`), ask "Tap the salon, then go in." → `/salon`.
2. Step 44 (`studio`) circles the Style studio. Step 45 (`profile-tab`), ask "Tap Profile." → press the **Profile** tab.
3. Steps 46 to 51 (`profile-card`, `level`, `coins-card`, `privacy-switch`, `saved-quotes`, `replay`) each circle their card in turn; the Profile tab stays open.
4. Step 52 (`bye`) on `/`: the last bubble says "That's all of IKDA!" and the button reads **Done**; press **Done** → the bubble closes 📸.
**DB:** `profiles.tour_seen_at` is set to now. **Pass:** no bubble remains; reload → no bubble; the location prompt ("Find readers near you?") may now appear for a non-minor (answer **Stay private**).

### TOUR-07 · Back and the counter · High
1. From step 5 press **Back** twice → the counter reads `3 of 52 · Town` and the circled element changes accordingly.
2. Press **Next** four times → step 7; across a page change (e.g. from step 11 back to 10) → the page changes with the step (`/house` ↔ `/`).
**DB:** none. **Pass:** the counter always equals the step; **Back** is absent only on step 1.

### TOUR-08 · Pressing Next instead of doing an ask · High
**Situation:** the reader doesn't want to do the action. **Objective:** Next always works and nothing breaks.
1. At step 3 (weather) press **Next** instead of tapping → step 4; the sky unchanged.
2. At step 10 press **Next** → step 11 jumps to `/house` automatically.
3. At step 28 press **Next** without adding a book → continues to 29; no book added.
**DB:** `user_books` has no The Hobbit row in step 3; no `xp_events` for the skipped actions. **Pass:** every ask can be skipped with **Next**; later steps still find their targets (step 27's card and step 38's Message may be missing if their earlier ask was skipped: record exactly what the bubble does, e.g. "circles nothing"). **(unverified)**

### TOUR-09 · Skip this part · High
1. At step 5 (Town) press **Skip this part** → the counter jumps to step 11 `Your house`, page `/house`.
2. At step 20 (Your house) press **Skip this part** → step 24 `Library` on `/library`.
3. In the last section (Salon) press **Skip this part** → the tour **closes** (no later section).
**DB:** after step 3, `tour_seen_at` is set. **Pass:** each jump lands on the first step of the next section.

### TOUR-10 · Skip tour: closes and never returns · Critical
1. At any step press **Skip tour** → the bubble closes immediately.
2. Reload → no walkthrough. Log out and back in (and on a second browser) → none.
3. The walkthrough may be replayed only from the Salon (TOUR-11).
**DB:** `profiles.tour_seen_at` set. **Pass:** no automatic restart in any session. **Existing coverage:** `onboarding.spec.js` ("can skip the tour, and it stays skipped").

### TOUR-11 · Replay from the Salon · Medium
**Pre:** ACCT-NEW-TOURSEEN.
1. `/salon` → **Profile** tab → press **Replay the walkthrough** → the bubble starts at `1 of 52 · Town` (the page moves to `/` as step 1 requires).
2. **Skip tour** → closes; `tour_seen_at` remains set (not cleared).
3. Replay and finish it with actions (TOUR-04 and TOUR-05 actions again) → **no duplicate** XP for an already-added book or a re-sent first message; sending a second hello to Pip works and Pip replies again.
**DB:** no duplicate `friendships`; `xp_events` unchanged for `add_book` (unique per book). **Pass:** replay is repeatable and harmless.

### TOUR-12 · Closing the page mid-tour · Medium
1. At step 15 reload the page → the walkthrough restarts at step 1 (the progress is in memory; the flag is saved only on close) **(unverified)**.
2. Close the tab at step 15, reopen and log in → the tour starts again because it was never closed.
**DB:** `tour_seen_at` still null until the tour is closed. **Pass:** record the observed behaviour (restart vs resume); it must not crash or show two bubbles.

### TOUR-13 · The walkthrough's data is real and consistent afterwards · High
**Pre:** TOUR-01 to TOUR-06 completed with all asks done.
1. Town: Pip's house present; **Friends** shows Pip under **Your friends**, "Online now".
2. Bell: any entries are consistent (no crash on empty).
3. Salon → Profile: card shows `0 Reading`, `1 To read`, `0 Finished`; **Reader level** shows 30 XP (level 1, 70 XP to level 2).
4. My Room: the corkboard shows Pip's note; the shelf has The Hobbit on **To be read**.
5. Log out and in → all of it persists.
**DB:** see TOUR-04 and TOUR-05. **Pass:** counts and XP match; nothing is duplicated.

### TOUR-14 · The walkthrough on a phone and with reduced motion · Medium
1. Phone viewport: step through steps 1 to 10 → the bubble never covers its own target and no sideways scroll appears; **Next** and **Skip tour** stay tappable (≥ 44 px).
2. Emulate `prefers-reduced-motion: reduce`: steps still advance (the camera glide is instant or short).
3. Keyboard: Tab reaches **Next**; Enter advances; the bubble has `aria-live="polite"` so the text is announced.
**DB:** none. **Pass:** usable at 390 × 844 and with reduced motion. **(unverified)**
