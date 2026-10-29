# Pixel buttons everywhere

**Status:** ready-for-agent

## Problem Statement

Readalot's world is pixel art: the town, My Room, the library hall, the cafe and the salon are
drawn sprite by sprite with a dark one-pixel outline. The buttons over them aren't. Most are
Bootstrap's rounded buttons in the app's brown; the house uses soft round pills with blurred
shadows; the cafe, salon and library each style their own; and two older shared buttons
(the "sticker" ones) look different again. Moving between buildings, the same kind of action (a
main action, Cancel, Close, a danger action, a filter chip) looks different on every page, and
none of them look like they belong in the pixel world they sit in.

## Solution

One clean pixel button look for the whole app, drawn the way My Room's sprites are drawn: square
corners, a solid dark outline in the room's outline colour, a lighter top edge and a darker bottom
edge like a sprite's shading, and a hard pixel shadow with no blur that the button presses into
when tapped. Colours come from My Room's palette. A small set of kinds covers every button:

| Kind | Used for | Look |
|---|---|---|
| Primary | the main action on a page or card (Enter, Post note, Save, Visit room, Confirm) | dark wood fill, cream label |
| Secondary | the other choices (Cancel, Close, Back, Follow) | paper fill, dark label |
| Accent | the one fun or celebratory action where a page wants it (Shop, Buy, Claim) | mustard fill, dark label |
| Danger | taking something away (Remove, Take down, Delete, Sign out) | brick red fill, cream label |
| Quiet | small text-only actions inside a card (See all, Undo) | no fill or outline, underlined dark label, the same focus ring |
| Icon | a button that is only an icon (Close ×, the room menu, arrows, weather) | square, the same outline and shadow, the icon centred |
| Chip | toggles and filters (genres, shelf filters, radio chips) | small, paper fill; pressed or selected shows the primary fill |

