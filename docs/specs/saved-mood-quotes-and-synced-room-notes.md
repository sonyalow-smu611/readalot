# Save mood quotes to the salon, sync room notes, and a cleaner shelf row

**Status:** ready-for-agent
**Part:** Your house → My Room (owner: Sonz), with changes to the Hair Salon's Saved quotes
(owner: Aalric), the mood check-in modal, and the server. The team has agreed to these changes,
including the new Express endpoints; record the AI use in AI_USAGE.md as usual.

## Problem Statement

When I check in with my mood, Readalot picks a book and shows me a line from it. Sometimes that
line is exactly what I needed, but once I close the modal or ask for another recommendation it's
gone. The salon has a "Saved quotes" card, yet it only ever says "No saved quotes yet", because
nothing in the app can save a quote.

When I leave a note on another reader's notice board, it only lives in my own browser. The reader
whose board it is never sees it, and if I open Readalot on my phone instead of my laptop, the
note isn't there either. My own room's notice board never shows the notes people left for me.

On My Shelf, each shelf row draws a thin scrollbar line under the covers, between the books and
the wooden plank. It looks like a stray rule cutting through the shelf, and the row already
scrolls by swipe, drag, the Previous / Next buttons and the arrow keys.

## Solution

- The mood result gets a **Save quote** button next to its quote. Saving keeps the quote, with
  its author, book and source, in my account in Supabase. Once saved, the button reads **Saved**
  and a **See saved quotes** link takes me to the salon's Saved quotes card at `/salon`.
- The salon's **Saved quotes** card lists every quote I've saved, newest first, each with its
  author and book, a link to the book's page, and a way to remove it. With none saved, it keeps
  today's empty state, now pointing at the mood check-in as well as Discover.
- Notes on notice boards are kept on the server. A note I leave on a reader's board is there for
  them and for every visitor, on any device, after any reload. My own room's notice board shows
  the notes others have left me, and I can take any of them down. I can still take down notes I
  left on someone else's board.
- My Shelf's rows no longer show a scrollbar line. Every other way of scrolling a row keeps
  working, and the plank stays.

## User Stories

### Saving mood quotes

1. As a reader, I want a Save quote button under the quote in my mood recommendation, so that I
   can keep a line that spoke to me.
2. As a reader, I want the button to change to "Saved" once the quote is saved, so that I know it
   worked.
3. As a reader, I want to tap "Saved" again to unsave the quote, so that a mis-tap is easy to undo.
4. As a reader, I want the button to say "Saving…" and be disabled while it works, so that I don't
   save the same quote twice.
5. As a reader, I want a clear message if the quote couldn't be saved, so that I know to try
   again.
6. As a reader, I want a See saved quotes link once I've saved, so that I can go straight to my
   collection in the salon.
7. As a reader, I want "Show another recommendation" to reset the button for the new quote, so
   that I can save that one too.
8. As a reader, I want a quote I saved earlier to show as already Saved when it comes up again,
   so that I don't get duplicates.
9. As a reader, I want saving a quote to leave the "Add to To Be Read" button alone, so that I can
   do either, or both.
10. As a reader, I want my saved quotes kept in my account, so that they are there on any device
    and after I sign out and back in.
11. As a reader, I want the quote's Wikiquote credit kept with it when I save it, so that the
    source is still linked where I read it later.

### The salon's Saved quotes

12. As a reader, I want the salon's Saved quotes card to list my saved quotes, newest first, so
    that my latest finds are at the top.
13. As a reader, I want each saved quote to show its text, author and book title, so that I
    remember where it came from.
14. As a reader, I want each saved quote's book to link to its book page, so that I can go back
    and read or shelve it.
15. As a reader, I want a Remove button on each saved quote, so that I can tidy my collection.
16. As a reader, I want a removed quote to disappear straight away, and to come back with an error
    message if removing failed, so that the list never lies to me.
17. As a reader, I want a loading state while my quotes load, so that an empty card doesn't flash
    before they arrive.
18. As a reader, I want an error with a Try again button if my quotes can't load, so that I'm not
    told I have none when the server is just down.
19. As a reader with no saved quotes, I want the empty state to tell me I can save quotes from my
    mood check-in, so that I know how to start.
20. As a reader, I want the See saved quotes link to land me on the Saved quotes card itself, not
    the top of the salon, so that I don't have to hunt for it.
