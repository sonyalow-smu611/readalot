# Spec: My Room pixel-art redesign

Labels: `ready-for-agent`
Owner: Sonz (house building)

## Problem Statement

Readalot now opens on Dylan's town: a crisp, flat pixel-art map with bright colours, dark outlines and no smoothing. Tapping "Your house" takes the reader into My Room, which is a soft-shaded, beige 3D render from Blender. Walking from the town into the house feels like entering a different app. The room's art style, its view through the window and the panels around it don't match the town the reader just left.

## Solution

Restyle My Room so it looks like the inside of the blue-roofed house in the town, and change nothing else. The room stays 3D, and it is drawn with the town's look:

- it's drawn at low resolution and scaled up with hard pixel edges
- surfaces use flat bands of colour instead of smooth shading
- colours come from the town's palette
- edges get dark outlines

The furniture, the camera, the size inside the phone frame and every tappable thing stay exactly where they are and work exactly as they do today. The panels around the room (Currently Reading card, bar of places, room buttons) get restyled with the same design-system cards and pill tabs Dylan's town panels use. The room's code moves into the house building's own folder.

## User Stories

1. As a reader, I want My Room to look like the same pixel-art world as the town, so that going into my house feels like stepping inside, not switching apps.
2. As a reader, I want the room to show hard pixel edges with no blur, so that it matches the crisp town map.
3. As a reader, I want the room's colours to come from the town's palette, so that my room clearly belongs to my blue-roofed house.
4. As a reader, I want the walls, floor and furniture shaded in a few flat colour bands, so that they read as pixel art and not as a smooth 3D render.
5. As a reader, I want dark outlines around furniture and books, so that they look drawn like the town's buildings.
6. As a reader, I want the bookcase, armchair, window, clock, corkboard and lamp table exactly where they are now, so that the room I know isn't rearranged.
7. As a reader, I want the room to fill the same space in the phone frame as before, so that nothing around it shifts.
8. As a reader, I want to drag to look around and pinch or scroll to zoom exactly as before, so that the controls I've learnt still work.
9. As a keyboard user, I want arrow keys to turn and plus/minus to zoom as before, so that I can still explore without a pointer.
10. As a reader, I want the bar of places along the bottom to still turn me towards the bookshelf, chair, window, clock and corkboard, so that I can jump straight to things.
11. As a reader, I want to tap the bookshelf and see my books, so that my shelf still works.
12. As a reader, I want each shelf row to still hold my books by reading status, with spines in palette colours, so that I can still find books at a glance.
13. As a reader, I want a book to still lift out a little when I point at it, so that I know what I'm about to open.
14. As a reader, I want tapping a book to still open its details, so that the shelf stays useful.
15. As a reader, I want tapping the chair to still open my Currently Reading card, so that I can pick up where I left off.
16. As a reader, I want tapping the corkboard to still open the Quote of the Day, so that that feature stays.
17. As a reader, I want the window to still show the live weather and temperature, so that the room still feels connected to outside.
18. As a reader, I want the rain, sun, clouds, birds and moon outside the window drawn in pixel art like the town's sky and rain, so that the view outside matches the town.
19. As a reader, I want the wall clock to still show Singapore time, so that it stays a real clock.
20. As a reader, I want my shop decorations and pets still pinned to their spots, so that what I've collected stays in my room.
21. As a reader, I want pets to still walk around the room, so that it still feels alive.
22. As a reader, I want day and night lighting to still follow the real time and weather, still in flat bands, so that the room's mood changes without losing the pixel look.
23. As a reader whose device can't draw 3D, I want a pixel-art still picture of the room instead of the old soft render, so that I still see the new style.
24. As a reader waiting for the room to load, I want the still picture shown first in the new style, so that the room doesn't jump from one style to another.
25. As a reader, I want the Currently Reading card in the same card style as the town's place cards, so that the panels look like one app.
26. As a reader, I want the bar of places and room buttons styled with the town panels' tokens, with the house's blue accent, so that the controls match.
27. As a reader, I want the daily mood check-in to still pop up in the room as before, so that that habit isn't broken.
28. As a screen reader user, I want every room label to stay the same ("Bookshelf, N books", "Window view: Rain, 27 degrees", "Singapore time 12:00", the shelf row names), so that the room is as usable as before.
29. As a reader who prefers reduced motion, I want books and turns to keep respecting that setting, so that the restyle adds no new motion.
30. As a reader on a low-end phone, I want the room to run at least as smoothly as before, so that the restyle doesn't slow it down (drawing at lower resolution should make it cheaper).
31. As a reader visiting the book details page, I want its background to stay the same as now, so that the room restyle doesn't change another page.
32. As a teammate, I want all of My Room's code inside the house building's folder, so that my work on the town and other buildings doesn't conflict with Sonz's.
33. As Sonz, I want the town's colours in one palette module that the room reads from, so that I can tweak colours in one place while I keep redesigning.
34. As Sonz, I want the Blender source files left as they are, so that the model can still be edited and re-exported later.

