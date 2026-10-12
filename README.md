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
| Room wall, floor, rug, bookcase, bay window frame, reading chair, Currently Reading card, Quote of the Day popup | Sonya |
| Weather scenes in the window, full bookshelf (spines / covers), shop, inventory, drag-and-drop decor, pets, credits, time API | Alric |
| Phone frame, route slides, book-open overlay | Alric |
| Header, bottom nav, theme tokens, API and book data | Sonya |
| Analog wall clock, quote sticky note, mood check-in and recommendation | New on this branch |

## Getting Started

Requires Node.js 20 or newer (built with Node 24).

```bash
npm install               # once, at the repo root: installs client and server (npm workspaces)
cp .env.example .env      # then fill in the keys you have; every key is optional
npm run dev:server        # terminal 1: Express API on http://localhost:3000
npm run dev:client        # terminal 2: Vue app on http://localhost:5173
```

Check the API is up at `http://localhost:3000/api/health`. If the server stops with
`EADDRINUSE`, another copy is already running on that port.

Root `.env` is the only env file; Vite reads it through `client/vite.config.js`. On phones the
app fills the screen; on wider screens it sits in a centred phone-size frame. In Chrome
DevTools, device mode at 390 × 844 (or 375 px wide) shows the primary layout.

### First run: what gets loaded

The server fetches book and quote data the first time each feature is used, then saves it in
`server/data/*.cache.json` (not in git, one set per machine) so later starts are instant.
Delete a cache file to fetch that data afresh.

| Feature | Needs | First time | After that |
|---------|-------|------------|------------|
| Bookshelf in My Room | `GOOGLE_BOOKS_API_KEY` | Picks 20 random novels from Google Books. Takes 10 to 20 seconds, because Google Books answers many requests with 503 and each is retried | Same 20 books from `demoShelf.cache.json` |
| Mood recommendation | `GOOGLE_BOOKS_API_KEY`, Wikimedia Enterprise login | Looks the book up on Google Books and reads its quotes from Wikiquote: 2 to 13 seconds per book | Under 0.1 seconds from `googleMatches.cache.json` and `wikiquote.cache.json` |
| Quote of the Day | `API_NINJAS_KEY` | One request the first time the popup opens each day, about 1 second | Kept in memory until midnight Singapore time, or a server restart |
| Book Details | `GOOGLE_BOOKS_API_KEY` | One Google Books request per page view | Not cached |

**Without any keys** the app still runs: the shelf is 16 built-in books with plain coloured
covers, mood recommendations show the quote stored with each book in `server/data/works.json`,
and Quote of the Day shows one built-in quote. Search and Book Details for a Google Books id
answer with an error. Weather, the room clock and pet photos need no key.

### Getting the keys

- **Google Books**: create an API key in Google Cloud Console, enable the **Books API** for that
  project, and make sure the key's API restrictions allow it.
- **api-ninjas**: sign up at <https://api-ninjas.com> and copy the key.
- **Wikimedia Enterprise**: there is no API key. Sign up for a free account at
  <https://dashboard.enterprise.wikimedia.com/> and put its username and password in `.env`;
  the server logs in with them for a 24-hour access token. The free plan allows 50,000 article
  lookups a month.
- **Supabase** (shared keys from the team): see "Database" below.

### Database

One shared Supabase project is used by all developers. Without it the shelf lives in the
server's memory and changes are lost on restart.

- Fresh project: run `database/schema.sql` in the Supabase SQL editor (skip the "Migration" block at the bottom).
- Existing project from the older schema: run only the "Migration" block (idempotent).
- Then run `npm run seed -w server` once (demo user, fake readers, sample books) and copy the printed demo user id into `DEMO_USER_ID`.

### Environment variables

`.env.example` lists these with the same notes.

