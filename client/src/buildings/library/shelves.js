// Scaffolded with AI assistance — see AI_USAGE.md
// How an opened bookcase lays out its books, so it looks like a real, lived-in bookcase rather
// than a grid: mostly upright spines of different widths and heights, now and then two books
// lying flat in a stack, a few of the genre's props, and a last book leaning where a shelf has
// room. Everything is seeded by the genre and the book, so a bookcase looks the same every visit.
// Sizes are CSS px.
import { seeded } from './hall/pixel.js'

export const SPINE = { min: 44, max: 60 }
export const STACK = { w: 150, h: 36 }
export const PROP_W = 56
export const COVER = { w: 100, h: 150 }
// the space between things standing on a shelf, in each mode
const GAP = { spines: 2, covers: 16 }
// a bookcase of spines always stands at least this many shelves tall: spare shelves at the
// bottom hold one of the genre's props
const MIN_SHELVES = 4

// The books (and props) to stand in the bookcase, in order, each with its width:
//   { kind: 'spine', book, width, colour, band }
//   { kind: 'stack', books: [a, b], widths: [a, b], colours: [a, b] }
//   { kind: 'prop', icon }
//   { kind: 'cover', book }
export function bookItems(books, category, mode) {
  const { ri, pick } = seeded(`case-${category.key}`)
  const items = []
  let sinceProp = 0
  let propIndex = 0
  for (let i = 0; i < books.length; i++) {
    if (mode === 'covers') {
      items.push({ kind: 'cover', book: books[i], width: COVER.w })
    } else if (i % 7 === 5 && books[i + 1]) {
      // two books lying flat, the top one a little shorter
      items.push({
        kind: 'stack',
        books: [books[i], books[i + 1]],
        widths: [STACK.w, STACK.w - ri(10, 24)],
        colours: [pick(category.spines), pick(category.spines)],
        width: STACK.w,
      })
      i++
    } else {
      items.push({
        kind: 'spine',
        book: books[i],
        width: ri(SPINE.min, SPINE.max),
        colour: pick(category.spines),
        band: pick(['gold', 'dark', 'none']),
      })
    }
    sinceProp++
    if (sinceProp >= (mode === 'covers' ? 7 : 9) && i < books.length - 1) {
      items.push({ kind: 'prop', icon: category.props[propIndex++ % category.props.length], width: PROP_W })
      sinceProp = 0
    }
  }
  return items
}

// The items packed onto shelves `width` wide, in order: [{ items, height }]. Each shelf of spines
// gets its own height, and each spine a height a little under it, so the shelves are uneven; a
// shelf with room to spare (the 30 px a lean takes, and more) leans its last spine over.
export function packShelves(items, width, category, mode) {
  const { ri } = seeded(`shelves-${category.key}-${mode}`)
  const gap = GAP[mode]
  const shelves = []
  let shelf = null
  for (const item of items) {
    // full: the next shelf down (a shelf always takes at least one thing, however narrow)
    if (shelf && shelf.used + gap + item.width > width) shelf = null
    if (!shelf) {
      shelf = { items: [], used: -gap }
      shelves.push(shelf)
    }
    shelf.used += gap + item.width
    shelf.items.push({ ...item })
  }
  for (const one of shelves) {
    if (mode === 'covers') {
      one.height = COVER.h + 24
      continue
    }
    const tallest = ri(170, 220)
    one.height = tallest + 22
    for (const item of one.items) if (item.kind === 'spine') item.height = tallest - ri(0, 34)
    const last = one.items.at(-1)
    if (last?.kind === 'spine' && width - one.used > 60) last.lean = true
    delete one.used
  }
  for (let spare = 0; mode === 'spines' && shelves.length < MIN_SHELVES; spare++) {
    shelves.push({ items: [{ kind: 'prop', icon: category.props[spare % category.props.length], width: PROP_W }], height: 150 })
  }
  return shelves
}

// Dark or light lettering for a spine of colour `hex`, whichever reads better on it.
export function inkFor(hex) {
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#1e1a24' : '#fffbf2'
}
