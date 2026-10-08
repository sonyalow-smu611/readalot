# Readalot

A mobile-first social reading web app (IS216 group project): a Vue 3 client and an Express
API, with Supabase as the database. Each reader gets a virtual reading room with a bookshelf,
a window showing the live weather, a daily mood check-in that recommends a book, and a shop for
decorating the room, plus pages to discover books, meet nearby readers and scan books in.

> **Merge branch (`merge-homepage`).** Alric's and Sonya's apps are being combined here page by
> page. Done so far: the shared shell and the home page (My Room), including the mood check-in.
> The other pages still show Sonya's versions; Alric's `DiscoverView`, `PeopleView` and
> `ScanView` are in `client/src/views/` but not routed until those pages are merged.
> Course rules and AI policy: [GUARDRAILS.md](GUARDRAILS.md), [AI_USAGE.md](AI_USAGE.md).
> Project brief: [PROJECT.md](PROJECT.md).

### What came from which branch (home page)

| Piece | From |
|-------|------|
| Room wall, floor, rug, bookcase, reading chair, Currently Reading card, Quote of the Day | Sonya |
| Weather window, full bookshelf (spines / covers), shop, inventory, drag-and-drop decor, pets, credits, time API | Alric |
| Phone frame, route slides, book-open overlay | Alric |
| Header, bottom nav, theme tokens, API and book data | Sonya |
| Analog wall clock, quote sticky note, mood check-in and recommendation | New on this branch |

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

**Without any keys** the app is still demoable: the shelf is a 16-book demo shelf held in the
server's memory (reset on restart), mood recommendations use the quotes stored in
`server/data/works.json`, and books show plain coloured covers. Weather, the room clock and pet
photos need no key.

**Quote of the Day** needs one extra step: its quote list is not in the repository and is built
on each machine (see "Quote of the Day" below). Until then the popup shows one built-in quote.

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
| `GOOGLE_BOOKS_API_KEY` | server | Book search, metadata, covers | Keyless quota runs out quickly; placeholder book, no covers |
| `GOOGLE_CLOUD_PROJECT_ID`, `GOOGLE_CLOUD_VISION_KEY` | server | Scan Book text detection (not built yet, T26) | No effect yet |
| `GOOGLE_MAPS_API_KEY` | server | Nearby stores (lookup not built yet; not needed for the map) | Empty store list |
| `DEMO_USER_ID` | server | Seeded demo profile used when no login token is present | Only needed with Supabase |
| `API_NINJAS_KEY` | server | Quotes for mood recommendations (`X-Api-Key`) | Quotes stored in `server/data/works.json` |
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
| `npm run test:e2e` | Playwright tests. First time: `npx playwright install chromium`. Starts its own server and client on ports 3100 and 5174 |

## Project Structure

