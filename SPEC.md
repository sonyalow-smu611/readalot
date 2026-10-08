# Readalot: MVP Spec, Decisions and Tickets

Single source of truth for the MVP. Produced from a design-grilling session against the low-fi reference screens in `REFERENCE-IMG/`. Ticket order is dependency order; "Blocked by" lists hard prerequisites.

## Problem Statement

Students and young readers who love books have no single mobile place that feels like *their* reading space, helps them pick a book for how they feel, and lets them find and connect with nearby readers who share their taste. Existing tools are either plain catalog apps or generic social feeds.

## Solution

Readalot is a mobile-first web app built around four areas that share one book record and one reading status: **My Room** (an illustrated personal room that is the profile/home), **Discover Books** (shelf carousels), **Discover People** (a map of nearby readers with compatibility scores) and **Scan Book** (add a physical book from a photo). A shared **Book Details** page ties them together, and a daily **Mood Check-in** recommends a book with a matching quote.

## User Stories

1. As a reader, I want a personal room as my home screen, so that my reading life feels like a space of my own.
2. As a reader, I want to see the current weather in my room's window, so that the room feels alive.
3. As a reader, I want a floating "Currently Reading" card with progress, so that I can jump back into my book.
4. As a reader, I want a bookshelf in my room grouped by status and genre, so that I can see my library at a glance.
5. As a new reader with no books, I want a clear "Add your first book" prompt on my shelf, so that I know what to do next.
6. As a reader, I want to tap a book spine to get a quick preview, so that I can peek without leaving the room.
7. As a reader, I want to open a daily Quote of the Day, so that I get a small moment of inspiration.
8. As a reader, I want a once-a-day mood check-in I can skip for today, so that it helps without nagging.
9. As a reader, I want to pick how I feel (Calm, Low, Stressed, Excited), so that I get a fitting book.
10. As a reader, I want the recommendation to come with a quote from that book, so that I can judge it quickly.
11. As a reader, I want to add the recommended book to To Be Read, open its page, or ask for another, so that I stay in control.
12. As a reader, I want to browse shelf carousels (For You, Genres, Awards, Community), so that I can find new books.
13. As a reader, I want to search books and authors, so that I can find a specific title.
14. As a reader, I want a "See all" view of a genre as tiered shelves sorted by popularity, length or rating, so that I can explore deeply.
15. As a reader, I want one Book Details page with About, Reviews, Quotes, Buy and Similar tabs, so that everything about a book is in one place.
16. As a reader, I want to mark a book Want to Read, Reading or Read, so that my shelf stays accurate.
17. As a reader, I want to buy online or find nearby stores, so that I can get the book.
18. As a reader, I want to see similar books, so that I can keep discovering.
19. As a reader, I want to read community reviews and filter by Top, Newest or Following, so that I can trust my choice.
20. As a reader, I want to write or edit my own review with a star rating, so that I contribute to the community.
21. As a reader, I want to read and add quotes from a book, so that I can share what moved me.
22. As a reader, I want to save a quote with a heart and see my saved quotes on my profile, so that I can revisit them.
23. As a reader, I want a map of nearby readers with compatibility percentages, so that I can find people like me.
24. As a reader, I want my location to be approximate to others, so that my privacy is protected.
25. As a reader, I want to search by city or username and filter, so that I can find readers anywhere.
26. As a reader, I want to open another reader's room read-only, so that I can see their taste.
27. As a reader, I want to see books we both shelved, so that I know what we share.
28. As a reader, I want to follow a reader instantly, so that I can keep up with them.
29. As a reader, I want to view another reader's full bookshelf, so that I can explore their library.
30. As a reader, I want to scan a book cover with my phone or upload a photo, so that I can add physical books quickly.
31. As a reader, I want to confirm or rescan a detected book before saving, so that mistakes are avoided.
32. As a reader, I want to choose its reading status while scanning, so that it lands on the right shelf.
33. As a reader, I want a Profile page for my name, avatar, favourite genres, location and map visibility, so that I control my presence.
34. As a reader, I want clear loading, empty and error states with Retry, so that the app never shows a blank screen.
35. As a desktop visitor, I want the app shown as a centred phone-width column, so that it still looks right.
36. As the team, I want a seeded demo user and fake readers, so that every feature is testable from day one.

## Implementation Decisions

