# Buildings

Each building in the town opens one part of the app, and each part has one owner. Work only
inside your own folder; anything shared (stores, `services/api.js`, `components/shared/`) changes
through a pull request a teammate reviews.

| Building | Folder | Route | Owner | Shows today |
|---|---|---|---|---|
| Your house | `house/` | `/house` | Sonz | `house/RoomView.vue` (My Room) |
| Library | `library/` | `/library` | Aasim | `views/DiscoverBooksView.vue` (Discover) |
| Cafe | `cafe/` | `/cafe` | Emiley | `views/PeopleView.vue` (Social) |
| Hair Salon | `salon/` | `/salon` | Aalric | Profile, now in `salon/` (split into `salon/components/`) |

## The contract

- Your entry view (`HouseView.vue`, `LibraryView.vue`, …) wraps everything in
  `<BuildingShell>`. It gives every building the same **Back to town** button, top left, with no
  bar: your page's background runs to the top. On a `flush` page the button floats over it, so
  start anything of yours in the top left at `calc(var(--building-back-space, 0px) + 10px)`. Use
  `flush` only for a page that fills the screen itself, like the 3D room.
- `WipPanel` marks anything not built yet: `<WipPanel owner="…" :items="[…]" />`.
- Build with components and props (see the Code rules in `PROJECT.md`): data down as props,
  changes up as events. Put your components in `<your folder>/components/`.
- When you're ready, move your old page from `views/` into your folder and import it from
  there. Old addresses (`/room`, `/discover`, `/people`, `/profile`) already redirect to yours.
- `profile.character` is the reader's character as part ids (see `src/lib/avatar/catalogue.js`).
  The salon sets it; `<CharacterSprite :character="…">` draws it. `profile.avatar` stays the emoji the Profile page uses today.
- Each building's name, colour and owner live in `src/town/places.js`, so the town's card and
  your page always match.
