# Readalot

A mobile-first social reading web app (IS216 group project): a Vue 3 client and an Express
API, with Supabase as the database. Each reader gets a 3D reading room (modelled in Blender,
drawn with Three.js) with their books on the bookcase, the live weather through the window, a
daily mood check-in that recommends a book, and a shop for decorating the room, plus pages to
discover books, meet nearby readers and scan books in.

> What the app is and why: [SPEC.md](SPEC.md). Course brief and team rules (tech stack, AI
> policy, code style): [PROJECT.md](PROJECT.md). AI-written code: [AI_USAGE.md](AI_USAGE.md).

### What came from which branch (home page)

| Piece | From |
|-------|------|
| Room layout, Currently Reading card, Quote of the Day popup, header, bottom nav, theme tokens, API and book data | Sonya |
| Weather view in the window (sun and birds, clouds, rain, moon), shop, inventory, decorations, pets, credits, time API, phone frame, route slides | Alric |
| Mood check-in and recommendation | `merge-homepage` |
| 3D room (Blender + Three.js), the `bookshelf.blend` bookcase, books that fly out and open | `merge-homepage`, AI-written (see [AI_USAGE.md](AI_USAGE.md)) |

## Getting Started

Requires Node.js 20 or newer (built with Node 24).

```bash
npm install               # once, at the repo root: installs client and server (npm workspaces)
cp .env.example .env      # optional keys; the app runs with all of them empty
npm run dev:server
npm run dev:client
```

Run the server and client commands in separate terminals.

- Vue app: `http://localhost:5173`
- Express API: `http://localhost:3000/api/health`
- Root `.env` is the only env file. Vite reads it through `client/vite.config.js`.

**Without any keys** the app is still demoable: the shelf is 16 built-in books held in the
server's memory (reset on restart), mood recommendations use the quotes stored in
`server/data/works.json`, and books show plain coloured covers. With `GOOGLE_BOOKS_API_KEY` the
shelf is 20 novels picked from Google Books and remembered in `server/data/demoShelf.cache.json`.
Weather, the room clock and pet photos need no key.

