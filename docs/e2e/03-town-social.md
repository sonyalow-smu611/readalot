# E2E scenarios 03: town, Daily tasks, friends, Cafe, visiting rooms

Suites: **TWN** town and HUD (14), **DLY** Daily tasks (9), **FRD** friends, chat and bell (13), **CAF** Cafe (8), **VIS** visiting rooms and
notes (7) = 51. Format, accounts and rules: header of [01-public-auth-onboarding.md](01-public-auth-onboarding.md) and C2/C3 of
[../E2E_GUIDE.md](../E2E_GUIDE.md). Unless stated: Desktop, signed in, walkthrough already seen (ACCT-NEW-TOURSEEN or ACCT-DEMO).
**Reset the demo account** (`npm run seed:demo -w server`) before any scenario that says ACCT-DEMO, and after any that changes it.

---

## TWN: Town and HUD

### TWN-01 · A returning reader's town loads with the whole HUD · Critical
**Pre:** ACCT-DEMO, just seeded. **Objective:** the town and every HUD control appear with the right state.
1. Log in (AUTH-09) → the map loads ("Loading the town…" first), then 📸: weather chip top left, Daily button (flame) left, bell, **Places**, **Friends** top right, public/private chip under Daily, player badge bottom left, zoom buttons bottom right.
2. Read the badge → `Jordan Lee`, level 4, `600` coins.
3. Read the top bar button names → `Friends, 2 online, 1 friend request`; `Daily tasks, N of 3 finished, 0-day streak`; `Weather: … live. Change the sky`; the bell label shows `0 new` at first and `3 new` after about 10 seconds.
4. Emma's and Ayaan's houses show a **green dot** on the name tag; Sofia's and Mei's do not.
**DB:** none (reads `profiles`, `friendships`, `xp_events`, `daily_state`). **Pass:** all controls present and labelled; counts as above. **Existing coverage:** `town.spec.js`.

### TWN-02 · Pan, zoom and follow · High
1. Drag the map left/right/up/down → the map pans; release stops it.
2. Press **Zoom in** twice, **Zoom out** once → the scale changes each time; keyboard wheel/pinch also zooms.
3. Pan away from the character, press **Follow my character** → the camera returns and stays on the character as it moves.
**DB:** none. **Pass:** zoom is bounded (cannot zoom to nothing); follow recenters. **Existing coverage:** `town-map.spec.js`.

### TWN-03 · Tap the ground to walk; water and buildings stop the walk · Medium
1. Tap an empty pavement point → the character walks there along the pavement and stops.
2. Tap the lake → it walks to the shore, not into the water. Tap a building body → it walks as near as it can.
3. Tap a townsperson → they jiggle and then carry on.
**DB:** none. **Pass:** the character never ends on water or inside a building. **Existing coverage:** `town-map.spec.js`.

### TWN-04 · Place card and entering each building · Critical
1. Tap **Your house** once → a card slides up: the building's name on a coloured sign, a one-line blurb, an enter button **Go inside**, and **Close** 📸.
2. Press **Close** → the card closes.
3. Tap **Library** → **Enter the library**; **Cafe** → **Enter the cafe**; **Hair Salon** → **Enter the salon**. For each: press the enter button → the character walks to the door, the door opens with lamplight, the page becomes `/house`, `/library`, `/cafe`, `/salon`.
4. In each building press **Back to town** → `/`, the character stands at that building's door.
**DB:** none. **Pass:** four routes correct; the browser Back button from a building also returns to the town. **Existing coverage:** `town.spec.js`, `back-button.spec.js`.

### TWN-05 · Places menu · High
1. Press **Places** → a list named "Places in town" shows Your house, Library, Cafe, Hair Salon.
2. Press **Library** → the character walks to its door and the place card/enters as in TWN-04; the menu closes.
**DB:** none. **Pass:** each item leads to its building. **Existing coverage:** `town.spec.js`.

### TWN-06 · Weather chip previews · Medium
**Pre:** `mockWeather` or live weather available.
1. Press the weather chip repeatedly → it steps through day, night, rain, rainy night, then **live**; the chip label changes (`…, preview` vs `…, live`).
2. At **night** the street lamps, windows and lighthouse light up and cars show headlights; in **rain** drops fall and splash 📸.
3. Reload → back to live weather (previews are not saved).
**DB:** none. **Pass:** each look is distinct; reload resets.