| Variable | Used by | Purpose | If empty |
|----------|---------|---------|----------|
| `PORT` | server | API port | 3000 |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | server | Database and auth access | In-memory demo shelf and a built-in demo user |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | client | Browser Supabase client | No login token is sent |
| `GOOGLE_BOOKS_API_KEY` | server | Book search, details, covers, and the 20 random books on the demo shelf | Keyless quota runs out quickly: search and book pages show an error, the demo shelf is the built-in 16 books |
| `API_NINJAS_KEY` | server | Quote of the Day | The offline quote list, or one built-in quote |
| `WIKIMEDIA_ENTERPRISE_USERNAME`, `WIKIMEDIA_ENTERPRISE_PASSWORD` | server | Quotes for mood recommendations, from Wikiquote | The quote stored with each book in `server/data/works.json` |
| `DEMO_USER_ID` | server | Seeded demo profile used when no login token is present | Only needed with Supabase |
| `GOOGLE_CLOUD_PROJECT_ID`, `GOOGLE_CLOUD_VISION_KEY` | server | Scan Book text detection (not built yet, T26) | No effect yet |
| `GOOGLE_MAPS_API_KEY` | server | Nearby stores (lookup not built yet; not needed for the map) | Empty store list |
| `VITE_API_TARGET` | client dev server | Where Vite proxies `/api` | `http://localhost:3000` |

Public APIs that need no key, all called from the server: Open-Meteo (weather), utctime.app and
time.now (room clock), Wikipedia and Dog CEO (pet photos).

### Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev:server` / `npm run dev:client` | Run API / web app |
| `npm run build` | Build the client |
| `npm run test:e2e` | Playwright end-to-end tests (see below) |
| `npm run check -w server` | Assert checks: compatibility score, Quote of the Day picker |
| `npm run seed -w server` | Seed demo user, readers, saved books (needs Supabase) |
| `npm run verify-works -w server` | Verify the mood book list (not written yet, T12) |

### Running the tests

```bash
npx playwright install chromium   # first time only
npm run test:e2e
```

