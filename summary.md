# Readalot: Codebase Summary

### Client views (`client/src/views/`)
- ProfileView.vue: placeholder text only (T20)
- SearchView.vue: placeholder text only (T09)
- GenreShelfView.vue: placeholder text only (T08)
- ReaderShelfView.vue: placeholder text only (T25)

### Client components (`client/src/components/`)
- ShelfTier.vue: placeholder (T08/T25)
- QuoteCard.vue: placeholder (T18)
- ReviewCard.vue: placeholder (T17)
- book/AboutTab.vue: placeholder (T05)
- book/ReviewsTab.vue: placeholder (T17)
- book/QuotesTab.vue: placeholder (T18)
- book/BuyTab.vue: placeholder (T05)
- book/SimilarTab.vue: placeholder (T05)
- modals/MoodCheckInModal.vue: placeholder (T15)
- modals/MoodResultModal.vue: placeholder (T16)
- modals/QuoteOfDayModal.vue: placeholder (T14)
- modals/WriteReviewModal.vue: placeholder (T17)
- modals/AddQuoteModal.vue: placeholder (T18)
- room/RoomScene.vue: placeholder (T10)
- room/CurrentlyReadingCard.vue: placeholder (T10)
- people/PeopleMap.vue: placeholder (T23)
- people/ReaderSheet.vue: placeholder (T23)

### Client logic
- composables/useLocation.js: throws "not implemented" (T04)

### Server stubs
- server/src/services/quotes.js: throws "not implemented" (T13)
- server/src/services/compatibility.js: throws "not implemented" (T22)
- server/src/services/vision.js: throws "not implemented" (T26)
- server/scripts/seed.js: logs "not implemented" (T02)
- server/scripts/verifyWorks.js: logs "not implemented" (T12)
- server/data/works.json: empty array `[]` (T12)
- server/tests/compatibility.check.js: imports compatibility, asserts it exists only (T22)

### E2E test stubs (`tests/e2e/`)
- shelve-book.spec.js: `test.skip`, empty body (T28)
- scan-book.spec.js: `test.skip`, empty body (T28)
- mood-result.spec.js: `test.skip`, empty body (T28)

## Written and working in this session
- client/src/components/StateView.vue: loading / error + Retry / empty slot (T01), not used anywhere yet
- client/src/router/index.js: all spec routes registered, `/mood` removed (T01)
- client/src/components/BottomNav.vue: 5 tabs (Home, Discover, People, Scan, Profile) (T01)
- database/schema.sql: `saved_quotes` table added (T03)
- .env.example: `DEMO_USER_ID`, `API_NINJAS_KEY` added (T02)
- client/src/views/MoodView.vue: deleted (T01)
- client/build (`vite build`): passes

## Already existed before this session (built)

### Client
- main.js, App.vue (AppHeader + RouterView + BottomNav)
- composables/useAsync.js (data / error / loading / run)
- services/api.js: searchBooks, getBook, getUser, getUserBooks, saveUserBook, updateReadingStatus, removeUserBook, getWeather, getNearbyReaders, getCompatibility, getNearbyStores, getRecommendations, scanBook, getReviews, addReview, getQuotes, addQuote, getTodayQuote
- services/supabase.js
- components: AppHeader, BookCarousel, BookCover, BookPreviewModal, BookShelf, CompatibilityBadge, PrimaryButton, RatingStars, ReadingStatusButtons, UserAvatar
- views (basic, old design): MyRoomView, DiscoverBooksView, DiscoverPeopleView, ReaderRoomView, BookDetailsView, ScanBookView
- assets/theme.css (old green/berry theme)

### Server
- app.js, index.js
- middleware/auth.js (requires Bearer token, no demo fallback)
- services: books.js (Google Books search/map), env.js, supabase.js
- routes working at basic level:
  - books.js: search, get by id, get/post reviews, get/post quotes
  - userBooks.js: post, patch, delete
  - users.js: get user, get user books
  - people.js: nearby, compatibility (hardcoded demo data when no Supabase)
  - weather.js
  - stores.js
  - quote.js: today (from `featured_quotes` table, fallback quote)
  - recommendations.js: mood → hardcoded query (old moods: sad, stressed, bored, reflective, romantic)
  - scanBook.js: takes `detectedText` from body, no Vision call

