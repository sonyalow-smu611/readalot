# Spec: My Shelf as a library bookcase, in the room's colours

Labels: `ready-for-agent`
Owner: Sonz (house building)
Builds on: `room-shelf-page-and-book-card.md`. Look reference: an opened genre bookcase in the Library (`/library`, tap a bookcase)

## Problem Statement

Tapping the bookshelf in My Room opens My Shelf (`/house/shelf`). Right now the page is three
rows of cover tiles on header cards. They work, but they look like a list. The Library already has
a bookcase that feels like real furniture: a wooden frame and a dark back, books standing as spines
with their titles running up them or facing out as covers, a sign over the bookcase, a Back button,
and a Spines / Covers switch. The reader's own shelf should feel like the same kind of object, but
it belongs to their room, so it should be in their room's colours and not a library genre's.

## Solution

My Shelf becomes one bookcase drawn the way the Library draws an opened genre bookcase, with
exactly three shelves, one per reading status, top to bottom: **To be read**, **Currently
reading**, **Finished reading**. Each shelf has a small sign-style plate on its plank that shows
the shelf's name and how many books are on it.

The page header copies the Library's bookcase header: **Back to room** on the left, a sign reading
**My Shelf** in the middle (it drops to its own line on a phone), and the **Spines / Covers**
switch on the right. The search box and genre chips stay, between the header and the bookcase, and
work as they do today.

The wall behind the bookcase is the room's wall colour, and the bookcase's wood comes from the
room's floor and skirting colours, so a Peach room has a Peach shelf and a Night sky room a Night
sky shelf. Spines use one fixed set of warm colours that is the same in every theme.

A shelf with more books than fit across scrolls sideways (swipe, drag, Shift + wheel, Previous /
Next buttons, arrow keys), as rows do today. A tapped book slides up out of the shelf the way it
does in the Library, then the current book card opens: status buttons, the reading-progress slider
while the book is being read, Remove from shelf.

A visited reader's shelf (`/people/:id/room/shelf`) is the same bookcase in **their** room's theme.
It shows their books, has no search box, and its book cards can't change anything, as today.

## User Stories