21. As a reader on a phone, I want long quotes to wrap neatly inside the card, so that nothing runs
    off the screen.

### Notes on notice boards, kept on the server

22. As a visitor, I want a note I leave on a reader's board to be saved on the server, so that the
    reader actually gets it.
23. As a visitor, I want my note still on the board after I reload or come back on another device,
    so that I trust it was left.
24. As a room owner, I want my own notice board to show the notes others have left me, newest
    first, so that I can read them.
25. As a room owner, I want to take down any note on my board, so that I control what my room
    shows.
26. As a visitor, I want to take down a note I left on someone else's board, so that I can retract
    it.
27. As a visitor, I don't want to be able to take down other visitors' notes, so that nobody can
    silence someone else.
28. As a reader, I don't want to be able to pin a note on my own board, so that the board is for
    messages from others.
29. As a visitor, I want my note signed with my profile name, taken from my account rather than
    anything I type, so that nobody can sign as someone else.
30. As a visitor, I want the same 1 to 140 character limit, enforced by the server too, so that the
    rule holds no matter what.
31. As a visitor, I want the board to show a loading state, and an error with Try again if its
    notes can't load, so that a failed load doesn't look like an empty board.
32. As a visitor, I want my typed note kept in the box if posting fails, with an error message, so
    that I don't lose what I wrote.
33. As a visitor to one of the Cafe's sample readers, I want leaving a note to keep working, so
    that the demo still makes sense.

### My Shelf rows

34. As a reader, I want each My Shelf row without a scrollbar line under its covers, so that the
    shelf looks like one clean shelf.
35. As a reader, I want to still scroll a row by swipe, Shift + wheel, mouse drag, Previous / Next
    and the arrow keys, so that losing the scrollbar costs me nothing.
36. As a reader, I want the wooden plank under each row kept, so that the rows still look like
    shelves.

## Implementation Decisions

### Saved quotes

- **One table for all saved quotes, storing the quote itself.** The mood quote comes from the
  works catalogue / Wikiquote, so it has no row in the `quotes` table, and the existing
  `saved_quotes` table (a foreign key to `quotes`) can't hold it. Add a new migration with a table
  that stores a copy of the quote: `id`, `user_id` (references the reader's account, cascade on
  delete), `quote_text`, `author`, `work` (the book title), `book_id` (nullable), `source_url`
  (nullable), `mood` (nullable, the mood it was found for), `created_at`. A reader can't save the
  same text from the same book twice: unique on `(user_id, book_id, quote_text)`. RLS on, no
  browser policies, only the Express API with the service-role client reads or writes it,
  following the pattern of the room notes table. Leave the old `saved_quotes` table alone. Later,
  hearts on a book's Quotes tab can use this table too.
- **API** under `/api/saved-quotes`, behind `requireUser` (as `/api/user-books`):
  - `GET /` → `{ quotes: [{ id, quoteText, author, work, bookId, sourceUrl, mood, createdAt }] }`,
    newest first.
  - `POST /` with `{ quoteText, author, work, bookId?, sourceUrl?, mood? }` → the saved quote.
    Saving a quote that's already saved returns the existing one (an upsert), not an error. Rejects
    missing or empty `quoteText` with 400.
  - `DELETE /:id` → 204; only removes the caller's own quote.
- **Without Supabase** (local dev, Playwright), the server keeps saved quotes in memory per user,
  as `reviews.js` and `userBooks.js` do today.
- **Client:** functions in the services layer (`getSavedQuotes`, `saveQuote`, `unsaveQuote`). The
  mood result modal and the salon's card call them directly; no new Pinia store is needed, as the
  two never show on one screen.
- **Mood result modal:** under the quote, a Save quote / Saved toggle (pixel button kinds, as the
  rest of the house) and, once saved, a See saved quotes link to `/salon#saved-quotes`. When a
  recommendation loads, the modal checks the reader's saved quotes so a quote that's already saved
  shows as Saved. "Show another recommendation" resets the save state along with the "added" state.
- **Salon Saved quotes card:** becomes a component that loads and lists quotes, with loading,
  error-with-retry and empty states (reusing `StateView` where it fits). Each saved quote is one
  child component (quote, author, linked book, Remove) that emits `remove` and never edits its
  props. The card carries the `saved-quotes` id so the link's hash scrolls to it. Removing is
  optimistic and rolls back with an error message on failure.

