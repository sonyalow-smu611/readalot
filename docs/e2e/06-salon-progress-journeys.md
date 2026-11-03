# E2E scenarios 06: Hair Salon, XP/coins/levels, connecting journeys

Suites: **SAL** Salon (15), **PRG** progression (6), **JRN** connecting journeys (8) = 29. Format, accounts and rules: header of
[01-public-auth-onboarding.md](01-public-auth-onboarding.md) and C2/C3 of [../E2E_GUIDE.md](../E2E_GUIDE.md). Unless stated: Desktop,
**ACCT-DEMO** just seeded for SAL; **ACCT-NEW** for JRN-01. The JRN scenarios chain features: execute their steps in order and
verify the database at the checkpoints marked **✔ DB**. Reset the demo account after any scenario that changes it.

---

## SAL: Hair Salon

### SAL-01 · Enter the salon · High
1. Town → **Hair Salon** → **Enter the salon** → pixel clouds cover the screen then part to the sides, revealing the salon: a tall bulb-ringed mirror, counter, barber chair, your character standing beside it (breathing, blinking, sometimes walking on the spot) and its reflection in the mirror 📸.
2. A dock with two tabs **Style studio** and **Profile**; **Back to town** top left.
**DB:** none. **Pass:** the stage shows the saved look. **Existing coverage:** `salon.spec.js`.