1. As a reader, I want tapping the bookshelf in My Room to open a bookcase that looks like the Library's, so that my shelf feels like real furniture in my house.
2. As a reader, I want my bookcase to have exactly three shelves, so that I can see at a glance where every book stands.
3. As a reader, I want the top shelf to be To be read, the middle Currently reading and the bottom Finished reading, so that the order matches the bookshelf in my room.
4. As a reader, I want each shelf to have a plate on its plank with its name, so that I know which shelf is which without guessing.
5. As a reader, I want each shelf's plate to show how many books are on it, so that I can see how long my to-read pile is.
6. As a reader, I want the counts to follow the search and genre filter, so that they agree with the books I can see.
7. As a reader, I want my books to stand as spines with their titles written up them, so that the shelf looks like a real bookcase.
8. As a reader, I want spines of different widths and heights, with a book that sometimes leans or two that lie flat, so that the shelf looks lived-in like the Library's.
9. As a reader, I want a Spines / Covers switch, so that I can see the covers face out when I'm looking for a particular book.
10. As a reader, I want the bookcase to open on Spines, so that it first looks like the Library's bookcase.
11. As a reader, I want a Back to room button at the top left, in the same place and style as the Library's Back button, so that the way out is where I expect it.
12. As a reader, I want Back to room to take me back to my room where I was, so that I don't lose my place.
13. As a reader, I want a "My Shelf" sign over the bookcase, styled like the Library's genre signs, so that the page has a clear title.
14. As a reader on a phone, I want the sign to drop to its own line under Back and the switch, so that nothing overlaps on a narrow screen.
15. As a reader, I want the wall behind the bookcase to be my room's wall colour, so that the shelf feels like part of my room.
16. As a reader, I want the bookcase's wood to match my room's floor, so that it looks like furniture from my room and not the Library's.
17. As a reader who changes room theme, I want My Shelf to change with it, so that the two never clash.
18. As a reader, I want spine colours to stay warm and readable in every theme, so that titles are always easy to read.
19. As a reader, I want the search box above the bookcase, so that I can find a book by its title or author.
20. As a reader, I want the genre chips above the bookcase, so that I can show one genre on every shelf.
21. As a reader, I want a shelf with no matching books to say "Nothing matches." while I'm filtering, so that I know the filter emptied it.
22. As a reader, I want an empty shelf to say "No books here yet." when I'm not filtering, so that it doesn't look broken.
23. As a reader with no books at all, I want the "Add your first book" message with links to Discover and Scan, so that I know how to start.
24. As a reader with many books on one shelf, I want that shelf to scroll sideways, so that the bookcase keeps three shelves and doesn't grow extra planks.
25. As a reader with a mouse, I want to drag a shelf sideways without opening the book I started on, so that scrolling doesn't open books by accident.
26. As a reader, I want Previous / Next buttons on a shelf that overflows, so that I can page through it without a trackpad.
27. As a keyboard user, I want each shelf to be one Tab stop, with Left / Right / Home / End moving between its books, so that I can get through the bookcase quickly.
28. As a keyboard user, I want the book I move to scrolled into view, so that focus never goes off-screen.
29. As a reader, I want a tapped book to slide up out of the shelf before its card opens, so that it feels like taking a book down.
30. As a reader, I want the book to stay pulled out while its card is open, so that I can see which book I opened.
31. As a reader, I want the book card to keep the status buttons, so that I can move a book between shelves.
32. As a reader, I want a book I move from its card to appear on its new shelf at once, so that the bookcase is always right.
33. As a reader, I want the reading-progress slider in the card of a book I'm reading, so that I can update my progress from the shelf.
34. As a reader, I want Remove from shelf in the card, with the usual confirmation, so that I can tidy my shelf.
35. As a reader, I want focus to go back to the book's spine or cover when I close its card, even if it moved shelf, so that I keep my place.
36. As a reader, I want ghost spines while my shelf loads, so that the page doesn't jump when the books arrive.
37. As a reader, I want an error and a Retry button if my shelf can't load, so that I can try again.
38. As a reader who prefers reduced motion, I want books to open without sliding and without animation, so that the page doesn't move more than I want.
39. As a screen-reader user, I want each shelf announced as "<shelf name>, <n> books", so that I know where I am.
40. As a screen-reader user, I want each book announced by its title and author, so that I know which book I'm on.
41. As a visitor in a friend's room, I want their bookshelf to open the same bookcase, so that their shelf looks like mine.
42. As a visitor, I want their bookcase in their room's theme, so that it feels like their house.
43. As a visitor, I want the sign to read their name, e.g. "Emma's Shelf", and the back button to say "Back to Emma's room", so that I know whose shelf I'm looking at.
44. As a visitor, I want no search box on their shelf but still the genre chips and the Spines / Covers switch, so that I can browse without tools only the owner needs.
45. As a visitor, I want their book cards to show the book with nothing I can change, so that I can't edit someone else's shelf.
46. As a visitor to a friend with no books, I want "No books yet", so that the empty bookcase makes sense.
47. As a visitor following a link to a reader who doesn't exist, I want "Shelf not found" with a way back to the Cafe, as today, so that I'm not stuck.

## Implementation Decisions

- **New house component, copied from the Library.** The house gets its own bookcase component,
  started from a copy of the Library's bookcase component (which stands books as spines, stacks,
  leaning books or covers) and the parts of the Library's shelf-layout module it needs (item
  sizes, spine items, ink colour for a spine). Nothing in the Library's folder changes and nothing
  is imported from it, because that folder belongs to another teammate. AI_USAGE.md notes the copy
  and where it came from.
- **Three fixed shelves, not packed by width.** The Library fills as many shelves as the books
  need. The house bookcase always draws three shelves, one per status in the shared shelves list
  (To be read, Currently reading, Finished reading). Each shelf lays its books out in one line
  with the Library's spine/stack/lean/cover rules, and scrolls sideways when the line is wider
  than the shelf. The Library's genre props and rolling ladder are left out.
- **Sideways scrolling is the existing shelf-row behaviour**: mouse drag that cancels the click,
  Previous / Next buttons that appear only when the shelf overflows, Shift + wheel, one Tab stop
  per shelf with arrow / Home / End keys, focus scrolled into view. It moves to the new shelf, and
  the old header-card shelf row and its tier are no longer used by My Shelf.
- **Shelf plate.** Each shelf's plank has a small sign-style plate (dark outline, hard pixel
  shadow, like the Library's sign) reading "<label> · <count>". The Previous / Next buttons sit at
  the right end of the same line.
