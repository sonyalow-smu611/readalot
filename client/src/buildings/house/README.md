# Your house: My Room

Owner: Sonz. My Room is one wide pixel-art picture of the room, side on, that the reader moves
along sideways. It's drawn in the town's style, using the town's own drawing helpers.

| File | What it does |
|---|---|
| `HouseView.vue` | The building's entry view, inside the shared `BuildingShell` |
| `RoomView.vue` | The room page: the room, the Currently Reading card, book details, modals, the menu. With `visiting`, someone else's room |
| `VisitView.vue` | Someone else's room (`/people/:id/room`), opened from their profile in the Cafe |
| `ShelfView.vue` | My Shelf (`/house/shelf`): every book, by shelf, with genre chips and a search. Opened by tapping the bookshelf. A cover opens the genre page's book card (`BookPreviewModal`), with the progress slider and Remove from shelf. At `/people/:id/room/shelf`, the visited reader's shelf, whose card has no status buttons |
| `furniture.js` | **The furniture library:** the pieces in the room's pixel style that the Shop sells (the Shop sells nothing else) |
| `visitors.js` | Other readers' rooms: the Cafe's sample readers, their books in the shelf's shape, the furniture in each room and its theme |
| `themes.js` | **Each house's look:** wall and floor colours, and its own curtains, bedding, lamps and rug |
| `lamps.js` | The lamps, on or off, for the visit (My Room and each room visited keep their own) |
| `components/PlacesMenu.vue` | The Places button in the room's top left corner and its list of places |
| `notes.js` | Notes left on readers' notice boards, kept per reader in this browser |
| `components/RoomStrip.vue` | The room itself: scrolling, the tappable spots, the shelf's name plates, books, furniture, cats. Takes the furniture and whether it can be edited from the page |
| `components/VisitorBookDialog.vue` | A book off someone else's shelf in their room: what it is and which shelf, with nothing to change |
| `components/NoteComposer.vue` | The Leave a note card |
| `components/NoticeBoard.vue` | A visited reader's notice board: the Quote of the Day, then the notes left there |
| `components/ShelfRow.vue` | One shelf on My Shelf, drawn as the genre page's shelf tier (header card, covers, plank): a sideways row of covers that scrolls by swipe, wheel, drag, buttons or arrow keys |
| `components/DecorArt.vue` | A decoration's picture in the Shop and inventory: a furniture piece's own sprite, kept crisp |
| `components/BookDialog.vue` | A book's card over the room (remove with Undo included) |
| `useRemoveBook.js` | Remove from shelf for the room's and My Shelf's cards: ask first (unless told not to), then Undo in a toast |
| `components/WindowView.vue` | The view through the window: sky, weather and the town across the street |
| `strip/layout.js` | **What stands where.** Every piece, the parts of the room, decoration spots, lights |
| `strip/placement.js` | **Where a decoration may stand:** the wall, the floor and the small surfaces, and the room kept between pieces |
| `strip/palette.json` | The room's colours, used by the art script and the room alike |
| `strip/paint.js` | Paints the layout onto the canvas, with the light for the weather and time of day |
| `strip/books.js` | The reader's books on the shelf |
| `strip/flight.js` | A book coming off the shelf and opening |
| `strip/scroll.js` | Wheel, drag, arrow keys and sliding to a part of the room |
| `strip/sprites.json` | Made by the art script: each sprite's size and the points the room needs from it |
| `assets/room-still.png` | The picture shown until the room has loaded, or when it can't load |

The art itself is drawn by `client/scripts/room-art/room.js` into `client/public/room/strip/`.
Redraw it with `npm --workspace client run draw-room`.

## Coordinates

Everything is in **art pixels**, the pixels of the sprites:

- `x` runs left to right from the room's left wall. The room is `ROOM.width` wide (1240).
- `y` runs down from the top of the room as designed (`ROOM.height`, 420). The wall meets the
  floor at `ROOM.floor` (400). Furniture stands with its feet at 404, a little into the floor.

On screen, one art pixel is a whole number of device pixels, the largest at which the room's
height fits. Any height to spare becomes more floor at the bottom (clear of the round room menu),
then more wall at the top.

## Moving a piece

Find it in `PIECES` in `strip/layout.js` and change its `x`, or its `y` to move it up or down.
`y` is the piece's **bottom** edge, so something standing on furniture uses the top of that
furniture as its `y`.

## Adding a piece

