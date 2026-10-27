# Spec: My Room as a flat pixel-art panorama strip

Labels: `ready-for-agent`
Owner: Sonz (house building)
Replaces: the 3D look-around room, including its uncommitted pixel-art restyle (`room-pixel-redesign.md`)
Style references: `REFERENCE-IMG/16_room_strip_style_kitchen.png`, `REFERENCE-IMG/17_room_strip_style_living_room.png`

## Problem Statement

From the town, tapping "Your house" opens My Room: a 3D room you turn around in, one object per screen. Even with its pixel-art restyle, it doesn't feel like it belongs in Dylan's town:

- **Too chunky:** its pixels are much bigger than the town's.
- **Warped:** walls and floor bend with the 3D perspective.
- **Muddy:** colours shift with 3D lighting.
- **Empty:** you only ever see one thing at a time.

The town is crisp, flat and warm. Stepping inside should feel like looking into a cosy dollhouse in that same world, not entering a different game.

## Solution

Replace the 3D room with one wide, side-on picture of the room, like a dollhouse with its front wall taken off. The reader scrolls along it sideways. Left to right, the room tells a small story:

1. the bay window reading nook
2. the reading chair and coffee table
3. the bookshelf
4. the corkboard
5. the bed with posters above it

Small props fill the gaps, so no wall or floor is bare.

The room uses the town's pixel art: the same pixel size at the town's normal zoom, the same dark 1 px outlines, and the same warm palette. It's drawn without smoothing, at whole-number scales only. At night it's lit like the town at night: lamps cast warm glows and the window lets in cool blue.

Everything you can do in the room today still works: books on the shelf, the Currently Reading card, the Quote of the Day, the live window weather and clock, decorations and pets, the room menu, the coins, and Back to town.

## User Stories

**Entering and leaving**
1. As a reader, I want "Your house" in the town to open the new room, so that going inside works exactly as before.
2. As a reader, I want Back to town to stay clearly visible, so that I can always leave the room.
3. As a reader, I want the room to be fully drawn the moment it appears, with no pieces popping in, so that it feels finished.
4. As a reader on a slow connection, I want a pixel-art still of the room's first view while its pieces load, so that I never see an empty page.

**Looking around**
5. As a reader on a phone, I want to swipe sideways to move along the room, so that I can look around with one thumb.
6. As a reader on a phone, I want a swipe to carry on gently after I let go, so that scrolling feels natural.
7. As a reader on a phone, I want a sideways swipe never to scroll the page up or down, so that the two never fight.
8. As a reader on a laptop, I want the mouse wheel and trackpad to move along the room, so that I don't have to drag.
9. As a reader on a laptop, I want to drag the room with the mouse, so that it works like the town map.
10. As a keyboard user, I want the left and right arrow keys to move along the room, so that I can look around without a pointer.
11. As a reader, I want scrolling to stop at both ends of the room, so that I never scroll into empty space.
12. As a reader, I want the bar of places to slide the room to the window, chair, bookshelf, corkboard, clock or bed, so that I can jump straight to something.
13. As a reader who prefers reduced motion, I want those jumps to happen instantly, so that nothing slides.
14. As a first-time visitor, I want a quiet "Swipe to look around" hint that fades after a few seconds or as soon as I scroll, so that I find out the room is wider than the screen.
15. As a returning visitor, I don't want to see that hint again, so that it doesn't get in the way.
16. As a reader on a phone, I want to see about one part of the room at a time, so that each part is big enough to enjoy.
17. As a reader on a laptop, I want to see about two parts of the room at once, so that the room feels connected.

**How it looks**
18. As a reader, I want the room's pixels the same size as the town's at its normal zoom, so that the two look like one world.
19. As a reader, I want the room crisp at every screen size, with no blur, so that the pixel art stays sharp.
20. As a reader, I want straight walls, a straight floor band and straight shelves, so that nothing looks warped.
21. As a reader, I want every piece of furniture outlined in the town's dark 1 px outline, so that they match the town's buildings.
22. As a reader, I want warm cream or peach walls, soft wood browns, muted greens and dusty pinks, so that the room feels cosy and slightly faded like the town.
23. As a reader, I want every part of the wall and floor to have something on it (a rug, plants, a basket, a socket with its cable, frames, a clock, hanging decorations), so that the room feels lived in.
24. As a reader on a very tall or very short screen, I want the room to fill the height, with extra wall or floor drawn rather than blur or black bars, so that it always looks complete.
25. As a reader, I want the view through the window and the wall decorations to move a little slower than the furniture as I scroll, so that the room has a little depth. (Optional.)