### TWN-07 · Returning from a building puts you at its door · Low
1. Enter the Library, press **Back to town** → the character stands at the library door.
2. Reload the town → the character starts at your front door again.
**DB:** none. **Pass:** position remembered only until a refresh.

### TWN-08 · Player badge · Medium
1. Read the ring, gold level tab, name, coins → matches `my_progress` (XP and coins) 📸.
2. Press the badge → `/salon` opens.
3. Earn XP elsewhere (e.g. add a book) and return → the ring fills and a "+10 XP" floats; on a level-up the badge pops.
**DB:** none. **Pass:** badge and Salon agree on level and coins.

### TWN-09 · Public/private chip · High
**Pre:** adult reader, private. **Objective:** the chip and the Salon switch are one setting.
1. Read the chip under Daily → **PRIVATE**. Press it → a prompt or switch to public; choose public.
2. The chip reads **PUBLIC**. Open Salon → Profile → **Public profile and location** is on; the cheer pop-up shows once.
3. Press the chip again → private; the Salon switch is off and a mask pop-up shows.
4. Reload → state persists.
**DB:** `profiles.discoverable` true/false accordingly; going private deletes the `reader_areas` row (trigger `forget_area_when_private`). **Pass:** both controls always agree.

### TWN-10 · "Find readers near you?" prompt · High
**Pre:** adult reader who finished the walkthrough and has `location_asked_at` null.
1. After the tour closes → a prompt "Find readers near you?" with **Go public** and **Stay private**.
2. Press **Stay private** → closes; chip stays **PRIVATE**; `location_asked_at` is set; no prompt on reload.
3. (Fresh reader) press **Go public** → the browser asks for location. **Allow** → chip **PUBLIC**, a rough area is stored. **Block** → a polite message; the chip stays private.
**DB:** `profiles.location_asked_at` set; on public + allow: `reader_areas` row (a 1 km cell) and `discoverable = true`; never the exact position. **Pass:** never asked twice; under-18s are never asked. **Existing coverage:** `nearby.spec.js`.

### TWN-11 · Friends' houses and walking friends · High
**Pre:** ACCT-DEMO (Emma and Ayaan online right after the seed).
1. Find Emma's and Ayaan's houses: name tag with a **green dot**; Sofia's tag has none; Mei's house looks dusty 📸.
2. Online friends walk the streets with an **orange glow**. Tap one → the Cafe's reader card opens (**Meet <name>**): **Visit <name>'s room**, **Add friend** / **Added as friend**, **Message**, what they are reading. At most five made-up townsfolk wander the pavements besides the real readers out walking.
3. Tap a friend's house → its card offers to go in.
**DB:** none. **Pass:** online/away/dusty states are visually distinct. **Existing coverage:** `friends.spec.js`.

### TWN-12 · Ambient animation · Low
1. Watch 30 seconds → water flows, fish swim, the campfire flickers, cars drive on the left, townsfolk walk, signs bob and sparkle.
2. Emulate reduced motion → animations are calmer or paused; the page stays usable.
**DB:** none. **Pass:** no frozen frame or console error.

### TWN-13 · Night and rain lighting · Low
1. With weather preview **night** → lamps, windows, lighthouse lit; headlights on cars.
2. **Rainy night** → rain plus lights.
**DB:** none. **Pass:** the town remains legible (contrast) in every look.

### TWN-14 · Map load states and API failure · Medium
1. Throttle the network to Slow 3G and reload → "Loading the town…" shows until the map is ready; no blank screen.
2. Block `GET /api/friends` → the town still loads; Friends shows an empty or error state without breaking the page.
3. Block `GET /api/weather` → the chip falls back (no crash).
**DB:** none. **Pass:** each failure degrades gracefully.

---

## DLY: Daily tasks

**Pre for all DLY:** a reader with a clean `daily_state` (ACCT-NEW-TOURSEEN or a freshly seeded ACCT-DEMO). The panel is `section#town-daily`, title **Daily tasks**.

### DLY-01 · The panel opens by itself the first time each day · High
1. Arrive in the town for the first time today → the **Daily tasks** panel opens on its own with "New in HHh MMm".
2. Close it with its close control or by pressing the Daily button; reload → it does not open again today.
**DB:** `daily_state.shown` = today (via `daily_mark_shown`). **Pass:** once per day per account.