1. **Draw the sprite** in `client/scripts/room-art/room.js` with `add(id, width, height, draw)`,
   using the town's helpers: `R` (rectangle), `P` (pixel), `E` (ellipse), `fillPoly` and `shade`,
   plus the room's `panel`, `RR` (round rectangle), `L` (line) and `leaf`. Take colours from `C`
   (the palette). `add` gives the sprite the town's 1 px outline.
2. **Redraw:** `npm --workspace client run draw-room`. Check the new PNG in
   `client/public/room/strip/`.
3. **Place it:** add a line to `PIECES` in `strip/layout.js`:

   ```js
   { sprite: 'my-lamp', x: 520, y: 404, layer: 'furniture' },
   ```

   `layer` is one of:
   - `wall`: hangs on the wall and casts a flat shadow on it
   - `hang`: hangs from the ceiling on a string drawn up to the top
   - `floor`: lies on the floor, like the rug
   - `furniture`: stands on the floor and casts a shadow on the wall
   - `front`: stands in front of the furniture

   Pieces are drawn layer by layer, and in list order within a layer.

### Optional fields

- **`lit`:** the sprite to show while a lamp is on (lamps are switched by tapping them; see `lamps.js`). To light the room round it, give the sprite
  a `glow` point in its `meta` and add it to `LIGHTS`, as the floor lamp is.
- **`action`:** what tapping the piece does: `window`, `chair` (the Currently Reading card),
  `bookshelf`, `clock` or `corkboard`. The button covers the whole sprite, grown to finger size
  if it's small.
- **`id`:** needed when something looks the piece up, like the lights or the bookshelf's rows.

## Other things in the layout

- **`PARTS`:** the Places menu, left to right. `at` is the x the view centres on.
- **`SLOTS`:** the glowing spots a decoration can be put on with a tap. Wall art, plants and the
  succulents can also stand anywhere else they fit (see "Putting pieces anywhere" below); a spot
  glows only while the piece fits on it. Keep their `zone` and `x` as they are, or the visited
  readers' furniture will move. You can change `at`, where a slot is drawn.
- **`WALK`:** the line along the floor that pets walk on. It's also where visitors could walk later.
- **`LIGHTS`:** the window's cool light at night, each lamp's pool of warm light, and the fairy lights.

## The furniture library

Readers furnish the room from the Shop with pieces drawn in the room's own style. Each piece
is a line in `furniture.js` plus a sprite. The Shop's catalog takes the list in, so buying,
the inventory and the glowing spots work for it as for any decoration. A placed piece is painted
into the room's canvas, so it gets the same shadows, weather tints and lamplight as the room's own
pieces. An invisible button over it makes it tappable.

To add a piece:

1. **Draw it** in `client/scripts/room-art/room.js`, in the "furniture library" section at the
   end, with `add(id, width, height, draw)` as for any piece.
2. **Redraw:** `npm --workspace client run draw-room`.
3. **List it** in `FURNITURE` in `furniture.js`:

   ```js
   { id: 'poster-moon', name: 'Moon poster', group: 'Wall art', price: 25, sprite: 'poster-moon', surface: 'wall', blurb: 'On the wall' },
   ```

   `group` is its row in the Shop. `surface` says where it can go:
   - `wall`: a wall spot, and it hangs centred on the spot. The spots are `WALL` in
     `strip/layout.js`, on open wall clear of everything that can be tapped
   - `floor`: a spot on the floor
   - `shelf`: the window seat, side table or nightstand
   - `chair`: the reading nook, in place of the armchair. One chair at a time: a new one sends
     the last back to the inventory, and putting it away brings the armchair back

   A **cat** also has `pet: true`. Its sprite is a sheet of four frames, `walk`, `step`, `sit`
   and `sleep`, drawn with `catSheet` in the art script. Cats walk along `WALK`, sit, and
   sometimes nap. They're drawn on their own canvas over the room, tinted for the weather.
   With reduced motion they sit still.

## Putting pieces anywhere

Wall art, plants and the succulents aren't held to the glowing spots. Dragged out of the inventory,
they land where they're let go, if they fit there (`strip/placement.js`):

