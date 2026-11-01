# Library: Discover

Owner: Aasim. The library is one wide pixel-art hall, side on, that the reader moves along
sideways, in the same style as My Room. Each bookcase is one genre, in that genre's colours, with
the genre's art on the wall behind it and its sign hung above it. Tapping a bookcase opens it to
fill the screen; tapping the help desk puts the reader in the search bar; tapping the book
scanner opens the camera to scan a book's cover.

Across the top: Back to town on the left, the search bar in the middle, the live weather on the
right (on a phone the search bar rests as a magnifier and grows into a bar when used). The
**Places** menu in the bottom right, like My Room's, slides the hall to the help desk, the
scanner, the reading nook or a genre's bookcase.

There are no emoji in the library: every icon is a pixel icon drawn in the hall's style
(`hall/icons.js`).

## The genres

The ten bookcases are the most read genres of 2025, so the shelves match what readers look for:
Romance, Romantasy, Fantasy, Mystery & Thriller, Horror, Science Fiction, Historical Fiction,
Young Adult, Memoir & Biography, and Graphic Novels & Manga. Sources: the twelve genre lists of
Goodreads' 2025 Reading Challenge ([goodreads.com/blog/show/3029](https://www.goodreads.com/blog/show/3029))
and Circana BookScan's US print sales, where romance and romantasy led adult fiction and graphic
novels grew 9.2% ([Publishing Perspectives](https://publishingperspectives.com/2025/04/circanas-q1-us-print-report-romance-romantasy-lead-adult-fiction/),
[The Beat](https://www.comicsbeat.com/graphic-novel-sales-rose-9-2-in-2025)).

Each sign is lettered in a free pixel font from Google Fonts with the genre's feel (`fonts.js`
loads them once): gothic for Horror, a computer screen for Sci-Fi, a typewriter for Mystery and
so on. Offline, the signs fall back to the app's bold title font.

## An opened bookcase

A tall bookcase in the genre's wood against the genre's wall, at least four uneven shelves tall,
which the reader scrolls down. Its 24 books (one Google Books search) stand as **spines**, each
with its title written up it in big, bold letters, some lying flat in stacks, the last on a shelf
with room leaning over, with the genre's props among them and a rolling ladder on a wide screen.
**Covers** turns them face out. Tapping a book slides it out of the shelf and opens its preview.
Everything is seeded by the genre and the book, so a bookcase looks the same every visit.

## A book's preview

A found book offers two simple choices (`components/book/FoundBookPreview.vue`, shared with
search and the genre page): **Add to To be read**, which puts it on the To be read shelf in My
Room and then says "On your To be read shelf", and **Where to get**, a list of shops and the
library that each open their own search for the book (`services/bookShops.js`). Reviews wait
behind "Read reviews". My Shelf keeps its own preview, with all three shelves.

## Search

`/search` is the library's catalogue (`SearchView.vue`): full screen on the hall's striped wall,
with the library's search bar, and the books found standing in a bookcase in the hall's own wood,
face out (Spines turns them round). The librarian's card says what to do before a search, when
nothing is found, and when search is offline.

## The scanner and the weather

The book scanner is Khaleil's Scan Book feature (it used to be `views/ScanBookView.vue`). The old
`/scan` address opens the library with the scanner on (`/library?scan=1`). The server side is
unchanged: `POST /api/scan-book` reads the cover with Google Vision, or returns a sample book when
`GOOGLE_CLOUD_VISION_KEY` is not set.

The hall follows the live weather, like My Room: the windows show the sky, rain falls on them
while it rains, the hall greys in cloud and rain, and after dark its lamps light it. Tapping a lamp
turns it off and on, remembered on that device. The weather comes from `services/weather.js`
(Open-Meteo, for Singapore) every 10 minutes; `/library?scene=sunny|cloudy|rain` previews a sky.

## Files

| File | What it does |
|---|---|
| `LibraryView.vue` | The building's page: the hall, the search bar, the open bookcase and the book preview. Holds the state, and loads the weather |
| `SearchView.vue` | Search (`/search`): the catalogue, its results in a bookcase |
| `categories.js` | **The bookcases.** One entry per genre: its name, icon, search, colours, wood, sign, wall art and props. Also `HALL_CASE`, the library's own bookcase for search |
| `shelves.js` | How an opened bookcase lays out its books: spines, stacks, props, leaning books, shelves |
| `fonts.js` | Loads the genre signs' pixel fonts |
| `components/LibraryHall.vue` | The hall itself: sizing, scrolling, the bookcase and desk buttons, the signs, the weather |
| `components/PlacesMenu.vue` | The Places menu in the bottom right (a copy of My Room's, in groups) |
| `components/GenreBookcase.vue` | One genre's bookcase opened: its wall, sign, Spines/Covers and its books |
| `components/BookShelves.vue` | A bookcase full of books, as spines or covers; the genre bookcase and search both use it |
| `components/ScanMachine.vue` | The book scanner: camera with "Snap cover", photo upload, the scan and its result |
| `hall/layout.js` | **What stands where.** Every piece, the wall art, the lamps' light and the places in the menu |
| `hall/sprites.js` | Draws each piece (bookcases in their genre's wood, desk, scanner, windows, lamps…) in pixel art |
| `hall/murals.js` | The art on the wall behind each bookcase |
| `hall/icons.js` | The pixel icons: tiny bitmaps for the signs, headings and wall art |
| `hall/paint.js` | Paints the wall, floor, pieces and light onto the canvas, with the tint for the weather |
| `hall/pixel.js` | The drawing helpers (`R`, `P`, `E`, `panel`, `leaf`, `shade`, `sprite`) |
| `hall/palette.js` | The hall's colours |
| `hall/scroll.js` | Wheel, mouse drag, arrow keys and gliding to a part of the hall |

Unlike My Room, nothing is generated ahead of time: the sprites are drawn in the browser the
first time the hall opens, so there is no art script to run.

## Adding a genre

Add an entry to `CATEGORIES` in `categories.js` (the comment at its top says what each field is).
The hall adds a bookcase for it, with its sign, a place in the Places menu, and makes the hall
wider. Its books come from a Google Books search of `query` (plain words work better than
`subject:` searches). Give it:
- `icon`: a pixel icon from `hall/icons.js`, or draw a new one there (one letter per pixel).
- `wall`: the name of a painter in `hall/murals.js` (copy one and change it).
- `sign.font`: a pixel font, added to `FAMILIES` in `fonts.js`.

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
