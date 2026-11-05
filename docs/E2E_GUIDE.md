# IKDA: complete user guide and end-to-end testing scenarios

This is the master document for the end-to-end (E2E) verification phase. It has three parts:

| Part | What it is | Where |
|---|---|---|
| **A** | A complete user guide: every page, feature and flow, what it does, when to use it and how the features connect | this file, [Part A](#part-a-complete-application-user-guide) |
| **B** | The E2E scenarios, organised by feature and by journey, each with an ID, steps, expected results, database changes and a priority | [docs/e2e/](e2e/) (7 files, indexed in [Part B](#part-b-e2e-scenario-index)) |
| **C** | Reference: test data, rules and numbers, UI label glossary, database map, how to run things, known bugs | this file, [Part C](#part-c-reference) |

> **Status: professor-pass updated.** Core public journeys and the walkthrough were re-run manually from
> README instructions in a live browser. Where behaviour still depends on seeded data, this guide now
> calls that out explicitly.

**How to use it (for the agent that will execute it).** Read Part C first (data, accounts, tools).
Then run the scenario files in order. Each scenario is self-contained: it names its preconditions,
gives numbered steps with the expected result after each, lists the database rows to check, and ends
with pass criteria. Record a screenshot at every step marked 📸 and at every failure.

---

## Contents

- [Part A: complete application user guide](#part-a-complete-application-user-guide)
- [Part B: E2E scenario index](#part-b-e2e-scenario-index)
- [Part C: reference](#part-c-reference)
  - [C1. How to run things](#c1-how-to-run-things)
  - [C2. Test accounts and data](#c2-test-accounts-and-data)
  - [C3. Rules and numbers](#c3-rules-and-numbers)
  - [C4. UI label glossary](#c4-ui-label-glossary)
  - [C5. Database and API map](#c5-database-and-api-map)
  - [C6. Existing automated tests](#c6-existing-automated-tests)
  - [C7. Known bugs, gaps and unverified areas](#c7-known-bugs-gaps-and-unverified-areas)
  - [C8. Coverage matrix](#c8-coverage-matrix)

---

# Part A: complete application user guide

## A1. What IKDA is

IKDA (읽다, Korean for "to read") is a mobile-first social reading web app. After signing in the reader
stands in a pixel-art **town**. Each building is one part of the app:

| Building | Route | Section | What the reader does there |
|---|---|---|---|
| **Your house** | `/house` | My Room | Their own room: bookshelf, reading progress, mood check-in, Shop, Inventory, decorations |
| **Library** | `/library` | Discover | Genre bookcases, bestsellers, search, book scanner, book cards, reviews |
| **Cafe** | `/cafe` | Social | Meet readers, see match scores, view profiles, add friends, message |
| **Hair Salon** | `/salon` | Profile | Restyle the character, edit the profile, level, coins, privacy, saved quotes, log out |

Around the buildings are friends' houses, other readers walking about, and the HUD (the buttons on
the map): weather, Daily tasks, the bell, Places, Friends, the public/private chip and the player badge.

**Two currencies of progress.** *XP* raises the reader's level. *Coins* are spent in the Shop. New
levels pay coins. See [C3](#c3-rules-and-numbers).

**Where the data lives.** Sign-in and the reader's profile are in Supabase from the browser. Everything
else goes through the Express API (`/api/*`), which uses Supabase with the service-role key. See
[C5](#c5-database-and-api-map).

## A2. Page and route inventory

Every route in `client/src/router/index.js`. "Guest" pages are for signed-out readers only.

| Route | Name | Page | Who | Notes |
|---|---|---|---|---|
| `/start` | start | Landing page | Guest | First screen for a new visitor |
| `/login` | login | Log in | Guest | Email, password, then the 6-digit code |
| `/register` | register | Register ("Create your card") | Guest | Email, username, password, confirm |
| `/verify` | verify | Check your email | Guest | Six digit boxes. Redirects to `/login` if there is no pending sign-in |
| `/welcome` | welcome | Welcome set-up (6 steps) | Signed in, profile incomplete | A signed-in reader with no finished profile is sent here from every other page |
| `/` | town | The town | Signed in | The home page. Starts the walkthrough for a new reader |
| `/house` | house | My Room | Signed in | |
| `/house/shelf` | my-shelf | My Shelf | Signed in | Reached by tapping the bookshelf |
| `/library` | library | Library hall | Signed in | `?scan=1` opens the scanner; `?scene=sunny\|cloudy\|rain` previews weather |
| `/search` | search | Library catalogue (search results) | Signed in | `?q=...`; the query lives in the URL |
| `/discover/:genre` | genre-shelf | Full genre shelf (about 24 books, sort chips) | Signed in | Old page; reachable by URL |
| `/cafe` | cafe | Cafe | Signed in | |
| `/salon` | salon | Hair Salon | Signed in | Two tabs: Style studio and Profile |
| `/books/:id` | book-details | Full book page | Signed in | Reached from a book card's "Open full book page" |
| `/people/:id` | reader-room | A reader's profile page | Signed in | `:id` is a username (or account id) |
| `/people/:id/room` | reader-house | Visiting a reader's room | Signed in | Read-only, in the reader's own colours |
| `/people/:id/room/shelf` | reader-house-shelf | A visited reader's shelf | Signed in | Read-only |
| `/people/:id/shelf` | reader-shelf | Placeholder ("Reader bookshelf (T25): placeholder") | Signed in | Unfinished page |
| `/mood` | mood | Old mood page ("Mood matching is getting dressed up") | Signed in | Placeholder; the real check-in is a modal in My Room |
| `/playground` | playground | Component gallery | Signed in | Developer-only: mock books, toast, bottom sheet |
| `/room`, `/discover`, `/people`, `/profile`, `/scan` | redirects | To `/house`, `/library`, `/cafe`, `/salon`, `/library?scan=1` | Signed in | Old addresses |
| anything else | | Redirects to `/` | | Then the guard decides |

**Route guard (every navigation).**
1. A signed-in reader opening a Guest page (`/start`, `/login`, `/register`, `/verify`) is sent to `/`
   (profile complete) or `/welcome` (not complete).
2. A signed-out reader opening any other page is sent to `/start` the first time, and to `/login` once the
   landing page has been seen (`localStorage`, set by pressing Sign up or Log in on the landing page).
3. A signed-in reader with a complete profile opening `/welcome` is sent to `/`.
4. A signed-in reader with an incomplete profile opening any page except `/welcome` is sent to `/welcome`.

## A3. The complete reader journey

This is the spine that the connecting journeys in Part B (suite JRN) follow.

1. **Discover the app.** Open the site signed out. The landing page explains IKDA (Part A4).
2. **Create a card.** Register with an email, a username and a password (A5). A demo-domain email
   (`@demo.ikda.app`) needs no inbox and uses the code `111111`; any other email gets a real emailed code.
3. **Confirm the code.** Enter the 6 digits on "Check your email". A new reader is taken to Welcome.
4. **Welcome.** Six steps: name, gender, age, religion, genres, character (A6). The profile is saved.
5. **Walkthrough.** The reader's own character floats round the app for 33 numbered stops and shows every part
   of it, ending with a friend request to Pip and a first message (A7). It can be skipped.
6. **Use the town.** Daily tasks, friends, notifications, weather, privacy (A8).
7. **Build the shelf.** Search or browse the Library, add a book to "To be read" (A12).
8. **Read.** In My Room, start a book, move the progress slider, finish it, review it (A9, A13).
9. **Look after the mood.** The daily mood check-in recommends a book and a quote (A10).
10. **Decorate.** Buy furniture in the Shop, place it from the Inventory (A11).
11. **Meet people.** The Cafe shows readers with match scores; add friends, message, visit rooms (A14, A15).
12. **Level up.** XP and coins accumulate; levels pay coins (A16).
13. **Restyle and manage the profile.** The Salon (A17).
14. **Log out and back in.** Everything persists (A18).

## A4. Landing page (`/start`)

**Purpose:** explain the app and get the visitor to register. **Find it:** open the site signed out.

- **Bar** (stays on top while scrolling): `IKDA` (back to the top), `Meet Maya`, `The town`,
  `Your character`, `Levels`, `How it works`, `FAQ`, `Sign up`. The link for the section in view is marked
  and the highlight slides to it.
- **Hero:** the town map drifting, the IKDA sign with 읽다, "Social media, but for book lovers.", a **Sign up**
  button, a **See how it works** button (scrolls to the steps) and a small **Log in** link.
- **Sections in order:** *Meet Maya* (the persona and five steps of her evening), *The town* (four building
  tabs, each with an animated scene; arrow keys, Home and End move between tabs), *Your character* (a
  mini character studio with tabs Looks, Hair, Skin, Outfit, a **Surprise me** button and a "Your name in
  town" box; the result reappears on the Levels badge and at the door of the last screen), *Levels* (tap
  actions to add XP: Add a book, Start reading, Visit a room, Leave a note, Send a message, Finish a book;
  **Start over** resets), *How it works* (three steps), *FAQ* (six questions that open and close), and the
  last screen (night, the reader's house, **Sign up** again).
- **Visual behaviour:** the sky changes from evening to deep night as the page scrolls (sun sets, stars,
  moon, houses light up one by one); the mouse moves layers at different depths; words fade in.
- **Leaving:** Sign up or Log in marks the landing page as seen, so later visits go to `/login`.

## A5. Register, log in and the code

**Register (`/register`).** Heading **Create your card**. Fields: **Email**, **Username** (3 to 20
lowercase letters, numbers, dots, underscores; spaces turn into dots; other readers see it), **Password**,
**Confirm password** (6 or more characters), an eye button (**Show password** / **Hide password**), and a
**Register** button. Link: **Already have a card? Log in**. Pixel cats and books beside the form follow
the pointer and the active field, cover their eyes while the password shows, duck on an error and hop
when a code is accepted; floating books are pushed by the cursor.
- *Checks, in order:* the two passwords must match (`Those passwords do not match.`), the password needs
  6+ characters (`Use at least 6 characters.`), the username must fit the pattern (`Usernames are 3 to 20
  lowercase letters, numbers, dots or underscores.`) and be free (`That username is taken. Try another.`).
- *Then:* a normal email goes to Supabase `signUp` (a real emailed code); a `@demo.ikda.app` email goes to
  `POST /api/demo-auth/register`, which creates a confirmed account. An address already registered shows
  `That email is already registered. Log in instead.`

**Log in (`/login`).** Heading **Welcome back**. **Email**, **Password** (+ eye), a **Remember me for 30 days**
checkbox (ticked at the start; its tick draws itself), **Log in**, link
**Need a card? Register**. The password is checked first (a wrong one shows Supabase's error and stays on
the page); then a code is emailed (or, for demo addresses, none is sent).

**Check your email (`/verify`).** Six digit boxes (typing moves on, Backspace goes back, a pasted code
fills all six), **Confirm code**, and a **Resend** button (the same width and padding as Confirm code, a gap
below it) that starts as `Resend in 30s`, counts down, then becomes **Resend code**. A demo address shows **"Demo account: no email is sent. Enter the code 111111."**
A wrong code shows an error and the cats duck (demo: `That code is not right. The demo code is 111111.`).
With **Remember me for 30 days** ticked the reader stays signed in for 30 days on that browser (the session is kept
in `localStorage` with its end date, `readalot-remember`); unticked, the session lasts until the browser is closed
(`sessionStorage`). Readers who signed in before this existed stay signed in as before. A device that has accepted a
code with the box ticked is remembered for 30 days (`localStorage` key `readalot-trusted`): logging out and back
in there needs the password only, with no emailed code. Unticking the box at a log in asks for the code again and
forgets the device.
A correct code shows **Code accepted**, the cats hop, then a returning reader zooms into the town and a
new reader goes to Welcome. A reload on the code screen of a demo address asks to log in again
(`Go back and log in again, then enter the code.`).

**Demo account.** `demo@demo.ikda.app` / `Ikda-Demo-2026` / `111111` (Jordan Lee). Details: [docs/DEMO.md](DEMO.md).

## A6. Welcome (`/welcome`)

Six steps with a progress line ("1 of 6"), **Back** and **Next** (the last is **Finish**, then "Saving…"):

| Step | Title | Rule / error text |
|---|---|---|
| 1 | Your name | Required: `Add your name to continue.` Up to 40 characters |
| 2 | Gender | Choose one (Woman, Man, Non-binary, Prefer not to say): `Choose one to continue.` |
| 3 | Age | A whole number from 13 to 120: `Enter an age from 13 to 120.` |
| 4 | Religion | Choose one (Christianity, Islam, Buddhism, Hinduism, Sikhism, Judaism, None, Prefer not to say): `Choose one, including prefer not to say.` |
| 5 | Genres you like | At least one: `Pick at least one genre.` |
| 6 | Pick your character | Five presets drawn as pixel sprites; the big character hops when the choice changes |

Finishing saves `profiles` (name, avatar, favourite genres, character) and `profile_private` (gender, age,
religion), then zooms into the town where the walkthrough starts. If the saved profile can't be loaded
the page offers **Try again**. A reader under 18 is always private (a database trigger); the minimum
age is 13.

## A7. The walkthrough (33 numbered stops)

**What it is.** After Welcome, the reader's own character floats over the app in a speech bubble and
shows every part in order. It plays once (`profiles.tour_seen_at`), can be skipped, and can be replayed
from the Salon.

**Observed in the professor pass (live app, Nov 2026).**

- The counter now reads `N of 33 · <Section>`.
- The flow includes **ask** steps with **Skip this step** (instead of forcing one action path).
- Buttons are: **Back** (from step 2), **Next**, **Skip this step** (only on ask steps), **Skip this part**,
  **Skip tour**. The last stop has **Done**.
- Some numbered stops contain more than one short card, so message cards can advance while the counter
  stays on the same `N of 33` value.

**Section map (current build):**

| Counter range | Section | Key outcomes |
|---|---|---|
| 1–5 | Town | HUD tour, weather ask, intro movement, then enter your house |
| 6–10 | Your house | Room tour, bookshelf/menu asks, then enter Library |
| 11–21 | Library / Your shelf | Search for a book, add to shelf, move a shelf item, then enter Cafe |
| 22–29 | Cafe | Meet Pip, add/message/visit flow, return to town |
| 30–34 | Salon | Style tab, Profile tab, profile cards, finish with **Done** |

**Pip** (`pip.ikda`, "Pip the Librarian") is the neighbour every reader can befriend. Pip is always
online, accepts a friend request straight away, pins a welcome note on a new friend's corkboard
("Welcome to town, neighbour! Pop by the library any time. — Pip") and, once `database/neighbour.sql` is
applied, answers every message with a short line (a database trigger, `pip_replies`). Sections of the
walkthrough change real data: the friend request, the message and the visit are real and award XP.

**Finishing or skipping** (`closeGuide`) saves `profiles.tour_seen_at`, so it doesn't start again on any
device. **Replay the walkthrough** (Salon, Profile tab) restarts at step 1.

## A8. The town (`/`)

**Purpose:** the home page and the map between the buildings. **Map controls:** drag to pan, pinch or
wheel to zoom, buttons **Zoom in**, **Zoom out**, **Follow my character**; tap the ground and the
reader's character walks there (it stops at water and buildings); tap a building and a **place card**
slides up (the building's sign, a blurb, an enter button: *Go inside*, *Enter the library*, *Enter the
cafe*, *Enter the salon*, and a **Close**); entering walks the character to the door, the door opens and
the reader goes in. Coming back out puts the character at that door (until a page refresh).
Animated: water, fish, campfire, cars, townsfolk (tap one and they jiggle), signs, night lamps, rain.
The reader's character has a glow and a green diamond.

**HUD buttons.**
- **Weather chip** (top left): `Weather: <sky> · <temp>°, live. Change the sky`. Each tap steps through
  previews (day, night, rain, rainy night, then live again).
- **Daily** (flame, left): opens the Daily panel (A8a). The panel opens by itself the first time each day.
- **Bell** (`Notifications, N new`, with a red badge while something is unread): friend requests (waiting, sent by you, accepted), messages you sent or received, friends coming online, visits to your room; **Clear all**. A new one (not something you did yourself) slides in from the right for about 5 seconds and fades away; press it, or open the bell and press a notification, to go to it (friends list, chat, the friend on the map, or the visitor's profile).
- **Places** (`Places in town`): jumps to a building.
- **Friends** (`Friends, N online, M friend requests`): the friends panel (A14).
- **Public / private chip** (under Daily): the same setting as the Salon's switch (A17).
- **Player badge** (bottom left): the face in an XP ring, the level on a gold tab, name and coins; pressing it opens the Salon.
- **Chat boxes** (by the zoom buttons): one per friend you have chatted with; tap to open or tuck away.
- **Location prompt** ("Find readers near you?", **Go public** / **Stay private**): asked once, after the
  walkthrough, for a reader who is not under 18 and has not been asked.

**Friends in town.** Friends' houses stand on plots (seven at most), with a name tag and a green dot when
online; a friend away a long time has a dusty house. Online friends walk the streets with an orange
glow, readers nearby (if you are public) with a blue glow; tapping one opens the Cafe's reader card (**Meet <name>**).

### A8a. Daily tasks

Three tasks a day (the same for everyone; new at midnight Singapore time): **Check in at town** (ticked
when the town opens), **Update your reading progress** (move a progress slider, start or finish a book),
and a third that rotates: *Visit a friend's room*, *Say hi to a reader*, *Add a book to your shelf*, or
*Leave a note for a friend* (friend tasks are skipped for a reader with no friends). Each row has a tick box
and a **Go** button that takes the reader to the right building. When all three are ticked the button
says **Claim N coins**; before that `Finish N more to claim`; after, `Claimed. New tasks tomorrow`.
Claiming shows a chest animation with the streak day and the reward and adds coins and XP. The week strip
shows seven reward tiles (day 7 is a chest and refills a streak freeze). Two **streak freezes** protect a
missed day; with none left a missed day resets the streak ("Your N-day streak ended" notice, dismissed
with ×). State is saved in `daily_state`, so it is the same on every device. (Development builds also show
**Preview** buttons: Next day, Skip a day, Reset. They are hidden in production.)

## A9. My Room (`/house`) and My Shelf (`/house/shelf`)

**Purpose:** the reader's own room and bookshelf. **Find it:** the blue house, or Places, or the badge
route. **The room** is one wide pixel-art picture the reader moves along sideways (drag, swipe, wheel,
arrow keys) or jumps along with **Places** (Window, Chair, Bookshelf, Clock, Corkboard, Bed).
- **Window:** live Singapore weather (sun and birds, clouds, rain, or moon at night) and the temperature;
  `?scene=sunny|cloudy|rain` previews one.
- **Clock:** Singapore time. **Lamps:** tap a lamp to turn it off or on (the floor and table lamps).
- **Chair:** the armchair with the current book opens the **Currently Reading** card.
- **Corkboard:** the **Quote of the Day** and the notes friends pinned.
- **Bookshelf:** three rows named on plates (**To be read**, **Currently reading**, **Finished reading**)
  with every book as a labelled spine (`<title> by <author>`). Tapping a spine lifts the book out, flies it
  up and opens it as a card; a tap skips the animation (reduced motion skips it). Tapping the shelf itself
  opens **My Shelf**.
- **Book card** (a book of your own): cover, title, author, rating, synopsis, the next-step button
  (**Start reading** on a To-be-read book, **Mark as finished** on a Reading book, nothing on a Finished
  one), a **progress slider** while reading, **Where to get** while still to be read, **Remove from shelf**
  (asks first, then an **Undo** toast), **Leave/Read Reviews** (with the rating and review form, A13),
  **Open full book page**, and **Close book** (the book flies back).
- **Room menu** (the button at the bottom right): **Mood check-in**, **Shop**, **Inventory** (A10, A11).
- **Coins** show at the top right.

**My Shelf:** a bookcase with exactly three shelves (the statuses), a search box (**Search your books**),
genre chips, the **Spines / Covers** sliding switch (opens on Covers; press **Spines** to show spines, then a press anywhere on the switch goes back to Covers), **Back to room**. A book can be dragged (mouse: pull it up or down;
touch: press and hold) to another shelf, which changes its status; **Esc** or letting go elsewhere puts it
back; holding near the top or bottom edge scrolls the page. Long rows have **Previous / Next**, swipe,
shift-wheel and arrow keys. Empty shelf: **No books yet** with **Discover books** and **Scan a cover**.

## A10. Mood check-in and Quote of the Day

**Mood check-in** opens by itself on the first visit to My Room each day in a browser (remembered in
`localStorage`), and from the room menu. Steps tracker: 1 Check-in, 2 Result, 3 Saved. Pick **Calm**
(Settled, unhurried), **Low** (Could use a lift), **Stressed** (A lot on my mind) or **Excited** (Full of
energy), press **Continue** (disabled until one is chosen), or **Skip for today**. The result card
**A book for your mood** shows a book with a quote from it (Wikiquote, then api-ninjas, then a stored line)
and the buttons **Save quote** (becomes **Unsave**; stored in `saved_mood_quotes`, shown in the Salon),
**Add to To Be Read** (becomes **Added to To Be Read** with **Undo**), **Show another recommendation** (a different book),
open the book's page, and close.
**Quote of the Day** (the corkboard) shows one quote, the same for everyone all day, changing at midnight Singapore time.

## A11. Shop, Inventory and decorating

Open the **Room menu → Shop**. **Decoration shop** lists 25 pieces in six groups with prices (C3). Pressing a
piece asks **"Buy <name>?"** with the price ("comes out of your credits") and **Confirm** / **Cancel**;
**Confirm** is disabled with **"Not enough credits."** when the coins don't cover it. A bought piece goes to
the **Inventory** (Room menu → Inventory). Pressing an inventory piece starts placing: "Tap a piece, then
where it should go in the room. Or drag it there." Where a piece can go depends on its kind: wall art on the
wall, floor pieces (plants, cats) on the floor, a succulent trio on a small surface (window seat, side table,
nightstand), a reading chair in the nook (replaces the armchair, one at a time), curtains at the window and
bedding on the bed (one set at a time; the one replaced returns to the Inventory). Pieces keep a gap between
them. Placed pieces can be moved (tap one: arrow buttons or arrow keys, **Done**, **Cancel**) and returned to the
Inventory. Cats wander the floor. The room is saved to `room_furniture` after every change, and friends see it.

## A12. Library (`/library`, `/search`)

**Purpose:** find books. **The hall** is a pixel library the reader slides along (drag, swipe, wheel, arrow
keys). Lit by the live weather (rain on the windows), lamps that toggle on tap. Parts: the **help desk**
("Search for any book here"), the **scanner**, the **reading nook**, and one **bookcase per genre**, each
with its own sign, colours and wall: **Bestsellers** (this week's list, credited under the sign), Romance,
Romantasy, Fantasy, Mystery & Thriller, Horror, Sci-Fi, Historical Fiction, Young Adult, Memoir, Graphic
Novels. The **Places** menu (bottom right, "Places in the library") has two groups: *Around the library* and *Shelves*.
- **Opening a bookcase** shows its books; the **Spines / Covers** sliding switch (opens on Covers) changes the look; a book slides out on hover.
- **Book card** (a found book): cover, title, author, rating, synopsis, **Add to To be read** (becomes a shelf
  label; after adding, **See it in my room** (a button, with **Undo** beside it for a book just added)), **Where to get** (shops, downloads, borrowing), **Leave/Read Reviews**,
  **Open full book page**.
- **Help desk / search** (`/search?q=`): a search bar (**Search books or authors**); results stand in a bookcase;
  Back steps through earlier searches; the query survives a reload; no results shows a clean empty
  state; a failed lookup shows **Search is offline** with **Try again**.
- **Scanner** (a camera view with **Snap cover**, **Or upload a photo of the cover**, **Search by title**, a close
  button): the cover is read (Google Vision) and the book opened; with no camera or key it falls back.

## A13. Books, reviews and ratings

A book's card or full page (`/books/:id`) shows details and reviews. **Leave/Read Reviews (N)** expands the
list and, for the signed-in reader, **Rate this book** (five stars: ★ 1 star … ★ 5 stars), **Your review
(optional)** (up to 500 characters, with a counter) and **Post Review**. After saving: the reader's review
with **Edit your review** and **Delete your review**, and the average ("4.7 ★ from 3 readers"). A review is
one per reader per book (`reviews`). Writing one earns 40 XP (once per book).

## A14. Friends, chat and notifications

**Friends panel** (HUD **Friends**): **Add friend** (a **Friend's username** box and **Send request**),
**Remove friends** (rows become tickable), **Friend requests** (each with **Accept** / **Decline**, or "No
requests right now."), **Your friends** (each shows the book being read, **Online now** or **Last seen …**,
and a **Chat with …** button; pressing the row finds them on the map), **Readers nearby** (public readers
close to your last rough area; pressing opens a card). Adding a sample reader (Pip, the demo readers) is
accepted straight away. Errors: `Couldn't find <name>. Check the spelling.`, already friends, etc.
**Reader card** (tap anyone walking on the map, a friend or a reader nearby): the same card as tapping a reader in the Cafe (**Meet <name>**): who they are, **Visit <name>'s room** (**Back to town** returns to the same card), **Add friend** / **Added as friend**, **Message**, what they are reading and your shared books and genres. Friends are removed from the Friends list (**Remove friends**).
**Chat** (a **Reader messages** box): the conversation, a **Your message** box, **SEND →**, **Minimise chat**,
**Close chat with <name>**; 1 to 1000 characters; one message per 1.5 seconds per reader; private to the two readers. Sending can earn 5 XP.
**Bell:** entries such as "Emma Tan visited your room 46 minutes ago", "Noah Koh sent you a friend request",
"<friend> is online", "You sent <name> a friend request", "<name> accepted your friend request", "You sent <name> a message"
(or "<name> sent you a message"). The Friends panel also lists **Waiting for an answer** for requests you sent.
Removing a friend takes them off the map and out of the list straight away. The count is stored (`notifications_read_at`, `notifications_cleared_at`) so devices agree.

## A15. Cafe, profiles and visiting rooms

**Cafe** (`/cafe`): **BREW & BOOKS**, readers sitting at tables (up to 8), a name tag and a **N% match**
score each (60% shared books, 40% shared genres), **N readers in café**, the weather, and "Click a reader
to walk over". Clicking a reader walks the reader's character over and opens a **profile popup**: avatar,
name, `@username`, area, **MATCH**, **Visit <name>'s room**, the friend button (**Add friend** → **Request
sent** / **Added as friend**), **Message**, **Currently Reading**, **Reading Prefs** (shared genres starred),
**Books You Both Have**, and **Close reader profile (×)**.
**Visiting a room** (`/people/:id/room`): **Knocking on the door…**, then the reader's room, read-only, in their
colours, with **Back to <name>'s profile**. The bookshelf opens their shelf (no search, no status
buttons) and every book on it, with its cover and synopsis, as the reader sees their own shelf; a book opens the
same card as in the library (**Add to To be read** / **Undo**, **Where to get**, **Leave/Read Reviews**, **Open full
book page**), where the shelf it shows is yours; the corkboard shows their notes; **Leave a note**
opens "Say hello, recommend a book…" with **Post note** / **Cancel** (up to 140 characters; you can take down
your own notes); lamps toggle for your visit only. Visiting earns 15 XP once a day per room; a note 10 XP.
An unknown reader shows **We couldn't find that reader.** with **Find readers in the Cafe**.

## A16. XP, coins and levels

XP comes from actions (C3). The level is shown on the badge and in the Salon's **Reader level** card ("N XP
to level L+1, which gives X coins"). Coins start at 480; each new level pays 25 × the level; the Daily
reward pays coins and XP; the Shop spends coins. Both numbers are stored on the server (`xp_events`,
`profiles.coins`) and are the same on every device.

## A17. Hair Salon (`/salon`)

**Entry:** pixel clouds part to show the salon (a mirror ringed with bulbs, a counter, a barber chair, the
reader alive beside it, the reflection in the mirror). **Two tabs: Style studio and Profile.**
- **Style studio:** **Looks** (five presets), **Surprise me**, tabs **Hair, Skin, Outfit, Extras** with a tile per
  part wearing it and colour swatches; priced parts are shown as locked ("Locked ones open up with coins
  soon"); parts that clash say why. A save bar **New look ready** appears with **Save look** (confetti, the
  character hops, "saved" status) and **Reset**. Leaving with an unsaved look asks **"Save your new look?"**
  (**Save look and leave**, **Stay**, **Discard and leave**).
- **Profile:** the reader card (name, email, counts **Reading / To read / Finished**, **Edit**), **Reader level**
  (+ **How to earn XP**), **Favourite genres** (chips), **Coins** (+ **Visit the shop**), **About you** (pencil per
  field), **Privacy** (**Public profile and location** switch with a cheer or mask pop-up), **Saved quotes**,
  **Replay the walkthrough**, **Log out**.
- **Edit profile:** Name, Gender, Age, Religion, Location (optional), Favourite genres, **Change look**,
  **Save**, **Cancel**. Errors: `Add your name.`, `Choose one, including prefer not to say.`, `Enter an age from 13
  to 120.`, `Pick at least one genre.`
- **Log out:** a dialog **"Close this book?"** with **Stay** and **Log out**.
- **Privacy rules:** public readers are listed in the Cafe and "Readers nearby" and share a rough area
  (a 1 km cell, never the exact position); under-18s are always private; the town chip and this switch are
  the same setting (`profiles.discoverable`).

## A18. Sessions, persistence and permissions

- A session survives a reload (Supabase `getSession`); the guard waits for it before deciding.
- **Log out** ends the session; the browser Back button must not re-enter the town.
- Shelf, reviews, XP, coins, furniture, friends, messages, notes, daily state, tour-seen flag and profile
  are all server-side, so they persist across reloads and devices. Browser-only: the landing-seen flag, the
  daily mood check-in and the last place left.
- Each reader changes only their own data; other readers' rooms are read-only; the server checks the
  access token on every call.

---

# Part B: E2E scenario index

All scenarios are in `docs/e2e/`. **Scenario IDs** are `<SUITE>-<NN>`. **Priority:** Critical (the app is unusable or data is
lost/leaked without it), High (a core feature), Medium (a supporting behaviour), Low (polish, rare cases).

| File | Suites | Scenarios |
|---|---|---|
| [01-public-auth-onboarding.md](e2e/01-public-auth-onboarding.md) | LND Landing, AUTH Register/login/code/logout/guards, WEL Welcome | 33 |
| [02-walkthrough.md](e2e/02-walkthrough.md) | TOUR The walkthrough (33 numbered stops) | 14 |
| [03-town-social.md](e2e/03-town-social.md) | TWN Town and HUD, DLY Daily tasks, FRD Friends and chat, CAF Cafe, VIS Visiting rooms and notes | 51 |
| [04-room-shelf-shop-mood.md](e2e/04-room-shelf-shop-mood.md) | ROOM My Room, SHF Bookshelf and My Shelf, MOOD Mood and quotes, SHOP Shop and Inventory | 41 |
| [05-library-books.md](e2e/05-library-books.md) | LIB Library, BOOK Book cards, pages and reviews | 25 |
| [06-salon-progress-journeys.md](e2e/06-salon-progress-journeys.md) | SAL Salon, PRG XP/coins/levels, JRN connecting journeys | 29 |
| [07-security-resilience.md](e2e/07-security-resilience.md) | SEC Permissions and data safety, ERR Errors, empty and loading states, RSP Responsive and accessibility | 22 |
| | **Total** | **215** |

**Order of execution.** Run 01 first (it creates accounts), then 02, then the rest in any order; 06 (JRN) and
07 last. Scenarios that change the demo account say **Reset: `pnpm --filter readalot-server seed:demo`** and must be followed by it.

---

# Part C: reference

## C1. How to run things

| What | How |
|---|---|
| **Live site** | https://ikda-rust.vercel.app (client and API on one Vercel project, `legally1/ikda`) |
| **Local app** | `pnpm install`, `cp .env.example .env` (Supabase keys needed), `pnpm dev:server` (API on :3000), `pnpm dev:client` (http://localhost:5173) |
| **Existing automated tests** | `pnpm test:e2e` (Playwright; it starts its own servers on 3100, 3101 and 5174; if a port is busy, find the process first and don't kill what you don't recognise) |
| **One file / one test** | `pnpm exec playwright test tests/e2e/room.spec.js`, `pnpm exec playwright test -g "lamp"`, `--headed`, `--ui`, `--debug` |
| **Server checks** | `pnpm --filter readalot-server check` (also `node server/tests/*.check.js`; some need Docker) |
| **Seed readers (once)** | `pnpm --filter readalot-server seed:readers` (Emma, Ayaan, Sofia, Noah, Mei, Priya, Daniel, **Pip**) |
| **Seed / reset the demo account** | `pnpm --filter readalot-server seed:demo` (rewrites only Jordan's rows; makes Emma and Ayaan "online" for 5 minutes) |
| **Pip's replies** | needs `database/neighbour.sql` applied in Supabase (unverified whether it is applied) |
| **Build** | `pnpm --filter readalot-client build` |
| **Viewport** | Desktop 1440 × 900 first, then phone 390 × 844 |

**Driving the UI like a user.** Find things the way a reader does: by role and accessible name (`getByRole`,
`getByText`, `getByLabel`), as `tests/e2e/` does. A `data-testid` exists only for the room canvases
(`room-canvas`, `room-cats`), the window view and a Shop card's name and price. The walkthrough marks
targets with `data-tour="…"`. Helpers in `tests/e2e/fixtures.js`: `goToPlace`, `openPlaces`, `roomReady`,
`openShop`, `buy`, `pickFromInventory`, `inventory`, `fromMenu`, `screenOf`, `SPOTS`, `useRealApi`
(routes the page's `/api` calls to the API with Supabase on, port 3101), `mockWeather`, `mockTime`,
`mockQuote`, `skipMoodCheckIn`, `townReady`, `artColour`. In `tests/e2e/supabaseUser.js`: `createReader`
(a confirmed reader with a finished profile, signed in without the emailed code), `signInPage`, `setDaily`,
`befriend`, `giveXp`, `readXp`, `readProfile`, `readerClient`, `visitorClient`, `markActive`.

**Checking the database.** The "Database" lines in the scenarios name tables and columns. Check them with a
service-role Supabase client (`createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)`) from a throw-away
script, or in the Supabase SQL editor. Never print the keys. Never delete or edit another person's rows;
delete only the accounts a scenario created. To look at what a reader can see through the app, call the
API with that reader's access token: `Authorization: Bearer <token>` (get one with `signInWithPassword`).

## C2. Test accounts and data

| ID | Account | How to get it | State |
|---|---|---|---|
| **ACCT-NEW** | A fresh reader | Register `qa.<n>@demo.ikda.app`, username `qa.<n>` (digits and letters), password `Maya1234`, code `111111`; finish Welcome with name `Qa Tester`, Woman, age 21, Prefer not to say, genres Fantasy and Mystery & Thriller, any character | Profile complete, walkthrough pending, 480 coins, 0 XP, empty shelf, no friends |
| **ACCT-NEW-TOURSEEN** | A fresh reader with the walkthrough already done | ACCT-NEW, then **Skip tour** (or `createReader({ profile, tourSeen: true })` in code) | As above, no walkthrough |
| **ACCT-DEMO** | Jordan Lee | `demo@demo.ikda.app` / `Ikda-Demo-2026` / `111111`, after `pnpm --filter readalot-server seed:demo` | Level 4, 620 XP, 600 coins, 10 books (3 finished and reviewed: The Hobbit 5★, Pride and Prejudice 4★, Project Hail Mary 5★; 2 reading: Dune 45%, The Secret History 20%; 5 to be read: Fourth Wing, Piranesi, The Night Circus, Circe, Gone Girl), friends Emma Tan and Ayaan Rahman (online for 5 minutes after the seed), Sofia Lim (12 days away), Mei Chen (5 weeks away), a pending request from Noah Koh, chats with Emma and Ayaan, notes from Emma and Ayaan on the corkboard, two visits and a request in the bell, three saved quotes, a decorated room (13 placed pieces) and 5 pieces in the Inventory (Moon poster, Rocking chair, Calico cat, Navy curtains, Tartan bedding), tour seen |
| **ACCT-PROG** | A programmatic reader | `createReader({ profile: {...}, tourSeen })` in `tests/e2e/supabaseUser.js` (needs the service-role key) | Isolated, deleted after the test |
| **ACCT-DEMO-FRESH** | A second demo-domain reader | Register `qa.b.<n>@demo.ikda.app` | For two-reader scenarios (friend requests between two real accounts) |
| **Pip** | `pip.ikda`, "Pip the Librarian" | Seeded by `seed:readers` | Always online, accepts requests at once |
| **Sample readers** | `emma.reads`, `ayaan.pages`, `sofia.shelves`, `noah.bookmarks`, `mei.margins`, `priya.pagecount`, `daniel.dogears` | Seeded | Public, fictional, accept requests at once; they cannot reply to chat (except Pip) |
| **Team accounts** | Dylan, Aasim, Alric, chain, … | Real teammates | **Never** send them requests or messages in a test |

**Naming and cleanup.** Make accounts with a unique stamp (`qa.<epoch>`). After a scenario, delete the accounts it
created (auth user plus `profiles` row; related rows cascade) with the service-role client. Leave ACCT-DEMO
reset (`pnpm --filter readalot-server seed:demo`) when a scenario changed it.

**When Google Books refuses the server** (a used-up quota, a limit on a shared host's address, an outage) the
search falls back to Open Library, so shelves still load: its books have ids like `ol-OL45804W`, covers and
subjects but often no synopsis. `GET /api/health?deep=1` shows what Google answered.

**Books for tests.** Use titles that Google Books returns reliably: The Hobbit, Dune, Circe, Piranesi. Book
search can be slow or rate-limited; retry once before calling it a failure.

## C3. Rules and numbers

| Rule | Value |
|---|---|
| Username | 3 to 20 characters of `a-z 0-9 . _`; unique |
| Password | 6 or more characters |
| Age | whole number 13 to 120; under 18 is always private |
| Name | required, at most 40 characters (Welcome and Edit profile) |
| Location | optional, up to 60 characters |
| Review | rating 1 to 5; text up to 500 characters; one per reader per book |
| Note on a corkboard | 1 to 140 characters; not on your own board |
| Chat message | 1 to 1000 characters; at most one every 1.5 seconds per reader (API 429) |
| Furniture | at most 200 pieces per room |
| Friends' houses | 7 plots in town |
| Starting coins | 480 |
| XP actions | add a book **10** (once per book); start a book **20** (once per book); finish a book **100** (once per book); write a review **40** (once per book); visit a room **15** (once a day per room, not your own); leave a note **10** (once a day per room); send a message **5** (at most 10 a day) |
| Levels | level L starts at `100(L-1) + 25(L-1)(L-2)` XP: 2 at 100, 3 at 250, 4 at 450, 5 at 700, 6 at 1000 |
| Level-up coins | 25 × the new level (level 5 pays 125) |
| Daily reward by streak day | 1: 50 coins + 20 XP, 2: 75 + 20, 3: 100 + 30, 4: 125 + 30, 5: 150 + 40, 6: 200 + 40, 7 and after: 300 + 75 (a chest that also refills a streak freeze) |
| Streak freezes | up to 2; a missed day uses one; none left resets the streak |
| Online | last active within 5 minutes |
| Dusty house | friend away about a month or more |
| Match score | 60% your books they also have (by title) + 40% your favourite genres they share |
| Nearby | a rough 1 km cell of the last location; never the exact position |
| After `lock_down.sql` | `earn_xp` only counts a book that is on your shelf (or reviewed by you) and a room that is another reader's |

**Shop catalogue (25 pieces).** Wall art: Mountain poster 25, Moon poster 25, Book club poster 25, Botanical
print 40, Gold photo frame 45. Reading chairs: Wingback 140, Rocking 120, Papasan 160. Plants: Monstera 60,
Fiddle-leaf fig 55, Succulent trio 30. Cats: Ginger tabby 80, Black cat 85, Calico 90. Curtains (named
"<fabric> curtains"): Rose 45, Lavender 45, Dusty blue 45, Sage 40, Navy 50, Mustard 40. Bedding: Gingham 60,
Striped 55, Floral 65, Starry 70, Tartan 65.

**Salon catalogue.** Free: Long, Bun, Curly, Twists, Puff hair; priced 120: Bob, Wavy, Messy, Short, Spiky, Mop
(and other priced parts). All are free to try; priced parts show a lock ("open up with coins soon"): they cannot be bought yet.

## C4. UI label glossary

Use these exact names. (Labels are from the code; a handful were also seen in a running app.)

- **Landing:** IKDA, Meet Maya, The town, Your character, Levels, How it works, FAQ, Sign up, See how it works, Log in, Surprise me, Start over.
- **Auth:** Create your card, Welcome back, Email, Username, Password, Confirm password, Show password, Hide password, Register, Log in, Already have a card? Log in, Need a card? Register, Check your email, Verification code, Digit 1…6, Confirm code, Resend code, Resend in Ns, Code accepted, Remember me for 30 days.
- **Welcome:** Name, Gender, Age, Religion, Genres, Characters, Back, Next, Finish, Try again.
- **Walkthrough:** Walkthrough (region), Back, Next, Done, Skip this part, Skip tour, Replay the walkthrough.
- **Town:** Follow my character, Zoom in, Zoom out, Notifications, Clear all, Places, Friends, Daily tasks, Dismiss, Claim N coins, Go, Nice!, Weather: …, Go inside, Enter the library, Enter the cafe, Enter the salon, Close.
- **Friends:** Add friend, Remove friends, Friend requests, Accept, Decline, Your friends, Chat with <name>, Readers nearby, Friend's username, Send request, Remove friend, Yes, remove <name>, Visit <name>'s room, Visit <name>'s house.
- **Chat:** Reader messages, Your message, SEND →, Minimise chat, Close chat with <name>.
- **Room:** Places, Window, Chair, Bookshelf, Clock, Corkboard, Bed, Room menu, Mood check-in, Shop, Inventory, Decoration shop, Buy <name>?, Confirm, Cancel, Not enough credits., Close, Move left/up/down/right, Done.
- **Book card (own):** Start reading, Mark as finished, Remove from shelf, Leave/Read Reviews, Hide reviews, Rate this book, ★ N star(s), Your review (optional), Post Review, Edit your review, Delete your review, Open full book page, Close book, Undo.
- **Found book card:** Add to To be read, See it in my room, Undo, Where to get.
- **Mood:** How are you feeling today?, Calm, Low, Stressed, Excited, Continue, Skip for today, A book for your mood, Save quote, Unsave, Add to To Be Read, Added to To Be Read, Undo, Show another recommendation, Quote of the Day.
- **My Shelf:** Back to room, Search your books, Spines, Covers, No books yet, Discover books, Scan a cover, Previous, Next.
- **Library:** Back to town, Places in the library, Around the library, Shelves, Search books or authors, Search, Search is offline, Try again, Snap cover, Or upload a photo of the cover, Search by title, Close scanner.
- **Cafe:** Loading readers…, No other readers available yet., Readers unavailable, Retry, N% match, Meet <name>, Visit <name>'s room, Added as friend, Request sent, Message, Close reader profile.
- **Visiting:** Knocking on the door…, We couldn't find that reader., Find readers in the Cafe, Leave a note, Say hello, recommend a book…, Post note, Cancel, Back to <name>'s profile.
- **Salon:** Style studio, Profile, Looks, Hair, Skin, Outfit, Extras, Surprise me, Reset, Save look, New look ready, Edit, Edit profile, Change look, How to earn XP, Visit the shop, Public profile and location, Saved quotes, Go to My Room, Find a book, Log out, Stay, Save look and leave, Discard and leave, Save your new look?, Close this book?, PUBLIC / PRIVATE.

## C5. Database and API map

**Tables** (Supabase; hand-run SQL in `database/`): `profiles` (display_name, username, avatar, character, favorite_genres,
location_name, discoverable, coins, tour_seen_at, location_asked_at, last_active_at, notifications_read_at,
notifications_cleared_at), `profile_private` (gender, age, religion; own row only), `books`, `user_books`
(status want_to_read / reading / read, progress 0 to 100), `reviews`, `quotes`, `featured_quotes`, `saved_quotes`,
`saved_mood_quotes`, `xp_events` (action, target, xp, day), `daily_state`, `friendships` (pending / accepted /
closed, house spots), `reader_messages`, `room_notes`, `room_furniture` (a `pieces` JSON array),
`reader_areas` (rough cell). `auth.users` holds accounts. RLS: the browser reads/writes only its own
`profiles`, `profile_private`, its `reader_messages` and its `xp_events`/`daily_state` reads; every other table
is reachable only through the API (service role).

**RPCs** (browser, signed in): `earn_xp`, `my_progress`, `spend_coins`, `claim_daily`, `daily_today`, `daily_done`,
`daily_mark_shown`, `daily_dismiss_notice`, `readalot_username_free` (anon allowed, answers yes/no).

**API** (`/api`, Bearer token unless noted): `GET /health`; `GET|POST|PATCH|DELETE /user-books`; `GET /books/search`,
`/books/bestsellers`, `/books/:id`, `GET|POST|DELETE /books/:id/reviews`, `GET|POST /books/:id/quotes`;
`GET /recommendations?mood=`; `GET /quote/today`; `GET /weather`; `GET /time`; `GET /creatures`; `GET /people`,
`/people/:id`, `/people/:id/compatibility`; `POST /nearby`; `GET|POST /friends`, `/friends/requests`,
`/friends/requests/:id/accept|decline`, `DELETE /friends/:id`; `GET|POST /messages/:readerId` (the id is the other reader's **account UUID**, not a username);
`GET /notifications/visits`; `GET /notifications/activity` (requests sent and accepted, messages); `GET|POST|DELETE /rooms/:id/notes`; `GET|PUT /rooms/:id/furniture`;
`GET|POST|DELETE /saved-quotes`; `POST /scan-book`; `GET /stores/nearby` (placeholder); `POST /demo-auth/register` (no token; demo domain only).

## C6. Existing automated tests

36 Playwright spec files, about 405 tests in `tests/e2e/` (one per journey): `auth`, `onboarding`, `start`, `town`,
`town-map`, `daily`, `friends`, `friends-list`, `nearby`, `notifications`, `cafe-profile`, `reader-profile`,
`visit-room`, `room`, `room-furniture`, `room-themes`, `furniture`, `bookshelf`, `my-shelf`, `house-desktop`,
`mood-result`, `library`, `library-wide`, `search`, `find-book`, `synopsis`, `book-page`, `reviews`, `progress`,
`salon`, `buttons`, `pixel-look`, `back-button`, `database-access`, `demo-account`, `scan-book` (placeholder).
They run the app with the built-in demo shelf and no Supabase on the main API (port 3100), a second API with
Supabase for friends and nearby (3101), and real Supabase sign-in from the browser. Where a scenario below
duplicates one of these, the file is named under **Existing coverage**; run it as a quick regression check.

## C7. Known bugs, gaps and unverified areas

**Failing or flaky automated tests (from the latest runs):**
- 8 tests always fail and fail on a clean checkout of `main` too: `daily.spec.js` lines 76 (a task's Go takes you to its building), 220 (the Daily button's
  spot while moving from page to page), 275 (three tests: stacking under the back button on My Shelf and a friend's shelf), 293 (on search), 302 (under a title bar) and
  `reader-profile.spec.js:276` (the Daily button beside Back to Discover). They concern **where the Daily button sits**.
- Flaky under load, pass on re-run: `onboarding.spec.js:42`, `friends.spec.js:60`, `bookshelf.spec.js:262`,
  `room.spec.js:213`, `town-map.spec.js:64` (a townsperson jiggles).
- The latest working tree adds an onboarding spec rewrite and a 33-stop walkthrough; automated TOUR coverage still needs a clean full run in CI.

**Known product gaps:** no password reset, no account deletion, no moderation; any signed-in reader can message
any other reader (no friendship needed); other signed-in readers can read all `profiles` columns; the
priced salon parts cannot be bought yet; `/people/:id/shelf` is a placeholder; `/mood`, `/discover`-style
old pages and `/playground` are leftovers; the walkthrough and the Shop copy mention **lamps in the Shop**, but the
Shop sells none (lamps are fixtures you toggle); Book quotes (`/books/:id/quotes`, `Add quote` modal) are only partly surfaced in the UI;
nearby stores (`/stores/nearby`) and the scan fallback are placeholders; nine client files still say "Readalot"
(page title suffix, "from N Readalot readers", the old tour title); Daily and mood state: Daily is on the server, the mood check-in is per browser.
**Remaining unverified in this pass:** the exact text/timing of friend-house appearance for a newly accepted friend;
the dusty look of a long-away friend's house; the location prompt after walkthrough completion; Pip auto-reply when
`neighbour.sql` is applied in the current environment; full ask-path completion for every walkthrough stop (the 33-stop
flow itself was observed); scanner behaviour with a real camera; "Where to get" links; the Bestsellers source; the
notification line for "friend comes online"; behaviour on very small phones; `/discover/:genre` sort-chip behaviour;
and the exact response to a 13-year-old's public setting.

## C8. Coverage matrix

| Area | Suite | Scenarios |
|---|---|---|
| Landing, public navigation | LND | 10 |
| Register, login, code, logout, route guard, demo account | AUTH | 17 |
| Welcome | WEL | 6 |
| Walkthrough | TOUR | 14 |
| Town, HUD, map, weather, privacy, location | TWN | 14 |
| Daily tasks | DLY | 9 |
| Friends, requests, chat, bell | FRD | 13 |
| Cafe and profiles | CAF | 8 |
| Visiting rooms and notes | VIS | 7 |
| My Room | ROOM | 8 |
| Bookshelf and My Shelf | SHF | 14 |
| Mood check-in and quotes | MOOD | 7 |
| Shop, Inventory, decorating | SHOP | 12 |
| Library, search, scanner | LIB | 14 |
| Book cards, pages, reviews | BOOK | 11 |
| Salon: style, profile, privacy, log out | SAL | 15 |
| XP, coins, levels | PRG | 6 |
| Connecting journeys | JRN | 8 |
| Permissions and data safety | SEC | 8 |
| Errors, empty and loading states | ERR | 8 |
| Responsive and accessibility | RSP | 6 |
| **Total** | | **215** |
