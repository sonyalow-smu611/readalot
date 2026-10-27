# Spec: Labelled bookshelf, My Shelf page, and the book card in the town's style

Labels: `ready-for-agent`
Owner: Sonz (house building)
Builds on: `room-panorama-strip.md`. Layout reference: the Library page (`REFERENCE-IMG/18_my_shelf_layout_library.png`)

## Problem Statement

Three things in My Room still feel unfinished next to Dylan's town and the café:

1. **The book card looks like a different app.** Opening a book (from the shelf, or on its own page) shows a dark walnut-framed card on brown paper. The town's place cards and the café page use a light cream surface, a fine border, round corners, pill tags in the building's colour and serif titles.
2. **The bookshelf's rows have no visible names.** The reader can't see which row is "to be read", which is "currently reading" and which is "finished".
3. **There's no way to see the whole shelf at once.** The room shows only what fits on the bookshelf's three rows. There's no list of all the reader's books, nothing to sort them by genre, and no search.

## Solution

- **Book card:** restyled in the town's design system, the same as the town's place cards and the café page.
- **Visible row labels** on the bookshelf in the room: **To be read**, **Currently reading** and **Finished reading**.
- **Books stay tappable:** tapping a single book on the bookshelf still takes it off the shelf and opens it, as now.
- **My Shelf page:** tapping the bookshelf itself (anywhere but a book) opens a new page laid out like the Library page:
  - a search box, then genre chips across the top
  - one row each for To be read, Currently reading and Finished reading, each a sideways row of covers
  - the chips filter every row to one genre
  - tapping a cover opens the same restyled book card

## User Stories

**The book card**
1. As a reader, I want the book card to look like the town's place cards (a cream surface, a fine border, round corners, a soft shadow), so that opening a book feels part of the same app.
2. As a reader, I want the book card's colours and fonts to match the café page (warm dark text, muted captions, serif titles, cream pill tags), so that every page reads the same way.
3. As a reader, I want the book's shelf shown as a pill in the building's colour at the top of the card, like the place card's tab, so that I see at a glance where the book lives.
4. As a reader, I want the card's main action as a filled button in the building's colour, like the place card's "Go inside", so that I know what the card wants me to do.
5. As a reader, I want the shelf buttons (Want to read / Reading / Finished reading) to look like the town's chips, the chosen one filled, so that changing a book's shelf feels familiar.
6. As a reader, I want genres shown as the café's cream pill tags, so that they match the reader cards I see there.
7. As a reader, I want Synopsis, Rating and Reviews to keep working exactly as now, only restyled, so that nothing I use goes missing.
8. As a reader, I want the progress slider, Review, Rate, Remove from shelf with Undo, and Open book page to keep working exactly as now, so that nothing I use goes missing.
9. As a reader, I want the Book Details page to use the same restyled card, so that a book looks the same wherever I open it.
10. As a reader, I want the close button in the town's style (the place card's ×), so that closing looks the same everywhere.
11. As a reader on a phone, I want the card to keep its size and position, so that only its look changes.

**The labelled bookshelf**
12. As a reader, I want each row of the bookshelf in my room labelled **To be read**, **Currently reading** and **Finished reading**, top to bottom, so that I know which row is which.
13. As a reader, I want the labels readable at any screen size, so that the room's pixel scale never makes them blur or shrink away.
14. As a reader, I want the labels in the room's style (a small plate on each shelf's board, like the rest of the room's pixel art), so that they look like part of the bookshelf.
15. As a screen reader user, I want each row named the same way it's labelled, with how many books it holds, so that what I hear matches what others see.
16. As a reader, I want to tap a single book on the bookshelf and have it come off the shelf and open, exactly as now, so that the quick way still works.

**Opening My Shelf**
17. As a reader, I want tapping the bookshelf itself (not a book) to open a page with all my books, so that I can see the whole shelf at once.
18. As a reader, I want the bar of places' Bookshelf chip to keep sliding the room to the bookshelf, so that moving around the room still works the same.
19. As a reader whose room can't load, I want the Bookshelf chip to open My Shelf, so that I can always reach my books.
20. As a reader, I want a clear back button on My Shelf that returns me to my room, at the same spot, so that I don't lose my place.
21. As a reader, I want My Shelf to keep the house's header (its colour, "Your house", my name), so that I know I'm still in my house.

