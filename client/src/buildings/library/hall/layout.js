// Scaffolded with AI assistance — see AI_USAGE.md
// The library hall, as data: what stands where. The hall draws whatever is listed here.
//
// Everything is in art pixels. x runs left to right from the hall's left wall; y runs down from
// the top of the hall as designed (HALL.height tall). A piece's `y` is its BOTTOM edge, so
// something standing on furniture uses the top of that furniture as its `y`.
// On a taller screen the hall grows more wall above and more floor below; y stays the same.
import { CATEGORIES } from '../categories.js'

// the first bookcase's left edge, and how far along each next one stands
const FIRST = 300
const STEP = 150
// the reading nook's left edge: a little past the last bookcase
const NOOK = FIRST + (CATEGORIES.length - 1) * STEP + 100 + 40

export const HALL = {
  width: NOOK + 190,
  height: 260,
  // where the wall meets the floor
  floor: 232,
}

// furniture stands with its feet a little into the floor
export const FEET = 236

// the wood panelling along the bottom of the wall
export const WAINSCOT = 168

// Sizes of the pieces that more than one thing needs to know (the hall's buttons sit on them).
export const BOOKCASE = { w: 100, h: 156 }
export const WINDOWS = { window: { w: 34, h: 86 }, 'window-tall': { w: 44, h: 112 } }
export const DESK = { w: 120, h: 46 }
export const SCANNER = { w: 50, h: 80 }
const TABLE = { w: 130, h: 30 }

// Layers, drawn in this order:
//   wall       on the wall (windows, sconces); casts no shadow
//   hang       hangs from the ceiling on a string, which the hall draws up to the top
//   furniture  stands on the floor; casts a shadow on the wall
//   front      in front of the furniture (the ladder, things on the desk)
export const LAYERS = ['wall', 'hang', 'furniture', 'front']

// One entry per piece: `sprite` (a name in sprites.js), `x` its left edge, `y` its bottom edge,
// `layer`. Optional: `category` (a bookcase's category key), `action` (what tapping it does:
// desk or scanner), `lamp` (a lamp's id and `name`: tapping it turns it off and on).
export const PIECES = [
  // --- the help desk, by the door ----------------------------------------------------------
  { sprite: 'window-tall', x: 20, y: 150, layer: 'wall' },
  { sprite: 'globe', x: 22, y: FEET, layer: 'furniture' },
  { sprite: 'pendant', x: 112, y: 54, layer: 'hang', lamp: 'desk-ceiling', name: 'Help desk ceiling lamp' },
  { sprite: 'desk', x: 64, y: FEET, layer: 'furniture', action: 'desk' },
  { sprite: 'banker-lamp', x: 72, y: FEET - DESK.h, layer: 'front', lamp: 'desk', name: 'Help desk lamp' },
  { sprite: 'book-pile', x: 128, y: FEET - DESK.h, layer: 'front' },
  { sprite: 'bell', x: 160, y: FEET - DESK.h, layer: 'front' },

  // --- the book scanner: point a cover at it and it finds the book --------------------------
  { sprite: 'scanner', x: 206, y: FEET, layer: 'furniture', action: 'scanner' },
  { sprite: 'plant', x: 268, y: FEET + 2, layer: 'furniture' },

  // --- one bookcase per category, with a window or a lamp in each gap -----------------------
  ...CATEGORIES.flatMap((category, index) => {
    const x = FIRST + index * STEP
    const gap = x + BOOKCASE.w
    const pieces = [{ sprite: `bookcase:${category.key}`, x, y: FEET, layer: 'furniture', category: category.key }]
    if (index === CATEGORIES.length - 1) return pieces
    if (index % 2 === 0) {
      pieces.push(
        { sprite: 'window', x: gap + 8, y: 140, layer: 'wall' },
        { sprite: 'plant', x: gap + 13, y: FEET + 2, layer: 'furniture' },
      )
    } else {
      pieces.push(
        {
          sprite: 'sconce',
          x: gap + 20,
          y: 104,
          layer: 'wall',
          lamp: `wall-${category.key}`,
          name: `Wall lamp beside ${category.label}`,
        },
        { sprite: 'book-pile', x: gap + 15, y: FEET + 4, layer: 'front' },
      )
    }
    return pieces
  }),
  // the rolling ladder leans on the mystery bookcase
  { sprite: 'ladder', x: FIRST + 3 * STEP + 78, y: FEET + 2, layer: 'front' },

  // --- the reading nook, at the far end -----------------------------------------------------
  { sprite: 'window-tall', x: NOOK + 40, y: 150, layer: 'wall' },
  { sprite: 'window-tall', x: NOOK + 100, y: 150, layer: 'wall' },
  { sprite: 'pendant', x: NOOK + 68, y: 60, layer: 'hang', lamp: 'nook-ceiling', name: 'Reading nook ceiling lamp' },
  { sprite: 'chair-right', x: NOOK, y: FEET, layer: 'furniture' },
  { sprite: 'table', x: NOOK + 24, y: FEET, layer: 'furniture' },
  { sprite: 'chair-left', x: NOOK + 156, y: FEET, layer: 'furniture' },
  { sprite: 'banker-lamp', x: NOOK + 32, y: FEET - TABLE.h, layer: 'front', lamp: 'nook', name: 'Reading nook lamp' },
  { sprite: 'open-book', x: NOOK + 80, y: FEET - TABLE.h, layer: 'front' },
  { sprite: 'book-pile', x: NOOK + 124, y: FEET - TABLE.h, layer: 'front' },
]

