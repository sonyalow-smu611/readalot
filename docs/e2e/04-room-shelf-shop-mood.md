# E2E scenarios 04: My Room, bookshelf and My Shelf, mood check-in, Shop and Inventory

Suites: **ROOM** (8), **SHF** bookshelf and My Shelf (14), **MOOD** (7), **SHOP** (12) = 41. Format, accounts and rules: header of
[01-public-auth-onboarding.md](01-public-auth-onboarding.md) and C2/C3 of [../E2E_GUIDE.md](../E2E_GUIDE.md). Unless stated: Desktop,
signed in as **ACCT-DEMO** just seeded (Jordan: 620 XP level 4, 600 coins, 10 books, decorated room). **Reset after any scenario that
changes it:** `npm run seed:demo -w server`. Existing room helpers: `roomReady`, `goToPlace`, `fromMenu`, `openShop`, `buy`,
`pickFromInventory`, `screenOf`, `SPOTS` in `tests/e2e/fixtures.js`.

---

## ROOM: My Room

### ROOM-01 · Enter and look around · Critical
1. From the town tap **Your house** → **Go inside** → `/house`: one wide pixel-art room; 600 coins top right; **Back to town** top left; **Places** and the room menu button 📸.
2. Drag, swipe, scroll the wheel and press ←/→ → the room slides sideways: the bay-window nook, reading chair, bookshelf, clock, corkboard, bed (with starry bedding for Jordan).
3. A first-visit hint explains how to move (new readers).
**DB:** none. **Pass:** the room scrolls both ends; the cats wander (ginger and black). **Existing coverage:** `room.spec.js`.

### ROOM-02 · Places menu · High
1. Press **Places** → list "Places in the room": Window, Chair, Bookshelf, Clock, Corkboard, Bed.
2. Press each → the room slides to it and stops; Esc closes the list.
**DB:** none. **Pass:** each place centres its object. **Existing coverage:** `room.spec.js`.

### ROOM-03 · The window shows live weather · Medium
1. Go to **Window** → sun and birds, clouds, rain or the moon (by the real Singapore time/weather) with the temperature; the town across the street through the glass.
2. Open `/house?scene=rain`, then `sunny`, `cloudy` → each preview appears (the query param only affects the window).
**DB:** none. **Pass:** the three scenes render; the lamps light at night. **Existing coverage:** `room.spec.js`.

### ROOM-04 · The clock · Low
1. Go to **Clock** → its accessible name reads `Singapore time HH:MM`; the hands match Singapore time (UTC+8) within one minute.
**DB:** none. **Pass:** correct time (mock with `mockTime` for determinism).