### SAL-02 · Ready-made looks · High
1. **Style studio → Looks** → five presets (drawn as the town's pixel sprites); press each → the stage character changes and hops; the save bar **New look ready** slides up.
2. Press the current look's own preset → no change flagged.
**DB:** none until Save. **Pass:** the stage matches the chosen preset each time.

### SAL-03 · Customise part by part · High
1. Tabs **Hair, Skin, Outfit, Extras** (arrow keys move between tabs). In **Hair** change style and colour; **Skin** tone; **Outfit** top, top colour, bottoms, bottoms colour, shoes, shoe colour; **Extras** glasses, hat, hair accessory, scarf, earrings, bag.
2. Each tile shows your character wearing that part; colours are named swatches; the stage updates live.
3. Choose **None** for an optional extra → it is removed.
**DB:** none until Save. **Pass:** every slot changes the stage; selection is a radio group (one per part). **Existing coverage:** `salon.spec.js`.

### SAL-04 · Surprise me and Reset · Medium
1. **Surprise me** → a random free look is applied.
2. **Reset** → the stage returns to the saved look; the save bar disappears.
**DB:** none. **Pass:** only free parts are used by Surprise me.

### SAL-05 · Save a look · Critical
1. Change hair and top, press **Save look** → "Saving…", then a status (look saved), pixel confetti bursts, the character hops.
2. Leave to the town and return → the saved look persists; the town character and the player badge use it 📸.
3. Reload and log out/in → the same look.
**DB:** `profiles.character` = the new look JSON (all keys valid). **Pass:** the same look in the Salon, the town and the badge. **Existing coverage:** `salon.spec.js`.

### SAL-06 · Locked parts and clashes · Medium
1. Parts with a price show a lock ("Locked ones open up with coins soon"); pressing one does not select it.
2. Choose a part that clashes with another (e.g. a hat with a hair accessory) → the clash note explains why it is disallowed.
**DB:** none. **Pass:** priced parts cannot be selected; coins are never spent in the Salon.

### SAL-07 · Leaving with an unsaved look · High
1. Change the hair, press **Back to town** → a dialog **"Save your new look?"** with **Save look and leave**, **Stay**, **Discard and leave**.
2. **Stay** → remains with the changes; Esc selects the safe choice (Stay).
3. **Discard and leave** → the town; the look is unchanged in the Salon later.
4. Repeat and choose **Save look and leave** → the new look is saved and the town opens.
**DB:** `profiles.character` changes only with Save. **Pass:** all three buttons behave as named.

### SAL-08 · Profile tab content · High
1. **Profile** → the reader card (name, email, counts **Reading / To read / Finished**, **Edit**), **Reader level** (+ **How to earn XP**), **Favourite genres**, **Coins** (+ **Visit the shop**), **About you**, **Privacy**, **Saved quotes**, **Replay the walkthrough**, **Log out** 📸.
2. For Jordan: `Jordan Lee`, `demo@demo.ikda.app`, 2 / 5 / 3, level 4, 620 XP with "80 XP to level 5, which gives 125 coins", genres Fantasy / Science Fiction / Mystery / Literary Fiction, 600 coins.
3. On a phone-size window the panel is a sheet with a handle: **Show more / Show less**.
**DB:** none. **Pass:** numbers match `my_progress` and `user_books`. **Existing coverage:** `salon.spec.js`, `progress.spec.js`.

### SAL-09 · Edit profile (happy path) · Critical
1. Press **Edit** → a form: **Name**, **Gender**, **Age**, **Religion**, **Location** (optional), **Favourite genres**, **Change look**, **Save**, **Cancel**.
2. Change **Name** `Mya` → `Maya`, **Location** `Tampines, Singapore`, add a genre, **Save** → the card shows `Maya`; the town badge shows `Maya`.
3. Open the cafe as another account → the reader appears as `Maya` (if public). Reload → persists.
4. **Change look** → the Style studio tab opens.
**DB:** `profiles.display_name`, `location_name`, `favorite_genres`; `profile_private` unchanged unless edited. **Pass:** the name updates everywhere after reload. **Reset the demo account.**

### SAL-10 · Edit profile validation · High
1. Clear the name → `Add your name.`; spaces only → the same.
2. Name 41 characters → capped at 40 (maxlength).
3. Gender unselected → `Choose one, including prefer not to say.`
4. Age `abc`, `12`, `121`, `-5` → `Enter an age from 13 to 120.`; `13` accepted.
5. Remove every genre → `Pick at least one genre.`
6. **Cancel** after edits → nothing saved; reopening shows the saved values.
**DB:** unchanged on every refused attempt. **Pass:** exact messages; no partial save.

### SAL-11 · About you, field by field · Medium
1. Press the pencil on one field (e.g. Location) → only that field opens with **Save**/**Cancel**; edit and save.
2. Open another and **Cancel** → unchanged.
3. An invalid value (age `5`) → an error under the field.
**DB:** only the edited column changes. **Pass:** independent field editing.

### SAL-12 · Privacy switch and its pop-ups · High
1. **Public profile and location** off → on → a pop-up: your character cheers ("found"); a status line announces it.
2. On → off → a pop-up: the character puts on a mask ("hidden").
3. For an under-18 reader the switch is locked with an explanation.
4. The town chip mirrors the switch (TWN-09).
**DB:** `profiles.discoverable`; going private removes `reader_areas`. **Pass:** the two controls always agree. **Existing coverage:** `nearby.spec.js`, `salon.spec.js`.

### SAL-13 · Book counts open the lists · Medium
1. Press **Reading**, **To read** or **Finished** on the card → a sheet with those books, each with a remove button ("Remove <title> from <shelf>").
2. Remove one → it leaves the sheet and the count decreases; close the sheet (Close).
3. An empty shelf says so.
**DB:** `user_books` row deleted. **Pass:** the sheet and the counts agree. **Reset the demo account.**

### SAL-14 · Saved quotes · Medium
1. **Saved quotes** lists the three seeded quotes (Fear is the mind-killer. — Frank Herbert, Dune; "I declare after all there is no enjoyment like reading!" — Jane Austen; "Not all those who wander are lost." — J. R. R. Tolkien).
2. A reader with none: "No saved quotes yet" with **Go to My Room** and **Find a book**; both links work.
3. Remove a quote if a control exists **(unverified)**; reload to confirm.
**DB:** `saved_mood_quotes`. **Pass:** list equals the table.

### SAL-15 · Level, Coins and the shop shortcut · Medium
1. **How to earn XP** expands a list of actions and XP (Add a book 10 … Write a review 40 …).
2. The level card's bar fills to the next level; the text says how many XP and what the level pays.
3. Coins card **Visit the shop** → `/house` with the shop opened **(unverified)**.
**DB:** none. **Pass:** the XP table matches C3.

---

## PRG: XP, coins and levels

### PRG-01 · XP per action · Critical
**Pre:** ACCT-NEW-TOURSEEN and a fresh friend. After each action read `my_progress` (XP and coins).
1. Add a book (+10), Start reading (+20), Finish it (+100), Write a review (+40), Visit a friend's room (+15), Leave a note (+10), Send a message (+5).
2. XP total after all of them = 200 → level 2.
**DB:** `xp_events` one row per action with the right `xp`. **Pass:** each increment matches; the badge animates "+N XP".

### PRG-02 · Once-only and daily limits · High
1. Add the same book again → no XP; start the same book again → none; finish again → none; review again → none.
2. Visit the same friend's room twice the same day → +15 once; leave a second note the same day on the same room → +10 once.
3. Next day (mock the date or use another day's row) → +15 and +10 are available again.
**DB:** unique indexes `xp_once_per_book`, `xp_once_a_day`. **Pass:** no double award.

### PRG-03 · Level thresholds and level-up coins · Critical
1. From 0 XP reach 100 → level 2, +50 coins (25 × 2); 250 → level 3, +75; 450 → level 4, +100; 700 → level 5, +125.
2. A jump over two levels in one action pays both levels' coins.
**DB:** `profiles.coins` increases by the sum 25 × level. **Pass:** the level shown is `max L with threshold ≤ XP`; coins correct. **Existing coverage:** `progress.spec.js`.

### PRG-04 · Coins sources and sinks · High
1. Start at 480. Claim day-1 Daily (+50) → 530; level up (+50) → 580; buy a $30 succulent trio → 550.
2. Every place that shows coins agrees (badge, room, Salon).
**DB:** `profiles.coins` equals start + rewards − purchases. **Pass:** arithmetic exact. **Existing coverage:** `progress.spec.js`, `furniture.spec.js`.

### PRG-05 · Message XP cap · Low
1. Send 11 messages to friends in one day (wait at least 1.5 seconds between sends, or the API refuses with 429) → XP awarded for 10 only (+50), the 11th gives 0.
**DB:** `xp_events` `send_message` count 10 per day. **Pass:** capped.

### PRG-06 · XP and coins cannot be forged · High
**Pre:** `database/lock_down.sql` applied (it is, per the Supabase audit).
1. With a reader's token call `rpc('earn_xp', { p_action: 'add_book', p_target: 'not-a-real-book' })` → 0 XP gained.
2. Try `update profiles set coins = 99999` through the browser client → refused (coins are not writable).
3. `rpc('spend_coins', { p_amount: -5 })` → refused ("A price must be more than 0.").
4. The public (anon) key reading `user_books` → refused.
**DB:** no change. **Pass:** every forgery fails. **Existing coverage:** `database-access.spec.js`, `progress.spec.js`.

---

## JRN: Connecting journeys

### JRN-01 · A brand-new reader, start to finish · Critical
**Situation:** a professor's first session. **Objective:** every part of the app works in one chain.
1. Register (AUTH-01) → `111111` → Welcome (WEL-01) → **✔ DB:** `profiles`, `profile_private`, `coins 480`, `tour_seen_at` null.
2. Walkthrough (TOUR-02 to TOUR-06, doing every ask) → **✔ DB:** `tour_seen_at` set; Pip friendship; The Hobbit on To be read; XP 30.
3. Library: search `dune`, add Dune → **✔ DB:** `user_books`, `add_book` XP (total 40).
4. My Room: start Dune (+20), move the slider to 50%, mark it finished (+100) → **✔ DB:** `read`, XP 160, level 2 (+50 coins = 530).
5. Review Dune ★ 5 (+40) → XP 200; **✔ DB:** `reviews`.
6. Mood check-in: Calm → Save quote → Add to To Be Read (+10).
7. Shop: buy a Mountain poster ($25), place it on the wall, reload → persists; coins 505 − … (compute from the DB).
8. Cafe: add a sample reader, message them (+5).
9. Daily: complete the three tasks, claim (+50 coins +20 XP).
10. Salon: change the hair, **Save look**; edit the name; switch to public; **Replay the walkthrough** then **Skip tour**.
11. Log out and log in (`111111`) → everything persists; the town shows the new name, level and coins.
**DB:** all checkpoints above. **Pass:** no step errors; final numbers equal the sum of the XP/coin rules. **Reset:** delete the account.

### JRN-02 · The presenter's 8-minute demo run · Critical
**Pre:** ACCT-DEMO just seeded (docs/DEMO.md). 1. Log in `demo@demo.ikda.app` / `111111`.
2. Town: weather chip, friends walking, Emma's and Ayaan's houses. 3. Bell and Friends: visits, accept Noah, chat with Emma. 4. Cafe: match scores, Emma's profile, shared books. 5. Visit Emma's room: corkboard, leave a note. 6. My Room: open Dune, mark finished (level 5), Shop and Inventory. 7. Salon: restyle, Save look (confetti), Profile tab. 8. Library: a bookcase, the help desk, the scanner.
**DB:** end state = seeded + the actions. **Pass:** every step in DEMO.md works inside 8 minutes without an error. **Reset the demo account.**

### JRN-03 · Two readers: friendship, chat, visit, note, notification · Critical
**Pre:** ACCT-A and ACCT-B (two contexts, both past Welcome and the tour).
1. A adds B (FRD-04); B accepts. **✔ DB:** `friendships accepted`.
2. A chats to B; B sees the message in the chat box (reload or poll) and replies.
3. A visits B's room (+15 XP) and leaves a note (+10). **✔ DB:** `room_notes`, `xp_events`.
4. B's bell shows "A visited your room"; B's corkboard shows A's note; B removes it.
5. B removes A as a friend → both houses vanish; A's chat box is gone; B's room is still visible by URL but A is no longer a friend (no friend features).
**DB:** `friendships closed`. **Pass:** each step visible to the other reader within a reload.

### JRN-04 · A full Daily day done through real actions · High
**Pre:** ACCT-NEW-TOURSEEN with one friend. 1. Open the town → the panel opens by itself; note the three tasks. 2. Do the reading task (start a book, move the slider). 3. Do today's third task (add a book / message / visit / note). 4. Claim → chest → coins +50, XP +20; badge counts up. 5. Reload, second browser → claimed. 6. Next day (mock): a new set of tasks; streak 1.
**✔ DB:** `daily_state`, `xp_events daily_claim`. **Pass:** the ticks come only from the real actions.

### JRN-05 · The privacy journey · High
**Pre:** two adult readers A and B near each other. 1. A is private: B's Cafe/Friends nearby lists do not show A. 2. A turns public via the town chip (allow location) → A appears in B's Cafe and **Readers nearby** (after B reloads). 3. B adds A (request). 4. A turns private → A vanishes from B's nearby/Cafe lists; the friendship remains. 5. Under-18 variant: a 16-year-old can never become public.
**✔ DB:** `discoverable`, `reader_areas`. **Pass:** visibility always matches the setting; coordinates never appear.

### JRN-06 · The shelf lifecycle · High
**Pre:** ACCT-NEW-TOURSEEN. 1. Library: add a book (To be read). 2. My Room: **Start reading** → Reading. 3. Move the slider; drag it to Finished on My Shelf (status `read`). 4. Review it. 5. Remove it with Undo, then remove again. 6. After each step check the Salon card counts and the Daily reading task.
**✔ DB:** `user_books`, `reviews`, `xp_events`. **Pass:** counts agree in the room, My Shelf and the Salon at each step.

### JRN-07 · Decorate and show off · High
**Pre:** ACCT-A (with coins) and ACCT-B (friend). 1. A buys and places three pieces (poster, plant, cat). 2. B visits: sees them (read-only). 3. B leaves a note. 4. A's bell shows B's visit; A's corkboard shows the note. 5. A replaces a chair; B revisits and sees the change.
**✔ DB:** `room_furniture`, `room_notes`, `xp_events`. **Pass:** B always sees A's latest room.

### JRN-08 · Multi-device persistence · High
**Pre:** ACCT-A on two browsers (Desktop and Phone). 1. Make a change in each area on browser 1: shelf, furniture, look, profile name, friend, message, daily claim, bell cleared. 2. Reload browser 2 → all the changes are visible (except the browser-only mood check-in and landing flag). 3. Make a change on browser 2 and confirm browser 1 shows it after a reload.
**✔ DB:** consistent. **Pass:** server-side state is identical on both devices.