Every button in shared components, old pages and each building uses one of these kinds. The
invisible tap zones over the pixel art (the room's furniture, the library's bookcases, the town's
buildings, the salon's stage) stay invisible: they are the art. Cards that are themselves a big
button (a book tile, an inventory card, a reader card) keep their card look; the buttons inside
them use the kinds above.

## User Stories

1. As a reader, I want every button to look like it belongs in the pixel-art town, so that the app feels like one world.
2. As a reader, I want the same kind of action to look the same in every building, so that I learn the app once.
3. As a reader, I want the main action on a page to stand out from the others, so that I know what to do next.
4. As a reader, I want Cancel, Close and Back to look quieter than the main action, so that I don't tap them by mistake.
5. As a reader, I want actions that take something away to look like a warning, so that I think before I tap them.
6. As a reader, I want a button to press in when I tap it, like a real key, so that I know my tap landed.
7. As a reader on a phone, I want every button at least 44 px tall and wide, so that I can tap it with my thumb.
8. As a reader, I want a button's label to be easy to read on its fill, so that I don't have to squint.
9. As a keyboard user, I want a clear, chunky focus ring on the focused button, so that I can see where I am.
10. As a keyboard user, I want the focus ring to show only for keyboard focus, so that it doesn't flash when I tap.
11. As a reader, I want a disabled button to look flat and greyed out, so that I can tell it won't do anything yet.
12. As a reader, I want a button that's busy (saving, loading) to keep its size while its label changes, so that the page doesn't jump.
13. As a reader who prefers less motion, I want buttons to change state without sliding, so that nothing moves unexpectedly.
14. As a reader, I want icon-only buttons (Close, the room menu, arrows) to be square pixel keys like the others, so that they match.
15. As a screen reader user, I want every icon-only button to keep its spoken name, so that I know what it does.
16. As a reader, I want filter and genre chips to show clearly which are selected, so that I know what I'm seeing.
17. As a screen reader user, I want chips to announce whether they're selected or pressed, so that I get the same information.
18. As a reader, I want small text actions inside cards (See all, Undo) to stay light, so that cards don't fill up with heavy buttons.
19. As a reader, I want the furniture, bookcases, buildings and the salon stage to stay clickable art with no button drawn over them, so that the pictures aren't spoiled.
20. As a reader, I want book tiles and reader cards to keep looking like cards, so that lists stay easy to scan.
21. As a reader, I want the buttons in pop-ups (mood check-in, quote of the day, remove book, book preview) to match the rest, so that pop-ups don't feel like another app.
22. As a reader, I want the log in, welcome and verify pages' buttons to match the town, so that the app looks right from the first screen.
23. As a reader, I want the Places menu, the room menu and the Shop's buttons in My Room to match the rest of the app, so that the room isn't the odd one out.
24. As a reader, I want the library's scan machine and shelf sheet buttons to match, so that the library feels like the rest of town.
25. As a reader, I want the cafe's reader cards' Visit Room and Follow buttons to match, so that the cafe fits.
26. As a reader, I want the salon's save, confirm, privacy and shelf-list buttons to match, so that the salon fits.
27. As a reader, I want the town's place card Enter button, friends button, weather button and chat dock buttons to match, so that the map fits.
28. As a reader, I want buttons that are links (Visit room, Back to town) to look the same as real buttons of their kind, so that I can't tell them apart and don't need to.
29. As a reader on a laptop, I want a button to lighten slightly when my pointer is over it, so that I know it's clickable.
30. As a reader using Windows high contrast or forced colours, I want buttons to keep a visible outline, so that I can still find them.
31. As a teammate, I want one place that defines how buttons look, so that I don't restyle buttons in my building.
32. As a teammate, I want to pick a kind for a button (primary, secondary, danger…) rather than write CSS, so that new buttons match without effort.
33. As a teammate, I want Bootstrap's button classes to keep working and simply look pixelated, so that I don't have to rewrite markup that already uses them.
34. As a teammate, I want the old sticker buttons to look the same as everything else, so that there's only one button style.
35. As a teammate, I want a check that fails when a button doesn't follow the look, so that the style doesn't drift.

## Implementation Decisions

- **One definition, in the app's shared theme.** The pixel look is defined once in the global
  stylesheet, as plain CSS on top of Bootstrap (the project's rule: Bootstrap first, plain CSS for
  the gaps). Bootstrap's own button classes are restyled through Bootstrap's button CSS variables
  plus the pixel additions, so every existing Bootstrap button picks up the look without markup
  changes:
  - Bootstrap primary and the app's primary: **Primary**
  - Bootstrap outline and secondary variants: **Secondary**
  - Bootstrap success: **Primary** (no separate green)
  - Bootstrap danger (new where needed): **Danger**
  - Bootstrap link: **Quiet**
  - Bootstrap small: the small size
  The gaps Bootstrap has no class for (accent, icon, chip, quiet in a card) get a few small
  modifier classes in the same stylesheet.
- **The look**, from My Room's sprites:
  - square corners (no radius)
  - a 2 px solid outline in My Room's outline colour (the same dark as the town's sprite outline)
  - a 2 px lighter band along the top inside edge and a 2 px darker band along the bottom, from
    the fill colour's light and shade in My Room's palette
  - a hard shadow 3 px down and right in the outline colour, no blur
  - pressed: the button moves 2 px down and right and the shadow shrinks to 1 px; with reduced
    motion it changes at once, without a transition
  - hover (pointer devices only): one step lighter
  - focus (keyboard only): a 3 px outline ring in the outline colour, offset 2 px; in forced
    colours, the system's button colours and outline
  - disabled: flat (no shadow, no bands), paper-shade fill, muted label, no press
  - minimum 44 × 44 px; the small size is 36 px tall but keeps a 44 px tap area
  - labels: the app's body font, bold, at least 14 px, text unchanged (no forced capitals)
- **Colours** come from My Room's palette, read from the room's colour file so they can't drift:
  dark wood for Primary, paper for Secondary and chips, mustard for Accent, brick red for Danger,
  and the outline colour for lines and shadows. Every label is at least 4.5:1 against its fill;
  where a palette colour misses that, the fill uses that colour's shade from the same palette.
- **One look everywhere.** Buildings don't recolour buttons. The house's per-theme accent tint
  for its buttons goes; the house uses the kinds like everyone else.
- **Shared button components:** the two older "sticker" buttons render the pixel look (their
  colour variants map onto the kinds), and are kept only for the pages that already use them. New
  buttons use Bootstrap's classes plus the kind modifiers.