### Database
- schema.sql: profiles, books, user_books, reviews, quotes, connections, featured_quotes, saved_quotes

### Tests
- tests/e2e/smoke.spec.js (expects "Search Results" heading on `/discover`)
- playwright.config.js

## Not yet built / not yet connected

### T01 Shared shell
- Mockup colour tokens not applied (theme.css still green/berry)
- Georgia / Arial typography not applied
- Bootstrap variable overrides not applied
- AppHeader: no title/subtitle props, no back arrow, no search icon
- AppHeader still has old "Scan" button
- 430px centred phone column not applied
- StateView not used by any view
- Smoke test not checked against new placeholder screens

### T02 Demo user, seed, environment
- Auth guard has no demo-user fallback
- `DEMO_USER_ID` not read in env.js
- Seed script not written
- README setup / env vars not updated
- Shared Supabase project not documented

### T03 Schema and Book shape
- `buyUrl`, `pageCount`, `ratingsCount` not in books.js mapper
- README book contract not updated
- Saved-quotes table not yet run on the Supabase project

### T04 Location service
- useLocation not implemented
- Hardcoded Singapore coordinates still in weather, people, stores calls
- Permission-denied handling not written

### T05 Book Details
- BookDetailsView has no tabs
- Tab components not imported or wired into BookDetailsView
- Similar books endpoint does not exist
- Back header / rating chip / synopsis expand not built
- Status button persistence not verified

### T06 Quick Preview
- BookPreviewModal not wired to carousels, spines, or results
- "View full details" link not confirmed

### T07 / T08 / T09 Discover and search
- Filter chips (For You, Genres, Awards, Community) not built
- Shelf carousels with next-card cue not built
- "See all" links not built
- GenreShelfView: no data fetch, no 4 tiers, no sort chips
- ShelfTier not implemented
- SearchView: no search UI
- Header search icon not built

### T10 / T11 My Room
- RoomScene not built (CSS/SVG)
- Weather window not built
- CurrentlyReadingCard not built
- Quote of the Day pill not built
- Shelf rows (status × genre, max 3) not built
- Empty state "Add your first book" not built

### T12–T16 Quotes and mood
- Candidate title list not picked
- verifyWorks script not written
- works.json empty
- quotes.js service not written (api-ninjas)
- Quote of the Day still reads `featured_quotes`, no daily cache, no api-ninjas
- QuoteOfDayModal not built
- MoodCheckInModal not built
- Daily auto-open / "Skip for today" (browser storage) not built
- Mood vocabulary not changed to Calm / Low / Stressed / Excited
- Mood → category mapping not written
- Recommender still uses hardcoded queries, not curated list
- Recommendation + quote lookup not written
- MoodResultModal not built
- "Add to TBR / Open book / Another" actions not built
- Step indicator not built
- `getRecommendations` in api.js no longer used by any view

### T17–T19, T21 Reviews and quotes
- ReviewsTab / ReviewCard not built
- Filter chips Top / Newest / Following not built
- Review upsert (one per user per book) not confirmed
- WriteReviewModal not built
- QuotesTab / QuoteCard not built
- AddQuoteModal not built
- Save / unsave quote endpoints missing
- Heart toggle not built
- List saved quotes endpoint missing
- Saved quotes section on Profile not built

### T20 Profile
- ProfileView has no form (name, avatar, genres, location, discoverable)
- Profile update endpoint not confirmed

### T22–T25 People
- computeCompatibility not written (60/40)
- people.js still returns hardcoded compatibility (72)
- Coordinates not rounded to 2 decimals
- Compatibility assert check not written
- Leaflet not installed
- PeopleMap / ReaderSheet not built
- City / username search and filter not built
- ReaderRoomView not converted to read-only room scene
- Follow / Unfollow endpoints and button missing
- "You both shelved" chips not built
- "View full bookshelf" link not built
- ReaderShelfView has no data / tiers

### T26 / T27 Scan
- Vision API call not written
- Confidence score not written
- "Not found" result not written
- ScanBookView has no camera file input
- 1280px downscale not written
- Result screen (confirm / scan again / status buttons) not built
- Express body limit still 8mb

### T28 / T29 Tests and polish
- E2E specs are skipped stubs
- Stubbed external APIs not set up
- Accessibility pass not done
- Loading / empty / error audit not done
- README not updated for setup, env vars, known limits
