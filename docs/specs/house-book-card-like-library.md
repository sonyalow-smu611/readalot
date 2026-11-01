# Spec: Your own book's card, laid out like the library's book preview

Labels: `ready-for-agent`
Owner: Sonz (house building)
Builds on: `room-shelf-page-and-book-card.md`, `my-shelf-library-bookcase.md`. Layout reference: the
library's book preview (Library → open a bookcase → tap a book).

## Problem Statement

When I open one of my own books in My Room, the card doesn't look like the one the library shows.
The library's preview is short and calm: the cover, title, author and rating, the synopsis, then
a single stack of full-width buttons: **Add to To be read**, **Where to get**, **Read reviews (n)**,
**Open full book page**, **Close**.

My Shelf's card for my own book is a long scroll. It has a "TO BE READ" line above the title,
three side-by-side reading-status buttons, the star rating, the review box and every review laid
out in full, and only then the buttons. The 3D Room is worse: tapping a book there opens a
different card altogether, with a different layout, the building's accent colour and plain text
links instead of buttons.

So the same book looks three different ways depending on where I tap it, and my own books look
nothing like the books I find in the library.

## Solution

Every place where I open **my own** book in the house (a cover on My Shelf, or a book on the
bookshelf in the 3D Room) shows one card, laid out exactly like the library's preview:

- The top is the same: cover, title, author and the rating pill, with no shelf line above the
  title.
- The synopsis is the same, with **Read more**.
- The three status buttons give way to **one main brown button with the next step**:
  - a To be read book: **Start reading** (it moves to Currently reading)
  - a Currently reading book: **Mark as finished** (it moves to Finished reading)
  - a Finished reading book: no next-step button
- A Currently reading book still shows its progress slider.
- A To be read book also gets **Where to get**, just like the library.
- **Remove from shelf** stays the full-width red button, asking first, with Undo after.
- The reviews (the star rating, my review box and everyone's reviews) wait behind
  **Read reviews (n)**.
- Then **Open full book page** and **Close book**, as now.

A friend's books (on their shelf or in their room) are left as they are.

## User Stories

**One card everywhere**
1. As a reader, I want my own book's card on My Shelf to be laid out like the library's book preview, so that the app feels like one app.
2. As a reader, I want tapping a book on the 3D Room's bookshelf to open that same card, so that a book looks the same wherever I open it.
3. As a reader, I want the card in the room to have the library card's colours and buttons, not the house's accent colour, so that it matches exactly.
4. As a reader, I want the card centred over the room with the same dimmed backdrop as the library, so that it feels like the same pop-up.

**The top of the card**
5. As a reader, I want to see the cover, title and author at the top, so that I know which book I opened.
6. As a reader, I want the Google Books rating pill when the book has a rating, so that I see how others rated it, as I do in the library.
7. As a reader, I want no "TO BE READ" line above the title, so that the top matches the library's card.
8. As a reader, I want the synopsis cut short with Read more, so that the card stays short until I ask for more.

**Moving a book along**
9. As a reader with a To be read book, I want one brown **Start reading** button, so that starting a book is one obvious tap.
10. As a reader, when I tap Start reading, I want the book to move to my Currently reading shelf, so that My Shelf and the room show it there.
11. As a reader, after Start reading I want the card to stay open and change to show **Mark as finished** and the progress slider, so that I can see the move worked.
12. As a reader with a Currently reading book, I want one brown **Mark as finished** button, so that finishing a book is one obvious tap.
13. As a reader, when I tap Mark as finished, I want the book to move to my Finished reading shelf, so that it is filed with the books I've read.
14. As a reader with a Finished reading book, I want no next-step button, so that the card doesn't offer a move that makes no sense.
15. As a reader with a Currently reading book, I want the progress slider still on the card, so that I can still record how far I've got.
16. As a reader, if moving a book fails, I want a short message on the card and the book left where it was, so that I'm not misled.
17. As a reader, while a move is saving, I want the button to say so and not take a second tap, so that I don't move the book twice.

**Where to get**
18. As a reader with a To be read book, I want **Where to get** under the main button, so that I can find a shop or library for a book I don't own yet.
19. As a reader with a Currently reading or Finished book, I want no Where to get, so that the card only offers what I need.

**Removing a book**
20. As a reader, I want **Remove from shelf** to stay a full-width red button, so that it's clearly different from the other buttons.
21. As a reader, I want Remove from shelf to ask me first, as it does now, so that I don't lose a book by accident.
22. As a reader, after removing a book I want Undo, as now, so that I can put it back.
23. As a reader in the room, after removing a book I want the book that flew out to fade away rather than go back on the shelf, as now.

**Reviews**
24. As a reader, I want the reviews hidden behind **Read reviews (n)**, with n the number of reviews, so that the card stays short.
25. As a reader, I want Read reviews to open the star rating, my review box and everyone's reviews in place, so that I can still rate and review my book from the card.
26. As a reader, I want the button to say **Hide reviews** while they're open, so that I can fold them away again.
27. As a reader, I want the reviews folded again whenever I open another book, so that each card starts short.

**Leaving the card**
28. As a reader, I want **Open full book page** to take me to the book's own page, as now.
29. As a reader, I want **Close book**, a tap on the backdrop or Esc to close the card, as now.
30. As a reader in the room, when I close the card I want the book to go back on the bookshelf, as now.
31. As a keyboard or screen-reader user, I want the card announced as "Book details" and focused when it opens, so that I land in it.

**Unchanged**
32. As a reader visiting a friend's shelf or room, I want their book cards left as they are, so that this change touches only my own books.
33. As a reader in the library, I want the library's preview left exactly as it is, so that nothing else changes there.

## Implementation Decisions

- **One house component for your own book's card.** A new component in the house's `components/`
  folder wraps the shared book preview, just as the library's found-book preview does. It takes
  the book (with its `status` and `progress`) and emits close (saying whether the book was
  removed) and its status/progress changes upward. My Shelf and the 3D Room both use it, so the
  markup lives in one place.
- **The shared book preview is not changed.** The new component only uses options the preview
  already has: reading statuses off, reviews collapsed, "Book details" as the dialog's name,
  "Close book" as the close label, no tab line, and its slot for the house's own buttons. The
  library's preview and the shared code stay as they are, so no shared-code pull request is
  needed.
- **What goes in the slot, in order:** the progress slider (Currently reading only), the next-step
  button (brown, main), Where to get (To be read only, using the existing shared Where to get
  component), a move error (if any), then the red Remove from shelf. After the slot the preview
  adds Read reviews, Open full book page and Close book.
- **Next step:** to be read → reading ("Start reading"), reading → read ("Mark as finished"),
  read → none. It goes through the same bookshelf store action the status buttons use now, so
  the room's bookshelf, My Shelf's rows and the server stay in step.
- **The 3D Room's own dialog is replaced.** The room stops using its own book dialog (the
  BookCard + book-details layout with the house's accent colour) and uses the new component
  instead. The room keeps its behaviour: close says whether the book was removed, so the room
  fades the book that flew out instead of putting it back.
- **The building's accent colour is dropped from this card** so it matches the library exactly.
- **Remove from shelf** keeps the house's existing remove flow (ask first unless told not to,
  Undo either way).