```text
readalot/
├── SPEC.md                     MVP spec, decisions and tickets (T01-T29)
├── PROJECT.md, GUARDRAILS.md   Project brief; course rules and allowed tech
├── guidelines/                 Tech stack, code cleanliness, course requirements
├── AI_USAGE.md                 What AI produced, for the team to review
├── REFERENCE-IMG/              Low-fi reference screens 01-15
├── design-system/              Design tokens and component guidelines
├── client/src/
│   ├── views/                  One file per route
│   ├── components/             Shared UI
│   │   ├── book/               Book Details tabs (About, Reviews, Quotes, Buy, Similar)
│   │   ├── modals/             Mood, Quote of the Day, Write review, Add quote
│   │   ├── room/               Room scene: window, wall clock, quote note, bookcase, chair
│   │   └── people/             Map, reader bottom sheet
│   ├── composables/            useAsync, useLocation, useDecor (shop and decorations), useBookOpen
│   ├── stores/bookshelf.js     The reader's shelf (Pinia), loaded from and saved to the API
│   ├── lib/                    Book shape helpers, GSAP motion wrapper
│   ├── assets/theme.css        Shared colour, type and radius tokens
│   ├── styles/                 Aliases onto those tokens for the room components, route transitions
│   ├── router/                 Routes
│   └── services/               api.js (the app's API calls), weather.js and time.js (room window and clock)
├── server/
│   ├── src/routes/             Express routes
│   ├── src/services/           Books, quotes, works, demo shelf, compatibility, vision, supabase, env
│   ├── src/middleware/auth.js  Token guard (demo-user fallback)
│   ├── data/works.json         Books a mood recommendation picks from (starter list, see Known Limits)
│   ├── data/quotes.json        Quote of the Day list, built locally from the Kaggle dataset (not in git)
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
| `GET /user-books`, `POST /user-books`, `PATCH /user-books/:id`, `DELETE /user-books/:id` | The reader's shelf and reading status |
| `GET /books/search?q=`, `GET /books/:id`, reviews and quotes under `/books/:id` | Book search and details |
| `GET /recommendations?mood=calm\|low\|stressed\|excited[&exclude=<work id>]` | A book for the mood with a quote from it |
| `GET /quote/today` | Quote of the Day: `quoteText`, `topic` (and `author`, empty for dataset quotes) |
| `GET /weather[?lat=&lng=]` | Weather for the room window (Singapore by default): `scene`, `temperature`, `isDay`, `sunrise`, `sunset` |
| `GET /time` | Singapore time for the wall clock |
| `GET /creatures` | Breed photos for the shop's cats and dogs |
| `GET /users/:id`, `/users/:id/books`, `/people/nearby`, `/people/:id/compatibility` | Readers, their shelves and compatibility |
| `GET /stores/nearby`, `POST /scan-book` | Nearby bookshops and cover scanning (both placeholders for now) |

## App Contracts

Use `client/src/services/api.js` from Vue components. Components should not call Google Books, Open-Meteo, Places, Vision, api-ninjas, or Supabase data tables directly.

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
- Quote of the Day quotes have no author or book: the dataset only holds the quote text. The popup shows the topic instead ("On books"). Some quotes in it are well-known misattributions.
- The quotes dataset was scraped from Goodreads by its Kaggle author and its licence is listed as "Unknown", so the quote list is kept out of git for now. Check it against the course rules on scraped data before the final submission. A deployed server needs the list built on it, or it shows the one built-in quote every day.
- Mood recommendations are limited to the list in `server/data/works.json`. It is a 12-book starter list, not yet curated or verified against the quotes API (T12). Each entry carries a `moods` tag and a `quote` used when `API_NINJAS_KEY` is not set or the API has nothing for that book.
- Without `GOOGLE_BOOKS_API_KEY`, Google Books lookups run out of quota quickly; a recommended book then shows without a cover, under its own `work-…` id.
- Google Books returns a limited slice per query, so genre shelves can be thin.
- Compatibility is computed per request (O(users)); fine at MVP scale.
- Desktop shows a centred phone-width column only.

## App Structure and Page Connections

The app is built around four main areas: **My Room, Discover Books, Discover People, and Scan Book**. Each area connects back to the same book and user data so the experience stays consistent.

### My Room

This is the user’s main profile and home page.

* Shows the user’s personalised reading room.
* Displays the live Singapore weather in the room window and Singapore time on the wall clock.
* The book on the chair opens the **Currently Reading** card, which leads to **Book Details**.
* The bookcase shows books from their **Read** and **To Be Read** collections; tapping it opens the full bookshelf (Reading, To read, Finished) as spines or covers. Dragging a book to another shelf saves its reading status.
* The sticky note on the wall opens the **Quote of the Day** popup.
* The menu button opens the **Shop** and **Inventory**: decorations and pets are bought with credits and dragged onto a shelf or the floor. Credits and placed pieces last until the page is reloaded.
* Opens the **Mood Check-in** when needed.

### Quote of the Day

The sticky note in My Room opens one quote, the same for every reader all day; it changes at midnight Singapore time.

Quotes come from `server/data/quotes.json`, which is **not committed** (it is in `.gitignore` because the dataset's licence is unknown): each developer, and the deployed server, builds it once with the commands below. If the file is missing the popup shows a single built-in quote. The file holds 1,000 quotes taken from the [Goodreads Quotes dataset on Kaggle](https://www.kaggle.com/datasets/abdokamr/good-reads-quotes) by Abdulrahman Kamr (about 83,000 quotes in 28 CSV files, one per topic). `server/scripts/importQuotes.js` keeps the 100 most-liked quotes from each of ten topics that suit a reading room (books, writing, poetry, knowledge, wisdom, hope, happiness, inspirational, life, time), leaving out anything longer than 220 characters, multi-line, mostly non-Latin, repeated, or with coarse language. The day's quote is picked by date, stepping through the list so none repeats until all have been shown.

To build the list (other topics or limits are set at the top of the script):

```bash
pip install kagglehub
python -c "import kagglehub; print(kagglehub.dataset_download('abdokamr/good-reads-quotes'))"
npm run import-quotes -w server -- <the folder printed above>
```

### Mood Check-in

Opens by itself on the first visit to My Room each day, and from the room menu at any time. The user picks one mood: **Calm, Low, Stressed or Excited**. "Skip for today" (or closing it) keeps it away until tomorrow.

The mood picks a book from `server/data/works.json` and a quote from that book: the server asks api-ninjas for a quote from the work in one of the mood's categories (Calm = nature / wisdom / philosophy, Low = inspirational / courage / happiness, Stressed = time / freedom / truth, Excited = success / humor / art), then for any quote from the work, then falls back to the line stored with the book.

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

This is the main information page shared across the app.

It contains:

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
