// My Room, as data: what stands where along the strip. The room draws whatever is listed here
// (see README.md in the house folder for how to add or move a piece).
//
// Everything is in art pixels (one pixel of the sprites in public/room/strip/). x runs left to
// right from the room's left wall; y runs down from the top of the room as designed (ROOM.height
// tall). On a taller screen the room grows more wall above, so y stays the same from the floor up.
import SPRITES from './sprites.json'

export const ROOM = {
  width: 1240,
  height: 420,
  // where the wall meets the floor; the floor band runs from here to the bottom
  floor: 400,
}

// furniture stands with its feet a little into the floor band, as if on the floor
const FEET = 404

// Layers, drawn in this order:
//   wall       on the wall (pictures, the window); casts a flat shadow on the wall
//   hang       hangs from the ceiling on a string, which the room draws up to the top
//   floor      lies on the floor (the rug); no shadow
//   furniture  stands on the floor; casts a shadow on the wall
//   front      in front of the furniture (the coffee table, things on it)
export const LAYERS = ['wall', 'hang', 'floor', 'furniture', 'front']

// One entry per piece: `sprite` (a file in public/room/strip/), `x` its left edge, `y` its
// bottom edge, `layer`. Optional: `id` (when a sprite is used twice, or something needs to find
// it), `lit` (the sprite shown while a lamp is on), `action` (what tapping it does: window,
// chair, bookshelf, clock, corkboard) with a `hit` box for it when that is not the whole sprite,
// `with` (the id of a piece this one is shown only alongside).
export const PIECES = [
  // --- bunting along the top of the wall, the whole way along ------------------------------
  ...[8, 128, 248, 368, 488, 608, 728, 848, 968, 1088].map((x) => ({ sprite: 'bunting', x, y: 44, layer: 'wall' })),

  // The room starts bare: its furniture and the parts you tap, with open wall and floor for the
  // reader to furnish from the Shop.

  // --- the bay window reading nook ---------------------------------------------------------
  { sprite: 'curtain-rod', x: 34, y: 146, layer: 'wall' },
  { id: 'window', sprite: 'bay-window', x: 46, y: 334, layer: 'wall', action: 'window' },
  { id: 'curtain-left', sprite: 'curtain-left', x: 38, y: 322, layer: 'wall' },
  { id: 'curtain-right', sprite: 'curtain-right', x: 226, y: 322, layer: 'wall' },
  { id: 'fairy-lights', sprite: 'fairy-lights', x: 42, y: 162, layer: 'wall' },
  { sprite: 'plant-sill', x: 178, y: 326, layer: 'wall' },
  { id: 'seat', sprite: 'window-seat', x: 34, y: FEET, layer: 'furniture' },
  { sprite: 'pillow-pink', x: 50, y: 352, layer: 'furniture' },
  { sprite: 'pillow-mustard', x: 198, y: 352, layer: 'furniture' },
  { sprite: 'pillow-sage', x: 222, y: 352, layer: 'furniture' },

  // --- the reading chair and coffee table -------------------------------------------------
  { sprite: 'outlet-cable', x: 458, y: 402, layer: 'wall' },
  { id: 'floor-lamp', sprite: 'floor-lamp', lit: 'floor-lamp-lit', x: 262, y: FEET, layer: 'furniture' },
  { id: 'armchair', sprite: 'armchair', x: 296, y: FEET, layer: 'furniture' },
  // the throw belongs to the armchair: it goes when another chair takes the armchair's place
  { sprite: 'throw', x: 380, y: 386, layer: 'furniture', with: 'armchair' },
  { id: 'side-table', sprite: 'side-table', x: 410, y: FEET, layer: 'furniture' },
  { sprite: 'rug', x: 280, y: FEET + 10, layer: 'floor' },
  { sprite: 'coffee-table', x: 318, y: FEET + 8, layer: 'front' },
  { id: 'reading', sprite: 'open-book', x: 330, y: 382, layer: 'front', action: 'chair' },
  { sprite: 'mug', x: 362, y: 382, layer: 'front' },

  // --- the bookshelf ------------------------------------------------------------------------
  { id: 'bookshelf', sprite: 'bookshelf', x: 496, y: FEET, layer: 'furniture', action: 'bookshelf' },

  // --- the clock and the corkboard ---------------------------------------------------------
  { id: 'clock', sprite: 'clock', x: 664, y: 196, layer: 'wall', action: 'clock' },
  { id: 'corkboard', sprite: 'corkboard', x: 690, y: 296, layer: 'wall', action: 'corkboard' },
  { sprite: 'light-switch', x: 812, y: 282, layer: 'wall' },
  { sprite: 'dresser', x: 700, y: FEET, layer: 'furniture' },
  { sprite: 'radio', x: 708, y: 346, layer: 'furniture' },

  // --- the bed and the bedside table --------------------------------------------------------
  { sprite: 'outlet-cable', x: 838, y: 402, layer: 'wall' },
  { sprite: 'mirror', x: 1150, y: 300, layer: 'wall' },
  { id: 'nightstand', sprite: 'nightstand', x: 862, y: FEET, layer: 'furniture' },
  { id: 'table-lamp', sprite: 'table-lamp', lit: 'table-lamp-lit', x: 866, y: 358, layer: 'furniture' },
  { id: 'bed', sprite: 'bed', x: 912, y: FEET, layer: 'furniture' },
]

