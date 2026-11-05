# E2E scenarios 05: Library and books

Suites: **LIB** library hall, search and scanner (14), **BOOK** book cards, full page and reviews (11) = 25. Format, accounts and rules:
header of [01-public-auth-onboarding.md](01-public-auth-onboarding.md) and C2/C3 of [../E2E_GUIDE.md](../E2E_GUIDE.md). Unless stated:
Desktop, signed in as **ACCT-NEW-TOURSEEN** (empty shelf, no XP) so that XP/shelf changes are easy to read; **ACCT-DEMO** where named.
Book search uses Google Books, which can be slow or fail: retry once before recording a failure. Existing helpers: `openPlaces` in
`tests/e2e/fixtures.js`.

---

## LIB: Library

### LIB-01 · Enter the library · Critical
1. From the town tap **Library** → **Enter the library** → `/library`: a pixel library hall opened at the **help desk**; **Back to town** top left; a **Places** button bottom right 📸.
2. The hall is lit by the live weather through its windows (rain on the glass when raining).
**DB:** none. **Pass:** the hall renders with no console errors; the route is `/library`. **Existing coverage:** `library.spec.js`, `library-wide.spec.js`.

### LIB-02 · Look around the hall · Medium
1. Drag, swipe, scroll the wheel, press ←/→ → the hall slides sideways: help desk, scanner, genre bookcases, reading nook.
2. Tap a lamp on the wall → it turns off/on.
3. Each genre has its own sign (colour, font, icon) and wall.
**DB:** none. **Pass:** both ends reachable; lamps toggle.

### LIB-03 · The library's Places menu · High
1. Press **Places** → a list "Places in the library" with two groups: **Around the library** (Help desk, Scanner, Reading nook) and **Shelves** (Bestsellers, Romance, Romantasy, Fantasy, Mystery & Thriller, Horror, Sci-Fi, Historical Fiction, Young Adult, Memoir, Graphic Novels).
2. Press **Fantasy** → the hall slides to that bookcase; Esc closes the list.
**DB:** none. **Pass:** 3 + 11 entries as listed; each slides to its part. **Existing coverage:** `library.spec.js`.

### LIB-04 · Open a genre bookcase; Spines and Covers · High
1. Press the **Fantasy** bookcase → it opens showing its books (loading placeholders first, then books).
2. Press **Spines / Covers** → the look changes; hover a book → it slides out of the shelf.
3. Close the bookcase.
**DB:** none. **Pass:** books load (about a dozen); both looks render. **Existing coverage:** `library.spec.js`.

### LIB-05 · A found book: card and Add to To be read · Critical
1. In the Fantasy bookcase press a book → a card: cover, title, author, rating (if any), synopsis, **Add to To be read**, **Where to get**, **Leave/Read Reviews**, **Open full book page**.
2. Press **Add to To be read** → "Adding…", then the button/label shows the book is on the shelf (To be read); **See it in my room** (a button, with **Undo** beside it for a book just added) appears; a toast may show.
3. In My Room the book is on **To be read**.
**DB:** `user_books` row `want_to_read` (book id from Google Books); `books` row cached; `xp_events` `add_book` +10; Daily "add a book" ticks if today's task. **Pass:** XP 0 → 10; the book on the shelf after reload. **Existing coverage:** `find-book.spec.js`, `library.spec.js`.

### LIB-06 · Where to get · Medium
1. On a found book press **Where to get** → a list of shops, downloads or ways to borrow it ("Where to get this book").
2. Press it again → closes.
**DB:** none. **Pass:** the list opens/closes; links open in a new tab and don't leave the app. **(unverified)** link targets.

### LIB-07 · Bestsellers · Medium
1. Press the **Bestsellers** bookcase → this week's list, credited under the sign (source named).
2. If the NYT key is missing the list comes from Open Library (trending).
**DB:** none. **Pass:** a non-empty list with a credit line. **(unverified)** source in production.