Playwright starts its own server and client on ports 3100 and 5174, so the dev servers can stay
running. The test server runs without a Google Books key, so the tests always see the built-in
16-book shelf, and the recommendation and Quote of the Day requests are answered inside the
tests: no outside API is called.

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
│   ├── src/services/           books (Google Books), quotes and dailyQuote (api-ninjas), wikimedia
│   │                           (Wikiquote), works, demoShelf, cacheFile, compatibility, vision, supabase, env
│   ├── src/middleware/auth.js  Token guard (demo-user fallback)
│   ├── data/works.json         Books a mood recommendation picks from (starter list, see Known Limits)
│   ├── data/*.cache.json       Saved Google Books and Wikiquote answers (not in git)
│   ├── scripts/                seed.js, verifyWorks.js
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
| `GET /books/search?q=`, `GET /books/:id`, reviews and quotes under `/books/:id` | Book search and details from Google Books. 502 when Google Books cannot be reached |
| `GET /recommendations?mood=calm\|low\|stressed\|excited[&exclude=<work id>]` | A book for the mood with a quote from it: `book`, `workId`, `quote` (`quoteText`, `author`, `work`, `sourceUrl`) |
| `GET /quote/today` | Quote of the Day: `quoteText`, `author`, `work`, `topic` |
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
  language,
  averageRating,
  ratingsCount,
  pageCount,
  buyUrl
}
```

`averageRating`, `ratingsCount`, `publisher` and `isbn` are empty when Google Books does not have them.

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

## How the features work

### My Room

The home page and the reader's profile.

* Shows the live Singapore weather in the room window and Singapore time on the wall clock.
* The book on the chair opens the **Currently Reading** card, which leads to **Book Details**.
* The bookcase opens the full bookshelf (Reading, To read, Finished) as spines or covers. Dragging a book to another shelf saves its reading status.
* Tapping a book on the full bookshelf lifts it out with the actions for its shelf: a **Reading** book has a progress slider and **Finished**; a **To read** book has **Started reading**; a **Finished** book has **Review** and **Rate** until both are done, then **View review and rating**. These open the book's **Book Details** page.
* The sticky note on the wall opens the **Quote of the Day**.
* The menu button opens the **Shop** and **Inventory**: decorations and pets are bought with credits and dragged onto a shelf or the floor. Credits and placed pieces last until the page is reloaded.

Without Supabase the shelf is a demo shelf: 20 novels picked at random from Google Books, by
searching the author names listed in `server/src/services/demoShelf.js` and keeping English
fiction with a cover, a description and a page count.

### Quote of the Day

One quote, the same for every reader all day; it changes at midnight Singapore time.

The server asks [api-ninjas](https://api-ninjas.com/api/quotes#v2-randomquotes) for a random quote (`GET /v2/randomquotes`) in one category, picked at random from writing, art, happiness, courage, love, humor, philosophy, time, freedom and death. The API matches every category it is given, so they cannot be sent together. It has no length filter and its `safe` filter is for paying subscribers, so the server checks both itself: a quote longer than 150 characters, or one with coarse language, is asked for again, up to eight times.

Without the key, or when the API cannot be reached, one built-in quote is shown.

### Mood Check-in

Opens by itself on the first visit to My Room each day, and from the room menu at any time. The user picks one mood: **Calm, Low, Stressed or Excited**. "Skip for today" (or closing it) keeps it away until tomorrow. From the recommendation the user can add the book to **To Be Read**, open its page, or ask for another.

The mood picks a book from `server/data/works.json`, looks it up on Google Books, and shows a quote from that book. The quote comes from English Wikiquote through the [Wikimedia Enterprise](https://enterprise.wikimedia.com/docs/) On-demand API (`POST /v2/articles/{name}`, project `enwikiquote`): the server reads the book's own page (by its title, then "Title (novel)"), or the section about the book on its author's page, and picks one line of 40 to 280 characters at random. If Wikiquote has nothing for the book, the line stored with the book is shown. Wikiquote text is CC BY-SA 4.0, so a quote from it carries a "via Wikiquote" link to its page.

### Other pages

| Page | What it is for |
|------|----------------|
| Book Details | Cover, authors, publisher, year, length, genres, description and rating from Google Books, with **Want to Read / Reading / Read** buttons that update the shelf. Reviews, quotes, buying options and similar books are planned as tabs |
| Discover Books | Shelves of books to browse by genre and popularity, leading to Book Details |
| Discover People | Other readers on a map with a reading compatibility score; a reader opens their **Reader Room** |
| Scan Book | Add a physical book from a photo: scan, confirm the book, pick a reading status |

Every page uses the same book records and reading status, so a book added from Discover, Scan
or a recommendation shows up on the shelf in My Room. `SPEC.md` has the full plan and tickets.

## Known Limits

- No login: the auth guard falls back to the seeded demo user (`DEMO_USER_ID`).
- Review and Rate on a finished book open Book Details, where writing a review or rating is not built yet (T17). On the demo shelf no book counts as reviewed or rated.
- Without Supabase, changes to the shelf (moving a book, progress, added books) are lost when the server restarts.
- Google Books is unreliable: about half the search requests in testing failed with 503 and were retried, and search by `intitle:`, `inauthor:`, `subject:` or `isbn:` returned nothing, so the server searches by plain keywords. It also has no rating for about half of its books.
- Each first-time build of the demo shelf costs about 20 to 30 Google Books calls, against a default quota of 1,000 a day.
- The Quote of the Day is held in the server's memory: restarting the server during the day fetches a new one. Offline quotes have no author, so the popup shows the topic instead ("On books").
- The free api-ninjas tier does not allow commercial use,: check it against the course rules before the final submission.
- Mood recommendations are limited to the 12-book starter list in `server/data/works.json`, not yet curated (T12). Three Men in a Boat has only three Wikiquote lines.
- Google Books returns a limited slice per query, so genre shelves can be thin.
- Compatibility is computed per request (O(users)); fine at MVP scale.
- Desktop shows a centred phone-width column only.
