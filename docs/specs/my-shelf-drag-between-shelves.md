# Spec: Drag a book to another shelf on My Shelf to change its status

Labels: `ready-for-agent`
Owner: Sonz (house building)
Builds on: `my-shelf-library-bookcase.md` (the three-shelf bookcase on My Shelf). That spec left dragging out of scope; this one adds it.

## Problem Statement

My Shelf is now a bookcase with three shelves, one per reading status: To be read, Currently
reading, Finished reading. To move a book from one shelf to another, the reader has to open its
card, find the status buttons, tap one, and close the card. A bookcase invites you to pick a book
up and put it somewhere else, and the page doesn't let you. Starting or finishing a book takes
four steps when it should take one gesture.

## Solution

On their own My Shelf, the reader can pick up any book (a spine, a book lying flat, or a cover)
and drop it on another shelf. Dropping it there changes the book's reading status, exactly as the
status buttons in its card do:

- To be read → Currently reading starts it.
- Anything → Finished reading finishes it (progress 100%).
- Anything back → To be read puts it back on the pile.

While a book is held, it follows the finger or pointer, its place on its own shelf is left empty,
and the shelf under it lights up as a place to drop. Letting go over another shelf moves the book
there. Letting go anywhere else, or over its own shelf, puts it back where it was. If the save
fails, the book goes back to its old shelf and the page says why. The plates' counts follow the
move at once.

Picking up must not break what the shelf already does. A sideways drag still scrolls the shelf,
and a tap still slides the book out and opens its card. A visited reader's shelf can't be
rearranged.

## User Stories

1. As a reader, I want to drag a book from one shelf to another, so that I can change its status in one gesture.
2. As a reader, I want to drop a To be read book on Currently reading, so that starting a book takes one move.
3. As a reader, I want to drop a book on Finished reading, so that finishing a book takes one move.
4. As a reader, I want a book dropped on Finished reading to count as fully read (100%), so that it behaves as if I'd pressed Finished reading in its card.
5. As a reader, I want to move a book back to To be read, so that I can undo starting one I've put down.
6. As a reader, I want to drag between any two shelves, including skipping the middle one, so that I'm not forced through Currently reading.
7. As a reader, I want to pick up a book lying flat in a stack, so that every book on the shelf can be moved.
8. As a reader, I want to drag books in Covers mode too, so that the gesture works however I view the shelf.
9. As a reader, I want the book I'm holding to follow my finger or pointer, so that I can see what I'm carrying.
10. As a reader, I want the held book's place on its shelf to stay visibly empty, so that I can see where it will go back to.
11. As a reader, I want the shelf under the book to light up as a place to drop, so that I know where it will land.
12. As a reader, I want the shelf the book came from not to light up, so that it's clear dropping there changes nothing.
13. As a reader, I want a book dropped on another shelf to appear on it at once, so that the bookcase is always right.
14. As a reader, I want both shelves' plate counts to update as soon as I drop, so that the numbers match what I see.
15. As a reader, I want a book let go of outside any shelf to go back to its place, so that a slip doesn't move it.
16. As a reader, I want a book dropped back on its own shelf to stay as it was, so that nothing is saved for no reason.
17. As a reader, I want Escape to put back the book I'm holding, so that I can change my mind with the keyboard.
18. As a reader, I want a failed save to put the book back on its old shelf with a message saying it couldn't be moved, so that the page never shows something that didn't happen.
19. As a reader, I want the page to scroll when I hold a book near the top or bottom edge, so that I can reach a shelf that's off screen, especially on a phone.
20. As a reader with a mouse, I want a sideways drag along a shelf to still scroll it, so that I don't pick up books by accident.
21. As a reader with a mouse, I want pulling a book up or down out of its shelf to pick it up, so that moving and scrolling stay separate gestures.
22. As a reader on a phone, I want a sideways swipe to still scroll the shelf and a vertical swipe to still scroll the page, so that browsing feels the same as before.
23. As a reader on a phone, I want to press and hold a book to pick it up, so that I can move books with one finger.
24. As a reader on a phone, I want a small lift when the hold picks the book up, so that I know I can now drag it.
25. As a reader, I want a quick tap to still slide the book out and open its card, so that drag and drop doesn't get in the way of looking at a book.
26. As a reader, I want a drag never to open the book's card when I let go, so that moving a book doesn't also open it.
27. As a reader, I want drag and drop to work while a genre chip or a search is filtering the shelves, so that I can move the books I've found.
28. As a reader, I want a book moved while filtered to stay visible if it still matches, so that I can see where it went.
29. As a reader, I want dropping onto an empty shelf ("No books here yet.") to work, so that I can start my first book or finish my last.
30. As a reader, I want moving a book by dragging to earn the same rewards as moving it from its card, so that both ways count the same.
31. As a keyboard or screen-reader user, I want the card's status buttons to stay the way to move a book, so that I'm not left out by a pointer-only gesture.
32. As a screen-reader user, I want each move announced ("The Hobbit moved to Currently reading"), so that I know a drag and drop worked.
33. As a screen-reader user, I want a failed move announced, so that I know it didn't happen.
34. As a reader who prefers reduced motion, I want the book to go back or land without gliding, so that nothing animates more than I want.
35. As a visitor on a friend's shelf, I want their books not to be draggable, so that I can't rearrange someone else's shelf.
36. As a visitor, I want a tap on their book to open its read-only card as before, so that browsing their shelf still works.

## Implementation Decisions

