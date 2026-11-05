# E2E scenarios 02: the walkthrough (35 numbered stops)

Suite **TOUR** (15 scenarios). Format, accounts and rules: header of
[01-public-auth-onboarding.md](01-public-auth-onboarding.md) and C2/C3 of
[../E2E_GUIDE.md](../E2E_GUIDE.md).

This file was updated from a live professor-pass run (Nov 2026): the walkthrough now shows `N of 35 · <Section>`,
uses **Skip this step** on ask cards, and still supports **Skip this part** / **Skip tour**.

**Pre for every TOUR scenario unless stated:** ACCT-NEW with Welcome just finished (`tour_seen_at` is null), desktop viewport.

---

### TOUR-01 · The walkthrough starts by itself after Welcome · Critical
**Situation:** a new reader finishes Welcome. **Objective:** the tour opens in town once.
1. Press **Finish** on Welcome → the town opens and the tour bubble appears with `1 of 35 · Town` and the intro text 📸.
2. Confirm buttons on step 1: **Next**, **Skip this part**, **Skip tour**. **Back** is not shown yet.
3. Open a second browser as the same reader before closing the tour → it is not marked seen yet.
**DB:** `profiles.tour_seen_at` stays null while the tour is open. **Pass:** one tour bubble, no duplicate overlays.