- **Bespoke button styles are removed.** Each component that styles its own buttons (pill
  buttons, rounded corners, blurred shadows, its own colours) switches to a kind and drops its own
  button CSS, keeping only layout (position, gaps, width).
- **What doesn't change:**
  - **Tap zones over the art** (the room's furniture and parts, the library's bookcases, the
    town's buildings, the salon's stage) stay invisible. Each is marked as a tap zone with a data
    attribute so the style and the check below leave it alone.
  - **Cards that are a button** (book tiles and covers, inventory and shop cards, reader cards, a
    book spine) keep their card look, marked as cards the same way. Buttons inside them follow the
    kinds.
  - Labels, accessible names, roles, pressed/selected state and what each button does.
- **Inventory** of buttons to move to the kinds, by part (counts are of button elements and
  Bootstrap buttons today; tap zones and cards are marked, not restyled):

  | Part | Components with buttons |
  |---|---|
  | Shared and old pages | app header, bottom sheet, toast, state view (Try again), guide tour, book preview, book open overlay, shelf book actions, book details, the mood check-in, mood result, quote of the day and remove book pop-ups, reader chat, the two sticker buttons; the log in, welcome, verify, search, discover, genre shelf, book details, people and reader profile pages |
  | Town (Dylan) | place card (Enter, close), places menu, town HUD, friends button and list, friend card, chat dock, weather button; town map tap zones (marked) |
  | House (Sonz) | room page (Leave a note, room menu), room dock (menu, Shop, Inventory, Mood, buy/confirm), places menu, room strip (Move/Remove, moving bar, Cancel placing, skip book; furniture and lamps are tap zones), note composer, notice board, book dialog, shelf rows, My Shelf |
  | Library (Aasim) | library page, library hall (bar of places; bookcases are tap zones), scan machine, shelf sheet |
  | Cafe (Emiley) | cafe scene, cafe reader card (Visit Room, Follow; the card itself is a card) |
  | Salon (Aalric) | salon page, about you, character customiser, coins card, confirm dialog, privacy setting, profile edit form, radio chips, reader card, shelf list sheet, style studio; the stage is a tap zone |

## Testing Decisions

- **Seam:** one, the app in the browser, through Playwright end-to-end tests.
- **The existing suite is the main guard.** Restyling must not change any label, role, name or
  behaviour, so every existing journey test must still pass untouched. A test that has to change
  for this work is a sign a label or behaviour changed.
- **One new spec checks the look itself**, because here the look is the requirement. It visits
  each building and the main shared pages and pop-ups at phone width, and for every visible button
  or button-styled link that isn't marked as a tap zone or a card, checks what a reader would see:
  square corners, a solid outline, a shadow with no blur, at least 44 px tall and wide (tap area),
  and a label at least 4.5:1 against its fill. It also presses one button with the keyboard and
  checks a focus ring shows, and checks a disabled button has no shadow. It reads computed styles,
  never class names.
- **What makes a good test here:** it asserts what's visible on the page (corners, outline,
  shadow, size, contrast, focus ring), so it passes whichever way the style is written.
- **Prior art:** the furniture spec's checks of crisp pixel sprites (`image-rendering`), the
  "never covers" check that walks every placed piece's box, and the house-desktop spec's checks at
  set viewport sizes.
- Screenshots of each building at 360 px wide are taken for review by eye, outside the suite.

## Out of Scope

- A pixel font, or making labels capitals.
- Restyling cards, chips' layout, inputs, selects, sliders, tabs, toasts or panels (only the
  buttons in them).
- The pixel art itself, and the invisible tap zones over it.
- Changing what any button does, its label or where it sits.
- The reader profile's own redesign (its own spec); it uses these kinds once both are built.

## Further Notes

- **Ownership:** this touches shared code and every teammate's building. The shared look goes in
  first as its own pull request; then each part is moved to the kinds in its own pull request,
  reviewed by that part's owner, so nobody's building changes without them seeing it.
- **AI use:** record the work in AI_USAGE.md, and add the top-of-file comment to new files.
- **Contrast:** the palette's brick red and mustard are close to the 4.5:1 line with their labels;
  the build must check them, and use the shade where they miss.
