# Spec: Smoother first tour, pixel characters in the salon, and reader levels

Labels: `ready-for-agent`
Owner: Aalric. Three PRs, in order; each is handed to Aalric to stage and commit.

Decisions made with Aalric in a Q&A session on 2026-10-28.

## PR 1: First tour fixes (Dylan reviews)

### Arrival: one continuous dive
Today three camera moves fire one after another with no knowledge of each other: Welcome's
Finish scales the login backdrop to 2.4× (`AuthStage.vue`, CSS), the town then opens at
`START_ZOOM` 0.6 (a sudden cut to a wider view), and the first tour Next zooms out and in again.

- After Welcome, the town opens already zoomed in on the reader's house, at the tour zoom, so
  the backdrop zoom and the town's first frame line up. No other zoom until the reader presses
  Next.
- A returning reader (no tour) opens the town as today.

### Spotlight and card below
- Each building stop puts the building in the top half of the screen (the camera aims below
  its centre), dims the rest of the map, and shows Dylan's building glow on it.
- The tour card sits under the building with a small arrow pointing up at it. Card and building
  never overlap, at phone or laptop size.
- Steps with no building (the welcome card) show the card over a dimmed screen, as today.

## PR 2: Pixel characters, salon room, profile tab (Aalric's area + shared character code)

### Characters look like the map
- Welcome's "Pick your character" and the salon draw the reader as the map's pixel sprite
  (`lib/avatar/draw.js`), large, with crisp pixels.
- The sprite is alive: it idles (breathes, blinks), hops when something changes, and walks on
  the spot now and then. No turning round. The 3D figure (`characterModel.js`, `CharacterModel.vue`)
  is removed.
- Welcome: one big sprite in the middle, with the 5 presets as small sprites underneath. Tapping
  one swaps it in with a hop.

### The salon room
- A pixel-art interior drawn the way the cafe, library and My Room are: the town palette, dark
  outlines, a barber chair, and a wall mirror that shows the reader's reflection (mirrored sprite).
- Laptop: the character in the room on the left, the customiser on the right (as today).
- Phone: the room and character fill the top half; the customiser is a pull-up sheet below.
  Changes show on the character straight away.

### Leaving with an unsaved look
Back to town, Log out, or any other way out of the salon with unsaved changes asks:
**Save look and leave** · **Discard and leave** · **Stay**. (Today only Discard or Stay.)

### Profile tab
- Pixel panels in the town's colours (chunky outlined cards, like the cafe and library signs),
  in place of the beige cards.
- Stats (books, level, XP, coins) count up when the tab opens, with a bar that fills.
- Cards tilt toward the pointer and pop when tapped; genre chips bounce.
- Pixel confetti or sparkles on save, on level-up, and when privacy is switched.
- Respects reduced motion: no tilt, no count-up, no confetti.

## PR 3: XP, levels, coins and the map badge (touches the house, cafe and HUD)

### XP
Saved as one row per action in a new `xp_events` table (reader, action, target, day, created_at);
the reader's XP is the sum. Duplicates are blocked by unique keys in the database, so actions
can't be farmed.

| Action | XP | Limit |
|---|---|---|
| Add a book to a shelf | 10 | once per book |
| Start reading a book | 20 | once per book |
| Finish a book | 100 | once per book |
| Write a review | 40 | once per book |
| Visit a reader's room | 15 | once per reader per day |
| Leave a note in a room | 10 | once per reader per day |
| Send a cafe message | 5 | 10 a day |

Levels: level 2 at 100 XP, and each level after costs 50 more than the one before
(level 3 at 250, level 4 at 450, …).

A shared `earnXp(action, target)` in `client/src/services/` is called with one line where each
action already succeeds. The calls in the house (visits, notes) and cafe (messages) are reviewed
by Sonz and Emiley.

### Coins
- Saved in Supabase. New readers start with 480, as today.
- Each level-up adds 25 × the new level (level 2: 50, level 3: 75, …).
- Shop purchases take coins off and are saved. `useDecor`'s in-memory credits read from the saved
  balance instead (Sonz reviews).

### Map badge (Pokémon GO style)
In place of the emoji pill on the map:
- A round portrait of the reader's pixel character (head and shoulders).
- A ring round it that fills with XP toward the next level, and the level number on a badge.
- The reader's name and coin count beside it.
- Animated: the portrait bobs and blinks, the ring sparkles as it fills, and a level-up pop.
  Tapping it still opens the salon.

`TownHud.vue` is Dylan's; he reviews the badge.

## Out of scope
- Changing what the Shop sells or its prices.
- XP for actions in the library beyond adding books (search, scanning).
