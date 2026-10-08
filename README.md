# Readalot

Minimal Vue + Express + Supabase project skeleton for the reading app.

## Getting Started

```bash
npm install
cp .env.example .env      # fill in the shared keys (ask the team)
npm run seed -w server    # once: demo user, fake readers, sample books
npm run dev:server
npm run dev:client
```

Run the server and client commands in separate terminals.

- Vue app: `http://localhost:5173`
- Express API: `http://localhost:3000/api/health`
- Root `.env` is the only env file. Vite reads it through `client/vite.config.js`.

### Database

One shared Supabase project is used by all developers.

- Fresh project: run `database/schema.sql` in the Supabase SQL editor (skip the "Migration" block at the bottom).
- Existing project from the older schema: run only the "Migration" block (idempotent).
- Then run `npm run seed -w server` and copy the printed demo user id into `DEMO_USER_ID`.

### Environment variables

| Variable | Used by | Purpose |
|----------|---------|---------|
| `PORT` | server | API port (default 3000) |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | server | Database and auth access |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | client | Browser Supabase client |
| `GOOGLE_BOOKS_API_KEY` | server | Book search, metadata, similar books |
| `GOOGLE_CLOUD_PROJECT_ID`, `GOOGLE_CLOUD_VISION_KEY` | server | Scan Book text detection |
| `GOOGLE_MAPS_API_KEY` | server | Nearby stores (not needed for the map) |
| `DEMO_USER_ID` | server | Seeded demo profile used when no login token is present |
| `API_NINJAS_KEY` | server | Quote of the Day and mood quotes (`X-Api-Key`) |

### Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev:server` / `npm run dev:client` | Run API / web app |
| `npm run build` | Build the client |
| `npm run seed -w server` | Seed demo user, readers, saved books |
| `npm run verify-works -w server` | Verify the curated mood book list against the quotes API |
| `npm run check -w server` | Compatibility score assert check |
| `npm run test:e2e` | Playwright tests |

## Project Structure

```text
readalot/
├── SPEC.md                     MVP spec, decisions and tickets (T01-T29)
├── REFERENCE-IMG/              Low-fi reference screens 01-15
├── client/src/
│   ├── views/                  One file per route
│   ├── components/             Shared UI
│   │   ├── book/               Book Details tabs (About, Reviews, Quotes, Buy, Similar)
│   │   ├── modals/             Mood, Quote of the Day, Write review, Add quote
│   │   ├── room/               Room scene, Currently Reading card
│   │   └── people/             Map, reader bottom sheet
│   ├── composables/            useAsync, useLocation
│   ├── router/                 Routes
│   └── services/api.js         Only place that calls the API
├── server/
│   ├── src/routes/             Express routes
│   ├── src/services/           Books, quotes, compatibility, vision, supabase, env
│   ├── src/middleware/auth.js  Token guard (demo-user fallback)
│   ├── data/works.json         Curated, verified works for mood recommendations
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
- Quote of the Day may be unfiltered (`safe` needs a premium api-ninjas key).
- Mood recommendations are limited to the curated list in `server/data/works.json`.
- Google Books returns a limited slice per query, so genre shelves can be thin.
- Compatibility is computed per request (O(users)); fine at MVP scale.
- Desktop shows a centred phone-width column only.

## App Structure and Page Connections

The app is built around four main areas: **My Room, Discover Books, Discover People, and Scan Book**. Each area connects back to the same book and user data so the experience stays consistent.

### My Room

This is the user’s main profile and home page.

* Shows the user’s personalised reading room.
* Displays the current weather in the room window.
* Shows the user’s currently reading book.
* Displays books from their **Read** and **To Be Read** collections.
* Opens the **Mood Check-in** when needed.
* Opens the **Quote of the Day** popup.
* Clicking a book opens its quick preview, then the full **Book Details** page.

### Mood Check-in

The user answers a few short questions about how they feel.

The answers are used to generate a book recommendation and matching quote.

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
