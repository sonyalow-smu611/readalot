# Spec: My Room on desktop, scrollable My Shelf rows, and a furniture library

Labels: `ready-for-agent`
Owner: Sonz (house building)
Builds on: `room-panorama-strip.md`, `room-shelf-page-and-book-card.md`. Style references: `REFERENCE-IMG/16_room_strip_style_kitchen.png`, `REFERENCE-IMG/17_room_strip_style_living_room.png`

## Problem Statement

1. **My Room is stuck in a phone column on a laptop.** The town map (the landing page) fills the whole laptop window. Entering Your house drops the reader into a narrow, rounded phone frame in the middle of the screen. The wide, side-on room is exactly what a wide window shows off best, and right now only a phone-width slice of it is visible.
2. **My Shelf's rows don't scroll on a laptop.** Each shelf on My Shelf (To be read, Currently reading, Finished reading) is a sideways row of covers. With a mouse or trackpad the reader can't reliably get past the first few covers:
   - there's no scrollbar
   - a trackpad swipe doesn't move the row
   - there are no buttons
   - tabbing to a hidden cover doesn't bring it into view
3. **The room can't be furnished in its own style.** The Shop's decorations and pets are smooth vector drawings, and they look pasted onto the pixel-art room. The reader also can't change the furniture that makes the room feel like theirs: they can't swap the reading chair, add plants, hang posters or frames on the wall, or have cats that look like they belong in the room.

## Solution

1. **Desktop view.** On a laptop or desktop window, My Room and My Shelf fill the whole window, the same size as the town map, with no phone frame. The room is drawn larger, still at a whole-number pixel scale, and shows a much wider stretch of the room at once. It still scrolls sideways to the rest. On a phone nothing changes.
2. **Scrollable shelf rows.** Every row on My Shelf scrolls sideways with:
   - a trackpad swipe
   - Shift + mouse wheel
   - a mouse drag
   - a visible thin scrollbar
   - Previous / Next arrow buttons at the row's ends
   - the keyboard: Tab or the arrow keys bring the focused cover into view

   On a phone it scrolls with a finger swipe, as now.
3. **Furniture library.** A set of new pieces, drawn in the room's own pixel style (the town's helpers, palette and 1 px outline), sold in the Shop and placed with the same glowing-spot flow as today's decorations:
   - **3 reading chairs:** Wingback chair, Rocking chair and Papasan chair. A chosen chair replaces the armchair by the window. The armchair stays the default and comes back when the chosen chair is put away.
   - **3 plants:** Monstera in a basket (floor), Fiddle-leaf fig (floor) and Succulent trio (small surfaces: the window seat, side table and nightstand).
   - **3 cats:** Ginger tabby, Black cat and Calico. Each walks around the room on its own with a walk cycle, sits, and now and then curls up to sleep. They replace the Shop's current vector cats.
   - **5 pieces of wall art:** Mountain poster, Moon poster and Book club poster (posters), plus Botanical print and Gold photo frame (picture frames). They hang on new wall spots.

## User Stories

**Desktop view: My Room**
1. As a reader on a laptop, I want My Room to fill the whole window like the town map does, so that entering my house doesn't shrink the app into a phone column.
2. As a reader on a laptop, I want to see a wide stretch of my room at once, so that the room feels like a real place I'm standing in.
3. As a reader on a laptop, I want the room drawn at a whole-number pixel scale, so that the pixel art stays crisp and never blurs.
4. As a reader on a laptop, I want the room drawn large enough that its full height fills the window, so that it isn't a small strip with empty space round it.
5. As a reader on a laptop, I want to keep scrolling sideways to the parts of the room that don't fit, with the wheel, a drag or the arrow keys, so that I can still reach everything.
6. As a reader on a laptop, I want the bar of places (Window, Chair, Bookshelf, Clock, Corkboard, Bed) to still slide the view to each part, so that I can jump straight there.
7. As a reader on a laptop, I want the bar of places, the room menu and the credit chip placed sensibly for a wide window, so that they don't stretch across the whole screen.
8. As a reader on a laptop, I want the Currently Reading card, the Quote of the Day and the book card sized for a laptop and centred, not stretched to most of a wide window, so that they stay easy to read.
9. As a reader on a very wide but short window, I want the room centred if it would be narrower than the window, so that it never looks broken.
10. As a reader who resizes the window, I want the room to redraw at the right scale and keep the part I was looking at in the middle, so that resizing doesn't throw me somewhere else.
11. As a reader on a phone, I want My Room to look and work exactly as it does now, so that nothing I'm used to changes.
12. As a reader moving between the town and my house on a laptop, I want both to be the same size, so that going inside feels like one app.

