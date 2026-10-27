# Your house: My Room

Owner: Sonz. My Room is one wide pixel-art picture of the room, side on, that the reader moves
along sideways. It's drawn in the town's style, using the town's own drawing helpers.

| File | What it does |
|---|---|
| `HouseView.vue` | The building's entry view, inside the shared `BuildingShell` |
| `RoomView.vue` | The room page: the room, the Currently Reading card, book details, modals, the menu |
| `ShelfView.vue` | My Shelf (`/house/shelf`): every book, by shelf, with genre chips and a search. Opened by tapping the bookshelf |
| `components/RoomStrip.vue` | The room itself: scrolling, the tappable spots, the shelf's name plates, books, decorations, pets |
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

## Colours

`strip/palette.json` holds every colour: the wall, the floor, the woods, the fabrics, the book
spines, and the tints for rain and night (the town's tints, softened for indoors). Change a
colour there and run `draw-room` again. The room picks up the change on its next load.