**The My Shelf page**
22. As a reader, I want My Shelf laid out like the Library page (search box, chips, then rows of covers), so that it feels familiar.
23. As a reader, I want three rows, **To be read**, **Currently reading** and **Finished reading**, each with how many books it holds, so that my books are grouped by where I am with them.
24. As a reader, I want each row to scroll sideways through its covers, like the Library's rows, so that a long shelf doesn't make a long page.
25. As a reader, I want genre chips across the top, made from the genres of my own books, so that I can sort my shelf by genre.
26. As a reader, I want an "All" chip, chosen at first, so that I can always see every book.
27. As a reader, I want choosing a genre chip to filter all three rows to books of that genre, so that I can find, for example, the fantasy I haven't started yet.
28. As a reader, I want the chosen chip filled and the others outlined, as on the Library page, so that I can see which filter is on.
29. As a reader, I want the genre chips ordered by how many of my books have that genre, ties alphabetical, so that my main genres come first.
30. As a reader, I want a search box that filters my rows by title or author as I type, so that I can find one book quickly.
31. As a reader, I want a row with nothing matching to say so ("No books here yet", or "Nothing matches" while filtering), so that an empty row isn't confusing.
32. As a new reader with an empty shelf, I want My Shelf to tell me how to add my first book (Discover, Scan a cover), so that I know what to do next.
33. As a reader, I want each cover to show the book's cover picture (or its title on a plain cover when there's none), with its title and author under it, as on the Library page, so that I recognise my books.
34. As a reader, I want to tap a cover and see the same restyled book card, so that books behave the same everywhere.
35. As a reader, I want a book I move to another shelf from the card to move to that row when I close it, so that the page stays right.
36. As a reader, I want a book I remove from my shelf to disappear from its row (with Undo), so that the page stays right.
37. As a reader, I want closing the card to return me to the cover I tapped, so that I keep my place.
38. As a reader, I want My Shelf's colours and type to match the town's cards and the café, so that it belongs with the rest of the app.
39. As a keyboard user, I want to reach the search box, every chip and every cover with Tab, and open a cover with Enter, so that the page works without a pointer.
40. As a screen reader user, I want the chips to be a labelled group with the chosen one announced as pressed, and each row to be a labelled section, so that I understand the page.
41. As a reader on a slow connection, I want the rows to show quietly while my shelf loads, then fill in, so that the page never looks broken.
42. As a reader whose shelf fails to load, I want a short message and a Retry button, so that I can try again.

**For Sonz and teammates**
43. As Sonz, I want My Shelf to live in the house building's folder, so that it stays mine to change.
44. As a teammate, I want any shared change (a new route, a back target in the shared building header, the shared book card) to be small and reviewable, so that my pages don't break.

## Implementation Decisions

**The book card, in the town's design system**
- The shared book card (its frame, and the book details inside it) drops the walnut frame and paper texture. It takes the design-system look the town's place card already uses:
  - a cream surface with a fine 1 px line border
  - the modal radius and the place card's soft shadow
  - warm dark text and muted captions
  - Georgia (the design system's only family) for titles and body
- **Building colour:** the card takes an accent colour from whoever shows it. In the room and on My Shelf that's the house's colour from the town's places. Elsewhere it defaults to the design system's primary walnut.
- **Inside the card:**
  - a pill tab in the accent naming the book's shelf
  - genres as cream pill tags, like the café's tags
  - shelf buttons as a toggle group: selected filled with the accent, the others outlined
  - one filled accent button for the main action
  - quieter actions in the café's secondary style
  - the close button as the place card's ×
- **Unchanged:** where the card appears, its size and position, and everything it does.
- **Shared change:** the card and the Book Details page are shared, so this restyle goes to a teammate for review, as the buildings README asks for shared changes.

**Row labels on the bookshelf**
- Each of the bookshelf's three rows gets a label plate on its board: **To be read**, **Currently reading**, **Finished reading**, top to bottom.
- The plates are page elements placed over the canvas from the layout's shelf rows, like the hotspots. Text drawn into the canvas would be too small to read at the room's pixel scale.
- They're styled as small pixel plates: cream face, the room's dark 1 px outline, bold small caps, no rounding.
- The plates aren't buttons: a tap on one falls through to the bookshelf.
- Each row's accessible name changes to match its label ("Currently reading shelf, 2 books"). The visible plate and the screen-reader text are one element.
- The same three names are used everywhere the shelf is listed: the row labels, My Shelf's rows and the book card's shelf tab.

**Tapping the bookshelf**
- The bookshelf's own button (behind the book buttons) opens My Shelf instead of sliding the room to it.
- Single books stay separate buttons on top, so tapping a book still opens it as now.
- The bar of places' Bookshelf chip still slides the room.
- When the room can't load, the Bookshelf chip opens My Shelf. My Shelf replaces the old pull-up "Your books" list, so the shelf is listed in one place only.
- **Returning:** the room remembers how far along it was scrolled, and returning from My Shelf puts it back there.

**The My Shelf page**
- A new page in the house building, at its own address under the house (for example `/house/shelf`), shown inside the shared building header with the house's title and colour.
- **Back button:** the header's back button reads "Back to room" and returns to the room. This needs a small optional back target and label on the shared building header, defaulting to the town, which is a shared change.
- **Route:** the page's route is added to the shared router. That's also a shared change.
- **Layout, following the Library page:** a search box, then a single-select chip group, then three shelf rows using the same shelf-row component the Library uses (title, emoji, sideways covers, loading and empty states). Using the same component keeps the two pages identical in look.
- **Rows:** To be read, Currently reading and Finished reading, in that order, each with its count. "See all" isn't shown.
- **Chips:** "All" first, then each genre found in the reader's books (each book's genres), by number of books, ties alphabetical. One chip at a time. A genre chip filters all three rows.
- **Search:** filters titles and authors as you type, together with the chosen chip.
- **Data:** the reader's existing shelf store. No new API.
- **Status changes:** a status change or removal made in the book card updates the store, and the rows follow.
- **Tapping a cover:** opens the restyled book card as a dialog over the page, with the same details as in the room, but without the room's fly-out animation. Closing returns focus to the cover.
- **States:** loading uses the shelf component's skeletons. An error shows a message and Retry. An empty shelf shows "Add your first book" with Discover and Scan a cover.

