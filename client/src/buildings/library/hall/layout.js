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
// desk or scanner).
export const PIECES = [
  // --- the help desk, by the door ----------------------------------------------------------
  { sprite: 'window-tall', x: 20, y: 150, layer: 'wall' },
  { sprite: 'globe', x: 22, y: FEET, layer: 'furniture' },
  { sprite: 'pendant', x: 112, y: 54, layer: 'hang' },
  { sprite: 'desk', x: 64, y: FEET, layer: 'furniture', action: 'desk' },
  { sprite: 'banker-lamp', x: 72, y: FEET - DESK.h, layer: 'front' },
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
        { sprite: 'sconce', x: gap + 20, y: 104, layer: 'wall' },
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
  { sprite: 'pendant', x: NOOK + 68, y: 60, layer: 'hang' },
  { sprite: 'chair-right', x: NOOK, y: FEET, layer: 'furniture' },
  { sprite: 'table', x: NOOK + 24, y: FEET, layer: 'furniture' },
  { sprite: 'chair-left', x: NOOK + 156, y: FEET, layer: 'furniture' },
  { sprite: 'banker-lamp', x: NOOK + 32, y: FEET - TABLE.h, layer: 'front' },
  { sprite: 'open-book', x: NOOK + 80, y: FEET - TABLE.h, layer: 'front' },
  { sprite: 'book-pile', x: NOOK + 124, y: FEET - TABLE.h, layer: 'front' },
]

// Warm pools of light round the lamps: x, y (the lamp's bulb) and how far the light reaches.
export const LIGHTS = [
  { x: 81, y: FEET - DESK.h - 14, r: 46 },
  { x: 121, y: 54, r: 60 },
  { x: NOOK + 41, y: FEET - TABLE.h - 14, r: 46 },
  { x: NOOK + 77, y: 60, r: 70 },
  // the scanner's screen
  { x: 231, y: FEET - SCANNER.h + 30, r: 30 },
  ...PIECES.filter((piece) => piece.sprite === 'sconce').map((piece) => ({ x: piece.x + 5, y: piece.y - 10, r: 40 })),
]

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