- **House building only.** Everything is in the house folder: the My Shelf page, the bookcase and
  its shelf component. The shared bookshelf store's existing set-status action does the move, so
  nothing shared changes and the server doesn't change.
- **Same move as the card.** A drop calls the same set-status action as the card's status buttons.
  That action already saves optimistically, puts the book back on a failed save and sets the
  move-error message, sets progress to 100 for Finished reading, and gives the move's rewards. The
  page shows the move-error message (in an alert, as the card does) when a drop fails.
- **Pointer events, not native HTML drag and drop.** Native drag and drop doesn't work with touch
  and can't follow the Library's pixel look, so the shelf uses pointer events, as its sideways
  mouse drag already does. The book images' native drag stays turned off.
- **Telling the gestures apart:**
  - *Mouse:* pressing on a book and moving past the existing 5 px drag threshold decides by
    direction. Mostly sideways is the existing scroll drag. Mostly up or down picks the book up.
  - *Touch and pen:* press and hold on a book for about 400 ms without moving more than a few
    pixels picks it up. The book lifts slightly, and a short vibration plays where the device
    supports it. Any movement before then is left to the browser (scroll or swipe). Once a book is
    held, the browser's own scrolling is suppressed for that pointer.
  - *Tap:* a press released without picking up or scrolling slides the book out and opens its card,
    as now. A press that picked a book up never opens the card.
- **Ownership of the gesture.** The shelf component detects the pick-up and reports it to the
  bookcase. The bookcase owns the drag: the floating copy of the book under the pointer, which
  shelf is under it, auto-scrolling the page's scroll area near its top and bottom edges, and the
  drop. It emits one event, a move with the book and the target status, only when the target
  differs from the book's current status. The page handles that event by calling set-status and
  announcing the result. Neither component changes the books it's given.
- **New interface pieces:**
  - The bookcase and its shelves take a `draggable` flag: true on My Shelf, false on a visited shelf.
  - The bookcase emits `move` with `{ book, status }`, alongside `select`.
  - Each shelf exposes its status as the drop target, using the region it already is.
- **Look while dragging:** the held book's place is kept but shown empty (a faint outline), so the
  shelf doesn't jump. A floating copy of the book follows the pointer, slightly tilted with a
  pixel shadow. The target shelf's space lights with a brighter back and a dashed outline in the
  plate's colour, and the book's own shelf isn't lit. Letting go over a target makes the copy land
  on that shelf. Anything else makes it glide back. Both are instant with reduced motion.
- **Where the book lands:** the bookcase doesn't keep a manual order. A moved book takes the place
  the shelf's usual order gives it (the store's order). Dropping between two particular books
  doesn't place it there.
- **Escape** while holding a book cancels the drag and puts the book back. A lost pointer (the
  window losing focus, a cancelled touch) also cancels.
- **Announcements:** a polite live region on the page says "<title> moved to <shelf name>" after a
  successful drop. A failed one shows the move error as an alert.
- **Accessible alternative:** keyboard and screen-reader users keep moving books through the
  card's status buttons. The drag gesture adds no keyboard shortcut.

## Testing Decisions

- **One seam: the My Shelf page in Playwright**, driven by the mouse and by touch through
  Playwright's pointer input. Tests find books by their accessible names and shelves by their
  region names ("<shelf>, <n> books"), and check what the reader sees: which shelf a book is on,
  the plate counts, the card, the alert, the announcement. No class names or internal state.
- **Saves are answered in the test** (the existing user-books route mock in the My Shelf spec), so
  the shared demo shelf stays the same for other tests. A failure is a mocked error response.
- **Tests:**
  - with the mouse, dragging a To be read book down onto Currently reading moves it: it's in the
    Currently reading region, both regions' names and plates show the new counts, and the save
    asked for status reading;
  - dropping on Finished reading saves status read with progress 100;
  - dragging from Finished reading up to To be read works (upwards, skipping a shelf);
  - letting go outside the bookcase, or back on its own shelf, leaves the book where it was and
    sends no save;
  - Escape while holding puts the book back and sends no save;
  - a sideways mouse drag still scrolls a long shelf (the existing laptop test) and picks nothing up;
  - a tap still opens the book's card; a drag never does;
  - a failed save puts the book back and shows "Couldn't move …";
  - a successful move is announced in the live region;
  - while filtering by a genre, a matching book can still be moved;
  - a book in Covers mode can be dragged to another shelf;
  - on a phone, press and hold then drag moves a book, and a quick vertical swipe scrolls the page
    without moving anything;
  - on a visited shelf, dragging a book moves nothing and sends no save.
- **Prior art:** `my-shelf.spec.js` (the laptop sideways-drag test with `page.mouse`, the card
  tests, the save mocks), `visit-room.spec.js` (the visited shelf), `room.spec.js` and
  `furniture.spec.js` (pointer drags in the room).

## Out of Scope

- Reordering books within a shelf, or dropping between two particular books.
- Dragging books in the room's own bookshelf (the room strip), or anywhere outside My Shelf.
- Dragging books off the shelf to remove them (Remove from shelf stays in the card).
- A keyboard drag mode (pick up with Space, move with arrows). The card's status buttons are the
  keyboard way.
- Undo in a toast for a drag move.
- Any server, database or shared store change.

## Further Notes

- Moving a book to Finished reading sets its progress to 100 and gives its rewards through the
  same store action the card uses, so dragging can't be used to earn more than the buttons can.
- On a phone the bookcase is taller than the screen, so dragging from To be read to Finished
  reading relies on the edge auto-scroll. Keep the edge zone big enough to hit with a thumb (about
  60 px).