### ROOM-05 · Lamps · Medium
1. Tap the floor lamp → it turns off (the room's light changes); tap again → on. Same for the table lamp.
2. At night (mock time/weather) the lamps light their corners.
**DB:** none (not saved). **Pass:** each lamp toggles independently; state resets on reload. **Existing coverage:** `room-themes.spec.js`.

### ROOM-06 · The armchair opens Currently Reading · Medium
1. Tap the open book on the chair → the **Currently Reading** card for the reader's current book (Jordan: Dune or The Secret History) with a link/button to its page.
2. For a reader with no Reading book → a sensible empty state **(unverified)**.
**DB:** none. **Pass:** the card matches the shelf.

### ROOM-07 · Corkboard and Quote of the Day · High
1. Tap the corkboard → the notice board: **Quote of the Day** on top (the same for everyone), then notes (Jordan: from Emma and Ayaan).
2. Mock `/api/quote/today` with `mockQuote` → the quote text appears.
3. Close it → the room is as before.
**DB:** none. **Pass:** quote present (or a built-in quote if no data); notes in newest-first order. **Existing coverage:** `room.spec.js`.

### ROOM-08 · Room menu and coin display · Medium
1. Press the **Room menu** (bottom right) → entries **Mood check-in**, **Shop**, **Inventory**.
2. The coin count at the top right equals the badge in the town and the Salon's **Coins** card.
3. Spend coins (SHOP-02) → the top-right count updates immediately.
**DB:** `profiles.coins`. **Pass:** one number everywhere.

---

## SHF: Bookshelf and My Shelf

### SHF-01 · The bookshelf has three labelled rows · High
1. In the room go to **Bookshelf** → three rows named on plates **To be read**, **Currently reading**, **Finished reading** with counts (Jordan: 5, 2, 3) via text like "To be read shelf, 5 books".
2. Each book is a button named `<title> by <author>`; hover/focus lifts it a little.
3. A row with more books than fit shows "+N more".
**DB:** none. **Pass:** books sit on the right row (status from `user_books`). **Existing coverage:** `bookshelf.spec.js`.

### SHF-02 · Opening a book from its spine · High
1. Press `Dune by Frank Herbert` → the book lifts out, flies up as its cover and swings open; then a **Book details** card shows (cover, title, author, synopsis).
2. Press anywhere during the flight → it jumps to open.
3. With reduced motion → the card shows at once.
4. Press **Close book** → the book flies back to its row.
**DB:** none. **Pass:** card always reaches the open state; closing returns the book. **Existing coverage:** `bookshelf.spec.js`.

### SHF-03 · Start reading a To-be-read book · Critical
**Pre:** ACCT-DEMO (Fourth Wing on To be read).
1. Open `Fourth Wing` → buttons **Start reading**, **Where to get**, **Remove from shelf**, **Leave/Read Reviews**.
2. Press **Start reading** → the book moves to **Currently reading**; a **progress slider** appears; the button becomes **Mark as finished**.
3. Close the card → the book is now on the middle row.
**DB:** `user_books.status = reading`, `progress = 0`; `xp_events` `start_book` +20 (target = book id); reading task ticks in Daily. **Pass:** XP 620 → 640; persists on reload. **Reset the demo account.**

### SHF-04 · Reading progress · High
1. Open `Dune` (45%) → the slider shows 45%; drag to 80% → the value shows 80%.
2. Close, reopen → 80%. Reload → 80%.
**DB:** `user_books.progress = 80`; `daily_state.done` includes `reading`. **Pass:** saves without a button; 0 and 100 are accepted, 101 is not possible.

### SHF-05 · Finish a book: XP, coins and level-up · Critical
**Pre:** ACCT-DEMO at 620 XP (level 4).
1. Open `Dune` → **Mark as finished**.
2. The book moves to **Finished reading** (4 books); the slider disappears; the card now offers **Leave/Read Reviews**.
3. Check XP/coins: **+100 XP** → 720 XP = **level 5**, +125 coins (600 → 725) 📸; the badge in the town shows 5 and `725`.
**DB:** `user_books.status = read`, `progress = 100`; `xp_events` `finish_book` +100; `profiles.coins = 725`. **Pass:** level 4 → 5 exactly here (no earlier crossing). **Reset the demo account.**

### SHF-06 · Remove from shelf, with Undo · High
1. Open `Circe` → **Remove from shelf** → a confirmation; confirm → the book leaves the shelf; a toast with **Undo** shows.
2. Press **Undo** within the toast time → the book returns to its row with its old status.
**DB:** `user_books` row deleted then re-created. **Pass:** the shelf counts return. **Reset the demo account.**

### SHF-07 · Remove without Undo persists · Medium
1. Remove `Gone Girl`, let the toast expire, reload → the book is gone; the shelf count is 4 To be read.
**DB:** row absent. **Pass:** removal persists.

### SHF-08 · My Shelf layout and view modes · Medium
1. Tap the bookshelf → `/house/shelf`: the three-shelf bookcase in My Room's colours, **Back to room**, **Spines / Covers**, **Search your books**, genre chips.
2. The switch opens on **Covers** (books cover-out); slide it to **Spines** → titles on spines, and back.
3. **Back to room** → `/house`.
**DB:** none. **Pass:** both modes render all books. **Existing coverage:** `my-shelf.spec.js`.

### SHF-09 · My Shelf search and genre chips · Medium
1. Type `dune` in **Search your books** → only Dune remains; clear → all.
2. Press a genre chip (e.g. Fantasy) → only that genre's books; press again to clear.
3. Search `zzzz` → an empty state ("No books yet" / no matches).
**DB:** none. **Pass:** filters combine (search + chip). **Existing coverage:** `my-shelf.spec.js`.

### SHF-10 · Drag a book to another shelf · Critical
1. Mouse: press on `Piranesi` (To be read) and pull it up/down out of its shelf → it is carried under the pointer; the shelf below lights up.
2. Let go over **Currently reading** → the book lands there; its status changes; counts update (4 To be read, 3 Currently reading).
3. Touch emulation: press and hold a book, then drag → the same result.
**DB:** `user_books.status = reading` (and `progress` unchanged or 0). **Pass:** the move persists after reload. **Existing coverage:** `my-shelf.spec.js`. **Reset the demo account.**

### SHF-11 · Cancel a drag · Medium
1. Pick up a book, press **Esc** → it returns to its own shelf.
2. Pick up a book and let go over empty space → it returns.
3. Hold a book near the top/bottom edge of the page → the page scrolls so a far shelf can be reached.
**DB:** none. **Pass:** status unchanged.

### SHF-12 · Long row navigation · Low
**Pre:** a reader with more than ~10 books on one shelf.
1. Press **Next / Previous** on the plank → the row scrolls; also swipe, Shift + wheel, scrollbar, arrow keys from book to book.
**DB:** none. **Pass:** every book reachable.

### SHF-13 · Empty shelf states · High
**Pre:** ACCT-NEW-TOURSEEN (no books).
1. Room: all rows empty; My Shelf: **No books yet** with **Discover books** and **Scan a cover**.
2. **Discover books** → `/library`; **Scan a cover** → the library with the scanner open.
**DB:** none. **Pass:** helpful empty state with working links. **Existing coverage:** `my-shelf.spec.js`.

### SHF-14 · The shelf persists across reload, devices and logout · High
1. Change the shelf (SHF-03/10), reload → same.
2. Log out and in, or open a second browser → same.
3. Check the Salon card (**Reading / To read / Finished**) → matches.
**DB:** `user_books` consistent. **Pass:** identical in every view.

---

## MOOD: Mood check-in and quotes

### MOOD-01 · The check-in opens by itself on the first visit of the day · High
**Pre:** a browser with empty `localStorage` for the site.
1. Open `/house` → a card **How are you feeling today?** with a step tracker (1 Check-in, 2 Result, 3 Saved), four moods and **Continue** (disabled) and **Skip for today** 📸.
2. Reload after answering or skipping → it does not open again that day in this browser.
**DB:** none (browser only). **Pass:** once per day per browser. **Existing coverage:** `mood-result.spec.js`.

### MOOD-02 · Pick a mood and get a recommendation · Critical
1. Press **Calm** → **Continue** is enabled; press it → **A book for your mood**: a book (cover/title/author) and a quote from it.
2. Repeat for **Low**, **Stressed**, **Excited** (on later reloads: open from the room menu → **Mood check-in**) → each returns a book and a quote.
**DB:** none until you save. **Pass:** a book and quote for every mood; if the quote service is down a stored line shows. Use `mockQuote` for determinism. **Existing coverage:** `mood-result.spec.js`.

### MOOD-03 · Save a quote · High
1. On a result press **Save quote** → the button changes to **Saved**.
2. Salon → Profile → **Saved quotes** lists it (text, author, work).
3. Reopen the same recommendation → the quote already shows **Saved**; saving again does not duplicate.
**DB:** `saved_mood_quotes` row (quote_text, author, work, book_id, mood); unique `(user_id, book_id, quote_text)`. **Pass:** one row. **Reset the demo account.**

### MOOD-04 · Add the recommended book to To Be Read · High
1. Press **Add to To Be Read** → "Adding…" then **Added to To Be Read**.
2. Bookshelf → the book is on **To be read**; Daily "Add a book" may tick.
**DB:** `user_books` `want_to_read`; `xp_events` `add_book` +10. **Pass:** no duplicate on a second press. **Reset the demo account.**

### MOOD-05 · Show another recommendation · Medium
1. Press **Show another recommendation** → a different book (never the same one immediately).
**DB:** none. **Pass:** different `workId` each time.

### MOOD-06 · Skip for today and closing · Medium
1. Press **Skip for today** → the card closes and stays away until tomorrow in this browser.
2. Open from the room menu → still available manually.
3. Close the result with the close control → the room is intact.
**DB:** none. **Pass:** manual access always works.

### MOOD-07 · Quote of the Day · Medium
1. Corkboard → **Quote of the Day** shows one quote; open it twice → the same quote.
2. The quote changes after midnight Singapore time (mock the date).
**DB:** none. **Pass:** stable all day; falls back to a built-in quote if the data is missing.

---

## SHOP: Shop, Inventory and decorating

### SHOP-01 · Browse the Shop · High
1. **Room menu → Shop** → the **Decoration shop** lists six groups: Wall art, Reading chairs, Plants, Cats, Curtains, Bedding (25 pieces), each with a name and `$price` (see C3 for the list) 📸; coins at the top right.
2. "Swipe the row. Each card says where that piece can sit." Each card has a one-line "where".
3. Close the shop (Close) → the room is unchanged.
**DB:** none. **Pass:** names and prices exactly as in C3 (Mountain poster $25 … Starry bedding $70). **Existing coverage:** `furniture.spec.js`.

### SHOP-02 · The full purchase journey (buy, inventory, place, replace, persist) · Critical
**Pre:** ACCT-DEMO (600 coins; Wingback chair placed; Rocking chair in the Inventory).
1. **Shop** → press **Papasan chair $160** → a card **"Buy Papasan chair?"** with "$160 comes out of your credits" and **Confirm** / **Cancel**.
2. Press **Confirm** → the shop confirms; the coin count drops **600 → 440** at once (badge, room, Salon agree).
3. **Room menu → Inventory** → the Papasan chair appears with "In the reading nook" alongside Moon poster, Rocking chair, Calico, Navy curtains, Tartan bedding.
4. Press the Papasan chair → "Tap a piece, then where it should go in the room. Or drag it there."; tap the reading nook → the Papasan replaces the Wingback chair in the nook; the Wingback moves into the Inventory 📸.
5. Press the **Rocking chair** in the Inventory and tap the nook → the Rocking chair replaces the Papasan; the Papasan returns to the Inventory.
6. Reload the page → the nook still shows the Rocking chair; the Inventory lists Wingback and Papasan; coins still 440.
7. Log out and in (and a second browser) → identical.
8. Visit as another reader (Emma, via a second account that is friends with Jordan) → the Rocking chair shows in Jordan's room.
**DB:** `profiles.coins = 440` (via `spend_coins`); `room_furniture.pieces` for Jordan: the Papasan uid with no `zone` (inventory) and the Rocking chair with `zone = "chair"`, `x`, `at`. **Pass:** coins, room, inventory and visitors' view all agree after each step and after reload. **Existing coverage:** `furniture.spec.js`, `room-furniture.spec.js`. **Reset the demo account.**

### SHOP-03 · Not enough coins · High
**Pre:** a reader with 10 coins (set `profiles.coins = 10` with the service role for a throw-away reader; **not** the demo account).
1. Shop → press **Papasan chair $160** → the buy card shows **"Not enough credits."** and **Confirm** is disabled.
2. Press **Cancel** → nothing bought; coins still 10.
**DB:** unchanged. **Pass:** coins never negative; no `room_furniture` change.

### SHOP-04 · Where each kind of piece can go · High
1. Hang a **Mountain poster**: pressing it then tapping the wall (or dragging) → it hangs at that point; tapping the **floor** with it → refused (a message says where it can sit).
2. Place a **Monstera** on the floor → stands on the floor; tapping the wall → refused.
3. Place a **Succulent trio** on the window seat, then side table, then nightstand → each accepted; on the floor → refused.
4. Place a **Black cat** on the floor → accepted.
**DB:** `room_furniture.pieces` each with `zone` `wall` / `room` / `seat|side-table|nightstand`. **Pass:** the card's "where" text is respected. **Existing coverage:** `furniture.spec.js`.

### SHOP-05 · Reading chair swap · High
1. With the Wingback in the nook, place the **Rocking chair** there → Rocking appears; Wingback goes to the Inventory.
2. Place the Wingback back → Rocking returns to the Inventory.
**DB:** exactly one piece with `zone = chair` at any time. **Pass:** never two chairs.

### SHOP-06 · Curtains and bedding swaps · High
1. Place **Navy curtains** → they replace the sage ones; sage goes to the Inventory.
2. Place **Tartan bedding** → it replaces the starry bedding.
3. Buy **Rose curtains $45** and place → replaces navy.
**DB:** one `curtains` and one `bed` piece. **Pass:** replaced pieces are in the Inventory. **Existing coverage:** `room-themes.spec.js`.

### SHOP-07 · Cats wander · Medium
1. Place the **Calico** on the floor → it wanders the floor and sometimes lies down; two or three cats coexist.
2. Drag the room → the cat does not slide with the camera incorrectly (stays on the floor).
**DB:** cat piece `zone = room`. **Pass:** cats stay within the floor line.

### SHOP-08 · Move a placed piece; return it to the Inventory · High
1. Tap a placed poster → a card with **Move left/up/down/right** (or arrow keys), **Done**, **Cancel**.
2. Press **Move right** three times, **Done** → the poster shifted; reload → saved.
3. **Cancel** after moving → returns to its previous spot.
4. Return a placed piece to the Inventory via its card (pick up) → it appears in the Inventory; the spot is empty.
**DB:** the piece's `at` updated or `zone` removed. **Pass:** the Inventory count changes accordingly. **Existing coverage:** `room-furniture.spec.js`.

### SHOP-09 · Persistence: reload, devices, visitors · Critical
1. After any change reload → identical; second browser → identical.
2. A friend visiting sees the current room, not a stale one; a **non-friend** public reader visiting by URL sees it too (rooms are readable by any signed-in reader).
3. Another account cannot change it: `PUT /api/rooms/<jordan>/furniture` with someone else's token → 403.
**DB:** `room_furniture.pieces`. **Pass:** all views agree; write attempts by non-owners fail. **Existing coverage:** `visit-room.spec.js`.

### SHOP-10 · Cancel a purchase and cancel placing · Medium
1. Open a buy card and press **Cancel** → no coins spent.
2. Start placing an inventory piece and press Esc or tap Cancel → the piece stays in the Inventory.
**DB:** unchanged. **Pass:** nothing charged or moved.

### SHOP-11 · Pieces never overlap · Medium
1. Hang two posters close together, the second overlapping the first → the second is refused or nudged to the nearest free spot; a gap is kept between pieces.
2. Fill the floor until no space remains → "no room" style refusal.
**DB:** every pair of placed pieces keeps the gap. **Pass:** no overlapping sprites. **Existing coverage:** `room-furniture.spec.js`.

### SHOP-12 · Coins are consistent everywhere · High
1. Note coins in the room, the badge, and the Salon **Coins** card → equal.
2. Buy (SHOP-02), claim a Daily reward (DLY-06), level up (SHF-05) → all three places update after each.
3. In the Salon press **Visit the shop** → `/house` (whether the Shop opens by itself is **unverified**).
**DB:** `profiles.coins`. **Pass:** one number; the Shop link works.
