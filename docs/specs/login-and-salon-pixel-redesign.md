# Spec: Sign-in screens, character customiser and Hair Salon in the town's pixel-art style

Labels: `ready-for-agent`
Owner: Aalric (Hair Salon → Profile; sign-in screens and the shared character code by team
agreement, through reviewed PRs)

## Problem Statement

Readalot's town is crisp, flat pixel art: bright colours, dark outlines, no smoothing. The town's
panels (place cards, menus) use the app's design tokens with pill buttons and soft cards. Before
the reader gets there, though, they sign in on a page that looks like a different app: a beige
split screen with smooth vector cats and floating books. Verify and Welcome share that look.
Once inside, the Hair Salon is just the old Profile page in a shell with a "not built yet" panel.

The town is also meant to know who the reader is, and readers should be able to make that
character their own: hair, skin, outfit, accessories. Today the characters are fixed images
drawn ahead of time by the town-art script, and nothing stores a reader's choice.

## Solution

Three pieces of work, each shipped as its own commit/PR, in this order:

1. **Character customiser (shared).** Move the code that draws the town's characters into a
   shared module the app can run in the browser. Add a catalogue of parts (hair, skin, outfit,
   accessories) with colour swatches and prices, and save each reader's character to their
   account as catalogue ids. At launch only free items can be chosen; priced items are shown
   locked until coins are saved properly (a separate spec).
2. **Sign-in screens (shared, PR).** Restyle the stage behind Log in, Register, Verify and
   Welcome so it is a window onto the town: a slowly drifting crop of the real town map, the
   cats and books redrawn as pixel art with the same reactions, and the form in a card styled
   like the town's panels. Welcome gains a quick "Pick your character" step (presets only).
   When sign-in finishes, the map zooms into the town.