## Implementation Decisions

**Approach: restyle the 3D room in code; don't redraw it in 2D.**
- The room stays a Three.js scene loaded from the existing Blender export. The geometry, the camera starting view, look-around and zoom limits don't change.
- Every pinned HTML layer is positioned by projecting 3D positions through the same camera, so pins, tap targets and labels stay aligned without changes.
- No Blender re-export. The `.blend` files and build scripts aren't touched. The restyle happens when the room loads.

**Pixel rendering**
- The renderer draws at a reduced resolution, one "art pixel" per N CSS pixels, then is scaled up with nearest-neighbour filtering (pixelated image rendering on the canvas). Antialiasing is turned off.
- N is a single named constant. Tune it by eye so that one room art pixel looks about the size of one town art pixel at the town's default zoom.
- The canvas's CSS size stays exactly as it is now. Only the size the scene is drawn at internally changes, so the layout inside the house page isn't affected.
- Shadows switch to hard-edged shadow maps so they don't blur.

**Materials and palette**
- A new palette module holds the town's colours: house blue and its roof shades, white clapboard, porch wood brown, grass greens, the dark outline colour, and warm interior neutrals. Take them from the town art helpers and the house sprite so the two stay consistent.
- When the room loads, every material from the Blender file is swapped for a flat toon material. Its colour comes from the palette, looked up by the original material's name, with a fallback colour for any unmapped name. A shared 3–4 step gradient with nearest filtering gives the flat colour bands.
- Book spine colours, made by the books module, come from the palette's book set. The gold bands stay as solid colour.
- Lighting (time of day, weather) keeps its current behaviour, tuned so each mood still lands on palette-friendly colour bands.

**Outlines**
- Furniture and books get a dark outline in the palette's outline colour, using an edge pass after rendering or back-face hulls, whichever looks cleaner at the chosen pixel size. Outlines must not cover the pinned HTML tap targets, which stay on top as today.

**Window view**
- The view outside the window keeps its inputs (scene, night) and its test ids (window view, raindrop, bird). Its drawings are redone in pixel art, borrowing the look and palette of the town's sky and rain.

**Still / fallback image**
- A new pixel-art still of the first view is made from the restyled render and lives with the house building.
- The existing shared room picture stays where it is, unchanged, because the book details page uses it as its background.

**Panels around the room**
- The Currently Reading card, bar of places, room buttons and toasts are restyled with the same design-system tokens and patterns Dylan's town panels use: the surface and line colours, the modal radius, pill-shaped tabs, the shadow, and the house place's blue accent.
- The town's panels themselves are not pixel-art, so the room's panels aren't either.
- The mood check-in and result modals are shared with other pages and stay unchanged.

**Code ownership move**
- The room page, the 3D room component, the window view, the Currently Reading card and the room helper modules (loading, books, book opening, look controls, weather) move into the house building's folder.
- The house view imports the room page from its new home. The buildings README row for the house is updated.
- Nothing outside the room imports these files (checked: friends' rooms use their own view), so the move is self-contained.

**Unchanged interfaces**
- The room component's props and events used by the room page (books, weather, taps on bookshelf, chair, book and corkboard) stay the same.
- The route, its name and the `/room` redirect stay the same.

## Testing Decisions

- **One seam: the existing Playwright journey at `/house`.** The current room tests check the room through accessible roles and labels: the bar of places, "Bookshelf, N books", the window view with weather, raindrops and birds, the Singapore clock, books and the Currently Reading card. They don't depend on how the room is drawn. If they pass **unchanged**, the layout and interactions survived the restyle. No test should be edited to make it pass. A failing room test means something real broke.
- The town journey test, which goes from the town into the house, must also still pass. It proves the entry point still works after the files move.
- A good test here checks what the reader can see and do (roles, labels, results of taps), never internal details such as materials, the pixel scale constant or shader setup.
- The pixel-art look itself is checked by eye: a side-by-side screenshot of the town and the room at phone width and laptop width, at day and at night, reviewed by Sonz.
- Prior art: the existing room and town e2e journeys, including their fixed weather and time answers and the pre-answered mood check-in.

## Out of Scope

- Changing the furniture, its positions, the camera or the room's size. The full rearrangement Sonz plans for later is a separate piece of work.
- Re-modelling or re-exporting from Blender.
- Redrawing the room as a 2D pixel-art scene.
- Restyling shared components used by other pages (book open overlay, book details, mood modals) and the shared room picture used by book details.
- Friends' rooms (reader room view).
- Any change to the town, its panels or other buildings.

## Further Notes

- Decisions settled with Sonz: keep everything except the art style (layout, size, interactions, camera); keep 3D and make it look pixel-art; restyle the room and its own panels but not shared components; move the room's code into the house folder.
- The palette module is meant to be the main thing Sonz edits during the upcoming full room redesign. Keep colour choices there, not spread across components.
- If flat toon materials look too plain at the chosen pixel size, a follow-up can add small hand-made pixel textures (wood grain, wallpaper, spines) on top. This is not part of this spec.
