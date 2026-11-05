# AI Usage Log

The course allows AI for lower-order tasks: boilerplate, layout/theme ideas, mock data and
explaining errors. It does **not** allow AI to write main business logic, backend endpoints or
critical frontend interactivity unless the team agrees and records it here. AI-generated files
carry a top-of-file comment pointing here. Unless noted, the assistant was Claude Code, work was
done at the named teammate's request, mostly test first, and checked with Playwright. Shared code
(`components/shared/`, `stores/`, `services/`, `router/`, `App.vue`, `server/`, `database/`) is
reviewed by a teammate in the pull request.

## Team-agreed exceptions (AI wrote endpoints or interactivity)

- **3D room / room decoration placing** (Sonz): the team asked for it to be AI-written.
- **Supabase sign-in and profiles** (Aalric): Aalric waived the limit for the sign-in work.
- **Nearby readers and friends' houses** (Dylan): endpoints and interactivity, team-agreed.
- **Reviews endpoints and form** (Sonz): `GET/POST/DELETE /api/books/:id/reviews`, team-agreed.
- **Room notes endpoints** (Sonz): `/api/rooms/:readerId/notes`, team-agreed.
- **Town notifications and tap to walk** (Dylan): `GET /api/notifications/visits`, team-agreed.
- **Bestsellers bookcase** (Aasim): `GET /api/books/bestsellers`, team-agreed.
- **Daily tasks in Supabase** (Dylan): `database/daily_tasks.sql` incl. `claim_daily()`, team-agreed.
- **Testing fixes rounds 1–3** (Dylan): incl. private-reader requests and `notes_read_at`, team-agreed.
- **Still to agree:** the library's interactivity (Aasim), the town's interactivity (Dylan), Daily
  tasks on every page, and the demo-account endpoint `POST /api/demo-auth/register`.

## Foundations and shared work

