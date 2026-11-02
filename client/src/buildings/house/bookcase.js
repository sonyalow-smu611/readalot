// Scaffolded with AI assistance — see AI_USAGE.md
// How My Shelf's bookcase stands a shelf's books, copied from the Library's bookcase (its
// shelves.js) so the two look alike: mostly upright spines of different widths and heights, now
// and then two books lying flat in a stack, and the last book leaning where the shelf has room.
// Unlike the Library, each shelf is one line that scrolls sideways (one shelf per reading status),
// and a book's colour comes from spineLook, so it matches the bookshelf in the room. Sizes are CSS px.
import { spineLook } from '@/services/shelves.js'

// A generator seeded with a string (the Library's own, from its hall/pixel.js).
function seeded(text) {
  let seed = 23
  for (const char of String(text)) seed = (seed * 31 + char.charCodeAt(0)) & 0x7fffffff
  return {
    ri(a, b) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      return a + Math.floor((seed / 0x7fffffff) * (b - a + 1))
    },
  }
}

export const SPINE = { min: 44, max: 60 }
export const STACK = { w: 150, h: 36 }
export const COVER = { w: 100, h: 150 }
// the space between books on a shelf, in each mode
export const GAP = { spines: 2, covers: 16 }
// the room a leaning book takes at the end of a shelf, and more
const LEAN_ROOM = 60
const BANDS = ['gold', 'dark', 'none']

// One shelf's books, in order, each with its width:
//   { kind: 'spine', book, width, height, colour, ink, band }
//   { kind: 'stack', books: [a, b], widths: [a, b], colours: [a, b], inks: [a, b] }
//   { kind: 'cover', book }
// and the shelf's height. `key` seeds the shelf's look, so it's the same every visit.
export function shelfItems(books, mode, key) {
  if (mode === 'covers') {
    return { height: COVER.h, items: books.map((book) => ({ kind: 'cover', book, width: COVER.w })) }
  }
  const { ri } = seeded(`my-shelf-${key}`)
  const tallest = ri(170, 220)
  const items = []
  for (let i = 0; i < books.length; i++) {
    if (i % 7 === 5 && books[i + 1]) {
      // two books lying flat, the top one a little shorter
      const looks = [spineLook(books[i]), spineLook(books[i + 1])]
      items.push({
        kind: 'stack',
        books: [books[i], books[i + 1]],
        widths: [STACK.w, STACK.w - 10 - Math.round(looks[1].height * 14)],
        colours: looks.map((look) => look.colour),
        inks: looks.map((look) => look.ink),
        width: STACK.w,
      })
      i++
    } else {
      const look = spineLook(books[i])
      items.push({
        kind: 'spine',
        book: books[i],
        width: Math.round(SPINE.min + look.thickness * (SPINE.max - SPINE.min)),
        height: tallest - Math.round(look.height * 34),
        colour: look.colour,
        ink: look.ink,
        band: BANDS[look.band],
      })
    }
  }
  return { height: tallest, items }
}

// Whether a shelf `room` px wide has space for its last spine to lean on the one before (a book
// alone on its shelf has nothing to lean on, and stands up straight).
export function leansLast(items, room, mode) {
  if (mode !== 'spines' || items.length < 2 || items.at(-1)?.kind !== 'spine') return false
  const used = items.reduce((sum, item) => sum + item.width, 0) + GAP[mode] * (items.length - 1)
  return room - used > LEAN_ROOM
}

// `hex` made darker by `amount` (0 to 1)
function darken(hex, amount) {
  const n = parseInt(hex.slice(1), 16)
  const part = (shift) => Math.round(((n >> shift) & 255) * (1 - amount))
  return `#${[16, 8, 0].map((shift) => part(shift).toString(16).padStart(2, '0')).join('')}`
}

// My Shelf's colours, from the room's theme (themes.js): the room's wall behind the bookcase, the
// bookcase in the floor's wood with a deep shadow for its back, and the plates and sign in the
// skirting board's cream.
export function bookcaseColours(theme) {
  return {
    wall: theme.wall,
    sign: theme.skirting,
    wood: {
      frame: theme.floor,
      light: theme.floorLight,
      dark: theme.floorShade,
      back: darken(theme.floorShade, 0.55),
      plate: theme.skirting,
    },
  }
}