### DLY-02 · Panel content · High
1. Open the panel → shows the streak ("0-day streak"), two streak-freeze icons, three tasks (**Check in at town** already ticked; **Update your reading progress**; one rotating task), a status button (`Finish 2 more to claim`), the week strip of seven reward tiles (day 7 a chest) and the note "Missed a day? A freeze keeps your streak. Day 7 refills one." 📸.
2. Hover the Daily button (desktop) → "Daily task" slides out with a progress ring; on touch a tap opens the panel.
**DB:** `daily_state` row exists (`day` = today, `done = {check-in}`). **Pass:** all elements present.

### DLY-03 · Go takes the reader to the right building · High
1. Press **Go** on "Update your reading progress" → the camera/route goes to the house (`/house`).
2. Press **Go** on the rotating task (e.g. Add a book to your shelf → `/library`; Say hi to a reader → `/cafe`; Visit a friend's room / Leave a note → a friend's house).
**DB:** none. **Pass:** each Go lands in the building named by the hint. **Existing coverage:** `daily.spec.js:76` (currently **failing**, see C7).

### DLY-04 · Reading progress ticks the task · High
**Pre:** a reader with a Reading book (ACCT-DEMO: Dune 45%).
1. Open Dune from the bookshelf and move the progress slider → the task ticks (`progress`).
2. Open the panel → "Update your reading progress" has a tick and no **Go**; the status reads `Finish 1 more to claim` (or 0).
3. Alternatively **Start reading** a To-be-read book or **Mark as finished** also ticks it.
**DB:** `daily_state.done` includes `reading`. **Pass:** tick appears without a reload.

### DLY-05 · The rotating task ticks on its action · Medium
1. Read today's third task title. Do its action: add a book (library) / send a message (any friend) / visit a friend's room / leave a note.
2. The task ticks; reload → still ticked.
**DB:** `daily_state.done` includes the task id. **Pass:** exactly the task's action ticks it (other actions don't).

### DLY-06 · Claim the reward · Critical
**Pre:** all three tasks done on day 1 of a streak.
1. The status button reads **Claim 50 coins** and glows gold; the Daily button shows a bouncing dot.
2. Press it → a chest bounces in and opens, coins fly out; it shows streak day 1 and "+50 coins, +20 XP" 📸; press **Nice!**.
3. The badge counts the coins up by 50; the status reads `Claimed. New tasks tomorrow`; the streak reads `1-day streak`.
**DB:** `profiles.coins` +50; `xp_events` row `daily_claim` (20 XP; unique per day); `daily_state.streak = 1`, `last_claim = today`.
**Pass:** coins and XP match the day-1 reward ([master C3](../E2E_GUIDE.md)). **Existing coverage:** `daily.spec.js` (claim).

### DLY-07 · A claim cannot be repeated or lost · High
1. After DLY-06 reload and press the status again → disabled; no second reward.
2. Open the town on a second browser/device as the same reader → the panel shows `Claimed` (same server state).
3. Try `claim_daily` twice quickly (double-click) → only one `daily_claim` row; coins +50 once.
**DB:** unique index `xp_daily_claim_once (reader, day)`. **Pass:** one reward per day.

### DLY-08 · Streak, freezes and a missed day · Medium
**Pre:** use the test helper `setDaily(id, {...})` (`tests/e2e/supabaseUser.js`) to set `last_claim` to 2 days ago, or an existing streak.
1. Streak 3, last claim yesterday → panel shows `3-day streak`; claiming makes day 4 (125 coins).
2. Last claim 2 days ago with 2 freezes → a notice "a freeze saved your streak" (freezes 2 → 1) dismissable with ×.
3. Last claim 5 days ago with 0 freezes → notice "Your N-day streak ended. Finish today's tasks to start a new one."; streak 0.
4. Day 7 → the reward is 300 coins + 75 XP and refills one freeze.
**DB:** `daily_state.streak`, `freezes`, `notice`. **Pass:** each notice shows once, then is cleared. **Existing coverage:** `daily.spec.js`.

### DLY-09 · Preview buttons exist only in development · Low
1. On the live site open the panel → **Next day**, **Skip a day**, **Reset** are **not** shown.
2. On a local dev build they are shown and move the day on.
**DB:** none. **Pass:** hidden in production.

---

## FRD: Friends, chat and notifications

### FRD-01 · The friends panel · High
**Pre:** ACCT-DEMO.
1. Press **Friends** → the panel: **Add friend**, **Remove friends**; **Friend requests** ("Noah Koh wants to be friends" with **Accept**, **Decline**); **Your friends** (Emma Tan, Ayaan Rahman, Sofia Lim, Mei Chen: each with the book they read and a **Chat with …** button); **Readers nearby** (e.g. Dylan, Aasim, Priya, Daniel: "Last seen around here") 📸.
2. Emma and Ayaan read **Online now**; Sofia **Last seen 12 days ago**; Mei **Last seen 5 weeks ago**.
**DB:** none. **Pass:** the lists match the seed. **Existing coverage:** `friends-list.spec.js`.