**Unchanged interfaces**
- The room component's props and events are unchanged, apart from the bookshelf's tap now asking the room page to open My Shelf.
- The book card's props are unchanged, plus an optional accent.

## Testing Decisions

- **One seam, as before: the Playwright journeys** for the room, the bookshelf and Book Details. They drive the room and the pages through what a reader sees and does: roles, labels, positions, results of taps.
- **Tests that change, because the behaviour they describe changes on purpose:**
  - **Row names:** the checks that read the rows' names ("To be read / Reading / Finished shelf, N books", and "Reading shelf, 2 books" after starting a book) move to the new names (To be read, Currently reading, Finished reading).
  - **Tapping the bookshelf:** "the bookcase turns you to your books" (tapping the bookshelf slides the room and opens no page) becomes "tapping the bookshelf opens My Shelf". Tapping a book still opens the book.
  - **When the room can't load:** "without the room's pictures" (the Bookshelf chip opens the "Your books" list) moves to My Shelf: same rows, same book opening and saving, same empty-shelf message.

  No other existing test changes.
- **New tests:**
  - the three visible row labels on the bookshelf, top to bottom
  - tapping a book still opens it, and tapping the bookshelf opens My Shelf
  - My Shelf's three rows hold the right books by status, with counts
  - the genre chips come from the reader's books, "All" first, and choosing one filters every row
  - search filters by title and author
  - opening a cover shows the book card, and moving the book to Reading moves it to the Currently reading row
  - Back to room returns to the room at the same spot
  - the empty shelf message, and the error with Retry
- **Look:** the book card's restyle is checked by eye against the town's place card and the café page, from side-by-side screenshots at phone and laptop size. Tests don't check colours or class names.
- **Prior art:** the bookshelf journey (shelf rows by position, the book card, saving shelf changes, focus returning after close), the Library page's chips and rows, and the town journey's place card.

## Out of Scope

- Changes to the Library page, the café page or the town.
- New shelf data: no ratings or sorting beyond genre and search, and no new API.
- "See all" pages for My Shelf rows.
- Multi-select genre filters.
- Redrawing the bookshelf's art (only label plates are added).
- Restyling other shared components (modals, Book Details tabs' contents beyond colours and type).

## Further Notes

- **Shared changes needing a teammate's review:**
  - the book card and Book Details page restyle
  - an optional back target and label on the building header
  - the new route
- **Reference image:** the screenshot of the Library page Sonz attached is the layout reference, saved as `REFERENCE-IMG/18_my_shelf_layout_library.png`.
- **Shelf names:** the design system's README names the reading-status toggle "Want / Reading / Read". The shelf names here ("To be read", "Currently reading", "Finished reading") follow Sonz's wording for the room, and are used everywhere the shelf is shown.