### TOUR-02 · Town section (1–4) · Critical
**Situation:** the reader follows the HUD intro. **Objective:** town controls are introduced and house entry works.
1. Advance to `2 of 35 · Town` → the first card lights the live weather chip (it only shows the weather; it can't be tapped).
2. Press **Next** → the tour continues.
3. Continue through Town cards (badge, daily, places, friends, bell, privacy, map guidance).
4. At `4 of 35 · Town`, do the ask (**Tap your house, then go in**) or skip it.
5. Enter your house → route `/house`, counter reaches `5 of 35 · Your house` 📸.
**DB:** none. **Pass:** transition to `/house` is reliable; counter and section change together.

### TOUR-03 · Your house section (5–9) · Critical
1. `5 of 35` asks to slide around the room; complete or skip.
2. Continue through room cards (window, clock/corkboard/chair/book guidance).
3. Complete the asks for opening shelf/menu (or skip each ask).
4. Final house card sends you back to town and asks you to enter Library.
5. Enter Library → route `/library`, counter reaches `10 of 35 · Library`.
**DB:** none. **Pass:** all house cards advance; no dead-end ask.

### TOUR-04 · Library and My Shelf section (10–20) · Critical
1. In Library, complete/skip hall and genre cards.
2. Help desk ask: search `The Hobbit` (or skip) and open a result card.
3. Add-book ask: press **Add to To be read** (or skip).
4. My Shelf cards appear (`/house/shelf`) and include the drag-to-move ask.
5. Section ends by returning to town and asking to enter Cafe (`21 of 35 · Cafe`).
**DB:** if add-book ask is completed, `user_books` gains The Hobbit and `xp_events` records `add_book` (+10). **Pass:** tour stays navigable whether asks are completed or skipped.

### TOUR-05 · Cafe section with Pip (21–28) · Critical
**Pre:** `database/neighbour.sql` applied for Pip auto-replies.
1. Cafe intro cards appear with match-score context.
2. Pip ask flow appears in order: tap Pip, add Pip, message Pip, visit Pip.
3. Complete all asks once end-to-end (recommended path): Pip becomes a friend, chat opens, visit room works.
4. Counter reaches `28 of 35 · Cafe` and returns to town.
**DB:** `friendships` row for Pip, chat rows, and Pip's welcome note behaviour match environment setup. **Pass:** no missing action path; Pip journey can be completed.

### TOUR-06 · Salon section and completion (29–33) · Critical
1. Town card asks to enter Salon (`29 of 35 · Salon`).
2. Style studio card appears, then Profile-tab ask appears.
3. Profile cards continue through level, coins, privacy, saved quotes, replay/log out guidance.
4. Final card `33 of 35 · Salon` shows **Done** with "That's all of IKDA!" 📸.
5. Press **Done** → bubble closes.
**DB:** `profiles.tour_seen_at` is set. **Pass:** reload does not auto-start the tour.

### TOUR-07 · Back and counter behaviour · High
1. From any middle step, press **Back** repeatedly.
2. Confirm the counter decrements and highlighted targets/messages move backwards correctly.
3. Press **Next** to return forward, including across route changes (`/`, `/house`, `/library`, `/cafe`, `/salon`).
**DB:** none. **Pass:** counter/state stay in sync; **Back** absent only on step 1.

### TOUR-08 · Skip this step behaviour on ask cards · High
1. On an ask card (enter-house, help-desk search, Pip actions), press **Skip this step**.
2. Confirm the counter advances and the tour remains usable.
3. Continue to completion.
**DB:** skipped asks should not create side effects (for example no new `user_books` row when add-book is skipped). **Pass:** skipping one ask does not break later cards.

### TOUR-09 · Skip this part behaviour · High
1. In Town, press **Skip this part** → jump to `5 of 35 · Your house`.
2. In Your house, press **Skip this part** → jump to `10 of 35 · Library`.
3. In Salon, press **Skip this part** → closes the walkthrough.
**DB:** closing via section-skip sets `tour_seen_at`. **Pass:** each jump lands at the next section start.

### TOUR-10 · Skip tour closes it permanently until replay · Critical
1. Press **Skip tour** at any step.
2. Reload, log out/in, and open on a second browser session.
3. Confirm the tour does not auto-open.
**DB:** `profiles.tour_seen_at` set. **Pass:** only manual replay can restart it.

### TOUR-11 · Replay from Salon Profile · Medium
**Pre:** ACCT-NEW-TOURSEEN.
1. Go to `/salon` → **Profile** tab → press **Replay the walkthrough**.
2. Confirm restart at `1 of 35 · Town`.
3. Skip or finish again; `tour_seen_at` remains set.
**DB:** replay is idempotent for one-time actions (no duplicate friend rows or duplicate unique XP events). **Pass:** replay is repeatable and safe.

### TOUR-12 · Reload mid-tour · Medium
1. Stop midway (for example in Library), then reload.
2. Observe whether it restarts from the beginning or resumes.
3. Close tab and sign in again.
**DB:** `tour_seen_at` remains null until close/skip/done. **Pass:** behaviour is consistent and crash-free; record restart/resume result.

### TOUR-13 · Data consistency after full completion · High
**Pre:** complete TOUR-01 to TOUR-06 with asks done.
1. Town: Pip appears in social surfaces expected for a new friend.
2. House/shelf: added book state matches what the tour asked you to do.
3. Salon profile cards and counts reflect actions done during tour.
4. Log out/in and confirm persistence.
**DB:** friendship, shelf, chat and XP rows match completed asks. **Pass:** no duplicates; persisted state matches UI.

### TOUR-14 · Mobile and reduced-motion pass · Medium
1. Set viewport to phone size (390 × 844), replay walkthrough, step through Town and one route change.
2. Confirm controls remain tappable and bubble does not trap the UI.
3. Emulate `prefers-reduced-motion: reduce` and verify progression still works.
**DB:** none. **Pass:** walkthrough remains usable on mobile and reduced motion.

### TOUR-15 · The music button, and your favourite genres · Medium
1. In town, `2 of 35 · Town` lights the note button beside **Daily tasks** one stop at a time: "The music button: tap it to play or mute the background music" 📸. Next moves on (the tour never presses it for you).
2. Reach the Salon: **Profile** tab → the cards group now includes **Your favourite genres. Each one is a button that opens that genre's bookcase in the library.**
3. `33 of 35 · Salon` asks you to **Tap a genre** (the first genre button is circled). Tap it → the library opens on that genre's bookcase (`/library?shelf=…`) and the tour moves on by itself. **Skip this step** also works, and a profile with no genre button skips the step after a few seconds.
4. `34 of 35 · Salon` lights the open bookcase ("browse it like the library: tap a book to open it…"), then the **Spines / Covers** switch. Next → `35 of 35`, the closing line, back in town.
5. Back from `35 of 35` returns to the open bookcase (`/library?shelf=fantasy`).
6. On a phone (390 × 780) the bar is taller (232 px), the words are centred and larger, and none of the 35 steps is cut off.
**DB:** none. **Pass:** each step reads in full, the genre tap opens its bookcase, and the tour carries on.