### FRD-02 · Add a sample reader by username · High
**Pre:** ACCT-DEMO; Priya not yet a friend.
1. **Add friend** → a **Friend's username** box; type `priya.pagecount`, **Send request** → "You and priya.pagecount are now friends."
2. Priya moves into **Your friends**; a house is added to town.
**DB:** `friendships` (demo ↔ Priya) `accepted` with a house spot. **Pass:** immediate friendship. **Reset the demo account afterwards.**

### FRD-03 · Add-friend errors · High
1. Username `nobody_here` → `Couldn't find nobody_here. Check the spelling.`
2. Your own username (`demo.reader`) → a refusal (not a friend of yourself) **(unverified wording)**.
3. An existing friend (`emma.reads`) → "You're already friends with emma.reads." **(unverified exact text)**.
4. Empty box, **Send request** → nothing sent / validation.
5. With 7 friends already (town full) add another → a clear "town is full" style message **(unverified)**.
**DB:** no new `friendships` rows. **Pass:** each case shows a message, never a crash.

### FRD-04 · A friend request between two real readers · Critical
**Pre:** ACCT-A and ACCT-B (two registered demo-domain readers, both public so they can find each other, or A adds B by username), two browser contexts.
1. A: **Friends → Add friend**, B's username, **Send request** → "Request sent" style confirmation; A's panel shows B as requested.
2. B (second context): the bell shows `1 new` and the Friends button `1 friend request`; open the bell → "<A> sent you a friend request".
3. B: **Friends** → **Friend requests** shows A with **Accept** and **Decline** → press **Accept**.
4. Both: A appears in B's **Your friends** and vice versa; each gets a house plot; B's request list says "No requests right now."
**DB:** `friendships` row `pending` then `accepted`, `accepted_at` set, both spot columns assigned. **Pass:** both sides agree after reload. **Existing coverage:** `friends.spec.js`, `nearby.spec.js`.

### FRD-05 · Decline a request · Medium
1. B presses **Decline** on A's request → the row disappears; A's panel no longer shows "Request sent".
2. A can send again later (status `closed` then re-requestable) **(unverified)**.
**DB:** `friendships.status = closed`. **Pass:** neither is told why (no notification to A).

### FRD-06 · Remove one friend from the Friends list · High
1. **Friends → Remove friends** → tick one friend → **Remove** → the button changes to **Yes, remove 1 friend**; press **Cancel** first → nothing removed.
2. Press **Remove** then **Yes, remove 1 friend** → the friend leaves **Your friends** and the map at once; the house disappears. (The reader card on the map has no remove button.)
**DB:** `friendships.status = closed`, spots cleared. **Pass:** the friend is gone after reload; the chat history remains in `reader_messages` but the box is gone.

### FRD-07 · Remove several friends · Medium
1. **Friends → Remove friends** → rows become tickable.
2. Tick two friends, confirm → both removed together; the panel returns to normal.
3. Press **Remove friends** and cancel → nothing changes.
**DB:** two rows `closed`. **Pass:** only ticked friends are removed. **Reset the demo account.**

### FRD-08 · Find a friend on the map · Low
1. In **Your friends** press Emma's row → the camera flies to her on the map.
**DB:** none. **Pass:** camera arrives and she is visible (offline friends fly to their house).

### FRD-09 · Chat: open, send, history, limits · Critical
**Pre:** ACCT-DEMO; Emma.
1. **Chat with Emma** → the panel closes and a chat box opens: **Reader messages** with the history (Emma's "Hi Jordan! I saw you just finished Project Hail Mary…", Jordan's replies) and a **Your message** box; a note says only you two can read it 📸.
2. **SEND →** with nothing typed → nothing sent.
3. Type `Tell me when you finish it!`, **SEND →** → the message appears at the bottom with a time.
4. Type 1000 characters → sent; 1001 → refused (the API answers 400 `Message must contain 1–1000 characters`; whether the UI also stops typing is **unverified**). Send two messages within 1.5 seconds → the second is refused (API 429 `Please wait before sending another message`; a per-server-instance limit); wait and resend → accepted.
5. Reload, open the chat → the new message is still there.
**DB:** `reader_messages` row (sender = demo, receiver = Emma); `xp_events` `send_message` +5 (max 10 a day). **Pass:** history persists. **Existing coverage:** `friends.spec.js`, `reader-profile.spec.js`. **Reset the demo account.**