**The five parts of the room**
26. As a reader, I want a wide bay window with a cushioned seat and pillows at the left end, so that the room opens on a reading nook.
27. As a reader, I want the town outside the window (sky, warm window lights, the glow of a street lamp), so that my room looks out onto the town I came from.
28. As a reader, I want a plant on the sill and fairy lights in the nook, so that it feels cosy.
29. As a reader, I want an armchair angled towards the window, with a lamp beside it and a low coffee table holding a mug, an open book and a small stack of books, so that it looks like somewhere I read.
30. As a reader, I want a tall, full bookshelf with books of different heights and colours, some leaning and some lying flat, mixed with a plant, a jar, a photo frame and a candle, so that it looks like a real shelf.
31. As a reader, I want a corkboard at eye level with pinned papers, notes, a photo or two and coloured pins and string, between the bookshelf and the bed, so that the wall shows a bit of my life.
32. As a reader, I want a bed with a quilt, pillows and a throw, a bedside table with a lamp, and two or three posters or framed prints above it, so that the room ends somewhere restful.
33. As a reader, I want a wall clock showing the real Singapore time, so that the room's clock still works.

**Things I can tap**
34. As a reader, I want things I can tap to glow softly when I point at or tap them, so that I know they're interactive.
35. As a reader, I want to tap the bookshelf and see my books, so that the shelf still works.
36. As a reader, I want my books on the shelf in three rows (To be read, then Reading, then Finished), each with its name and count, so that I can find books by where I am with them.
37. As a reader, I want each book to keep its own size and colour from one visit to the next, so that my shelf looks the same every time.
38. As a reader, I want a book to lift a little out of the shelf while I point at it, and settle back afterwards, so that I know which one I'm about to open.
39. As a reader, I want a tapped book to come off the shelf and open, showing its real cover, before its details appear, so that opening a book feels special.
40. As an impatient reader, I want a tap while the book is coming out to skip straight to it open, so that I'm never kept waiting.
41. As a reader who prefers reduced motion, I want a book's details to show at once, so that nothing flies across the screen.
42. As a reader, I want the room to stay where it is while a book is open, even if I drag, so that I come back to the same spot.
43. As a reader, I want a book I start reading while it's open to move to the Reading row when I close it, so that the shelf stays right.
44. As a reader, I want to tap the book in the reading corner to open my Currently Reading card, and tap anywhere else to put it away, so that I can pick up where I left off.
45. As a reader, I want to tap the corkboard to open the Quote of the Day, so that that feature stays.
46. As a reader, I want the window to show the live weather (sun and birds, clouds, rain, a clear night) and the temperature, so that the room still follows the real sky.
47. As a reader, I want my coins in one top corner and the temperature in the other, so that I can always see them.

**Light and weather**
48. As a reader, I want the room lit like the town at night when it's night: a blue tint, warm glows round each lamp, cool blue light from the window, so that inside and outside match.
49. As a reader, I want the room bright by day, and dimmer and bluer when it rains, following the same weather as the town, so that the room follows the real sky.
50. As a reader, I want the room to show night if the weather can't be loaded, so that it always looks cosy.

**Decorations, pets and the menu**
51. As a reader, I want the room menu, shop, inventory and mood check-in exactly as now, so that nothing I use goes missing.
52. As a reader, I want to place a bought decoration on a glowing spot (the window seat, the side table, the bedside table or the floor), so that I can still decorate.
53. As a reader, I want decorations I already placed to appear in the matching spots of the new room, so that I don't lose them.
54. As a reader, I want my pets to walk along the floor of the new room, so that they still live there.
55. As a reader, I want the daily mood check-in to still pop up in the room, so that the habit isn't broken.
56. As a reader using the guided tour, I want it to still point at the window, the clock, my coins, the shelf and the quote, so that the tour still makes sense.