**Quote of the Day** uses `server/data/quotes.json` when that file has been built (see "Quote of
the Day" below). Until then, `API_NINJAS_KEY` supplies the day's quote, and with neither the
popup shows one built-in quote.

**With Supabase** (shared keys from the team): follow "Database" below, then run
`npm run seed -w server` once for the demo user, fake readers and sample books.

On phones the app fills the screen; on wider screens it sits in a centred phone-size frame. In
Chrome DevTools, device mode at 390 × 844 (or 375 px wide) shows the primary layout.

### Database

One shared Supabase project is used by all developers.

- Fresh project: run `database/schema.sql` in the Supabase SQL editor (skip the "Migration" block at the bottom).
- Existing project from the older schema: run only the "Migration" block (idempotent).
- Then run `npm run seed -w server` and copy the printed demo user id into `DEMO_USER_ID`.

### Environment variables

All are optional. `.env.example` lists them with the same notes.

| Variable | Used by | Purpose | If empty |
|----------|---------|---------|----------|
| `PORT` | server | API port | 3000 |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | server | Database and auth access | In-memory demo shelf and a built-in demo user |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | client | Browser Supabase client | No login token is sent |
| `GOOGLE_BOOKS_API_KEY` | server | Book search, metadata, covers, and the 20-book demo shelf | Keyless quota runs out quickly; search shows a placeholder, book pages error, the shelf is the built-in 16 |
| `GOOGLE_CLOUD_PROJECT_ID`, `GOOGLE_CLOUD_VISION_KEY` | server | Scan Book text detection | Without the Vision key, scan uses a sample book |
| `GOOGLE_MAPS_API_KEY` | server | Nearby stores (lookup not built yet; not needed for the map) | Empty store list |
| `DEMO_USER_ID` | server | Seeded demo profile used when no login token is present | Only needed with Supabase |
| `API_NINJAS_KEY` | server | Mood quote when Wikiquote has nothing; Quote of the Day when `quotes.json` is missing | The line in `works.json`, or one built-in daily quote |
| `WIKIMEDIA_ENTERPRISE_USERNAME`, `WIKIMEDIA_ENTERPRISE_PASSWORD` | server | Mood quote from the book's Wikiquote page | api-ninjas, then the line in `works.json` |
| `VITE_API_TARGET` | client dev server | Where Vite proxies `/api` | `http://localhost:3000` |

Public APIs that need no key, all called from the server: Open-Meteo (weather), utctime.app and
time.now (room clock), Wikipedia and Dog CEO (pet photos).

### Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev:server` / `npm run dev:client` | Run API / web app |
| `npm run build` | Build the client |
| `npm run seed -w server` | Seed demo user, readers, saved books |
| `npm run import-quotes -w server -- <folder>` | Rebuild `server/data/quotes.json` from the downloaded Kaggle quotes dataset (see Quote of the Day) |
| `npm run verify-works -w server` | Verify the mood book list against the quotes API (not written yet, T12) |
| `npm run check -w server` | Assert checks: compatibility score, Quote of the Day picker |
| `npm run test:e2e` | Playwright tests (see Testing). First time: `npx playwright install chromium` |

## Testing

End-to-end tests in `tests/e2e/` drive the running app with Playwright, the way a reader would:
through labelled buttons and visible text, never internal structure.

```bash
npx playwright install chromium   # first time only
npm run test:e2e                  # all tests, headless Chrome
npx playwright test tests/e2e/room.spec.js            # one file
npx playwright test -g "birds fly past"               # tests whose name matches
npx playwright show-report        # the last run's report
```

- The run starts its own API (port 3100, no Google Books key, so the built-in 16-book demo shelf) and client (port 5174). Close anything on those ports first.
- Every test starts signed in (`tests/e2e/fixtures.js`). Live answers are mocked with `page.route`: the weather, the time, and every save to the shelf, so runs are repeatable and the shared demo shelf is never changed.
- Headless Chrome draws the 3D room (WebGL), so the room tests really turn and tap it. A full run takes about 4 minutes.

| File | Covers |
|------|--------|
| `room.spec.js` | The window's weather (rain, birds on a clear day), the clock, turning to the bookshelf, buying and placing a decoration, the chair's Currently Reading card, the corkboard's Quote of the Day |
| `bookshelf.spec.js` | Books in shelf order and sizes, tapping a book (it flies out and opens, skip, reduced motion, real and failed covers), the details and their actions (start, progress, finish, review, rate), remove and Undo, focus and keyboard, the book list without 3D |
| `mood-result.spec.js` | The mood check-in and its recommendation |
| `smoke.spec.js` | Every tab loads |
| `scan-book.spec.js`, `shelve-book.spec.js` | Placeholders (skipped) |

## Project Structure

```text
readalot/
├── SPEC.md                     What the app is, and the decisions behind it
├── PROJECT.md                  Team rules, then the course brief
├── AI_USAGE.md                 What AI wrote, for the team to review
├── REFERENCE-IMG/              Low-fi reference screens 01-15
├── design-system/              Design tokens and component notes
├── client/
│   ├── blender/                The 3D room: .blend files and the scripts that build and export it (its own README)
│   ├── public/room/bedroom.glb The exported room
│   └── src/
│       ├── views/              One file per route (RoomView is My Room)
│       ├── components/         Shared UI
│       │   ├── room/           Room3D (the 3D room), WindowView (the weather outside), Currently Reading card
│       │   ├── book/           Book Details tabs, and the details shown when a book is opened in the room
│       │   ├── modals/         Mood, Quote of the Day, Remove book, Write review, Add quote
│       │   └── people/         Map, reader sheet, chat
│       ├── lib/room3d/         Loading the room, the books on the shelf, opening a book, look-around, lighting
│       ├── composables/        useAsync, useDecor (shop and decorations), useBookOpen, ...
│       ├── stores/bookshelf.js The reader's shelf (Pinia), loaded from and saved to the API
│       ├── assets/             theme.css (colour, type and radius tokens), the room's still picture
│       ├── router/             Routes
│       └── services/           api.js (the app's API calls), weather.js and time.js, peopleDemo.js
├── server/
│   ├── src/routes/             Express routes
│   ├── src/services/           books (Google Books), quotes and dailyQuote, wikimedia (Wikiquote),
│   │                           works, demoShelf, cacheFile, compatibility, vision, supabase, env
│   ├── src/middleware/auth.js  Token guard (demo-user fallback)
│   ├── data/works.json         Books a mood recommendation picks from (starter list, see Known Limits)
│   ├── data/quotes.json        Quote of the Day list, built locally from the Kaggle dataset (not in git)
│   ├── data/*.cache.json       Saved Google Books, demo shelf and Wikiquote answers (not in git)
│   ├── scripts/                seed.js, importQuotes.js, verifyWorks.js
│   └── tests/                  Assert-style checks
├── database/schema.sql         Supabase schema and migration block
├── tests/e2e/                  Playwright tests
├── .env.example                Single env template
└── package.json                Workspace scripts
```

## Routes

| Path | Screen |
|------|--------|
| `/` | My Room (home) |
| `/discover`, `/discover/:genre` | Discover Books, full genre shelf |
| `/search` | Global search |
| `/people`, `/people/:id`, `/people/:id/shelf` | Discover People, Reader Room, reader bookshelf |
| `/scan` | Scan Book |
| `/profile` | Profile and settings |
| `/books/:id` | Book Details (tabs) |

Mood check-in, Quote of the Day, Quick Book Preview, Write review and Add quote are modals, not routes.

`/?scene=sunny`, `/?scene=cloudy` and `/?scene=rain` preview a window scene without waiting for that weather.
`/mood` and `/playground` are Alric's placeholder and component-gallery screens; they are not in the bottom nav.

## API

All under `/api`, served by `server/src/app.js`.

| Route | Purpose |
|-------|---------|
| `GET /health` | Server is up |
| `GET /user-books`, `POST /user-books`, `PATCH /user-books/:id`, `DELETE /user-books/:id` | The reader's shelf. Each book carries `status`, `progress` (0-100), `myRating` and `reviewed`; `PATCH` takes `status` and/or `progress` |
| `GET /books/search?q=&limit=`, `GET /books/:id`, reviews and quotes under `/books/:id` | Book search and details. Search returns a placeholder book when Google Books cannot be reached; a book page answers 404 or 502 |
| `GET /recommendations?mood=calm\|low\|stressed\|excited[&exclude=<work id>]` | A book for the mood with a quote from it: `book`, `workId`, `category` (or null), `quote` (`quoteText`, `author`, `work`, `sourceUrl`) |
| `GET /quote/today` | Quote of the Day: `quoteText`, `author`, `work`, `topic`. Dataset quotes leave `author` empty |
| `GET /weather[?lat=&lng=]` | Weather for the room window (Singapore by default): `scene`, `temperature`, `isDay`, `sunrise`, `sunset` |
| `GET /time` | Singapore time for the wall clock |
| `GET /creatures` | Breed photos for the shop's cats and dogs |
| `GET /users/:id`, `/users/:id/books`, `/people/nearby`, `/people/:id/compatibility` | Readers, their shelves and compatibility |
| `GET /stores/nearby`, `POST /scan-book` | Nearby bookshops and cover scanning (both placeholders for now) |

## App Contracts

Use `client/src/services/api.js` from Vue components. Components should not call Google Books, Open-Meteo, Places, Vision, api-ninjas, Wikimedia Enterprise, or Supabase data tables directly.

Book shape:

```js
{
  id,
  googleBooksId,
  title,
  authors,
  coverUrl,
  description,
  genres,
  publisher,
  publishedDate,
  isbn,
  averageRating,
  ratingsCount,
  pageCount,
  buyUrl
}
```

User shape:

```js
{
  id,
  username,
  displayName,
  avatarUrl,
  favoriteGenres,
  compatibility,
  currentlyReading
}
```

## Known Limits

- No login: the auth guard falls back to the seeded demo user (`DEMO_USER_ID`).
- Review and Rate on a finished book open Book Details, where writing a review or rating is not built yet (T17). On the demo shelf no book counts as reviewed or rated.
- Quote of the Day quotes have no author or book: the dataset only holds the quote text. The popup shows the topic instead ("On books"). Some quotes in it are well-known misattributions.
- The quotes dataset was scraped from Goodreads by its Kaggle author and its licence is listed as "Unknown", so the quote list is kept out of git for now. Check it against the course rules on scraped data before the final submission. A deployed server needs the list built on it, or an `API_NINJAS_KEY`, or it shows the one built-in quote every day.
- Mood recommendations are limited to the list in `server/data/works.json`. It is a 12-book starter list, not yet curated (T12). The quote is a Wikiquote line when the Wikimedia login is set, then an api-ninjas quote from the work, then the line stored with the book. Wikiquote text is CC BY-SA 4.0 and links back to its page.
- Google Books is unreliable: search requests often fail with 503 and are retried, and search by `intitle:`, `inauthor:`, `subject:` or `isbn:` returned nothing, so the server searches by plain keywords. Without a key the quota runs out quickly; a recommended book then shows without a cover, under its own `work-…` id. The first demo-shelf build costs many calls and is saved in `demoShelf.cache.json`.
- Quote of the Day prefers the local dataset, which has no author. api-ninjas is used only when that file is missing, and a server restart during the day can fetch a new api-ninjas quote. The free api-ninjas tier does not allow commercial use.
- Google Books returns a limited slice per query, so genre shelves can be thin.
- Compatibility is computed per request (O(users)); fine at MVP scale.
- Desktop shows a centred phone-width column only.
- Changing the 3D room needs Blender 5 (see `client/blender/README.md`); the exported `bedroom.glb` and still picture are committed, so running the app does not.
- A book's real cover only shows on the 3D book when its image host allows it (CORS); otherwise the book gets a cloth cover with its title. Google Books thumbnails may not allow it.
- Decorations, pets and credits are kept in memory only and reset when the page reloads.
- Discover People, Reader Room, follow and chat use four fictional sample readers kept in the browser (see Discover People), not real accounts.

## App Structure and Page Connections

The app is built around four main areas: **My Room, Discover Books, Discover People, and Scan Book**. Each area connects back to the same book and user data so the experience stays consistent.

### My Room

The reader's home page: a 3D bedroom built in Blender (`client/blender/`) and drawn with
Three.js. The reader stands in the middle and drags, pinches or scrolls to look around, or uses
the bar of places along the bottom (Bookshelf, Chair, Window, Corkboard, Clock). Everything that
can be tapped is a labelled button over the 3D scene.

* **Bookshelf:** each of the reader's shelves has a row of the bookcase to itself, top to bottom **To be read**, **Reading** (at eye level), **Finished**, named on a brass plate on the row's board with how many books it holds. The books stand with their titles on the spines and keep their own size from visit to visit; a book pointed at (or focused) lifts a little up and out of its row. Books that do not fit in a row show as "+N more" on its board.
* **Opening a book:** tapping a spine plays the animation designed in `bookshelf.blend`: the book slides out, flies to the reader with its cover facing them, the cover opens and the pages flip. A tap skips to the end, and reduced motion skips it altogether. Then the book's details show on a wood-framed card: the cover (or a cloth-bound stand-in with the title), title, author, stars and genres, the shelf buttons **Want to read / Reading / Finished reading**, then Synopsis, Rating and Reviews. Choosing **Reading** brings up a progress slider; a **Finished** book offers **Review** and **Rate** (they open Book Details) until both are done. **Remove from shelf** asks first, then offers Undo. Closing puts the book back on the shelf.
* **Window:** the bay window shows the live Singapore weather: the sun with birds flying past, drifting clouds, rain, or the moon at night, with the temperature. The room's light follows it, and the table lamp comes on at night. `/?scene=sunny|cloudy|rain` previews a scene.
* **Clock:** the wall clock shows Singapore time.
* **Armchair:** the open book on the chair opens the **Currently Reading** card, which leads to Book Details.
* **Corkboard:** opens the **Quote of the Day**.
* **Room menu:** the **Shop** and **Inventory**: decorations and pets are bought with credits and placed on the window seat, nightstand, side table or floor; pets wander the floor. They last until the page is reloaded.
* **Mood Check-in:** opens when needed (see below).
* On a device that cannot draw 3D, the room is a still picture and **Bookshelf** lists the books instead.
* Without Supabase the shelf is a demo shelf: 20 novels picked at random from Google Books when that key is set, otherwise 16 built-in books.

### Quote of the Day

The corkboard in My Room opens one quote, the same for every reader all day; it changes at midnight Singapore time.

Quotes come from `server/data/quotes.json`, which is **not committed** (it is in `.gitignore` because the dataset's licence is unknown): each developer, and the deployed server, builds it once with the commands below. If the file is missing, the server asks [api-ninjas](https://api-ninjas.com/api/quotes#v2-randomquotes) for one short quote in a single category (writing, art, happiness, courage, love, humor, philosophy, time, freedom or death) and keeps it until midnight Singapore time. With no key either, the popup shows a single built-in quote. The file holds 1,000 quotes taken from the [Goodreads Quotes dataset on Kaggle](https://www.kaggle.com/datasets/abdokamr/good-reads-quotes) by Abdulrahman Kamr (about 83,000 quotes in 28 CSV files, one per topic). `server/scripts/importQuotes.js` keeps the 100 most-liked quotes from each of ten topics that suit a reading room (books, writing, poetry, knowledge, wisdom, hope, happiness, inspirational, life, time), leaving out anything longer than 220 characters, multi-line, mostly non-Latin, repeated, or with coarse language. The day's quote is picked by date, stepping through the list so none repeats until all have been shown.

To build the list (other topics or limits are set at the top of the script):

```bash
pip install kagglehub
python -c "import kagglehub; print(kagglehub.dataset_download('abdokamr/good-reads-quotes'))"
npm run import-quotes -w server -- <the folder printed above>
```

### Mood Check-in

Opens by itself on the first visit to My Room each day, and from the room menu at any time. The user picks one mood: **Calm, Low, Stressed or Excited**. "Skip for today" (or closing it) keeps it away until tomorrow.

The mood picks a book from `server/data/works.json`, looks it up on Google Books, and shows a quote from that book. The quote comes from English Wikiquote through the Wikimedia Enterprise On-demand API when that login is set: the book's own page, then "Title (novel)", then the section about the book on its author's page. If Wikiquote has nothing, the server asks api-ninjas for a quote from the work in one of the mood's categories (Calm = nature / wisdom / philosophy, Low = inspirational / courage / happiness, Stressed = time / freedom / truth, Excited = success / humor / art), then for any quote from the work, then uses the line stored with the book. A Wikiquote line links back to its page.

From the recommendation, the user can:

* add the book to **To Be Read**
* open the full book page
* request another recommendation

### Discover Books

This page is used to explore new books.

Books are grouped into horizontal bookshelf carousels such as:

* genres
* popular books
* award winners
* community favourites

Users can scroll through each shelf, open a book preview, or enter a full category shelf.

Selecting a book leads to the **Book Details** page.

### Book Details

This is the main information page shared across the app. It is the same wood-framed card as a book opened in the room (`components/book/BookCard.vue` round `BookDetailsContent.vue`), over a soft picture of the room; ✕ goes back.

Built so far: cover, metadata, reading status (with progress), synopsis, rating and community reviews. Planned:

* book metadata
* synopsis
* reading status
* community reviews
* saved quotes
* online purchase options
* nearby stores
* similar books

Users can also mark a book as **Want to Read, Currently Reading, or Read**. This updates their personal bookshelf.

### Discover People

This page shows other readers through a map-based interface.

Each user can have a reading compatibility score based on shared books and genres.

Selecting a reader opens their **Reader Room**, where users can view:

* their bookshelf
* currently reading book
* reading preferences
* shared books

Users can then follow or connect with them.

For now this is a local demo with **four fictional sample readers** in
`client/src/services/peopleDemo.js`, kept in the browser rather than in Supabase:

* The map is OpenStreetMap over Singapore (needs internet) with a pin per reader; it does not pan or zoom, so the pins stay aligned. Search filters the pins.
* Compatibility uses the formula above against the demo reader's 4 books and 3 favourite genres; it is illustrative, not a production score.
* **Visit Room** shows the reader's profile, currently reading, favourite and shared genres, shared books and a full sample bookshelf that can be filtered by status.
* Follow and chat last across refreshes in the same browser (`localStorage` keys `readalot_demo_following_v1` and `readalot_demo_messages_v1`). In chat, "View as" switches sides to simulate a reply. It is not a real messaging service: do not type private information.
* Restoring API-based readers and real account checks is needed before production.

### Scan Book

This lets users add physical books into the app using their camera or an uploaded image.

The flow is:

`Scan Book → Detect Book → Confirm Book → Select Reading Status → Add to Bookshelf`

Once confirmed, the detected book uses the same **Book Details** and bookshelf system as every other book in the app.

### Shared Data Flow

Most features connect through the same book records and reading status.

`Discover / Scan / Recommendation`
→ `Book Preview`
→ `Book Details`
→ `Reading Status`
→ `User Bookshelf / My Room`

Community activity also connects back to books:

`Book Details`
→ `Reviews / Quotes`
→ `Reader Profile`
→ `Reader Room`

This keeps the app connected instead of making each page behave like a separate feature.