**Identity**
- No login for the MVP. The authentication guard falls back to a single seeded demo profile identified by an environment variable. That fallback is the one seam OAuth later replaces; nothing else should change.
- All write endpoints continue to require "a user"; the demo user satisfies it.

**Design system**
- Mockup tokens (Canvas `#F8F2E9`, Surface `#FFFDF9`, Primary `#3F2E24`, Secondary `#F1E7DA`, Accent `#9A7A55`, Text `#2C241E`, Muted `#7E7065`, Placeholder `#D8D2CA`) override Bootstrap CSS variables. Georgia for titles, Arial/system for body, 12px card radius, 20-24px modal radius. The green/berry theme is removed.
- Bootstrap stays for grid, utilities and modals. No new UI dependency.

**Shell and navigation**
- Five bottom tabs: Home (My Room), Discover, People, Scan, Profile.
- One shared header: title, subtitle, optional back arrow, search icon. The "..." button is dropped. The search icon opens a global `/search` page (hidden on Discover pages that have their own field).
- Desktop: a centred column of about 430px max width on the canvas colour (known limit: unused space on large screens).
- New routes: `/profile`, `/search`, `/people/:id/shelf`, `/discover/:genre`. The `/mood` route is removed.

**Overlays**
- Mood check-in, mood result, Quote of the Day, Quick Book Preview, Write review and Add quote are Bootstrap modals driven by component state. Browser Back closes the page, not the modal (accepted).
- The Mood check-in opens automatically once per day on first My Room visit; "Skip for today" suppresses it until tomorrow (last-shown date in browser storage). A manual entry point stays on My Room.

**My Room**
- Scene built from layered CSS/inline-SVG flat shapes using the token palette; window reflects the weather code.
- Shelf rows = reading status (read / want to read) x most common genre, maximum 3 rows, about 8 spines each with horizontal scroll, computed client-side from the user's saved books. Empty state links to Discover and Scan.
- Currently Reading card shows the latest "reading" book with progress.

**Book Details**
- One route with in-page tabs (About, Reviews, Quotes, Buy, Similar); lazy-load each tab's data on first open. The standalone Reviews/Quotes screens in the reference become tab panels (same filter chips and write buttons, no separate back header).
- Similar = Google Books search by first genre/author (new endpoint). Online retailer = Google Books `infoLink`. Nearby stores use the existing stores endpoint.
- Book shape gains `buyUrl`, `pageCount`, `ratingsCount`.
- Reviews: filter chips Top / Newest / Following (Following uses follows). One review per user per book (upsert); Write review modal = star rating + text.
- Quotes: Add quote modal = text + optional page number.

**Saved quotes (scope addition)**
- New table linking a user to a quote (unique pair). Endpoints to save/unsave a quote and list the current user's saved quotes. The heart toggles on quote cards; a "Saved quotes" section on Profile lists them newest first.

**Discover Books**
- Search field, filter chips, horizontal shelf carousels with "See all".
- Full Genre Shelf: one Google Books genre query (about 24 results) split into 4 tiers of about 6; sort chips (Popular first = ratings count, Length = page count, Rating = average rating) sort in the browser. Known limit: Google Books returns a limited slice per query. This shelf component is reused for another reader's full bookshelf.