**Desktop view: My Shelf**
13. As a reader on a laptop, I want My Shelf to fill the window as well, so that it matches the room I opened it from.
14. As a reader on a laptop, I want My Shelf's content kept to a comfortable width, so that the search box and chips don't stretch edge to edge.
15. As a reader on a laptop, I want more covers visible in each row on a wide window, so that I see more of my shelf at once.

**Scrollable shelf rows**
16. As a reader with a trackpad, I want a sideways swipe over a row to scroll that row, so that I can browse it naturally.
17. As a reader with a mouse, I want Shift + wheel over a row to scroll it sideways, so that I can browse without a trackpad.
18. As a reader with a mouse, I want to drag a row sideways to scroll it, so that it works the same as on a phone.
19. As a reader with a mouse, I want Previous and Next buttons on a row with more covers than fit, so that I can page through it with clicks.
20. As a reader, I want the Previous button disabled at the start of a row and Next disabled at its end, so that I know when I've seen everything.
21. As a reader, I want a row whose covers all fit to show no arrow buttons, so that the page stays tidy.
22. As a reader, I want a thin scrollbar under a row that scrolls, so that I can see there's more to the side.
23. As a reader using the keyboard, I want Tab to bring the focused cover into view, so that I can always see what I'm on.
24. As a reader using the keyboard, I want the left and right arrow keys to move between covers in a row, so that I can browse a row without tabbing through every cover.
25. As a reader on a phone, I want to swipe a row with my finger, as now, so that nothing changes for me.
26. As a reader, I want the page to keep scrolling up and down when I use a plain mouse wheel over a row, so that a row never traps me.
27. As a reader, I want tapping a cover to still open the book card, and a drag not to open it, so that scrolling never opens a book by accident.
28. As a reader, I want the rows to keep their names and counts (for example "To be read · 3"), the genre chips and the search, so that only the scrolling changes.
29. As a reader, I want focus to return to the book's cover when I close its card, scrolled into view, so that I don't lose my place.

**Furniture library: shopping and placing**
30. As a reader, I want the Shop to have Reading chairs, Plants, Cats and Wall art groups, so that I can find furniture by kind.
31. As a reader, I want each item in the Shop shown in the room's own pixel style, so that I know what it will look like in my room.
32. As a reader, I want each item to have a price in credits, so that furnishing my room is something I earn.
33. As a reader, I want to buy an item and find it in my inventory, as with today's decorations, so that buying works the way I know.
34. As a reader, I want to pick an item and see glowing spots where it can go, so that I know where to place it.
35. As a reader, I want to move a placed item to another spot, or put it back in my inventory, so that I can rearrange my room.
36. As a reader, I want each placed item to have a name I (or a screen reader) can hear, so that I know what's where.

**Reading chairs**
37. As a reader, I want three reading chairs to choose from (Wingback, Rocking chair, Papasan), so that my reading nook feels like mine.
38. As a reader, I want a chosen chair to stand where the armchair stands, so that the reading nook stays in one place.
39. As a reader, I want only one reading chair in the room at a time, so that picking a new one swaps it.
40. As a reader, I want the swapped-out chair to go back to my inventory, so that I can switch back later.
41. As a reader, I want the original armchair to come back when I put my chosen chair away, so that the nook is never empty.
42. As a reader, I want the book on the coffee table to still open my Currently Reading card whichever chair I have, so that the chair is only a look.
43. As a reader, I want the chairs to sit on the rug with a shadow on the wall like the other furniture, so that they look part of the room.