### FRD-10 · Chat boxes dock · Medium
1. Open chats with two friends → two boxes appear by the zoom buttons (one per friend).
2. Tap a box → its mini chat opens above; **Minimise chat** tucks it; **Close chat with <name>** removes the box.
3. Tap the other box → only one chat is open at a time.
**DB:** none. **Pass:** boxes behave as listed; no overlap with zoom buttons on a phone.

### FRD-11 · The bell: contents, count timing, Clear all, persistence · High
**Pre:** ACCT-DEMO just seeded.
1. After login the bell reads `0 new` then, after about 10 seconds, `3 new` (two visits and a request) 📸.
2. Open it → "Emma Tan visited your room …", "Noah Koh sent you a friend request …", "Ayaan Rahman visited your room …"; opening marks them read (count drops to 0).
3. Press **Clear all** → the list says "Nothing yet. Friend requests, friends coming online and visits to your room will show here."
4. Reload and use a second browser → still cleared.
**DB:** `profiles.notifications_read_at` and `notifications_cleared_at` set. **Pass:** state agrees on every device. **Existing coverage:** `notifications.spec.js`. **Reset the demo account.**

### FRD-12 · Online, away and dusty · Medium
1. Within 5 minutes of the seed → Emma/Ayaan: green dot, **Online now**.
2. After 6 minutes (no re-seed) → they show **Last seen N minutes ago** and the dot goes grey.
3. Mei (5 weeks) → **Last seen 5 weeks ago**; her house is dusty.
**DB:** `profiles.last_active_at`. **Pass:** thresholds as in C3.

### FRD-13 · Readers nearby and adding one · High
**Pre:** two public readers whose rough areas are in the same cell (ACCT-A, ACCT-B; or sample readers near SMU).
1. **Friends → Readers nearby** lists B ("Last seen around here"); never an exact location.
2. Tap B on the map (blue glow) or in the list → the same reader card with **Add friend** and **Visit <name>'s room**; pressing the room button opens their room directly, and **Back to town** brings you back to the same card.
3. Press **Add friend** → "Requested"; B accepts (FRD-04 steps 2 to 4).
4. Make B private → B vanishes from A's nearby list.
**DB:** `reader_areas` rows; `profiles.discoverable`. **Pass:** nearby respects privacy; the API never returns coordinates. **Existing coverage:** `nearby.spec.js`.

---

## CAF: Cafe

### CAF-01 · The cafe loads with readers · Critical
**Pre:** ACCT-DEMO. 1. Enter the cafe → "Loading readers…", then a scene **BREW & BOOKS** with up to 8 readers at tables, each with a name tag and a `N% match`; top-left `N readers in café`; weather top right; the hint "Click a reader to walk over"; your character by the WELCOME mat labelled **YOU** 📸.
**DB:** none. **Pass:** Emma shows 38% and Ayaan 38% for the demo account; matches are plausible integers. **Existing coverage:** `cafe-profile.spec.js`.

### CAF-02 · Clicking a reader walks you over and opens the profile · High
1. Click Emma Tan → your character walks across to her table; then a profile popup opens (a side panel on a laptop, a bottom sheet on a phone).
**DB:** none. **Pass:** the popup shows `Emma Tan`, `@emma.reads`, `MATCH 38%`.

### CAF-03 · Profile popup for a friend and a non-friend · High
1. Emma (friend): buttons **Visit Emma's room**, **Added as friend** (inactive), **Message**; sections **Currently Reading** (The Secret History), **Reading Prefs** (shared genres starred), **Books You Both Have** (The Hobbit, The Secret History, Fourth Wing).
2. Daniel Ong (not a friend): **Add friend** is active; the compatibility is 22%.
3. Press a shared book → it opens a card.
**DB:** none. **Pass:** friend/non-friend states are right.

### CAF-04 · Add a friend from the popup · High
**Pre:** ACCT-DEMO; Daniel not a friend. 1. Press **Add friend** → **Request sent** (a sample reader accepts at once, so it may read **Added as friend**). 2. Open **Friends** → Daniel under **Your friends** (sample readers) or no change (real readers until they accept).
**DB:** `friendships`. **Pass:** the button reflects the state. **Reset the demo account.**