### LIB-08 · Help desk search (happy path) · Critical
1. Press the help desk or the search bar (**Search books or authors**; placeholder "What are you looking for?" when asking) → type `hobbit`, press Enter/**Search**.
2. The page becomes `/search?q=hobbit` 📸: your query, books standing in a bookcase (covers face out), the first being The Hobbit.
3. Press a result → its card (as LIB-05).
**DB:** none. **Pass:** the URL carries the query; results show. **Existing coverage:** `search.spec.js`.

### LIB-09 · The query lives in the URL · High
1. Search `dune`, then `circe`, then press the browser **Back** → the `dune` results return (history steps through searches).
2. Reload `/search?q=circe` → the same results after reload.
3. Open `/search?q=` directly → an empty search page prompting for a query.
**DB:** none. **Pass:** history and reload behave. **Existing coverage:** `search.spec.js`.

### LIB-10 · No results, offline, slow · High
1. Search `zzzqqqxyz` → a clean "nothing found" message (no crash).
2. Block `GET /api/books/search` → **Search is offline** with **Try again**; unblock, press **Try again** → results.
3. Throttle the network → a loading state shows; a slow reply for an older query never overwrites a newer one (type two searches quickly).
**DB:** none. **Pass:** each state shown. **Existing coverage:** `search.spec.js`.

### LIB-11 · Scanner with a camera · Medium
**Pre:** Chromium with a fake camera (`--use-fake-device-for-media-stream`) or a real one; Google Vision key configured **(unverified)**.
1. Press **Scanner** (or `/library?scan=1`) → a camera view, "Book scanner", "Hold a book's cover up to the camera, with its title in view.", **Snap cover**, **Or upload a photo of the cover**, **Search by title**, a close button.
2. Allow the camera → "Starting camera…" then a live view. Press **Snap cover** → "Scanning…" then a found-book card (or a failure message).
3. Press the close button → the camera stops (the camera indicator turns off).
**DB:** none until a book is added. **Pass:** the camera starts and stops; a result or a clear failure shows.

### LIB-12 · Scanner without a camera: upload and search by title · High
1. Block the camera permission → a message and the fallbacks remain.
2. **Or upload a photo of the cover** → choose an image of a book cover → "Scanning…" then a result or "couldn't read that cover".
3. **Search by title** → opens the search (`/search`) for typing.
**DB:** none. **Pass:** never a blank screen. **Existing coverage:** `scan-book.spec.js` (placeholder, skipped).

### LIB-13 · A book already on the shelf · Medium
**Pre:** ACCT-DEMO. 1. Search `The Hobbit` and open its card → it shows the shelf it is on (Finished) instead of **Add to To be read**, and **See it in my room** (a button, with **Undo** beside it for a book just added).
2. Add a book twice (double-click **Add to To be read**) → only one `user_books` row and one XP award.
**DB:** unique `(user_id, book_id)`; `xp_events` once per book. **Pass:** no duplicates.

### LIB-14 · The old genre shelf page · Low
1. Open `/discover/fantasy` → "Full genre shelf": about 24 books stacked in shelf tiers; **Sort books** chips reorder in the browser; **Try again** on failure; "This shelf is empty" / "Shelf is offline" states.
**DB:** none. **Pass:** the page renders and sorts. **(unverified)**; page is an old route kept reachable.

---

## BOOK: Book cards, full page and reviews

### BOOK-01 · Book card details · High
1. Open a found book (e.g. The Hobbit) → cover (or a cloth cover with the title when there is no image), title, author(s), synopsis (or "No synopsis for this book yet."), rating text ("4.7 ★ from 3 readers" when reviewed).
2. Open an own book from the shelf → the same plus the next-step button and **Remove from shelf**.
**DB:** none. **Pass:** nothing is blank or "undefined". **Existing coverage:** `synopsis.spec.js`.

### BOOK-02 · The full book page · High
1. On a card press **Open full book page** → `/books/<id>` with the full details; a close (✕) returns to where you came from.
2. Status buttons **Want to read / Reading / Finished reading** set the status; choosing **Reading** shows a progress slider.
3. Open `/books/<invalid>` → "Couldn't open this book." with **Retry**.
**DB:** `user_books` status/progress as chosen; XP per C3. **Pass:** the page and its status controls work; the error state is clean. **Existing coverage:** `book-page.spec.js`.

### BOOK-03 · Write a review · Critical
**Pre:** a reader with a Finished or shelved book (ACCT-DEMO: Dune shelf; or add one).
1. Open the book's card → **Leave/Read Reviews** → **Rate this book** with five stars (★ 1 star … ★ 5 stars), **Your review (optional)** with a `0 / 500` counter, **Post Review**; **Post Review** is disabled until a star is chosen.
2. Choose **★ 5 stars**, type `Epic and unforgettable.`, press **Post Review** → your review appears (stars, text, "just now") with **Edit your review** and **Delete your review**; the header shows the new average and "from 1 reader".
**DB:** `reviews` row (rating 5, review_text, unique per reader and book); `xp_events` `write_review` +40 (once per book). **Pass:** XP +40; the review persists after reload. **Existing coverage:** `reviews.spec.js`. **Reset the demo account.**

### BOOK-04 · Review text limit and a stars-only review · Medium
1. Type 500 characters → counter `500 / 500`; the 501st is not accepted (maxlength) or flagged.
2. Save a review with stars only (no text) → allowed; it counts in the average but the book shows as rated, not "reviewed".
**DB:** `reviews.review_text` null or ≤ 500; constraint `reviews_text_length`. **Pass:** both saved.

### BOOK-05 · Edit your review · Medium
1. **Edit your review** → the form returns with your stars and text; change to ★ 3 and new text → **Post Review**.
2. The review and average update; `updated_at` changes; XP is **not** awarded again.
**DB:** the same `reviews` row updated. **Pass:** still one review per book.

### BOOK-06 · Delete your review · Medium
1. **Delete your review** → confirm → the review disappears; the form returns; the average updates ("No one has reviewed it yet." if none).
**DB:** `reviews` row deleted; XP already earned stays. **Pass:** re-reviewing later works and gives no second XP.

### BOOK-07 · Average rating and count · Medium
**Pre:** ACCT-DEMO. 1. Open The Hobbit → **Leave/Read Reviews (3)**: Jordan 5, Emma 5, Ayaan 4 → the header reads about "4.7 ★ from 3 readers".
2. Add a 3-star review from a second account → "4.3 ★ from 4 readers".
**DB:** `reviews`. **Pass:** the average is the mean to one decimal.

### BOOK-08 · Other readers' reviews and links · Medium
1. In a review list, your own review is first and labelled **You** with a pink avatar; others show their name (e.g. **Emma Tan**) as a link and their pixel avatar.
2. Press a reviewer's name → their profile page opens (`/people/<username>`).
**DB:** none. **Pass:** names are links; private readers appear as "A reader" or similar **(unverified)**.

### BOOK-09 · XP for a review once per book · High
1. Review a book (+40 XP). Delete the review and write a new one → no second +40.
2. Review a second book → +40 again.
**DB:** `xp_events` unique `(reader, action, target)` for `write_review`. **Pass:** XP increases by 40 per distinct book only.

### BOOK-10 · Reviewing a book that is not on your shelf · Medium
1. From a found book you have **not** added, open **Leave/Read Reviews** → the form may be shown.
2. Save a review → it saves; check whether XP is awarded: after `lock_down.sql` a review counts only if the book is on the shelf **or reviewed by you** → expect +40 once the review exists.
**DB:** `reviews` row; `xp_events` `write_review` (confirm). **Pass:** record the actual behaviour (reviews allowed without a shelf entry). **(unverified)**

### BOOK-11 · Reviews load and error states · High
1. Slow the network → **Leave/Read Reviews** shows a loading state ("Leave/Read Reviews" label) then the count.
2. Block `GET /api/books/<id>/reviews` → an error with **Retry** (or "couldn't load"), the rest of the card intact.
3. A book with no reviews → "No one has reviewed it yet."
**DB:** none. **Pass:** each state shown; no crash.