**Plants**
44. As a reader, I want three plants (Monstera, Fiddle-leaf fig, Succulent trio), so that I can make the room greener.
45. As a reader, I want the floor plants on the room's floor spots, so that big plants stand on the floor.
46. As a reader, I want the Succulent trio on small surfaces (the window seat, side table, nightstand), so that a small plant sits on furniture.

**Cats**
47. As a reader, I want three cats to choose from (Ginger tabby, Black cat, Calico), so that I can have a pet I like.
48. As a reader, I want my cat to walk around the room on its own, so that the room feels alive.
49. As a reader, I want my cat to have a walking animation, facing the way it walks, so that it looks like it's really walking.
50. As a reader, I want my cat to stop, sit, and sometimes curl up to sleep, so that it behaves like a cat.
51. As a reader, I want my cat to stay inside the room and on the floor, so that it never walks through walls.
52. As a reader, I want more than one cat at a time, each walking its own way, so that a room full of cats feels lively.
53. As a reader who prefers less motion, I want my cats to sit still instead of walking, so that the room stays calm.
54. As a reader, I want the cats darker at night and greyer in the rain, like the rest of the room, so that they don't glow out of place.

**Wall art**
55. As a reader, I want five pieces of wall art (Mountain poster, Moon poster, Book club poster, Botanical print, Gold photo frame), so that I can decorate my walls.
56. As a reader, I want wall art to hang on glowing spots on the wall, so that I know where it can go.
57. As a reader, I want wall art to cast the same soft shadow on the wall as the room's own pictures, so that it looks hung, not floating.
58. As a reader, I want wall art never to cover the window, the clock, the corkboard or the bookshelf, so that the parts I tap stay reachable.

**All furniture**
59. As a reader, I want every new piece darker at night, tinted in the rain and lit by the lamps like the rest of the room, so that it belongs there.
60. As a reader, I want every new piece drawn at the same pixel scale with the same 1 px outline as the room, so that nothing looks out of place.
61. As a reader, I want placed furniture still there when I go to My Shelf and come back, so that my room stays as I left it during my visit.

**Teammates**
62. As a teammate, I want the furniture library to be one list of items (name, kind, price, sprite, where it can go), so that I can add a new piece by adding a line and a sprite.
63. As a teammate, I want the house README to explain how to draw and add a furniture item, so that I can extend the library without reading the room's code.
64. As a teammate who owns the Library, I want the shared Discover carousel left as it is, so that my page doesn't change because My Shelf changed.

## Implementation Decisions