- **No moving backwards from the card.** The status buttons were the only way to move a book back
  a shelf. That's accepted: a wrongly moved book can be removed and added again.
- **Friend's books:** the visitor shelf card and the visitor room dialog are not touched.

## Testing Decisions

- **The seam is the Playwright end-to-end tests**, the same one every house journey already uses.
  Tests open a book through labelled buttons and visible text, as a reader would, and check what
  the card shows and what happens on the shelf, never component internals.
- **New tests** (in the house's specs, next to the existing My Shelf and bookshelf journeys):
  - My Shelf and the 3D Room open a card named "Book details" with no reading-status buttons and
    a Read reviews button. The rating and review box are hidden until it is tapped.
  - A To be read book shows Start reading and Where to get. Tapping Start reading moves it to the
    Currently reading row, and the card now shows Mark as finished and the progress slider.
  - Mark as finished moves the book to the Finished reading row. A Finished book has no
    next-step button and no Where to get.
  - Remove from shelf is still there and still asks first, with Undo.
  - The room's card has the same buttons as My Shelf's.
- **Existing tests to update** (they click the three status buttons or expect the reviews open):
  `my-shelf.spec.js`, `bookshelf.spec.js`, `room.spec.js`, `buttons.spec.js`, `reviews.spec.js`
  (a finished book's reviews are now behind Read reviews) and `house-desktop.spec.js` if it checks
  the card.
- **Prior art:** the library's preview tests in `library.spec.js` and `find-book.spec.js` (Add to
  To be read, Where to get, Read reviews), and the My Shelf card tests in `my-shelf.spec.js`.
- Before finishing: the client build passes and the house and library specs pass.

## Out of Scope

- A friend's books: the visitor shelf card and the visitor room dialog.
- The library's preview and the shared book preview component.
- The book's own page (`/books/:id`) and the book overlay's open spread.
- Moving a book back a shelf from the card.
- Any change to how reviews, ratings, progress or removing books work on the server.

## Further Notes

- The room's book dialog component becomes unused and can be deleted, along with anything only
  it used, once the room uses the new card.
- The house README describes the room's book card. Update it to say the room and My Shelf share
  the new card.
- Record the implementation in `AI_USAGE.md` and add the AI top-of-file comment to new files, as
  the team rules require.
