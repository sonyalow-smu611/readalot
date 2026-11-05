<!-- Scaffolded with AI assistance — see AI_USAGE.md -->
# Team feature acceptance tests

Run from the repository root:

```bash
pnpm install
pnpm exec playwright install chromium
pnpm test:e2e
```

The command runs **50 scenarios on each viewport (100 checks)**: **desktop Chrome (1440 × 900)**, then **iPhone 13 emulation (390 × 664 viewport, touch, mobile user agent, 3× scale)**. The second run still happens if the first finds failures. No retries are enabled. This is Chromium emulation, not Safari or a physical iPhone.

Keep the existing Supabase keys in the root `.env`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`. Use a team test project with the repository's database migrations applied. The runner refuses to report a successful run with missing authentication keys. It creates temporary readers, friend recipients and catalogue entries and removes them afterward. Default ports **3110 (demo API), 3111 (Supabase API) and 5175 (client)** must be free; Playwright starts and stops both APIs and the client. Override the ports with `PLAYWRIGHT_API_PORT`, `PLAYWRIGHT_REAL_API_PORT` and `PLAYWRIGHT_CLIENT_PORT` when needed. The feature config inherits these settings from `playwright.config.js`.

For one feature, still on desktop then iPhone:

```bash
pnpm test:e2e:features --grep CAFE
pnpm test:e2e:features --grep HOUSE
pnpm test:e2e:features --grep LIB
pnpm test:e2e:features --grep MAP
pnpm test:e2e:features --grep SALON
pnpm test:e2e:features --grep TOUR
pnpm test:e2e:features --grep FRIEND-0
```

For one viewport or an interactive debugging run:

```bash
pnpm exec playwright test --config=playwright.features.config.js --project=iphone --grep CAFE --headed
pnpm exec playwright test --config=playwright.features.config.js --project=desktop --debug
```

The old 42 top-level spec files have been removed. `pnpm test:e2e` and `pnpm test:e2e:features` now run this same suite, desktop first and then iPhone. `playwright.config.js` is the canonical configuration; `playwright.features.config.js` remains a compatibility entry point. Shared helpers in `tests/e2e/` are retained because these scenarios import them.

## Scenario inventory

Each scenario has explicit assertions and its own browser context. A failure stops that scenario and the other scenarios continue. Cafe journeys include named steps in the report.

| ID | Steps and expected results |
|---|---|
| MAP-01 | Open daily tasks with completed prerequisites → three tasks → claim 50 coins → balance increases once → reload → reward cannot be claimed twice. |
| MAP-02 | Grant a fixed location → private to public → saved public state → private → reload → saved private state. |
| MAP-03 | Switch music off/on → state changes → reload retains the choice. Uses the phone Menu when present. |
| MAP-04 | Profile badge → salon Profile tab expanded → no document overflow. |
| MAP-05 × 4 | Places → each building's place card → enter → expected route → Back to town → map ready. |
| MAP-06 | Open notifications → panel visible → Friends → the configured friend is present. Notification opening and persistent clearing are covered by MAP-09. |
| MAP-07 | Tap a ground coordinate (touch on iPhone) → character reaches it → enable Follow → drag map → Follow releases. |
| MAP-08 | Unfinished daily tasks → claim disabled → Go for reading task opens house card. |
| MAP-09 | Room visit notification → reader's profile → return → clear → reload keeps notifications cleared. |
| LIB-01 | Desk lamp off → other lamp unchanged → reload retains off → on. |
| LIB-02 | Help desk → focus search → enter only the start of a title → verify submitted query → open matching book. The match response is deterministic; this does not validate live search relevance. |
| LIB-03 × 11 | Each genre, including Bestsellers → Covers → Spines → mode is selected and books are visible → capture each rendering → preview → close → return to hall. |
| LIB-04 | Scanner → upload PNG → POST includes image → matched preview → close preview/scanner. |
| LIB-05 | Preview → add to To be read → Undo → Where to get (NLB/Amazon link destinations) → show/hide reviews → open full page. |
| LIB-06 | Full page → no rating blocks posting → four-star review → reload retains it → edit to five stars → delete. |
| CAFE-01, CAFE-02 | Walk to two distinct readers in separate scenarios → profile → real friend request → send/reopen real chat → visit room → no decoration controls → shelf → book preview, shops and reviews → no controls to edit their reading state → noticeboard note → reload retains note → remove own note. A friend request remains pending until its recipient accepts. |
| CAFE-03 | Visit furnished room → tap and long-drag furniture → no editor → drag a book toward another shelf → owner's shelf stays unchanged → no furniture or shelf mutation request. |
| FRIEND-01 | Accepted friendship in the real database → town Friends list → friend house → room book card → three shelf rows and both modes → Add/Undo affects only the visitor’s shelf → shops/reviews → full book page → post/delete visitor’s review → Back/reload → owner books and furniture unchanged. |
| FRIEND-02 | Accepted friend’s furnished room → tap/long-press/drag furniture → no editor → try moving books between shelves in Covers and Spines (touch input on iPhone) → no shelf/furniture writes → forged furniture PUT returns 403 → reload → original owner data unchanged. |
| FRIEND-03 | Town Places → accepted friend’s house → noticeboard → blank note blocked → post signed note → owner’s API sees it → visitor reload sees it → take down own note → original shelf/layout unchanged → Back to town. |
| HOUSE-01 | Room bookshelf → all genre filters → each retains books → Spines/Covers captures → own book details. |
| HOUSE-02 | Real seeded book → To be read to Currently reading → progress 40% → reload persists → Finished reading → 100 XP event → level-up coins. |
| HOUSE-03 | Floor and table lamps off/on → pressed state reflects each choice. |
| HOUSE-04 | Buy poster → coins deducted → inventory → place on wall → Move left → position changes → cancel removal → confirm removal → inventory → reload retains ownership. |
| HOUSE-05 × 3 | Chair/curtains/bedding → buy/place → buy replacement → prior item returns to inventory → no free Move control → remove replacement → both owned. |
| HOUSE-06 | Purchases total exactly 480 coins → zero balance → next purchase cannot be confirmed → reload retains zero. |
| HOUSE-07 | Noticeboard daily quote → save → salon saved quotes → remove → reload stays removed. |
| HOUSE-08 | Room menu mood check-in → Continue disabled before choice → Calm → recommendation and quote → save/unsave. |
| SALON-01 | Change hair style/colour, skin and top → save → verify database character → reload → all choices remain. |
| SALON-02 | Add favourite genre, gender and religion → save completes → reload → choices persist → favourite genre opens library bookcase. |
| SALON-03 | Start at 90 XP → salon bar at 90% → start a real shelved book → earn 20 XP → level 2 pays 50 coins → next bar at 7% → reload retains bar and coins. |
| SALON-04 | Profile Reading/To read/Finished → list counts and titles match shelf API → reading percentage shown → close each list. |
| TOUR-01 | Replay the tour → desktop explains direct controls; phone asks to open ☰ → Next through all four menu rows keeps it open → map step closes it → Back reopens it → Skip closes the tour. |
| TOUR-02 | Replay → skip earlier sections → salon studio → tour returns to town and asks for the badge → badge opens Profile → profile-card explanation → Skip → reload does not replay. |

## Reports and limits

The sequential runner keeps each viewport's report:

```bash
pnpm exec playwright show-report playwright-report/features-desktop
pnpm exec playwright show-report playwright-report/features-iphone
```

Failures retain screenshot, video, browser errors (when emitted) and trace under `test-results/features-desktop/` or `test-results/features-iphone/`. Each directory also contains `results.json` for machine-readable results. Shelf mode screenshots are attached even on successful runs for visual review. These captures are **not pixel-baseline comparisons**.

Weather, time, daily quotes, book search, bestsellers, mood recommendations and scan matches are fixed at the network boundary. The scan uses a small PNG fixture; live OCR accuracy and physical camera permission/hardware remain manual checks. Catalogue preview add/undo uses a stateful shelf fixture; the separate reading/XP journey uses the real API and database. Cafe seating/book data is fixed around real disposable recipients; friendships and chat use real persistence. The FRIEND scenarios use a discoverable owner with a real accepted friendship, real owner books on all three shelves, placed furniture and saved notes through the Supabase-backed API. They compare the owner’s authenticated shelf/layout snapshots before and after visitor actions. Only the external full-book catalogue lookup is fixed for their uniquely seeded test books. The default API serves demo room/shelf data in memory, while the second API uses Supabase.

This suite covers the feature journeys listed above. At the user's request, the former top-level specs (including auth, API security, additional errors, accessibility and visual tests) were removed. Their extra coverage has not all been migrated here. The broader documents in `docs/e2e/` remain manual verification plans, not additional executable tests. A failed scenario does not verify its later steps; inspect its trace.

## Historical verification before the pull (5 November 2026)

Client production build: passed. Complete feature run: **84 passed, 6 failed, 0 skipped, 0 retries**.

| Project | Passed | Failed |
|---|---:|---:|
| Desktop | 42 | 3 |
| iPhone emulation | 42 | 3 |

Before the pull, the same three scenarios failed on both viewports:

- **LIB-02:** submitting the help-desk search changes the URL, but the search page stays blank and no catalogue search request follows.
- **LIB-05:** Open full book page changes the URL, but the book page content stays blank. The preceding add/undo, shops and review-toggle steps pass.
- **MAP-05, Library:** entering the library succeeds; Back to town changes the URL, but the town scene does not mount.

The pull fixes the library root/transition bug behind these failures. All three scenarios are retained as regression checks; the targeted post-pull run passes on both viewports. No original scenario was removed because the feature behavior is still supported. Current full-run results are recorded below.

## Post-pull verification before the friend-house addition (6 November 2026)

Reviewed `fd8798d` → `e6b03bb`. All original 45 scenarios remain relevant. Added **TOUR-01** for the responsive town-menu walkthrough and **TOUR-02** for its town-badge shortcut into Profile. The build passes with `pnpm --filter readalot-client build`.

The full **94-check** run completed without skips or retries:

| Project | Passed | Failed |
|---|---:|---:|
| Desktop | 47 | 0 |
| iPhone emulation | 46 | 1 |

The iPhone failure was MAP-09 reloading after the notification list cleared optimistically but before the clear timestamp was saved. MAP-09 now waits for the actual saved `notifications_cleared_at` timestamp before reloading. Its targeted rerun **passes on both desktop and iPhone (2/2)**. The other 93 checks passed in the full run; the entire suite was not rerun after this isolated test-timing correction.

The original three library navigation regressions pass on both viewports after the upstream fix. The smoke/API specs present during that review were later removed with the legacy suite; this historical run did not execute them.

Each feature run replaces the per-viewport reports at the paths above; `results.json` identifies which scenarios were included. The corrected notification check has its own report:

```bash
pnpm exec playwright show-report playwright-report/notification-verification
```

## Accepted-friend house verification (6 November 2026)

The earlier Cafe scenarios visited readers with pending requests. FRIEND-01/02/03 explicitly seed an **accepted friendship**, enter the house through the town's **Friends** or **Places** controls, and verify the real owner's saved data. The three new scenarios pass on **desktop (3/3)** and **iPhone emulation (3/3)**, with no skips or retries. The client build passes.

```bash
pnpm test:e2e:features friend-house.spec.js
```

That targeted run covered the six new friend-house checks. The subsequent full-suite results are below.


## Legacy cleanup verification (6 November 2026)

Removed the 42 legacy top-level specs and retained these seven feature specs plus their shared helpers. `pnpm test:e2e` now runs this suite by default. Updated furniture actions and removal confirmation assertions for the latest pulled UI.

The complete run passes: **100 passed, 0 failed, 0 skipped, 0 retries**.

| Project | Passed | Failed |
|---|---:|---:|
| Desktop | 50 | 0 |
| iPhone emulation | 50 | 0 |

The per-viewport reports above contain this complete run. Both config entry points collect 100 checks, and `pnpm --filter readalot-client build` passes.
