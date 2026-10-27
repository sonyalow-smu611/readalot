# The room, in Blender

The 3D bedroom modelled here was the room's first version. The app no longer uses it: My Room is
now a side-on pixel-art picture (see `src/buildings/house/README.md`). The files are kept for
reference.

| File | What it is |
|------|------------|
| `build_room.py` | Builds the bedroom from primitives and saves `room.blend`: four walls, the bay window and its seat with the sky outside, the bed, nightstand and corkboard, the door and clock, the rug, the side table and lamp. The armchair is copied in from `furniture.blend` |
| `build_bookshelf.py` | Builds the `bookshelf.blend` bookcase against the left wall of `room.blend`, puts the plant and box from `furniture.blend` on top, and copies in the hero book with its animation. Saves `room.blend` |
| `render_room.py` | Renders `src/assets/room/room.webp` (a still of the first view, shown while the room loads and on devices without 3D) and exports `public/room/bedroom.glb` (the 3D room) |
| `room.blend` | The scene the two build scripts make. Open it in Blender to look around or model on top of it |
| `bookshelf.blend` | The bookcase design and the hero book animation (a book pulled off the shelf, opened, its pages flipped). Its `Text` block is the build code `build_bookshelf.py` was ported from |
| `furniture.blend` | Pieces modelled by hand that the build scripts copy in: the armchair (with the open book on its seat and its tap target), and the potted plant and box on top of the bookcase |

```sh
BLENDER=/Applications/Blender.app/Contents/MacOS/Blender
$BLENDER -b -P client/blender/build_room.py                                   # the room (overwrites room.blend)
$BLENDER -b client/blender/room.blend -P client/blender/build_bookshelf.py     # then the bookcase
$BLENDER -b client/blender/room.blend -P client/blender/render_room.py         # then still + export
```

If you edit `room.blend` by hand, run only `render_room.py`: `build_room.py` starts over.

## Names the app looks for

The app finds things in the room by object name, so keep these names when you remodel:

| Name | What the app does with it |
|------|---------------------------|
| `hit.<name>` | A hidden box over something you can tap: `bookshelf`, `chair`, `corkboard`, `window`, `clock`. Its button covers this box on screen. `hotspot.<name>` works too (`bookcase` for the bookshelf, `note` for the corkboard) |
| `shelf.<row>` | A hidden box per row of the bookcase, row 0 at the top. The top three rows hold the reader's To be read, Reading and Finished books, facing out of the case whichever wall it stands on, with a brass name plate on the board under each (drawn by the app, `src/buildings/house/room3d/books.js`) |
| `herobook` | The hero book from `bookshelf.blend`: `herobook.cover.front`, `.cover.back`, `.spine`, `.pages`, `.page.<n>`, with the actions that open the cover and flip the pages. A copy of it takes the place of the book the reader taps. Parked outside the room and left out of the still |
| `slot.<zone>.<n>` | An empty where a shop decoration can stand. Custom properties `zone` (`seat`, `nightstand`, `side-table`, `room`) and `x` |
| `walk.<n>` | Empties on the floor that pets wander between |
| `glass.<n>`, `sky.<n>` | Window panes, and the sky outside them. The app leaves the sky see-through and shows the live weather behind it there (`WindowView.vue`: sun and birds, clouds, rain, the moon); the still picture shows it plain |
| `clock.hour`, `clock.minute` | Clock hands, pointing at 12, with their origin at the clock's centre |
| `lamp.shade`, `lamp.light` | The lamp, lit at night |
| `camera` | Where the reader stands and the first view |

Placeholder books are hidden in the viewport: they appear in the still picture but are left out
of the export, where the reader's real books go instead.

Only colours, roughness and transparency reach the app (glTF), and the app lights the room itself.
A material whose colour comes from nodes (a procedural texture) is exported as the middle colour
of its colour ramp, so it does not reach the app white.
