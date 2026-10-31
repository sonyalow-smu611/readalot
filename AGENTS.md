# Readalot: guide for AI assistants

Readalot is an IS216 group project: a mobile-first social reading app. After signing in, the
reader lands in a pixel-art **town**; each building in it is one part of the app, built by one
teammate. Read this before changing anything.

## Rules you must follow

The team rules are in [PROJECT.md](PROJECT.md) (tech stack, AI policy, code style). The ones that
matter most:

- **Stack:** Vue 3 (`<script setup>`), JavaScript (ES6+), Bootstrap 5 first and plain CSS for the
  gaps, Express + Supabase on the server, Playwright for tests, Three.js for the 3D room, Phaser 3
  for the town map. **Never** React, Next.js, Angular, Svelte, Nuxt or TypeScript.
- **Components and props:** data goes down as props (`defineProps`, each with a type and
  `required` or a `default`), changes come back up as events (`defineEmits`). A component never
  edits its props. Views hold state and wire components together; anything with its own job is
  its own component. Repeated markup becomes one component.
- Vue components only call our own API through `client/src/services/`; the server calls outside APIs.
- `const`/`let`, `async`/`await`, handle errors and empty states, no leftover `console.log`.
- **AI use:** record what you write in [AI_USAGE.md](AI_USAGE.md) and add a top-of-file comment
  (`// Scaffolded with AI assistance — see AI_USAGE.md`). AI must not write main business logic,
  backend endpoints or critical interactivity unless the team agreed and recorded it.
- **Git:** never push. Commit only when the person you are helping asks.

## Who owns what: stay in your folder

| Part | Folder | Route | Owner |
|---|---|---|---|
| The town (map, walking, place cards) | `client/src/town/`, `client/src/components/town/`, `client/src/views/TownView.vue` | `/` | Dylan |
| Your house → My Room | `client/src/buildings/house/` | `/house` | Sonz |
| Library → Discover | `client/src/buildings/library/` | `/library` | Aasim |
| Cafe → Social | `client/src/buildings/cafe/` | `/cafe` | Emiley |
| Hair Salon → Profile | `client/src/buildings/salon/` | `/salon` | Aalric |

Ask which part the person owns, then change files only in that part. Shared code
(`components/shared/`, `stores/`, `services/`, `router/`, `App.vue`, `server/`) changes only when
the person asks, through a pull request a teammate reviews. Details: [client/src/buildings/README.md](client/src/buildings/README.md).

## How a building works

```
Log in → TownView (/) → tap a building → PlaceCard "Enter" → /house | /library | /cafe | /salon
                                                                 │
                         buildings/<name>/<Name>View.vue ────────┘
                           └─ <BuildingShell title owner>   ← same "Back to town" button, no header bar
                                └─ your page (today: the old page from views/, e.g. DiscoverBooksView)
```

- Each building's entry view wraps everything in `components/shared/BuildingShell.vue`: the back
  button, with no bar, so the page runs to the top. Use its
  `flush` prop only for a page that fills the screen itself (the 3D room).
- `components/shared/WipPanel.vue` marks anything not built yet.
- Put a building's own components in `buildings/<name>/components/`. To take over an old page,
  move it from `views/` into the building folder and import it from there.
- Old addresses `/room`, `/discover`, `/people`, `/profile` (and their route names) redirect to
  the buildings, so existing `router.push({ name: 'profile' })` calls still work.
- Each building's name, colour, owner and tap zone live in `client/src/town/places.js`.

## Shared data between parts

- `stores/user.js` → `profile`: `profile.avatar` is the emoji the Profile page shows.
  `profile.character` is the reader's town character: part ids (`{ base: 'maya', hair: 'bun', … }`),
  always complete and valid. Parts, prices and the five presets live in
  `client/src/lib/avatar/catalogue.js`. It is always drawn as the town's pixel sprite:
  `<CharacterSprite>` (still, via `lib/avatar/draw.js`, which the map script also uses for
  `client/public/town/avatars/<id>.png`) or `<PixelCharacter>` (the same sprite, alive: it
  breathes, blinks and hops). Both live in `components/shared/`. Welcome and the salon set it.
- `stores/bookshelf.js` → the reader's books and reading status, used by the room and book pages.
- `town/nearbyStore.js` → friends, friend requests and readers nearby, and `setPublic()`: public
  and sharing your last rough area are one setting (`profiles.discoverable`), shared by the map
  chip and the salon. Spec: [docs/specs/nearby-readers-and-friend-houses.md](docs/specs/nearby-readers-and-friend-houses.md).

## Map

```
client/
  public/town/            map.png (3584 x 2560) and avatars/ — generated, don't edit by hand
  scripts/draw-town-map.mjs + scripts/town-art/   draws them: npm --workspace client run draw-map
  src/
    town/                 places.js (layout), TownScene.js (Phaser)
    components/town/      TownMap, TownHud, PlacesMenu, PlaceCard
    components/shared/    BuildingShell, WipPanel
    buildings/            house/, library/, cafe/, salon/ — one per teammate
    views/                TownView, the old pages (Room, DiscoverBooks, People), and
                          pages opened from inside buildings (search, book details, scan…)
    components/           room/, book/, people/, modals/ and other existing parts
    stores/ services/ router/ lib/
server/                   Express API (routes/), Supabase, seed data
tests/e2e/                Playwright tests, one file per journey (town.spec.js covers the buildings)
```

## Run and check

```bash
npm install
npm run dev:server        # API on :3000
npm run dev:client        # app on http://localhost:5173
npm run test:e2e          # Playwright; starts its own servers
npm --workspace client run build
```

Before you finish: build passes, the e2e tests for what you touched pass, and a new journey gets
a Playwright test that goes through labelled buttons and visible text.