// Each kind of lamp: its sprite's size, where its bulb is from the piece's x and y, and how far
// its light reaches. Each has an unlit `<sprite>@off` too.
const BULBS = {
  'banker-lamp': { w: 18, h: 20, dx: 9, dy: -14, r: 46 },
  pendant: { w: 18, h: 12, dx: 9, dy: 0, r: 64 },
  sconce: { w: 10, h: 16, dx: 5, dy: -10, r: 40 },
}

// The lamps, each turned off and on by tapping it: id, name, its light (x, y, r) and its box
// (with a little room round it, so even a small lamp is easy to tap).
export const LAMPS = PIECES.filter((piece) => piece.lamp).map((piece) => {
  const bulb = BULBS[piece.sprite]
  return {
    id: piece.lamp,
    name: piece.name,
    light: { x: piece.x + bulb.dx, y: piece.y + bulb.dy, r: bulb.r },
    box: { x: piece.x - 4, y: piece.y - bulb.h - 4, w: bulb.w + 8, h: bulb.h + 8 },
  }
})

// Warm pools of light: x, y (the bulb) and how far the light reaches. A lamp's light carries its
// id, and goes out with it; the scanner's screen is always on.
export const LIGHTS = [
  ...LAMPS.map((lamp) => ({ ...lamp.light, lamp: lamp.id })),
  { x: 231, y: FEET - SCANNER.h + 30, r: 30, lamp: null },
]

// Each window's glass in art pixels, where the rain falls: its box, and the radius of its arch.
export function windowGlass() {
  return PIECES.filter((piece) => WINDOWS[piece.sprite]).map((piece) => {
    const { w, h } = WINDOWS[piece.sprite]
    return { x: piece.x + 3, y: piece.y - h + 3, w: w - 6, h: h - 11, arch: Math.floor(w / 2) - 3 }
  })
}

// Each bookcase's box in art pixels (its button covers it), with its category.
export function bookcases() {
  return PIECES.filter((piece) => piece.category).map((piece) => ({
    category: piece.category,
    x: piece.x,
    y: piece.y - BOOKCASE.h,
    w: BOOKCASE.w,
    h: BOOKCASE.h,
  }))
}

// The help desk's box (its button covers it, and the things on it).
export function deskBox() {
  const desk = PIECES.find((piece) => piece.action === 'desk')
  return { x: desk.x, y: desk.y - DESK.h - 22, w: DESK.w, h: DESK.h + 22 }
}

// The book scanner's box.
export function scannerBox() {
  const scanner = PIECES.find((piece) => piece.action === 'scanner')
  return { x: scanner.x, y: scanner.y - SCANNER.h, w: SCANNER.w, h: SCANNER.h }
}

// The bar of places along the bottom, left to right. `at` is the x the view centres on.
export const PARTS = [
  { id: 'desk', label: 'Help desk', at: 120 },
  { id: 'scanner', label: 'Scanner', at: 231 },
  ...bookcases().map((box) => ({
    id: box.category,
    label: CATEGORIES.find((category) => category.key === box.category).label,
    at: box.x + box.w / 2,
  })),
  { id: 'nook', label: 'Reading nook', at: NOOK + 90 },
]