- **Component interface.** The bookcase takes the three shelves (each with status, label and its
  already-filtered books), the colours, the mode (spines or covers), loading, error, the id of the
  open book, and the empty-shelf text. It emits `select` (a book, after its slide-out) and
  `retry`. It never filters or changes books itself; the page owns the books, the search, the
  genre and the mode.
- **Header.** The page draws the Library's three-part header: a back control on the left, a sign
  in the middle, the Spines / Covers chip group (labelled "Show the books by", each chip
  `aria-pressed`) on the right; on a phone the sign goes to its own line. The back control stays a
  link named "Back to room" (or "Back to <name>'s room" when visiting) to the same place it goes
  today. The page goes through the house's existing shell without a second back button.
- **Theme colours.** A small helper in the house folder turns a room theme into bookcase colours:
  the page wall from the theme's wall (shade for the faint pattern, if any), the frame from the
  floor, the light edge and planks from the floor's light tone, the dark edge from the floor
  shade, and the dark back of the bookcase from a deepened floor shade. The skirting colour is
  used for the shelf plates. My Shelf uses My Room's theme, and a visited shelf uses the visited
  reader's theme (already returned with their room). Spines use one fixed warm set, the same in
  every theme, with the Library's dark/light ink rule for titles.
- **Seeded look.** Spine widths, heights, bands, stacks and the leaning book are seeded by the
  shelf and the book (as in the Library), so the bookcase looks the same on every visit and only
  changes when books are added, moved or removed.
- **Search and chips** stay as they are today, between the header and the bookcase: search only on
  your own shelf, chips built from the shelf's genres, one chip filtering all three shelves.
- **Book card unchanged.** Opening a book, moving it, setting progress, removing it, and focus
  going back after close keep today's behaviour. Focus now goes back to the book's spine or cover
  in the bookcase.
- **No server, store, route or shared-component changes.** The same routes, the same shared
  bookshelf store, the same visitor fetch.

## Testing Decisions

- **One seam: the My Shelf page in Playwright**, driven by roles and visible text, as the existing
  My Shelf and visit-room journeys are. Tests check what the reader sees and can do, never class
  names or the layout maths. The current tests that look for the old header card and plank
  (`.shelf-tier`) are replaced by tests on the new structure through accessible names.
- **Regions stay the contract.** Each shelf stays a region named "<label>, <n> book(s)", and each
  book a button whose name starts with its title, so the existing helpers and most existing
  My Shelf and visit-room tests carry over unchanged.
- **New or updated tests:**
  - the three shelves in order, each with its plate showing the label and count;
  - the header: "Back to room" link, "My Shelf" sign heading, Spines / Covers chips with Spines
    pressed first; switching to Covers shows cover images and the same books;
  - search and chips still narrow every shelf, and the counts follow;
  - a shelf with more books than fit shows Next, and Next scrolls it;
  - tapping a book opens the existing book card; moving it from the card puts it on the new shelf;
  - the wall and wood follow the theme: switching the room theme changes My Shelf's wall colour
    (checked through a computed style on the page, as the room-themes test already does for the
    room);
  - a visited shelf shows their name on the sign, their theme, no search box, and a read-only card.
- **Prior art:** `my-shelf.spec.js` (rows, chips, search, card, back), `visit-room.spec.js`
  (visited shelf), `room-themes.spec.js` (theme colours), `library.spec.js` (bookcase header and
  Spines / Covers switch).
- Before finishing: the client build passes and the house and shelf e2e journeys pass.

## Out of Scope

- Any change to the Library's bookcase, its layout module or its look.
- Moving the bookcase into shared components for both buildings (possible later, through a
  reviewed shared-code PR).
- Theme-specific spine colour sets.
- Dragging books between shelves; moves stay in the book card.
- Remembering the Spines / Covers choice between visits.
- The bookshelf drawn inside the room itself (the room strip) and its labels.
- Server, database or store changes.

## Further Notes

- The Library's sign uses each genre's font and board colour. My Shelf's sign uses the town's
  title font with the room's skirting colour as the board, so it reads as part of the house.
- The room's own bookshelf already names its rows "To be read", "Currently reading" and "Finished
  reading". The plates use the same names from the shared shelves list, so the room and the page
  always agree.
