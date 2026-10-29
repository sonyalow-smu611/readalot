// Scaffolded with AI assistance — see AI_USAGE.md
// Where a decoration from the Shop may stand in My Room, in art pixels (see layout.js). A placed
// piece has a point, `at`: wall art hangs centred on it, anything else stands on it (its bottom
// edge centred there).
//
//   wall art     anywhere on the wall: below the bunting, above the skirting, inside the room's
//                two ends, and GAP clear of the room's own pieces (the window, the clock, the
//                corkboard, the bookshelf, the furniture standing against the wall…)
//   floor        anywhere along the floor, left to right
//   shelf        anywhere along the top of the window seat, the side table or the nightstand
//
// Every piece keeps GAP clear of the other placed pieces. Cats walk about and take no room; a
// reading chair, curtains and bedding take the place of the room's own, so they count as the
// room's own pieces.
import { PIECES, ROOM, SLOTS, SPRITES, boxOf } from './layout.js'

// art px kept clear between pieces
export const GAP = 8
// how far a piece let go where it doesn't fit may be moved to the nearest place it does
export const REACH = 40
// how close to a small surface a shelf piece must be let go to land on it
const SURFACE_REACH = 60

// the wall between the bunting (its bottom edge) and the skirting, inside the room's end walls
const WALL = { left: 4, right: ROOM.width - 4, top: 44, bottom: ROOM.floor - 8 }
// the line floor pieces stand on, and how far along it they may go
const FLOOR = { y: 416, left: 4, right: ROOM.width - 4 }
// the small surfaces: their top (where the slots on them stand) and the stretch along it a piece's
// middle may be on, a little in from the ends
const INSET = 6
export const SURFACES = ['seat', 'side-table', 'nightstand'].map((zone) => {
  const box = boxOf(PIECES.find((piece) => piece.id === zone))
  const y = SLOTS.find((slot) => slot.zone === zone).at.y
  return { zone, y, left: box.x + INSET, right: box.x + box.w - INSET }
})

// what a piece made of `sprite` fills, on `at` in `zone`
export function boxAt(sprite, zone, at) {
  const { w, h } = SPRITES[sprite]
  const x = Math.round(at.x - w / 2)
  const y = zone === 'wall' ? Math.round(at.y - h / 2) : at.y - h
  return { x, y, w, h }
}

// how far apart two boxes are (negative when they overlap)
function gapBetween(a, b) {
  return Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w), b.y - (a.y + a.h), a.y - (b.y + b.h))
}

// The room's own pieces wall art keeps clear of, as boxes: everything but the bunting and the rug.
// `replaced` are ids of pieces a placed piece stands in for (the armchair, under a new chair), and
// `own` the boxes of those placed pieces.
export function wallObstacles(replaced = [], own = []) {
  const gone = new Set(replaced)
  const pieces = PIECES.filter((piece) => piece.sprite !== 'bunting' && piece.layer !== 'floor' && !gone.has(piece.id) && !gone.has(piece.with))
  return [...pieces.map(boxOf), ...own]
}

function surfaceOf(zone) {
  return SURFACES.find((surface) => surface.zone === zone)
}

// Whether a piece fits on `at` in `zone`: inside its part of the room, and GAP clear of `others`
// (the other placed pieces' boxes) and, on the wall, of `obstacles` (wallObstacles()).
export function fits(sprite, zone, at, { others = [], obstacles = [] } = {}) {
  const box = boxAt(sprite, zone, at)
  if (zone === 'wall') {
    if (box.x < WALL.left || box.x + box.w > WALL.right || box.y < WALL.top || box.y + box.h > WALL.bottom) return false
    if (obstacles.some((other) => gapBetween(box, other) < GAP)) return false
  } else if (zone === 'room') {
    if (at.y !== FLOOR.y || box.x < FLOOR.left || box.x + box.w > FLOOR.right) return false
  } else {
    const surface = surfaceOf(zone)
    if (!surface || at.y !== surface.y || at.x < surface.left || at.x > surface.right) return false
  }
  return others.every((other) => gapBetween(box, other) >= GAP)
}

// The zones a piece for `surface` (from furniture.js) can be let go on, and the point in each it
// would land on, nearest (x, y) first: wall art where it's let go, a floor piece on the floor below
// it, a shelf piece on the small surface nearest it.
function landings(surface, x, y) {
  if (surface === 'wall') return [{ zone: 'wall', at: { x: Math.round(x), y: Math.round(y) } }]
  if (surface === 'floor') return [{ zone: 'room', at: { x: Math.round(x), y: FLOOR.y } }]
  if (surface !== 'shelf') return []
  return SURFACES.map((one) => {
    const along = Math.max(one.left, Math.min(one.right, x))
    return { zone: one.zone, at: { x: Math.round(along), y: one.y }, far: Math.hypot(along - x, one.y - y) }
  })
    .filter((landing) => landing.far <= SURFACE_REACH)
    .sort((a, b) => a.far - b.far)
}

// The points within REACH of `at` in `zone`, nearest first: across the wall, along the floor or
// a surface.
function around(zone, at) {
  const points = []
  if (zone === 'wall') {
    for (let dy = -REACH; dy <= REACH; dy += 2) {
      for (let dx = -REACH; dx <= REACH; dx += 2) {
        if (Math.hypot(dx, dy) <= REACH) points.push({ x: at.x + dx, y: at.y + dy })
      }
    }
  } else {
    for (let dx = -REACH; dx <= REACH; dx += 1) points.push({ x: at.x + dx, y: at.y })
  }
  return points.sort((a, b) => Math.hypot(a.x - at.x, a.y - at.y) - Math.hypot(b.x - at.x, b.y - at.y))
}

// Where a piece let go at art (x, y) goes: { zone, at } on the spot it fits nearest there (within
// REACH), or null when there's no room.
export function landingFor(meta, x, y, rules) {
  for (const landing of landings(meta.surface, x, y)) {
    const at = around(landing.zone, landing.at).find((point) => fits(meta.sprite, landing.zone, point, rules))
    if (at) return { zone: landing.zone, at }
  }
  return null
}

// One nudge of a piece being moved by `dx`, `dy` art px (up and down only on the wall): its new
// point, or null when it doesn't fit there.
export function nudged(meta, zone, at, dx, dy, rules) {
  const next = { x: at.x + dx, y: zone === 'wall' ? at.y + dy : at.y }
  if (next.x === at.x && next.y === at.y) return null
  return fits(meta.sprite, zone, next, rules) ? next : null
}