// The parts of the room, left to right, for the Places menu: `at` is the x the view centres on.
export const PARTS = [
  { id: 'window', label: 'Window', at: 146 },
  { id: 'chair', label: 'Chair', at: 360 },
  { id: 'bookshelf', label: 'Bookshelf', at: 574 },
  { id: 'clock', label: 'Clock', at: 680 },
  { id: 'corkboard', label: 'Corkboard', at: 748 },
  { id: 'bed', label: 'Bed', at: 1020 },
]

// Where wall art can hang: open stretches of wall, clear of the window, the clock, the corkboard,
// the bookshelf and the room's own pictures. `at` is the point a piece hangs centred on; `name`
// says where that is. Keep the order: a spot's id is its place in this list.
const WALL = [
  { at: { x: 278, y: 192 }, name: 'by the window' },
  { at: { x: 441, y: 188 }, name: 'by the reading chair' },
  { at: { x: 745, y: 106 }, name: 'above the corkboard' },
  { at: { x: 858, y: 240 }, name: 'over the nightstand' },
  { at: { x: 1125, y: 182 }, name: 'by the mirror' },
]

// Where a shop decoration can stand: the same zones and x (0 to 1 along the zone) as the 3D room
// had, so pieces placed there before stay put. `at` is the point it stands on (or, on the wall,
// hangs from); `name`, when there is one, says where that is.
export const SLOTS = [
  ...[0.25, 0.5, 0.75].map((x, k) => ({ id: `seat.${k}`, zone: 'seat', x, at: { x: Math.round(34 + 226 * x), y: 350 } })),
  { id: 'side-table.0', zone: 'side-table', x: 0.5, at: { x: 440, y: 357 } },
  { id: 'nightstand.0', zone: 'nightstand', x: 0.5, at: { x: 898, y: 359 } },
  ...[0.15, 0.33, 0.51, 0.69].map((x, k) => ({ id: `room.${k}`, zone: 'room', x, at: { x: Math.round(ROOM.width * x), y: 416 } })),
  // the reading nook: a chair from the Shop stands (`base`) where the armchair stands, in its
  // place; its spot glows on the seat
  { id: 'chair.0', zone: 'chair', x: 0.28, at: { x: 350, y: 350 }, base: FEET, name: 'in the reading nook' },
  // the window: curtains from the Shop take the place of the pair there; its spot glows on the glass
  { id: 'curtains.0', zone: 'curtains', x: 0.12, at: { x: 146, y: 230 }, name: 'at the window' },
  // the bed: bedding from the Shop takes the place of what's on it; its spot glows on the quilt
  { id: 'bed.0', zone: 'bed', x: 0.82, at: { x: 1030, y: 360 }, name: 'on the bed' },
  ...WALL.map(({ at, name }, k) => ({ id: `wall.${k}`, zone: 'wall', x: Math.round((at.x / ROOM.width) * 100) / 100, at, name: `on the wall ${name}` })),
]

// Pets (and, one day, visitors) walk along this line on the floor.
export const WALK = { y: 417, from: 20, to: ROOM.width - 20 }

// Light after dark: the cool light falling in through the window (first, so the lamps' light
// sits over it), each lamp's pool of light (from its sprite's `glow` point), the fairy lights.
function pieceById(id) {
  return PIECES.find((piece) => piece.id === id)
}
function topOf(piece) {
  return piece.y - SPRITES[piece.sprite].h
}
function glowOf(id, radius) {
  const piece = pieceById(id)
  const { glow } = SPRITES[piece.sprite]
  return { x: piece.x + glow.x, y: topOf(piece) + glow.y, radius, kind: 'lamp', lamp: id }
}
const lights = pieceById('fairy-lights')
const windowPiece = pieceById('window')
export const LIGHTS = [
  { x: windowPiece.x + SPRITES['bay-window'].w / 2, y: windowPiece.y - 40, radius: 120, kind: 'window' },
  glowOf('floor-lamp', 110),
  glowOf('table-lamp', 90),
  ...SPRITES['fairy-lights'].bulbs.map(([bx, by]) => ({ x: lights.x + bx, y: topOf(lights) + by, radius: 5, kind: 'bulb' })),
]

// Where things are, worked out from the pieces: the box each piece fills, the window's glass,
// the bookshelf's rows, the clock's middle.
export function boxOf(piece) {
  const { w, h } = SPRITES[piece.sprite]
  return { x: piece.x, y: piece.y - h, w, h }
}

export function glassOf() {
  const { glass } = SPRITES['bay-window']
  const box = boxOf(windowPiece)
  return { x: box.x + glass.x, y: box.y + glass.y, w: glass.w, h: glass.h }
}

export function shelfRows() {
  const box = boxOf(pieceById('bookshelf'))
  return SPRITES.bookshelf.rows.map((row) => ({ x: box.x + row.x, y: box.y + row.y, w: row.w, h: row.h, base: box.y + row.base }))
}

export function clockOf() {
  const piece = pieceById('clock')
  const box = boxOf(piece)
  const { centre, hands } = SPRITES.clock
  return { x: box.x + centre.x, y: box.y + centre.y, hands }
}

// what tapping each part of the room taps, and the box it fills
export function hotspots() {
  const spots = {}
  for (const piece of PIECES) {
    if (!piece.action) continue
    let box = piece.action === 'window' ? glassOf() : boxOf(piece)
    // a small thing to tap gets a finger-sized box round it
    const grow = Math.max(0, 26 - box.w) / 2
    const growY = Math.max(0, 20 - box.h) / 2
    box = { x: box.x - grow, y: box.y - growY, w: box.w + 2 * grow, h: box.h + 2 * growY }
    spots[piece.action] = box
  }
  return spots
}

export { SPRITES }