**People**
- Leaflet + OpenStreetMap (no key, one small dependency). Pins are compatibility-percentage circles; a reader bottom sheet shows avatar, compatibility, genre chips and "Visit their room".
- My location: browser geolocation, else saved profile location, else city/username search field. Replaces all hardcoded Singapore coordinates (weather, map, stores).
- Server returns coordinates rounded to 2 decimals (about 1 km) for others; readers with map visibility off never appear.
- Compatibility: 60% overlap of shelved books plus 40% overlap of favourite genres, computed server-side. Known limit: O(users) per request, fine at MVP scale (mark with a `ponytail:` comment).
- Follow = one-way, instant, no approval (existing connections table). One Follow/Unfollow button on the Reader Room.
- Reader Room: read-only copy of the My Room scene using their data, compatibility, currently reading, 6-book shelf preview, a "You both shelved" chip row (intersection of both users' books, max 6), and "View full bookshelf".

**Mood and quotes**
- External quotes API: api-ninjas v2 quotes, called server-side only, key in an environment variable, sent as `X-Api-Key`.
- Mood vocabulary (chips and server) is Calm, Low, Stressed, Excited. Each mood maps to a category group; one category is chosen at random per call because the API AND-matches multiple categories: Calm = nature / wisdom / philosophy; Low = inspirational / courage / happiness; Stressed = time / freedom / truth; Excited = success / humor / art.
- The recommender picks only from a curated JSON list of about 30-40 works, each verified once by a script to return at least one quote via the `work` filter. The Google Books lookup only fetches cover and metadata for the chosen title. Known limit: recommendations are bounded by that list.
- The mood note textarea is stored client-side only and unused for now.
- Quote of the Day: one unfiltered random call, cached server-side per day. `safe=true` is sent but only takes effect on a premium key (free key accepted risk: an unfiltered quote may appear; mark with a `ponytail:` comment, upgrade path = premium key).
- Mood result actions: add to To Be Read, open full book page, another recommendation.
- Step indicator reads Check-in, Result, Saved.

**Scan Book**
- Client: native file input with camera capture, image downscaled to about 1280px before upload (fixes the 8MB body limit and reduces cost). No live viewfinder.
- Server: Google Vision text detection on the cover, join the text, take the top Google Books match, confidence = naive title similarity (mark as heuristic). No match or empty OCR returns "not found" with Scan again / Search manually.
- Result screen: detected book, confidence chip, "Yes, this is the book", "Scan again", and Want to Read / Reading / Read buttons, then the shared bookshelf flow.

**Shared UI state convention**
- Every view uses the existing async composable and one small shared state component for loading, empty (with CTA slot) and error-with-Retry.

**Data and environment**
- One shared Supabase project for all developers plus a committed seed script (demo user, about 8 fake readers around Singapore, a few saved books).
- New environment variables: demo user id and the api-ninjas key. Vision and Maps keys already exist (the Maps key is no longer needed for the map itself).

## Testing Decisions

- A good test exercises external behaviour through the running app (user-visible flows and HTTP responses), never internal structure.
- Highest seam: Playwright end-to-end tests against the running app with the seeded demo user. Existing prior art: one Playwright smoke test.
- Add one e2e test each for: shelve a book (Discover to Book Details to status), Scan Book (with a stubbed Vision response), and Mood result (with a stubbed quotes response).
- One assert-style check for the compatibility function, the only non-trivial pure logic. No unit-test framework.
- External APIs (Google Books, Vision, api-ninjas) are stubbed at the server boundary in tests.

## Out of Scope

- Login, signup and OAuth (replaced later through the demo-user seam).
- Mutual connections, follow requests, notifications, messaging.
- Live camera viewfinder and barcode/ISBN scanning.
- Using the mood note text in recommendations.
- Desktop/tablet responsive layouts.
- User-created or named shelves.
- Premium quote filtering (`safe`) and unlimited quote variety.
- The "..." header menu.

## Further Notes

- Risks accepted: possible unfiltered Quote of the Day; mood recommender limited to the curated list; thin genre shelves from Google Books; saved quotes enlarge scope (first thing to cut if time runs short).
- Action items outside tickets: someone picks the ~40 candidate titles; someone creates the shared Supabase project and obtains the api-ninjas and Vision keys.
- Reference screens: `REFERENCE-IMG/01` to `15`.

---

# Tickets (ordered)

Each ticket is a thin vertical slice (client + server + data where relevant) that is demoable on its own. "Blocked by" lists hard prerequisites; tickets with the same blockers can run in parallel.

| # | Ticket | Blocked by |
|---|--------|------------|
| T01 | Shared shell | none |
| T02 | Demo user, seed data and environment | none |
| T03 | Schema and Book shape additions | none |
| T04 | Location service | T01 |
| T05 | Book Details core (header, status buttons, About, Buy, Similar tabs) | T01, T02, T03 |
| T06 | Quick Book Preview modal | T01, T05 |
| T07 | Discover Books (search, chips, carousels) | T01, T03 |
| T08 | Full Genre Shelf | T03, T07 |
| T09 | Global search page | T01 |
| T10 | My Room scene, weather, Currently Reading | T01, T02, T04 |
| T11 | My Room bookshelf rows and empty state | T06, T10 |
| T12 | Curated work list and verify script | none |
| T13 | Quotes service and Quote of the Day API | T02 |
| T14 | Quote of the Day modal | T10, T13 |
| T15 | Mood check-in modal and daily trigger | T10 |
| T16 | Mood recommendation and result modal | T03, T12, T13, T15 |
| T17 | Reviews tab and Write review | T05 |
| T18 | Quotes tab and Add quote | T05 |
| T19 | Save quote (heart) | T03, T18 |
| T20 | Profile page (settings) | T01, T04 |
| T21 | Saved quotes on Profile | T19, T20 |
| T22 | Compatibility and nearby readers API | T02 |
| T23 | Discover People map | T04, T22 |
| T24 | Reader Room, follow and shared books | T10, T22, T23 |
| T25 | Reader full bookshelf page | T08, T24 |
| T26 | Scan Book server pipeline | T02 |
| T27 | Scan Book UI flow | T05, T26 |
| T28 | End-to-end tests | T05, T16, T27 |
| T29 | Final polish and handover | all |

## T01 Shared shell
**Goal:** one PR that gives every other ticket a stable frame so six people stop colliding.
- Replace the green/berry theme with mockup tokens overriding Bootstrap variables; Georgia/Arial typography.
- Shared header (title, subtitle, back arrow, search icon) and 5-tab bottom nav; centred ~430px column.
- Router with all routes stubbed (`/`, `/discover`, `/discover/:genre`, `/search`, `/people`, `/people/:id`, `/people/:id/shelf`, `/scan`, `/profile`, `/books/:id`); delete `/mood`.
- Shared loading/empty/error component (with Retry) using the existing async composable.
**Done when:** every nav tab loads a placeholder screen in the new styling and the smoke test passes.

## T02 Demo user, seed data and environment
- Authentication guard falls back to the seeded demo profile when no token is present.
- Seed script: demo user, about 8 readers around Singapore with favourite genres and discoverable on, a few saved books.
- Environment template gains the demo user id and api-ninjas key; README setup updated; shared Supabase project documented.
**Done when:** a fresh clone with the shared keys can save a book as the demo user and see seeded readers.

## T03 Schema and Book shape additions
- Add the saved-quotes table (user, quote, created time, unique pair).
- Extend the Book shape and the Google Books mapper with `buyUrl`, `pageCount`, `ratingsCount`; update the README contract.
**Done when:** book responses include the new fields and the table exists in the schema script.

## T04 Location service
- One shared helper: browser geolocation, else saved profile location, else a city search value; replaces the hardcoded Singapore coordinates in weather, people and stores calls.
- Clear handling for permission denied.
**Done when:** denying permission still yields a usable location from the profile or search.

## T05 Book Details core
- Back header, cover, metadata, rating chip, Want to Read / Reading / Read buttons (save, change, remove).
- Tabs: About (synopsis with expand), Buy (online retailer link, nearby stores), Similar (new endpoint, Google Books by genre/author).
- Reviews and Quotes tabs present as empty placeholders for T17/T18.
**Done when:** from any book id, status changes persist for the demo user and survive a reload.

## T06 Quick Book Preview modal
- Wire the existing preview modal to open from carousels, spines and results; "View full details" goes to Book Details.
**Done when:** tapping any book opens the preview, then details.

## T07 Discover Books
- Search field, filter chips (For You, Genres, Awards, Community), shelf carousels (Popular, genre shelves, Booker winners) with partial next-card cue and "See all".
**Done when:** shelves load from live data and each book opens the preview.

## T08 Full Genre Shelf
- `/discover/:genre`: about 24 results as 4 shelf tiers; sort chips (Popular first, Length, Rating) sorted in the browser. Built as a reusable shelf-tier component.
**Done when:** sorting visibly reorders books and "See all" reaches it.

## T09 Global search page
- `/search` using the existing book search; reached from the header icon; hidden where a page has its own field.
**Done when:** a query returns results that open Book Details.

## T10 My Room scene, weather, Currently Reading
- Layered CSS/inline-SVG room (bookshelf container, bay window, reading chair); window shows live weather; floating Currently Reading card with progress; Quote of the Day button placeholder.
**Done when:** the room matches screen 01 and reflects real weather.

## T11 My Room bookshelf rows and empty state
- Group saved books by status x top genre, up to 3 rows of about 8 spines with scroll; spine opens Quick Preview; empty state "Add your first book" links to Discover and Scan.
**Done when:** a seeded user sees populated rows and a new user sees the empty state.

## T12 Curated work list and verify script
- Hand-pick about 40 candidate titles; one-off script queries the quotes API per title and keeps those that return a quote; commit the resulting list.
**Done when:** the committed list has 30-40 verified works.

## T13 Quotes service and Quote of the Day API
- Server-side client for the quotes API (key header, timeout, errors); Quote of the Day endpoint returns one random quote cached per day; mark the `safe` limitation.
**Done when:** repeated calls in a day return the same quote and a failure returns a friendly error.

## T14 Quote of the Day modal
- Pill button on My Room opens the modal (screen 04).
**Done when:** modal shows the day's quote and handles the error state.

## T15 Mood check-in modal and daily trigger
- Modal with step indicator, 4 mood chips, optional note, Continue and "Skip for today"; opens once per day on first My Room visit; manual entry point.
**Done when:** skipping suppresses it until the next day and the entry point still works.

## T16 Mood recommendation and result modal
- Mood to category mapping; recommendation picked from the curated list; quote fetched for that work; result modal (screen 03) with Add to TBR, Open book, Another recommendation.
**Done when:** each of the four moods returns a book with a quote and the actions work.

## T17 Reviews tab and Write review
- Review cards, filter chips (Top, Newest, Following), average and count, Write review modal (stars + text, upsert).
**Done when:** a posted review appears immediately and editing replaces it.

## T18 Quotes tab and Add quote
- Quote cards with reader attribution, Add quote modal (text + optional page).
**Done when:** a new quote appears on the tab for everyone.

## T19 Save quote (heart)
- Save/unsave endpoints and a heart toggle on quote cards.
**Done when:** toggling persists across reloads.

## T20 Profile page (settings)
- Display name, avatar, favourite genres, saved location, discoverable-on-map toggle.
**Done when:** changes persist and the discoverable toggle hides/shows the user on the map.

## T21 Saved quotes on Profile
- "Saved quotes" section, newest first, with an empty state.
**Done when:** a quote saved in T19 appears here and unsaving removes it.

## T22 Compatibility and nearby readers API
- Server-side compatibility score (60% books, 40% genres); nearby readers endpoint with rounded coordinates and discoverable filter; assert-style check for the score.
**Done when:** scores differ per reader and the check passes.

## T23 Discover People map
- Leaflet map with compatibility pins, search and filter, reader bottom sheet with "Visit their room".
**Done when:** seeded readers appear and a pin opens the bottom sheet.

## T24 Reader Room, follow and shared books
- Read-only room scene with their data, compatibility, currently reading, 6-book preview, "You both shelved" chips, Follow/Unfollow.
**Done when:** following persists and Following review filter (T17) reflects it.

## T25 Reader full bookshelf page
- `/people/:id/shelf` reusing the shelf-tier component.
**Done when:** "View full bookshelf" shows that reader's books in tiers.

## T26 Scan Book server pipeline
- Vision text detection, top Google Books match, naive confidence, "not found" result.
**Done when:** a cover photo returns the correct book and a blank photo returns not found.

## T27 Scan Book UI flow
- File input with camera capture, downscale to about 1280px, result screen (screen 12), confirm / scan again / choose status, hand off to the bookshelf.
**Done when:** a scanned book appears on the shelf with the chosen status.

## T28 End-to-end tests
- Playwright tests: shelve a book, scan (stubbed Vision), mood result (stubbed quotes), plus the existing smoke test.
**Done when:** the suite passes in CI/locally against the seeded demo user.

## T29 Final polish and handover
- Audit loading/empty/error states on every screen, accessibility pass (labels, focus, contrast), README with setup, env vars and known limits.
**Done when:** every reference screen is reachable and matches its mockup.

## Decision log (parked and accepted)

| Item | Resolution |
|------|------------|
| Quote of the Day source | api-ninjas v2, daily cache |
| Safe-content filter | Premium only; accepted risk on free key |
| Mood-result quote | api-ninjas `work` filter, books limited to curated list |
| Shelf grouping | Status x top genre, max 3 rows, empty-state CTA |
| Saved quotes | In scope (added by the team), shown on Profile |
| "..." header menu | Dropped |
| Login | Deferred; demo-user seam |