| Work | Asked by | What AI produced |
|---|---|---|
| Phase 1 scaffold (Cursor agent) | Team | Vite + Vue boilerplate, theme CSS, app shell, base components, GSAP motion, routing, Pinia skeletons over mock data, placeholder views, mock books/readers/quotes, Express skeleton |
| Merge of `alric` and `sonya` branches | Team | Combined config, shell, theme, one weather route, bookshelf store, the home page room, draft e2e tests |
| Mood check-in and recommendation | Team | Mood modals, `recommendations` route, quotes/works services, 12-book placeholder list (quotes from memory, to be checked) |
| Quote of the Day dataset | Team | Kaggle Goodreads import script, `dailyQuote` service, `quote` route (topic filters are the team's to change) |
| Discover Books layout | Aasim | Shelf row component and page layout only; data and search logic left to Aasim |
| Pixel buttons, fonts and surfaces | Sonz | `pixel-buttons.css`, `pixel-surfaces.css`: square, outlined, hard-shadow look on Bootstrap buttons, cards, modals, inputs; Arial titles |
| Readable synopsis and shared book cards | Sonz | `BookSynopsis`, `ReadingProgress`, `StarMeter`, preview/details cards shared by library, shelf and book page |
| Reviews table and shelf ratings | Sonz | `database/reviews.sql`; shelf rating read from reviews; unused `/api/users` routes removed |
| No header bar on buildings | Dylan | `BuildingShell` with a floating pixel back button; `flush` pages; back goes to the previous page |
| Demo account and code 111111 | Aalric | Demo-domain sign-in, `seed:demo` script, `docs/DEMO.md` |
| Remember me, trusted devices, Books fallback | Aalric | 30-day session option; Open Library fallback when Google Books fails; `/api/health?deep=1` |
| Usernames and Add friend on profiles | Sonya | `database/usernames.sql`, `drop_connections.sql`; follows replaced by friend requests |
| Music, sound effects and weather sounds | Khaleil | Music per building, music toggle, Web Audio click/footstep effects, weather loops (credits in README) |
| Landing page `/start` (IKDA) | Khaleil | Scroll-driven landing page, loading-screen timing, first-visit routing |
| IKDA marketing page (`landing/`, now removed) | Aalric | Standalone HTML/CSS/JS page with persona and copy written by AI |
| E2E test upkeep (several rounds) | Sonz, Dylan | Shared helpers in `fixtures.js`, role-based selectors, no fixed waits, real-API port for friends tests, fixes after merges |
| README and E2E guide corrections (Codex) | Aalric | Walkthrough step counts, demo-state preflight, URL fixes |
| npm → pnpm, clean-up before submission | Dylan | pnpm workspace; removed unused PDFs, `REFERENCE-IMG/`, `design-system/`, `client/blender/`, `landing/`, old specs |

## Town (Dylan)

| Work | What AI produced |
|---|---|
| Town map and building skeleton | Map art script, Phaser `TownScene`, pan/zoom camera, place cards, one folder per building, route redirects, `AGENTS.md` |
| Living town | Friends' houses, cars and walkers on a road network, water, campfire, live weather, night lighting, laptop view |
| Building signs | Sign art, later redrawn as chunky pixel plates with a blocky pixel font |
| Daily tasks and streaks | Three tasks a day, 7-day streak rewards, freezes; Daily tab on every page; later moved into Supabase |
| Nearby readers and friends | `nearby_friends.sql`, nearby/friends routes, rounded location, cottages for friends, privacy setting shared with the salon |
| Notifications, tap to walk, friends list | Bell for requests, online friends, visits, notes and messages; slide-in toasts; tap ground to walk; friend requests section |
| Testing fixes rounds 1–3 | Friend's house opens their room, faster friend requests, sharp map names, live-weather-only chip, fuller notice board, `LoadButton` spinner-then-tick, IKDA name everywhere |
| Phone layout (Khaleil) | ☰ menu folding Daily, music, bell and privacy on phones; smaller badge; walkthrough steps per screen |

## My Room / house (Sonz / Sonya)

| Work | What AI produced |
|---|---|
| 3D room (Blender + Three.js, since replaced) | Scene scripts, room loading, book spines, opening a book, weather window |
| Pixel-art room panorama | 58 room sprites, `RoomStrip` canvas with scrolling, lighting, window view; replaces the 3D room |
| My Shelf and the book card | Labelled shelf plates, My Shelf page with scrolling rows and header cards, shared book card, laptop layout |
| Furniture library and free placement | Wall art, plants, chairs, cats, curtains, bedding, room themes, lamp switches, placement rules, press-and-hold moving |
| Visiting rooms and notes | Visit routes, read-only rooms, knocking door, notice board notes kept on the server |
| Shelf sign and Spines/Covers switch | Gold pixel shelf sign, `SlideToggle` opening on Covers |
| Picking a placed piece (Dylan) | Highlight with × and ✥ badges instead of Move/Remove buttons, `RemovePieceModal` confirm, tap elsewhere or Escape to let go; a picked piece drags at once, with a "Drag to move" line at the top |

## Library (Aasim)

| Work | What AI produced |
|---|---|
| Pixel-art hall | Bookcases by genre, help desk, scrolling hall, opened bookcase, search bar |
| Scanner | Khaleil's Scan Book moved (not rewritten) into a scanning machine; `/scan` redirects |
| Weather, rain and lamps | Live weather in windows, falling rain, tappable lamps, full screen on laptops |
| Redesign after peer feedback | Ten genres with art and fonts, Places menu, full-screen bookcase and search, Add to To be read, Where to get links |
| Roomier preview and Bestsellers | Wider book preview; NYT / Open Library bestsellers bookcase with cache and credit |

## Cafe and profiles (Emiley / Aalric)

| Work | What AI produced |
|---|---|
| Pixel reader profile | Profile card, genre chips, chat dialog; laptop two-column and full-bleed layouts; popup in the Cafe |
| Salon and characters | Pixel `CharacterSprite`/`PixelCharacter`, salon room, leave dialog, profile tab with confetti and count-ups |
| Reader levels and coins | `xp_and_coins.sql`, level rules, map badge, Shop spending saved coins |
| First tour | Town-only tour, camera spotlight card, later steps per phone/wide screen |
| Profile shortcut and usernames (Khaleil) | Badge opens Profile tab, editable @username with availability check |
| Notifications, navigation and buttons (Aalric) | `/api/notifications/activity`, sent requests, recent searches, save quote, back goes where you came from |
| Shelf of a visited reader (Aalric) | Full books for a single reader from `/api/people/:id`; library card on their shelf; sample readers hidden with Supabase on |

## Team-owned work (not AI)

The team writes these themselves (AI may only explain errors or suggest boilerplate): Google
Books search and weather proxies, bookshelf CRUD, people matching, mood-to-book matching,
barcode scanning, authentication and persistence (outside the agreed exceptions above), and the
design of e2e tests for core journeys.