**Accessibility**
57. As a screen reader user, I want every tappable thing to be a labelled button with the same names as today ("Bookshelf, N books", "<title> by <author>", "Currently reading <title>", "Quote of the day", "Window view: <weather>, <n> degrees", "Singapore time <hh:mm>"), so that the room is as usable as before.
58. As a keyboard user, I want to tab to each tappable thing and have the room scroll to show it, so that nothing focused is off-screen.

**For Sonz and teammates**
59. As Sonz, I want the room's furniture and props listed as data (sprite, position, layer, optional action), so that I can add or move a piece without touching the drawing code.
60. As Sonz, I want every piece of art drawn by a script in the same way as the town's, using the town's own drawing and outline helpers, so that the room and town always match and the art can be redrawn at any time.
61. As a teammate, I want the same room drawing code to be able to show other readers' rooms later, so that friends' houses can reuse it.
62. As a teammate, I want the room's code to stay inside the house building's folder, so that the town and other buildings aren't affected.
63. As a reader on any device, I want the room's art to be small to download, so that it opens quickly.

## Implementation Decisions

**What gets replaced**
- The 3D room is retired from the app: the Three.js room component, its loading, look-around, lighting, book-opening and pixel-look helpers, and their uncommitted pixel-art restyle.
- The house view, the room page around it (modals, book details, list of books, menu, coins, toasts) and the shared stores and services stay.
- Nothing outside the house building uses Three.js. Once the 3D room is gone, removing the dependency is a separate, shared change for a teammate to review.
- The Blender sources and the exported model stay in the repo, unused, for now.