3. **Hair Salon (Aalric's folder).** Move the Profile page into the salon, split it into
   components, and set it inside a 2D pixel-art salon interior. The reader's character sits in
   the barber chair and shows in the mirror; the full customiser lives here.

The finished town map is the visual reference. The room's pixel spec
([room-pixel-redesign.md](room-pixel-redesign.md)) isn't built yet; this spec follows the same
rules so the two land consistent.

## User Stories

**Sign-in screens**

1. As a new visitor, I want the first screen to show the town I'm about to enter, so that the app
   feels like one world from the very start.
2. As a visitor, I want the town behind the form to drift slowly, so that the page feels alive
   without pulling my eye from the form.
3. As a visitor who prefers reduced motion, I want the town to stay still, so that nothing moves
   that I didn't ask for.
4. As a visitor, I want the cats drawn in the same pixel style as the town, so that they look like
   they live there.
5. As a visitor, I want the cats to look at the field I'm typing in, so that the page still feels
   playful.
6. As a visitor, I want the cats to cover their eyes when I show my password, so that the joke
   still works.
7. As a visitor, I want the cats to duck and the card to shake when something's wrong, so that I
   notice the error.
8. As a visitor, I want the form in a card that looks like the town's place cards, so that the
   controls feel familiar once I'm in town.
9. As a phone user, I want the town strip and cats across the top and the form below, so that the
   form is easy to reach with my thumb and nothing is squeezed.
10. As a laptop user, I want the form beside the scene as today, so that the wide screen is used
    well.
11. As a visitor, I want Log in, Register, Verify and Welcome to look the same, so that I don't
    jump between styles mid-sign-up.
12. As a visitor, I want every label, button and error message to stay where screen readers find
    them today, so that signing in stays accessible.
13. As a reader who just signed in, I want the view to zoom into the town, so that it feels like
    I'm walking in rather than loading a new page.

**Picking a character in Welcome**

14. As a new reader, I want to pick one of five ready-made characters (Rosie, Maya, Rex, Jay,
    Nova) during Welcome, so that I enter town as someone without a long setup.
15. As a new reader, I want to see the five as large pixel sprites, so that I can choose by how
    they look.
16. As a new reader, I want to be told I can restyle my character at the Hair Salon, so that I
    know where to go later.
17. As a keyboard or screen reader user, I want the picker to work as a labelled radio group, so
    that I can choose without a pointer.
18. As a reader who signed up before this existed, I want a default character (Rosie), so that
    the app never breaks for me.

**Customising in the salon**

19. As a reader, I want to start from any of the five presets, so that I have a good base to
    tweak.
20. As a reader, I want to change my hair style and hair colour, so that my character looks like
    me (it's a hair salon, after all).
21. As a reader, I want to choose my skin tone from the full set, always free, so that I can
    represent myself without paying.
22. As a reader, I want to change my top, bottoms and shoes and each of their colours, so that I
    can dress my character.
23. As a reader, I want to add accessories (glasses, scarf, flower, and later hats, a crown and
    more), so that my character has personality.
24. As a reader, I want colours from a set of swatches that suit the town, so that whatever I pick
    looks good in the pixel-art world.
25. As a reader, I want to see my character update in the salon mirror as I tap, so that I can
    try things before committing.
26. As a reader, I want Save to keep my changes and Cancel to put back what I had, so that I can
    experiment safely.
27. As a reader, I want to be asked before I leave with unsaved changes, so that I don't lose
    them by accident.
28. As a reader, I want to see confirmation when my character is saved, and an error if it isn't,
    so that I know whether it worked.
29. As a reader, I want my saved character to come back on another device, so that it's tied to
    my account.
30. As a reader, I want items that will cost coins shown with their price and a "Coming soon"
    lock, so that I know there's more to unlock later.
31. As a reader, I want options that can't be combined (e.g. a hat with a big hairstyle) to say
    why they're unavailable, so that I'm not confused.
32. As a keyboard or screen reader user, I want every part and swatch to be a labelled radio
    (colours named, e.g. "Chestnut"), and the preview to describe my character in words, so that
    I can customise without seeing the picture.

**Hair Salon**

33. As a reader, I want the salon to look like the inside of the pink-trimmed salon in town, so
    that entering it feels like stepping through its door.
34. As a reader, I want to see my character sitting in the barber chair, so that the salon is
    clearly about me.
35. As a reader, I want my profile sections (genres, coins, about you, privacy, saved quotes,
    lists) in the town's card style, so that the salon matches the rest of the town.
36. As a reader, I want everything the Profile page does today to still work in the salon, so
    that nothing I relied on is lost.
37. As a reader, I want "Back to town" to work as in every other building, so that I can leave.

## Implementation Decisions

**Ownership and review**
- Pieces 1 and 2 touch shared code (`lib/`, `views/`, `components/auth/`, `components/shared/`,
  `stores/user.js`) and Dylan's `scripts/town-art/`. The team agreed Aalric takes them on; they
  go through PRs a teammate reviews, and Dylan reviews the art-script change.
- Piece 3 stays inside `client/src/buildings/salon/`.
- `map.png`, the town's buildings and Dylan's town code are not changed.

**Shared drawing module** (`client/src/lib/avatar/draw.js`)
- `avatar(p)` and the pixel helpers it uses (`mk`, `R`, `P`, `E`, `fillPoly`, `shade`,
  `outline`) move out of `scripts/town-art/` into this module. The settings object `p` keeps the
  same fields it has today.
- `drawAvatar(p, rnd)` takes the random generator as an argument instead of reading the script's
  global one. The map script passes its own seeded `rnd`, in the same order as today, so
  **`npm --workspace client run draw-map` must produce byte-identical `map.png`, avatars,
  buildings, cars and `map-data.json`**. The app passes a fresh generator with a fixed seed for
  each drawing, so the same settings always give the same pixels.
- The script currently glues the art files together as plain text and runs them in Chromium.
  The shared module must still work there (e.g. the script reads the module's source and strips
  the `export`, or loads it as a module script). Pick whichever keeps the script simplest.
- The module draws onto a canvas at the sprite's native size, the same size and outline as the
  town's avatar PNGs. Callers scale it up with `image-rendering: pixelated` at whole-number scales.
- No Vue, no network: plain functions that can be called from anywhere, including Phaser later.

**Catalogue** (`client/src/lib/avatar/catalogue.js`)
- One list of items per slot. Each item has `id`, `label`, `slot`, `price` (0 = free) and the
  settings it adds to `p`. Slots:
  - `hair` (style), `hairColour`
  - `skin` (tone, with its shadow, lips and blush)
  - `top`, `topColour`; `bottom`, `bottomColour`; `shoes` (shoes or boots), `shoeColour`
  - accessories, one per slot: `eyes` (shades, goggles), `head` (beanie, fedora, crown, hood),
    `hairAccessory` (flower, clip, sprout), `neck` (scarf), `ears` (earring), `bag` (tote)
- **Colours are swatches, not free colours.** Each colour slot has 8–10 named swatches drawn from
  the town art's existing colours. Each swatch stores only its main colour; shadows come from
  `shade()`, so every combination stays on-palette.
- **Skin tones** come from the tones the town's characters already use, each with its own
  shadow, lips and blush values. Every skin tone is free, now and later.
- **Presets:** Rosie, Maya, Rex, Jay and Nova are written as catalogue ids, and drawing a preset
  must look exactly like today's PNG for that character.
- **Free at launch:** every item the five presets wear, plus all skin tones and all colour
  swatches. That is:
  - hair: long, bun, curly, twists, puff
  - tops: pinafore, puffer, coat, fuzzy
  - bottoms: skirt, baggy, pants, ripped
  - shoes
  - accessories: shades, goggles, scarf, flower
- **Priced (locked at launch):** the parts only the townsfolk wear:
  - hair: bob, wavy, messy, short, spiky, mop
  - tops: tee, tank, tube, hoodie, vest, sweater, cardigan, blazer
  - bottoms: long, cargo
  - shoes: boots
  - accessories: beanie, fedora, crown, hood, clip, sprout, earring, tote

  Exact prices are set in the catalogue, the only place they live.
- **Rules that need each other:** e.g. a hat swaps the hair to `tucked`, and the flower only
  draws on curly hair today. These live in the catalogue as rules (`requires`, `replaces`), not
  in components. The customiser disables an item that breaks a rule and says why.
- `isUnlocked(item)` returns `price === 0` for now. When coins are saved (separate spec), it
  checks the reader's owned items instead, and nothing else changes.

**Saved character**
- The profile is stored in Supabase auth `user_metadata` and saved with `saveProfile()` in
  `services/auth.js`. The character is one more field there: no new table, no server change.
  Preview mode (no Supabase keys) stores it in the same sessionStorage user, as for other fields.
- Shape: ids only, never colours:
  `{ v: 1, base: 'maya', hair: 'bun', hairColour: 'chestnut', skin: 'tone-3', top: 'puffer',
  topColour: 'red', bottom: 'baggy', bottomColour: 'slate', shoes: 'shoes', shoeColour: 'ink',
  eyes: null, head: null, hairAccessory: null, neck: null, ears: null, bag: null }`.
- `stores/user.js` → `applySession` reads `meta.character` through a `normaliseCharacter()`
  helper in the catalogue module:
  - Missing or unreadable → the Rosie preset.
  - Any id that's unknown, locked or breaks a rule → that slot from the `base` preset.
  - A plain string, like `'maya'` from an early build → that preset.
- The store exposes the normalised character only. Nothing else reads `meta.character` directly.

**Character components**
- `CharacterSprite` (`components/shared/`): props `character` (Object, required), `scale` (Number,
  default 4), `label` (String, default ''). It draws with `drawAvatar` onto a canvas, scaled with
  `image-rendering: pixelated`. It has `role="img"` and an `aria-label`: `label`, or a generated
  description such as "Long pink hair, light skin, pink pinafore, cream skirt".
- `CharacterPresetPicker` (`components/shared/`): props `modelValue` (String, required; a preset
  id) and `disabled` (Boolean, default false). It emits `update:modelValue`. It is a radio group
  of the five presets, each a `CharacterSprite` plus its name. It doesn't save; the view that
  uses it does. Welcome and the salon's "Start from preset" row both use it.
- `CharacterCustomiser` (`buildings/salon/components/`): props `modelValue` (Object, required; the
  draft character). It emits `update:modelValue`.
  - Tabs: Hair, Skin, Outfit, Extras.
  - Each slot is a radio group of item tiles or colour swatches.
  - Locked items show their price and "Coming soon" and can't be selected.
  - Items that break a rule are disabled, with the reason as their description.
  - It holds no saved state; the salon view owns the draft.

**Sign-in stage**
- All the work happens in `components/auth/AuthStage.vue` and its children, so Login, Register,
  Verify and Welcome change together. Their own logic (validation, submit, the auth calls) is
  untouched, apart from Welcome's new step.
- **Backdrop:** `public/town/map.png`, drawn with `image-rendering: pixelated` at a whole-number
  scale, panning slowly across a fixed path with a CSS animation. The animation is turned off
  under `prefers-reduced-motion`. A light scrim keeps the card readable.
- **Cats:** `DeskMascots.vue` is redrawn as pixel art (`pixelMascots.js`). Each cat and book
  is drawn with the town's own pixel helpers (from `lib/avatar/draw.js`) and the town's outline
  colour, then placed in the SVG as a layer with `image-rendering: pixelated`. The SVG is
  scaled by whole numbers (or halves on small screens), so pixels stay square.
  - Paws, book lids and pages are separate layers. The pupils are SVG rects that move in
    whole art pixels.
  - The `gaze` states (`idle`, `field`, `cover`, `duck`), `pageNudge`, `spines` and `hop` work
    as before, and the props are unchanged.
  - In `field`, the eyes turn to the focused input.
- **Floating books:** `FloatingBooks.vue` gets the same pixel treatment; positions and motion stay
  the same.
- **Card:** the form sheet uses the town panels' tokens: `--rl-surface`, `--rl-line`,
  `--rl-radius-modal`, the panel shadow, and pill-shaped buttons. The fonts stay the app's
  (`--rl-font-title`, `--rl-font-body`); no pixel font.
- **Layout:** from the `md` breakpoint up, side by side as today. Below it, a town strip with the
  cats across the top third and the card below, like the town's PlaceCard sheet.
- **Zoom into town:** when a returning reader's code is accepted, or after the last Welcome
  step, the stage scales the map crop up and fades out before the page changes.
  - A new reader going from Verify to Welcome stays on the scene.
  - Both still land in the salon, as before: the salon (old Profile page) is what starts the
    first-time tour. It is skipped under reduced
  motion, and it must not delay the route change by more than about 600 ms.
- `shake()` stays exposed on `AuthStage`.

**Welcome**
- A new last step, "Pick your character", uses `CharacterPresetPicker`. It starts on the saved
  base preset, or Rosie. A note says "You can restyle your character any time at the Hair
  Salon." The chosen preset is saved as a full character (that preset's ids) with the other
  Welcome answers.

**Hair Salon**
- `views/ProfileView.vue` moves to `buildings/salon/` and is split into components under
  `buildings/salon/components/`: profile header, favourite genres, coins, about you, privacy,
  saved quotes, edit profile form, the reading lists, and the "Close this book?" dialog. The
  salon view holds state and wires them together. Data goes down as props, changes come up as
  events.
- The `/profile` redirect and the `profile` route name keep working. Nothing else imports
  `ProfileView` (check with a search before moving it).
- **Scene** (`salonArt.js`, `components/SalonScene.vue`): a 2D pixel-art salon interior,
  drawn live with the town's pixel helpers like the sign-in cats, so there is no generated
  image to keep in step.
  - The room: pale clapboard walls with pink trim, a pink-paned window and a checked floor,
    plus a mirror over a counter, a barber chair, a hood dryer and a plant.
  - It runs edge to edge at the top of the page, scaled by whole numbers.
  - The saved character sits in the chair with `CharacterSprite`. The chair's seat and arms
    are a separate layer drawn over them.
  - The mirror shows a flipped reflection: the draft while restyling, otherwise the saved look.
- **Customising:**
  - A "Your character" card under the scene has a "Restyle" button. It opens a "Start from
    preset" row and the customiser, while the profile cards step aside. The mirror shows the
    draft live.
  - Each part's tile shows the reader's own character wearing it. `CharacterSprite` draws
    locked parts for these previews; only saving and loading drop them.
  - **Save** calls `saveProfile({ character })` and updates the store. The chair sprite then
    updates and a "Saved" message shows. While saving, the button shows "Saving…".
  - If saving fails, an inline error shows and the draft stays, so the reader can retry.
  - **Cancel** throws the draft away.
  - Leaving the salon (Back to town or a route change) with unsaved changes asks "Discard your
    changes?" first.
- The profile cards use the same town-panel tokens as the sign-in card. The salon's accent comes
  from `PLACES` (`salon`).
- `WipPanel` is removed from the salon.

**Unchanged interfaces**
- Routes, route names and redirects. `AuthStage` props and its `shake()`. The `services/auth.js`
  function signatures. The store's other profile fields. `AVATARS` and `TOWNSFOLK` in
  `town/places.js` and the PNGs in `public/town/avatars/` (the town keeps using them).

## Testing Decisions

- Tests check what a reader can see and do (roles, labels, visible text, results of clicks), never
  SVG shapes, canvas pixels, CSS classes or animation details.
- **Existing tests** (`town.spec.js`, `smoke.spec.js` and the rest) must pass unchanged.
- **Art script stays identical:** after the drawing code moves, run `draw-map` and then
  `git diff --exit-code client/public/town client/src/town/map-data.json`. Any change means the
  move altered the art. Write the exact commands in the PR.
- **Presets match today's sprites:** check by eye that each preset drawn by `CharacterSprite`
  looks the same as its PNG, side by side.
- **New `auth.spec.js`**, using preview mode (no Supabase keys):
  - Log in shows the email and password fields, and "Show password" toggles the field type.
  - A short password shows the "Use at least 6 characters." alert.
  - Register with mismatched passwords shows "Those passwords do not match."
  - Log in, then a code, leads a new reader to Welcome.
  - A new reader on Welcome reaches "Pick your character", picks Maya by her label, finishes,
    lands in the salon, and Maya is saved.
- **New `salon.spec.js`**, with a signed-in reader set up once, so a reload shows what was saved:
  - The salon shows the reader's profile sections (e.g. "Favourite genres", "About you").
  - Restyle → Hair → pick "Bun" and a hair colour → Save shows "Saved". After a reload, those
    radios are still checked, and the character's description mentions the new hair.
  - Restyle → change hair → Cancel puts back the old choice.
  - A priced item (e.g. "Crown") shows "Coming soon" and is disabled.
  - Changing something and then "Back to town" asks "Discard your changes?".
  - "Back to town" with no changes returns to the town.
  - The moved profile still works: edit an About you card, the full Edit profile form, the
    privacy switch, a shelf's book list, and the log-out dialog.
- The pixel look is checked by eye: screenshots of Log in, Welcome and the salon (with the
  customiser open) at phone width (390 px) and laptop width (1280 px), side by side with the town.
- `npm --workspace client run build` passes.

## Out of Scope

- **Saving coins and buying items.** Coins (`composables/useDecor.js`) live only in memory today
  and are shared with Sonz's room shop. Saving the balance and the owned items, and making
  priced items buyable, is its own spec agreed with Sonz. This spec only prepares for it (prices
  in the catalogue, `isUnlocked`).
- **Drawing the reader's custom character in the town.** The town today only shows a spawn ring.
  Dylan can turn the reader's character into a Phaser texture with `drawAvatar`; that is his
  change.
- **Showing a reader's character to other readers** (cafe, friends' houses, the users API).
- Changing the town, its panels, `map.png`'s look or what the art script draws.
- New hair styles, clothes or accessories beyond what the art code already draws.
- The room's pixel redesign (Sonz).
- A pixel font anywhere in the app.
- New profile features; the salon keeps exactly what Profile does today.

## Further Notes

- Decisions settled with Aalric:
  - **Sign-in:** match the town map; a town backdrop with a town-panel card; keep the cats and
    their reactions, redrawn as pixel SVG; restyle all four sign-in screens together; scene on
    top on phones; zoom into town after sign-in; keep the app's fonts.
  - **Character:**
    - Drawn live in the browser from a shared module.
    - Hair, skin, outfit and accessories can all be changed, using swatches, not free colours.
    - Readers start from a preset and tweak it.
    - Welcome offers presets only; the salon has the full customiser, with a live preview and
      Save / Cancel.
    - Saved as ids in the account.
    - Free items now, priced items locked until coins are saved; skin tones always free.
  - **Salon:** a 2D pixel interior; Profile split into components.
  - **Order of work:** character → sign-in → salon.
- The team's AI policy limits were waived by Aalric for this work. Keep the `AI_USAGE.md` entries
  and the top-of-file comments anyway.
- Tell Dylan once the character is saved and `drawAvatar` exists, so the town can start drawing
  readers. Tell Sonz about the coins follow-up.

## Changes after Aalric tried it (2026-10-27)

- **Full screen:** the salon route is `wide`, like the town and sign-in pages, so it fills a
  laptop window and resizes with it instead of sitting in the phone column.
- **Sign-in lands on the map:** Verify (returning reader) and Welcome (new reader) both go to
  the town.
- **The tour starts in the town:**
  - Five new first steps introduce the map: welcome, Places, the live weather, Scan, and the
    reader's name chip that leads to the salon.
  - Then a "style studio" step joins the salon steps.
  - `GuideTour` starts the tour on whatever page the new reader lands on, rather than the
    Profile page doing it.
  - The town's parts are found by their existing labels, so Dylan's files are unchanged.
- **The salon is a whole room**, replacing the "Your character" card and the Restyle button:
  - Pixel clouds part as the reader walks in (`SalonClouds`; skipped under reduced motion).
  - The full room is drawn behind everything (`salonArt.js` → `backdrop`).
  - The reader sits large in the barber chair on the left, beside an arched mirror
    (`SalonStage`). There's a spotlight, the reflection hops at each change, sparkles burst
    on save, and a name plaque sits below.
  - On the right is a dock of widgets with two tabs:
    - **Style studio** (`StyleStudio`): Looks (presets and "Surprise me", a random free look),
      the customiser, and a save bar ("New look ready", Reset, Save look) that appears only
      when something changed.
    - **Profile:** the profile cards.
  - The tour opens the tab it needs.
  - On narrow screens the chair sits on top and the widgets below.
- The tests follow the new design. New ones cover the register → town → tour journey and the
  laptop layout (chair left, widgets right).

## Second round of changes after Aalric tried it (2026-10-27)

Settled with Aalric:

- **One character, live.** The salon shows a single big character in the barber chair, wearing
  the look being styled. The mirror is decoration only, with no reflection. Save keeps the look.
- **Smooth vector art, not pixel art,** for:
  - the salon room and stage (`SalonBackdrop`, `SalonStage`);
  - the characters in the salon, the Welcome picker and the customiser tiles;
  - the sign-in cats and books (`DeskMascots`, `FloatingBooks`).

  The town map and walkers stay Dylan's pixel art.
- **`CharacterFigure`** (`components/shared/`) draws a character as a chibi SVG: a big head, big
  shiny eyes, dark outlines and soft shading.
  - It is drawn from the same saved ids and `toDrawParams()` as the pixel sprite, so saved
    characters don't change.
  - `crop` shows one part, for the customiser tiles. `wave` raises a hand.
  - `CharacterSprite` stays for the pixel town.
- **Sign-in cats** are new drawings in the character style, with every reaction kept.
- **Profile tab** matches the style studio: each section is a widget card with a dark outline,
  an offset shadow and salon pink accents.
- **Loading screen, "Town wakes up"** (`LoadingScreen.vue`, shared):
  - the sky turns from dawn to day and the sun rises;
  - the house, library, cafe and salon pop up with trees, and clouds drift;
  - the reader's character waves, and "Readalot" bounces in over "Waking up the town…".
  - It lasts about as long as before, and is skipped under reduced motion.
- The pixel-only pieces this replaced (`salonArt.js`, `pixelMascots.js`) are gone. `draw.js`
  and the map script are unchanged.

## Third round: match the map, and fly round it (2026-10-27)

- **Loading screen = the real map:**
  - `LoadingScreen` shows `public/town/map.png` at night: its lamps and windows glow (from
    `town/map-data.json`) and pixel clouds (`lib/pixelCloud.js`) drift over it.
  - Day breaks while the camera glides out over the plaza. The map's own cars drive the main
    road on the left, and townsfolk walk the pavements.
  - A "Readalot" sign in the town's chip style pops in, with the reader's smooth character
    waving.
- **Salon in the map's pixel style:**
  - The room, mirror and barber chair are pixel art again (`salonArt.js`), drawn with the map's
    helpers and outline. They're scaled by whole numbers.
  - The reader stays a smooth `CharacterFigure`, sitting in the chair (`SEAT_BOX`).
  - The way-in clouds and the save sparkles are pixel too. The profile widgets are unchanged.
- **Walkthrough of the map:**
  - After "Welcome to Readalot Town", the tour flies the camera to your house, the library,
    the cafe, the salon and a friend's house, each with a card saying what it is for. Then it
    points out Places, the weather, Scan and your name chip.
  - Fly-to steps carry `focus` (a place id) and don't dim the screen.
  - Dylan's `TownView` gained a small hook (a PR for him to review): while the tour is on it
    glides to `guide.focus`, and a tap or glide doesn't open the place card, so it doesn't
    cover the tour.
- Not done here: Aalric asked about setting up login with Clerk and Supabase. That needs a
  team decision (the app already uses Supabase Auth) and is tracked separately.

## Fourth round: no phone flash, a flipping book, and a 3D character on a podium (2026-10-27)

- **Loading glitch:** `App.vue` keeps `PhoneFrame` full-screen while the loading screen plays
  (new `full` prop), so it no longer flashes the phone column before the first page is known.
- **Loading book:**
  - The waving character is replaced by a pixel book under the Readalot sign
    (`lib/pixelBook.js`, a sprite sheet drawn with the map's helpers) that flips a page over
    and over.
  - The whole screen now lasts about 3 seconds.
- **Salon corner:**
  - The pixel art (`salonArt.js` → `station`) shows the vanity mirror at the back with the
    barber chair in front of it, seen from behind, plus a round pink podium with a ring of
    lights.
  - The reader stands on the podium in 3D.
- **3D character** (`characterModel.js`, `components/CharacterModel.vue`):
  - Built with Three.js from the same parts and colours as the drawings (`toDrawParams`),
    using rounded shapes, toon shading and an outline round each part.
  - Drag it to spin it all the way round. It keeps turning a little when let go, and turns
    slowly by itself when idle (not under reduced motion).
  - Turn left / Turn right buttons and the arrow keys do the same.
  - It hops when the look changes.
  - Without WebGL, the flat `CharacterFigure` stands in.
- **Tests:** a new salon test covers the turn controls.

## Fifth round: a nicer 3D character that only turns when asked (2026-10-27)

- **No auto-spin.** The character turns only when the reader drags it, or uses the turn
  buttons or arrow keys, and it slows to a stop after a drag. Changing the look doesn't turn
  it.
- **Rebuilt like a little vinyl toy** (`characterModel.js`):
  - **Face:** painted onto the head (`faceTexture`) like the drawings, with big shiny eyes,
    an iris, two highlights, lashes, brows, rosy cheeks, a nose and a smile.
  - **Hair:** every style starts from one shell over the top, sides and back, with an opening
    for the face. Fringes and strands are teardrop locks laid along the head.
  - **Body:** bean-shaped, with shoulders. Arms hang a little away from the body and end in
    mitten hands with thumbs. The shoes are rounded, with soft soles.
  - **Lighting:** soft standard materials, a warm key light, a pink rim light from behind,
    thin outlines, and a soft shadow on the podium.