### CAF-05 · Message from the popup · High
1. Press **Message** → the chat opens with the existing history; send a message → it appears.
**DB:** `reader_messages` row. **Pass:** same as FRD-09. **Reset the demo account.**

### CAF-06 · Visit room from the popup · High
1. Press **Visit Emma's room** → "Knocking on the door…", then `/people/emma.reads/room` with **Back to Emma's profile**.
**DB:** `xp_events` `visit_room` +15 (once a day per room). **Pass:** see VIS-01.

### CAF-07 · Closing the popup, keyboard and a narrow window · Medium
1. Press **Close reader profile (×)** or Esc → the popup closes; you stay in the cafe.
2. Resize to 700 px wide → the room becomes a clipped window you can drag, and it follows your character; the sprites do not squash.
3. Tab through the readers → each reader button is reachable (`Meet <name>` label) and Enter opens the popup.
**DB:** none. **Pass:** no overflow; focus order sensible.

### CAF-08 · Empty and failed cafe · Medium
1. Block `GET /api/people` → **Readers unavailable** with **Retry**; unblock and press **Retry** → readers load.
2. With no other readers → **No other readers available yet.**
3. Slow network → **Loading readers…** persists without a blank screen.
**DB:** none. **Pass:** each state shown. **Existing coverage:** `cafe-profile.spec.js` (partly).

---

## VIS: Visiting rooms and notes

### VIS-01 · Visit a friend's room (read-only) · Critical
**Pre:** ACCT-DEMO. 1. Tap Emma's house (or **Visit Emma's room**) → "Knocking on the door…", then her room in her own colours, with **Back to Emma's profile** and **Places** 📸.
2. Look around (drag, wheel, ←/→) → her furniture, cats, lamps, window weather are present.
3. Try to place or move anything → you cannot (no Shop/Inventory menu in visiting mode).
**DB:** `xp_events` `visit_room` (target = Emma's username) +15 once per day; the visit appears in Emma's bell. **Pass:** read-only. **Existing coverage:** `visit-room.spec.js`.

### VIS-02 · A friend's shelf is read-only · High
1. Tap her bookshelf → her shelf (`/people/emma.reads/room/shelf`): no search box, no status buttons; the books are theirs.
2. Open a book → a card with nothing to edit (no Start reading, no Remove).
**DB:** none. **Pass:** no write control anywhere. **Existing coverage:** `visit-room.spec.js`.

### VIS-03 · Lamps toggle only for your visit · Low
1. Tap a lamp in Emma's room → it switches; leave and return → back to the default (on).
2. Check Emma's own view (second account) → unaffected.
**DB:** none. **Pass:** visit-only.

### VIS-04 · Leave a note · High
1. Tap the corkboard → the notice board: **Quote of the Day** and the notes, including Jordan's earlier note.
2. Press **Leave a note** (bottom right) → a card "Say hello, recommend a book…" with **Post note** and **Cancel**.
3. Type `Great taste in books!`, **Post note** → the note appears on the board with your name and "just now".
**DB:** `room_notes` (owner = Emma, author = you, content); `xp_events` `leave_note` +10 once a day per room. **Pass:** note visible after a reload. **Reset the demo account.**

### VIS-05 · Note validation and cancel · Medium
1. **Post note** empty or spaces only → refused.
2. 140 characters → accepted; 141 → refused (counter or error).
3. **Cancel** after typing → nothing posted; reopening shows an empty box.
4. On **your own** corkboard there is no **Leave a note** (a note cannot be on your own board).
**DB:** `room_notes` content length 1 to 140; constraint `not_own_board`. **Pass:** exactly as listed.

### VIS-06 · Taking notes down · Medium
1. On Emma's board, your own note shows a remove control → remove it → it disappears.
2. Other people's notes on Emma's board show no remove control for you.
3. On **your** corkboard (My Room) you may remove any note left there.
**DB:** `room_notes` row deleted. **Pass:** permissions as listed. **Existing coverage:** `visit-room.spec.js`.

### VIS-07 · Visiting someone who doesn't exist or is private · High
1. Open `/people/nobody/room` → **We couldn't find that reader.** with **Find readers in the Cafe**.
2. Visit a **private** non-friend reader's profile by URL (get the username from the database) → not found or limited **(unverified)**; their coordinates/details are never shown.
3. Press **Find readers in the Cafe** → `/cafe`.
**DB:** none. **Pass:** a clean message, no crash, no data leak. **Existing coverage:** `visit-room.spec.js`.