**Rendering: layered pixel-art sprites in the page, not a canvas engine**
- The room is a stage of separate sprite images (wall, floor, each piece of furniture, each prop, light layers), all drawn with smoothing turned off.
- Every tappable thing is a real labelled button over its sprite, as today, so tests, the tour and screen readers keep working.
- Phaser (the town's engine) isn't used here. It would need a second layer of HTML buttons on top anyway, and a scrolling page gives wheel, trackpad, touch momentum, clamping and keyboard scrolling for free.

**Pixel size and whole-number scaling**
- One art pixel is drawn at a whole number of device pixels, chosen so it looks about as big as a town pixel at the town's normal zoom. A town art pixel is 2 map pixels and the town opens at 0.6 zoom, so the target is about 1.2–1.5 CSS pixels.
- The room has a designed height in art pixels (a constant, around 480). The scale is the biggest whole number at which that height fits the room's height in device pixels, capped near the town's pixel size and never below 1.
- Any leftover height is filled by extending the ceiling band above and the floor below. No black bars and no blur.
- Rough numbers: a phone in portrait sees about 300 art pixels across, about one part of the room. The app's phone frame on a laptop sees about 480, about 1.5–2 parts. The whole strip is about 1,700 art pixels wide, about 3–4 frame-widths on a laptop.
- The house page stays in the phone frame on laptops, as it is now. Making it full-width like the town would mean changing the shared router, which a teammate has to review.

**Scrolling**
- The stage is a sideways scroll container. Native scrolling handles touch momentum, trackpads, clamping at the ends and arrow keys (the container takes keyboard focus).
- A plain vertical mouse wheel is turned into sideways movement.
- Dragging with a mouse is added, with a short glide after release.
- Touch is limited to sideways panning, so a swipe never becomes a page scroll.
- While a book is open, scrolling and dragging are locked.
- The bar of places scrolls to each part of the room: smoothly normally, instantly with reduced motion.
- A tab-focused hotspot is scrolled into view.
- Optional parallax: the window view and wall decorations move at a fraction of the scroll.

**Layout as data**
- The room is described by one layout module:
  - **room size:** width in art pixels and designed height
  - **parts of the room:** id, name for the bar of places, left and right edges, in order: bay window, reading chair and coffee table, bookshelf, corkboard, bed
  - **pieces:** id, sprite, x, y (the piece's bottom edge, in art pixels), layer (back wall, wall decoration, furniture, front props), and optionally an action (bookshelf, currently reading, quote, window, clock) and a label
  - **shelf rows:** the y of each board, its left and right edges and its row status, which is where the books stand
  - **decoration spots:** id, zone (window seat, side table, bedside table, floor) and position. The zone names match today's, so placed decorations carry over.
  - **pet walk band:** the strip of floor pets walk along. It's also the place to hook in townspeople later.
  - **lights:** position, radius, colour and kind (lamp, window)
- One renderer draws any layout of this shape, so other readers' rooms can reuse it later.
- How to add or move furniture is written up next to the layout, as required by the PRD.

**Art pipeline**
- All room art is drawn by a script that works like the town's draw script. It's plain browser canvas code run in Playwright's Chromium, so every run gives the same pixels.
- It uses the town's own helpers (whole-pixel rectangles and ellipses, filled shapes, shading and the 1 px `#1e1a24` outline), so outlines and shading match the town exactly.
- It writes a small set of PNG sprites, at 1 pixel per art pixel, into the house's public art folder, and is run with its own npm script.
- All furniture and props are original drawings. They follow the mood and style of the two references but copy none of their pieces or layout.

**Style, measured from the references**
- **Scale:** each reference shows about 357 × 215 art pixels on one screen (each art pixel is about 5 image pixels). That's about the same amount of room per screen-width as the strip's phone view (about 300 art pixels across), so pieces get about the same amount of detail as in the references.
- **Composition:** the furniture fills the lower half of the wall. The upper half is busy too: hanging decorations on strings from the ceiling, wall shelves with jars, plants and small objects, a gallery of frames, a clock. Tall phone screens show more of this upper wall, so it needs the same density.
- **Wall and floor:** a flat peach wall (about `#f9dec1`) with a slightly darker peach (about `#f3cdae`) for shadows on the wall. The floor is a thin sage band (about `#b0b39c`) along the bottom, about a twentieth of the height. Furniture stands on the floor band's top edge.
- **Shading:** 3–4 flat tones per material, no blending between pixels, and almost no dithering. Fabric gets small repeated patterns (tufting, quilting, knit).
- **Shadows:** wall shelves, frames and hanging pieces cast a flat shadow 1–2 art pixels down and to the right, in the darker wall tone.
- **Palette:** a room palette sampled from the references, including muted sage and olive greens (`#adb6a1`, `#766e55`, `#51543f`), warm woods (`#d2ac72`, `#ac8a68`, `#94755c`), creams (`#f3eee0`, `#f9f3e6`), dusty pinks (`#e6a68d`, `#b4836a`, `#bd866e`) and dark browns (`#574f3c`, `#3b342a`). Add the town's warm window yellow and night tints for light. The palette lives in one module.
- **Outlines (decided: the town's):** every sprite gets the town's 1 px `#1e1a24` outline, drawn by the town's own outline helper, so the room matches the map as the PRD's acceptance criteria ask. The references outline in a darker shade of each object's own colour instead. Inner detail lines (shelf boards, drawer edges, fabric seams) can still use the object's own dark tones, as in the references.
- **Props from the references to echo, in original form:** hanging hearts or shapes on strings, a socket with a cable to a lamp or fan, stacks of books on the floor, a plant in a pot on a shelf, framed prints, a cuckoo-style clock, a knitting basket, pets sitting on furniture.
- Sprites are preloaded before the room shows. The pixel-art still of the first view is shown until then and is used again where images can't load.

**Books on the shelf**
- Each book is a small drawn spine standing on its row's board. Its height, thickness, colour and lean come from a generator seeded with the book's id, so they're stable between visits.
- Each book is a labelled button over its spine. Rows are named "<Row> shelf, N books" for screen readers.
- Pointing at a book lifts it a few art pixels up and out, and it settles back after.
- Tapping a book plays a short 2D animation: the book slides out, grows towards the middle, shows its real cover (or a cloth cover with its title if it has none), and opens. Then the existing Book details dialog appears.
- A tap during the animation skips to the end. With reduced motion, the details appear at once. "Close book" puts it back. Status changes move the book to its new row when it's back.

**Window and weather**
- The bay window shows the existing window view, redrawn as a small pixel-art view of the town: banded sky, the town's rooftops with warm windows, a street lamp glow, plus the sun with birds, clouds, rain or the moon.
- It keeps its inputs (weather, night) and its test ids (window view, bird, raindrop). Its label keeps the "Window view: <weather>, <n> degrees" format.
- The temperature chip is pinned in the top corner opposite the coins.

**Lighting**
- A light layer over the room uses the town's own night and weather tints (clear, rain, night, rainy night), multiplied over the room.
- Warm glows are added round each lamp in the layout, using the town's warm glow colour. Cool blue spills from the window at night.
- The light follows the same live weather and day/night as the town, and falls back to night when the weather is unknown.
- Lamps in the art also have lit-shade versions for night.

**Hint**
- "Swipe to look around" ("Drag or scroll to look around" on devices with a pointer) is shown once per viewer, on the first visit.
- It hides after a few seconds or at the first scroll. Whether it has been seen is remembered in browser storage, and the hint fails safe (it just shows) if storage isn't available.

**Unchanged interfaces**
- The house route and its name, the `/room` redirect, Back to town, and the BuildingShell header stay as they are.
- The room component still takes the books, current book, weather, loading and error state, and whether the reading card is open. It still emits the same events to the room page: open the current book, pick a book, list books, quote, retry.
- The tour targets (window, clock, credits, shelf, quote, menu) stay on the matching hotspots.

## Testing Decisions

- **Main seam: the existing Playwright journeys, passing without edits.** These are the room, bookshelf, mood and town tests. They drive the room through what a reader sees and does:
  - the bar of places, and labelled hotspots and book buttons
  - shelf rows checked by on-screen position
  - books lifting on hover and keeping their size
  - book opening, skipping it, reduced motion and the room staying put
  - the cover shown while a book opens
  - the Currently Reading card, the Quote of the Day, window weather (rain, birds), the clock
  - the shop and placing decorations, and the menu and mood check-in

  None of this depends on the room being 3D, so passing unchanged proves every existing interaction survived. Only a comment that calls the room "3D" may be updated.
- **New behaviour gets new tests at the same seam,** in the room journey:
  - the strip scrolls with the wheel, a mouse drag and the arrow keys, and stops at both ends
  - the bar of places reaches all five parts in order (bay window, chair, bookshelf, corkboard, bed), each further right than the one before
  - the hint shows on the first visit, hides at the first scroll and doesn't come back on reload
  - at night (weather says it isn't day) the window shows the night town
  - every room sprite is drawn at a whole-number multiple of its own size in device pixels, at a phone size and a laptop size (no blur)
- **A good test checks what the reader can see and do:** roles, labels, positions on screen, results of taps. It never checks the layout data, sprite file names or internal state.
- **Checked by eye:** matching the town's style, no empty walls, and day, night and rain lighting. Review side-by-side screenshots of the town and the room at phone and laptop size, by day, at night and in rain, before calling it done.
- **Prior art:** the room and bookshelf journeys (fixed weather and time answers, pre-answered mood check-in, sign-in fixture) and the town journey (opening the house from the map).

## Out of Scope

- Any change to the town map or its art.
- New gameplay or economy. Coins and the shop stay as they are.
- People walking about inside the room. The pet walk band is the hook for them later.
- Redrawing the shop's decoration and pet drawings as pixel art. They keep their current drawings (follow-up below).
- Turning friends' rooms into strips. The renderer is built to allow it later.
- Making the house page full-width on laptops (shared router change).
- Removing Three.js from the project dependencies, and deleting the Blender sources or exported model.

## Further Notes

- **Reference images:** both are in `REFERENCE-IMG/` (16 and 17). The style section above is measured from them.
- **Earlier work:** Sonz chose to replace the 3D room's pixel-art restyle, not commit it. Building this spec deletes the 3D room and its restyle. The earlier move of the room's code into the house building's folder stays.
- **Outline colour:** Sonz chose the town's near-black outline over the references' own-colour outlines.
- **Follow-up:** redraw the shop's decorations and pets in the room's pixel art, so placed pieces match the room.
- **Constants to tune by eye:** the designed room height, the strip width, how far each part sits from the next, and the pixel-size cap.