- **Wall art** hangs anywhere on the wall: below the bunting, above the skirting, inside the
  room's two ends, and 8 art px (`GAP`) clear of the room's own pieces (the window and its curtains,
  the clock, the corkboard, the bookshelf, the mirror, the furniture against the wall, and a reading
  chair from the Shop in the armchair's place).
- **Plants** stand anywhere along the floor; let go higher up, they land on the floor below.
- **The succulents** sit anywhere along the top of the window seat, side table or nightstand,
  whichever is nearest where they're let go.
- Every piece keeps `GAP` clear of the other placed pieces. Cats walk about and take no room.

Let go where it doesn't fit, a piece moves to the nearest place it does within 40 art px
(`REACH`); if there's none, it stays in the inventory and the room says "Not enough room there".

A placed piece remembers its point, `at`: the middle of wall art, the bottom middle of anything
standing. Reading chairs, curtains and bedding still go on their one spot each, and the visited
readers' furniture (`{ id, zone, x }`, no `at`) stands on the spot in its zone nearest `x`.

To move a placed piece in My Room:

- **Press and hold** it for 300 ms, then drag. It shows where it would land as it goes, and goes
  back where it was if it's let go where it doesn't fit. A quick drag still looks around the room.
- Or **tap it and choose Move**. The arrow buttons (or the arrow keys) nudge it 4 art px at a time,
  up and down too on the wall, never into a place it doesn't fit. **Done** keeps it there;
  **Cancel** or Escape puts it back.

Nothing in someone else's room can be moved.

## Themes

Every house has its own look, set in `themes.js`. A theme gives the colours the room paints
itself (`wall`, `wallShade`, `wallDeep`, `ceiling`, `skirting`, `skirtingShade`, `floor`,
`floorShade`, `floorLine`, `floorLight`) and, in `sprites`, the room's pieces it swaps for its
own: `{ 'curtain-left': 'curtain-left-navy', bed: 'bed-stars', … }`. My Room is `peach`; each
reader in `visitors.js` names theirs (Emma `rose-garden`, Ayaan `night-sky`, Sofia `tea-room`,
Noah `reading-den`).

The variants are drawn by the art script from the same drawing as the room's own: `FABRICS`
(curtains), `BEDDING` and `QUILTS` (the bed), `LAMPS` (floor and table lamp, unlit and lit) and
the rug. A variant must be the same size as the piece it replaces. To add a theme, add its
colours and sprites to `THEMES`, drawing any new variant first.

## Curtains and bedding

The Shop's Curtains and Bedding groups (in `furniture.js`) take the place of the room's own. Each
has `swaps`, the room pieces it replaces and the sprites drawn instead, and a small `sprite` for
its picture in the Shop (`curtains-<fabric>`, `bedding-<design>`). They go on one spot each (at the
window, on the bed). Like a reading chair, a new set sends the last back to the inventory, and
taking it away brings back the theme's own.

## Lamps

Tapping the floor lamp or the table lamp switches it on or off (`lamps.js`; both start on). A
lamp that's on shows its `lit` sprite day and night, and after dark lights its corner. Switched
off, it lights nothing.

## Visiting a room

Every reader in the Cafe has a room. Their profile (`/people/reader-<name>`) has a **Visit
<name>'s room** button, which opens `/people/reader-<name>/room`. It's the same room, from the
same files, as My Room: `VisitView` passes the reader from `visitors.js` to `RoomView` as
`visiting`, and the room shows their books and furniture. Visitors can look around, open their
books (read-only) and browse their shelf, but nothing in the room can be placed, moved or taken
down: `RoomStrip` gets `editable` off.

Where My Room has its menu, a visitor gets **Leave a note**. A note (up to 140 characters,
signed with the visitor's name) goes on that reader's notice board, and up to three are drawn on
the corkboard as small paper notes (`paintNotes` in `strip/paint.js`). Tapping the corkboard
opens the notice board, which has its own **Leave a note** button. A visitor can take down only the
notes they left (each note keeps its author's id). Notes stay in this browser only (`notes.js`),
like the Cafe's follows and chat, because the sample readers aren't real accounts.
`database/room_notes.sql` is the table for keeping them on the server, so a room's owner can read
them too.

To furnish a reader's room differently, change their list in `FURNISHINGS` in `visitors.js`.
Each piece is `{ id, zone, x }`, and stands on the spot in its zone nearest `x`.

## On a laptop

My Room and My Shelf fill the window, like the town; their routes are `wide`. The room keeps
its whole-number scale. If the room would come out narrower than the window, it's drawn one
size up, as long as that cuts no more than plain wall (24 art px, above the bunting) off the
top. Otherwise it's centred. The cards over the room keep a readable width and stay centred.

## Colours

`strip/palette.json` holds every colour: the wall, the floor, the woods, the fabrics, the book
spines, and the tints for rain and night (the town's tints, softened for indoors). Change a
colour there and run `draw-room` again. The room picks up the change on its next load.