**Desktop view**
- My Room and My Shelf opt in to the town's wide layout through the route's existing `wide` flag. The phone frame already lets a `wide` page fill the window on screens at least 576 px wide and 600 px tall. Below that, nothing changes. This is a change to the shared router, so it goes through a pull request a teammate reviews.
- The room's existing sizing rule stays: the scale is the largest whole number of device pixels per art pixel at which the room's height fits, and spare height becomes floor and then wall. On a laptop that gives a scale of 2 CSS px per art pixel or more, so the room (1240 art pixels wide) is still wider than the window and still scrolls.
- If the room would be narrower than the window at that scale, it's drawn one size up, as long as that cuts no more than 24 art px of plain wall (above the bunting) off the top. (A 1440 × 900 window at one device pixel per CSS pixel needs this, because the space under the header is just under two room-heights.) Only if that isn't enough (a very wide, short window) is the room centred, on the wall colour. *(Changed while building: centring alone left a laptop's room small.)*
- The bar of places takes taps only on its buttons, so glowing spots and pieces between them stay reachable.
- The overlays get a maximum width and are centred on wide windows:
  - the Currently Reading card
  - the Quote of the Day
  - the book card (today 80% of the frame)
  - the bar of places
  - the first-visit hint
  - the room menu

  On a phone they keep today's size and position.
- My Shelf's content keeps the shell's standard container width on wide windows.
- The Book Details page (`/books/:id`) belongs to shared views and isn't made wide here.

**Scrollable shelf rows**
- My Shelf stops using the shared Discover carousel (Swiper) and uses a new house component for a shelf row:
  - a heading (emoji, name and count)
  - a natively scrolling, scroll-snapping row of the existing book tiles
  - Previous / Next buttons
  - the empty message
- The shared carousel and the Library are untouched.
- The row's interface: props for the title, the emoji, the books, loading and the empty message; it emits `select` with the book, like the carousel it replaces. My Shelf's `data-shelf` hooks, its focus return after closing a card, and its region names ("To be read, 3 books") stay as they are.
- Scrolling:
  - native sideways overflow, so trackpad swipes, Shift + wheel, touch and the scrollbar all work
  - a pointer drag with the mouse scrolls the row. A drag of more than a few pixels cancels the click that would open a book
  - a plain vertical wheel is left to the page
- **Buttons:** the Previous / Next buttons scroll by about one row width and are labelled "Previous books in <shelf>" and "Next books in <shelf>". They're disabled at either end and hidden when everything fits. They update on scroll and on resize.
- **Keyboard:** focusing a cover scrolls it into view. Left / Right move focus to the neighbouring cover in the same row. Each row has one tab stop, a roving tabindex on the covers.
- Covers get wider rows on wide windows, with the same tile size, so more covers show at once.

**Furniture library**
- **Art.** Every piece is drawn by the room's art script with the town's helpers, the room's palette and the 1 px outline, written into the room's sprite folder alongside the existing sprites, with sizes in the sprite metadata.
  - Chairs are drawn to the armchair's footprint (about the same width and height), so they fit the reading nook.
  - Each cat has frames in one sheet: two walk frames, sit, and sleep. They're drawn facing right and flipped for left.
  - The Shop shows each piece's sprite, scaled by a whole number with pixelated rendering, in place of the vector drawing.
- **One list.** A furniture list in the house folder holds each item's id, name, kind (`chair`, `plant`, `cat`, `wall-art`), Shop group, price, sprite and where it can go:
  - chair: the reading-chair spot
  - floor plant: room floor spots
  - small plant: small surfaces
  - cat: roams
  - wall art: wall spots

  The shared Shop catalog takes these entries in, so the Shop, inventory and placing flow keep working as they do. This is a small change to shared code and goes through a teammate's review.
- **The Shop's cats.** The Shop's five vector cats are replaced by the three pixel cats. Dogs and the bird stay as they are. Decorations live in memory only today, so no saved placements break.
- **Prices (credits):**

  | Kind | Items and prices |
  |---|---|
  | Reading chairs | Wingback 140, Rocking chair 120, Papasan 160 |
  | Plants | Monstera 60, Fiddle-leaf fig 55, Succulent trio 30 |
  | Cats | Ginger tabby 80, Black cat 85, Calico 90 |
  | Wall art | Posters 25 each, Botanical print 40, Gold photo frame 45 |

  The reader starts with 480 credits, as now.
- **Spots.**
  - **Reading chair:** one new kind of spot, glowing on the armchair's seat. Placing a chair there replaces the armchair in the room's drawing and returns any chair already there to the inventory. Putting it away brings the armchair back. The Chair part, the open book's `chair` action and the floor lamp don't move.
  - **Wall art:** new wall spots on open stretches of wall, about five, kept clear of the window, clock, corkboard, bookshelf, light switch and the existing frames. Each spot sits at a fixed `at` point, and a piece hangs centred on it.
  - **Plants:** use the existing small-surface and room-floor spots.
  - Spot ids stay stable once added, so placements stay put if the art moves.
- **Drawing placed furniture.**
  - **Chairs, plants and wall art:** painted into the room's canvas with its layer (`furniture` for chairs and floor plants, `wall` for wall art and surface plants). They pick up the room's wall shadows, weather tints and lamp light. A transparent button over each keeps them tappable, as the room's own tappable parts are.
  - **Cats:** move every frame, so they're drawn on their own pixel canvas layer over the room, at the same scale. The room's current tint for weather and time of day is applied to that layer.
- **Cats' behaviour.**
  - Each cat picks a point along the room's walk line, walks there at a steady pace with its walk frames, faces the way it walks, then waits. While waiting it sits, or now and then sleeps for longer.
  - It stays between the walk line's ends.
  - With reduced motion, cats sit still at a spot.
  - Several cats move on their own.
- **Names.**
  - Placed items are named for screen readers by their name (for example "Rocking chair", "Ginger tabby").
  - The reading chair's button keeps the Chair part's role.
  - The glowing spots are named "Put <item> on <place>". Wall spots are "on the wall by the <neighbour>".
- **README.** The house README gets a "Furniture library" section: how to draw an item, add it to the list, pick its kind and spots, and redraw.

## Testing Decisions

- **One seam: Playwright end-to-end.** It goes through labelled buttons, visible text, region names and the room's scroll position, as the existing room and My Shelf journeys do. It doesn't test internals: no component unit tests, no checks on sprite coordinates or the furniture list's shape.
- **A good test** does what a reader does: opens the page, scrolls, buys, places. It checks what the reader sees: sizes, names, positions, scroll position, counts. It survives a refactor of the room's code.
- **Desktop view** (a desktop-sized viewport, for example 1440 × 900, set per test):
  - My Room and My Shelf fill the viewport, as the town does: the page's width and height equal the viewport's, with no phone frame
  - at the default phone-sized viewport they stay in the column
  - the room still scrolls sideways and the bar of places still slides to each part
  - the room's pixels stay whole-number crisp, reusing the existing crispness check
  - the book card and Currently Reading card stay within a readable width, centred
- **Scrollable rows** (one shelf given about 20 books by answering the shelf request in the test, as My Shelf's tests already answer saves):
  - Next scrolls the row and Previous is disabled at the start
  - Next becomes disabled at the end, with the last cover visible
  - a sideways wheel (deltaX) scrolls the row
  - a mouse drag scrolls the row and doesn't open a book; a click opens it
  - the arrow keys move focus along the row and bring covers into view
  - a row whose covers fit shows no buttons
  - a plain vertical wheel scrolls the page
- **Furniture library:**
  - the Shop lists the four groups with 3 chairs, 3 plants, 3 cats and 5 pieces of wall art, each with its price
  - buying a chair and placing it on the reading-chair spot shows it by name in the room and removes the armchair; the open book still opens Currently Reading; placing a second chair sends the first back to the inventory; putting the chair away brings the armchair back
  - a floor plant goes on a floor spot and the Succulent trio on a small surface, each named in the room
  - wall art shows glowing wall spots; once placed it's named in the room, and the window, clock, corkboard and bookshelf stay tappable
  - a placed cat's position changes over time (polled) and stays within the room; with reduced motion it stays put
  - furniture placed in the room is still there after going to My Shelf and back
- **Prior art:**
  - the room journey's Shop test ("buying a decoration spends credits and it can be placed in the room"), its scrolling, crispness and bar-of-places tests
  - My Shelf's journey, with its row region names and answered requests
  - the town journey, for the wide layout
- Tests run with the rest of the suite. The room's art is regenerated by the art script before tests that need new sprites.

## Out of Scope

- Saving the room's furniture, credits and inventory between visits or devices. They stay in memory, as today's decorations do.
- Making the Book Details page, the other buildings or other shared pages wide on desktop.
- Redrawing the Shop's dogs, bird, vases, statues, sofas, beanbags, mattresses and dishes in pixel art.
- Cats using the food and water dishes, interacting with each other, climbing furniture, or reacting to taps beyond today's pet behaviour.
- Changing the shared Discover carousel or the Library page.
- Visitors walking in the room.
- A separate gallery page for the furniture library. The Shop is where readers see it, and the README is where teammates see it.

## Further Notes

- **Shared files touched**, each needing a teammate's review: the router (the `wide` flag on My Room and My Shelf) and the shared Shop catalog (taking in the furniture list and replacing the cats). Everything else stays in the house folder.
- Record the new art, components and furniture list in AI_USAGE.md, with the top-of-file comment on new files.
- Pick the wall spots by checking the regenerated room picture for open wall. The room is crowded with built-in frames between the chair and the bookshelf, so most wall art will hang by the window seat, over the dresser and over the bed.
- On a phone, the reading chair swap and the wall art also work as described. The desktop view only changes the size.
