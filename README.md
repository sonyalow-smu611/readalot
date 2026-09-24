# Readalot

Minimal Vue + Express + Supabase project skeleton for the reading app.

## Getting Started

```bash
npm install
cp .env.example .env
npm run dev:server
npm run dev:client
```

Run the server and client commands in separate terminals.

- Vue app: `http://localhost:5173`
- Express API: `http://localhost:3000/api/health`
- Root `.env` is the only env file. Vite reads it through `client/vite.config.js`.

## Project Structure

```text
readalot/
├── client/             Vue 3, Bootstrap, router, shared API client
├── server/             Express API routes, Supabase, external API calls
├── database/schema.sql Minimal Supabase table schema
├── tests/e2e/          Playwright smoke tests
├── .env.example        Single env template
└── package.json        Workspace scripts
```

## App Contracts

Use `client/src/services/api.js` from Vue components. Components should not call Google Books, Open-Meteo, Places, Vision, or Supabase data tables directly.

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
  averageRating
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