### Room notes

- **Use the existing `room_notes` migration as is** (owner, author, 1–140 character content,
  no notes on your own board, RLS on, server-only access). Its comment already spells out the
  permissions, which the API enforces.
- **API** under `/api/rooms/:ownerId/notes`:
  - `GET /` → `{ notes: [{ id, ownerId, authorId, author, text, createdAt }] }`, newest first,
    with `author` as the author's profile name (falling back to "A reader"). Anyone signed in may
    read.
  - `POST /` with `{ text }` → the new note. The author is the signed-in reader from the token,
    never from the body. 400 for empty or over-140 text, 400 for the reader's own board.
  - `DELETE /:noteId` → 204 when the caller wrote the note or owns the board, 403 otherwise.
- **Identity:** writes require a real signed-in account, as `/api/messages` does with its own
  check, with no demo-user fallback in Supabase mode, so a note is never signed by the demo user.
- **Sample readers and no-Supabase mode:** the Cafe's sample readers (`reader-emma`, …) aren't
  accounts, so their boards can't go in `room_notes`. The server keeps notes for non-account ids,
  and for every board when Supabase isn't configured, in memory, as `reviews.js` does for its
  demo readers. The client always goes through the API, so there is one code path.
- **Client:** the house's notes module stops using `localStorage` and becomes async calls through
  the services layer, keeping its `NOTE_MAX` constant and its validation message so the box can
  check before sending. Notes left in the old `localStorage` key are not moved over.
- **Room view:** loads the board's notes when the room opens, both when visiting (the visited
  reader's board) and in the reader's own room (their own board, which today always shows empty).
  The owner sees a take-down control on every note; a visitor sees it only on their own notes.
  Posting shows a busy state, clears the box on success, and keeps the text with an error on
  failure.

### My Shelf row

- Hide the scrollbar of My Shelf's scrolling row (the house's shelf row component), as the genre
  page's shelf tier already does, in both standard and WebKit form. The plank, the drag, the
  Previous / Next buttons and the keyboard handling don't change. The shared shelf tier component
  isn't touched.

## Testing Decisions

- **One seam: Playwright through the UI**, as every journey in this project is tested. Tests use
  labelled buttons and visible text, never CSS classes or internal state. They run against the
  test server with no Supabase, so they go through the in-memory stores described above.
- A good test describes what a reader does and sees ("Save quote turns into Saved, and the quote
  is in the salon"), not how it's stored. It shouldn't care whether data is in memory or Supabase.
- **New journey for saved quotes:** open the mood check-in, pick a mood, Save quote → the button
  reads Saved → See saved quotes → the salon's Saved quotes card shows the quote's text and book →
  Remove → the empty state is back. Also: Saved survives a reload of the salon; unsaving from the
  modal removes it from the salon.
- **Room notes**, extending the visit-room notice board tests: leave a note → reload the page →
  the note is still there; clear the browser's storage → still there (proves it's on the server);
  take it down → gone after a reload. A note over 140 characters is refused with the message.
- **Shelf row**, in the my-shelf tests: a row with more books than fit still shows Next, and Next
  and the arrow keys still move it. Whether the scrollbar is drawn is a visual detail; check it by
  eye or with a screenshot, not with an assertion on styles.
- Prior art: `tests/e2e/visit-room.spec.js` (notice board), `tests/e2e/my-shelf.spec.js` (shelf
  rows), the mood modal tests, and `tests/e2e/town.spec.js` for reaching the salon.
- Before finishing: the client build passes and the e2e files touched pass.

## Out of Scope

- Hearts on a book's Quotes tab or on the Quote of the Day (the table is ready for them later).
- Sharing saved quotes, or showing them on another reader's profile.
- Editing a note, replying to it, or notifying the owner when a note arrives.
- Moving notes from the old `localStorage` key to the server.
- Any change to the genre page's shelf tiers or the plank.

## Further Notes

- Run the new saved-quotes migration and the existing `room_notes.sql` in the Supabase SQL editor
  before trying either against the real project.
- The salon is Aalric's part: the Saved quotes card changes should reach them for review in the
  pull request from Sonya's branch.
- The server's in-memory stores are lost when it restarts. That's fine for demos and tests, and is
  why real accounts go to Supabase.
