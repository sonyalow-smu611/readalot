# Your house: My Room

Owner: Sonz. My Room is one wide pixel-art picture of the room, side on, that the reader moves
along sideways. It's drawn in the town's style, using the town's own drawing helpers.

| File | What it does |
|---|---|
| `HouseView.vue` | The building's entry view, inside the shared `BuildingShell` |
| `RoomView.vue` | The room page: the room, the Currently Reading card, book details, modals, the menu. With `visiting`, someone else's room |
| `VisitView.vue` | Someone else's room (`/people/:id/room`), opened from their profile in the Cafe |
| `ShelfView.vue` | My Shelf (`/house/shelf`): every book, by shelf, with genre chips and a search. Opened by tapping the bookshelf. At `/people/:id/room/shelf`, the visited reader's shelf |
| `furniture.js` | **The furniture library:** the pieces in the room's pixel style that the Shop sells (the Shop sells nothing else) |
| `visitors.js` | Other readers' rooms: the Cafe's sample readers, their books in the shelf's shape, and the furniture in each room |
| `notes.js` | Notes left on readers' notice boards, kept per reader in this browser |
| `components/RoomStrip.vue` | The room itself: scrolling, the tappable spots, the shelf's name plates, books, furniture, cats. Takes the furniture and whether it can be edited from the page |
| `components/VisitorBookDialog.vue` | A book off someone else's shelf: what it is and which shelf, with nothing to change |
| `components/NoteComposer.vue` | The Leave a note card |
| `components/NoticeBoard.vue` | A visited reader's notice board: the Quote of the Day, then the notes left there |
| `components/ShelfRow.vue` | One shelf on My Shelf: a sideways row of covers that scrolls by swipe, wheel, drag, buttons or arrow keys |
| `components/DecorArt.vue` | A decoration's picture in the Shop and inventory: a furniture piece's own sprite, kept crisp |
| `components/BookDialog.vue` | A book's card over the page, used by the room and My Shelf (remove with Undo included) |
| `components/WindowView.vue` | The view through the window: sky, weather and the town across the street |
| `strip/layout.js` | **What stands where.** Every piece, the parts of the room, decoration spots, lights |
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
height fits. Any height to spare becomes more floor at the bottom (clear of the bar of places),
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

- **`lit`:** the sprite to show at night, for a lamp. To light the room round it, give the sprite
  a `glow` point in its `meta` and add it to `LIGHTS`, as the floor lamp is.
- **`action`:** what tapping the piece does: `window`, `chair` (the Currently Reading card),
  `bookshelf`, `clock` or `corkboard`. The button covers the whole sprite, grown to finger size
  if it's small.
- **`id`:** needed when something looks the piece up, like the lights or the bookshelf's rows.

## Other things in the layout

- **`PARTS`:** the bar of places, left to right. `at` is the x the view centres on.
- **`SLOTS`:** where shop decorations can stand. Keep their `zone` and `x` as they are, or
  decorations readers have already placed will move. You can change `at`, where a slot is drawn.
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
opens the notice board. Notes stay in this browser only (`notes.js`), like the Cafe's follows
and chat, because the sample readers aren't real accounts.

To furnish a reader's room differently, change their list in `FURNISHINGS` in `visitors.js`.
Each piece is `{ id, zone, x }`, the same as a piece placed in My Room.

## On a laptop

My Room and My Shelf fill the window, like the town; their routes are `wide`. The room keeps
its whole-number scale. If the room would come out narrower than the window, it's drawn one
size up, as long as that cuts no more than plain wall (24 art px, above the bunting) off the
top. Otherwise it's centred. The cards over the room keep a readable width and stay centred.

## Colours

`strip/palette.json` holds every colour: the wall, the floor, the woods, the fabrics, the book
spines, and the tints for rain and night (the town's tints, softened for indoors). Change a
colour there and run `draw-room` again. The room picks up the change on its next load.
