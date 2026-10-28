# Library: Discover

Owner: Aasim. The library is one wide pixel-art hall, side on, that the reader moves along
sideways, in the same style as My Room. Each bookcase is one category of books. Tapping a
bookcase opens its books; tapping the help desk puts the reader in the search bar; tapping the
book scanner opens the camera to scan a book's cover.

The book scanner is Khaleil's Scan Book feature (it used to be `views/ScanBookView.vue`). The old
`/scan` address now opens the library with the scanner on (`/library?scan=1`), so the "Scan"
links in the town and My Room still work. The server side is unchanged: `POST /api/scan-book`
reads the cover with Google Vision, or returns a sample book when `GOOGLE_CLOUD_VISION_KEY` is
not set.

The hall follows the live weather, like My Room: the windows show the sky (sun, clouds, or the
moon and stars), rain falls on them while it rains (lightly in drizzle, hard in a storm), the
hall greys in cloud and rain, and after dark its lamps light it. A chip under the search bar
shows the weather and temperature. Tapping a lamp (on the desk, the walls or the ceiling) turns
that lamp off and on, and the hall remembers which are off on that device. The search bar grows
and asks what you're looking for whenever it's in use, tapped directly or from the help desk. On a computer the library fills the window, like My Room. It comes from `services/weather.js`
(Open-Meteo, for Singapore) every 10 minutes; `/library?scene=sunny|cloudy|rain` previews a sky.

| File | What it does |
|---|---|
| `LibraryView.vue` | The building's page: the hall, the search bar, the open bookcase and the book preview. Holds the state, and loads the weather |
| `categories.js` | **The bookcases.** One entry per category: its name, emoji, search, genre page and spine colours |
| `components/LibraryHall.vue` | The hall itself: sizing, scrolling, the bookcase and desk buttons, the bar of places |
| `components/ShelfSheet.vue` | One bookcase opened: its books as covers, with "See all" |
| `components/ScanMachine.vue` | The book scanner: camera with "Snap cover", photo upload, the scan and its result |
| `hall/layout.js` | **What stands where.** Every piece, the lamps' light and the bar of places |
| `hall/sprites.js` | Draws each piece (bookcases, desk, scanner, windows, lamps…) in pixel art |
| `hall/paint.js` | Paints the wall, floor, pieces and light onto the canvas, with the tint for the weather |
| `hall/pixel.js` | The drawing helpers (`R`, `P`, `E`, `panel`, `leaf`, `shade`, `sprite`) |
| `hall/palette.js` | The hall's colours |
| `hall/scroll.js` | Wheel, mouse drag, arrow keys and gliding to a part of the hall |

Unlike My Room, nothing is generated ahead of time: the sprites are drawn in the browser the
first time the hall opens, so there is no art script to run.

## Adding a category

Add an entry to `CATEGORIES` in `categories.js`. The hall adds a bookcase for it, a button in the
bar of places, and makes the hall wider. Its books come from a Google Books search of `query`
(plain words work better than `subject:` searches). `genre` is the slug for its "See all" page
(`/discover/<genre>`), or `null` for no See all.

## Coordinates

Everything is in **art pixels**. `x` runs left to right from the hall's left wall; `y` runs down
from the top of the hall as designed (`HALL.height`, 260). The wall meets the floor at
`HALL.floor` (232), and furniture stands with its feet at `FEET` (236). A piece's `y` is its
**bottom** edge. On screen, one art pixel is a whole number of device pixels, so it never blurs.

## Adding a piece

1. Draw it in `hall/sprites.js` as a function that returns `sprite(w, h, (x) => { ... })`, using
   the helpers and colours from `PAL`, and add it to `MAKERS`.
2. Place it in `PIECES` in `hall/layout.js`, e.g.
   `{ sprite: 'globe', x: 22, y: FEET, layer: 'furniture' }`. `layer` is `wall`, `hang` (drawn
   with a string to the ceiling), `furniture` (casts a shadow on the wall) or `front`.
3. For a lamp, give it a `lamp` id and a `name` (what its button is called), and its sprite's
   bulb in `BULBS`: it gets a button that turns it off and on, and its light.
