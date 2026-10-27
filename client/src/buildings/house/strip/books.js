// The reader's books on the bookshelf, side on: one spine per book, standing on its row's board.
// Each book's thickness, height and colour come from a generator seeded with its id, so a book
// looks the same on every visit. Spines are drawn in the room's pixel art with the town outline.
import PALETTE from './palette.json'
import { SHELVES } from '@/services/shelves.js'

// Each of the reader's shelves has a row of the bookshelf to itself, top down (To be read,
// Currently reading, Finished reading), so what's being read sits at eye level.
export const SHELF_ROWS = SHELVES.map(({ status, label }) => ({ status, label }))
// thickness in art pixels (inside the outline), height as a share of the row
const SIZE = { thickness: [4, 8], height: [0.6, 0.9] }
// the last book in a row, with room beside it, may lean on its neighbour: how far its top leans
const LEAN = [3, 6]
// a book pointed at lifts this many art pixels out of its row
export const LIFT = 3

// The same numbers for the same id every time (FNV-1a hash into mulberry32).
function randomFor(id) {
  let seed = 2166136261
  for (const ch of String(id)) seed = Math.imul(seed ^ ch.charCodeAt(0), 16777619)
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function between([low, high], amount) {
  return low + (high - low) * amount
}

function shelfOf(book) {
  return SHELF_ROWS.some((row) => row.status === book.status) ? book.status : 'want_to_read'
}

// Stands each shelf's books along its row, left to right, as many as fit. Returns the spines
// ({ book, status, x, y, w, h, colour, ink, band, lean }, x/y the top left inside the outline)
// and each row's name, how many books it has and how many did not fit.
export function layoutBooks(rows, books) {
  const spines = []
  const named = SHELF_ROWS.map(({ status, label }, index) => {
    const row = rows[index]
    const queue = books.filter((book) => shelfOf(book) === status)
    const result = { status, label, count: queue.length, hidden: queue.length }
    if (!row) return result
    // spines share their outlines: each starts one pixel past the last one's colour
    let x = row.x + 1
    let next = 0
    while (next < queue.length) {
      const book = queue[next]
      const random = randomFor(book.id)
      const w = Math.round(between(SIZE.thickness, random()))
      const h = Math.round(between(SIZE.height, random()) * (row.h - 2))
      const [colour, ink] = PALETTE.books[Math.floor(random() * PALETTE.books.length)]
      const band = Math.floor(random() * 3)
      const leans = random() < 0.5 ? Math.round(between(LEAN, random())) : 0
      const last = next === queue.length - 1 && next > 0
      const lean = last && leans && x + w + leans + 1 <= row.x + row.w ? leans : 0
      if (x + w + lean + 1 > row.x + row.w) break
      spines.push({ book, status, x, y: row.base - 1 - h, w, h, colour, ink, band, lean })
      x += w + 1
      next += 1
    }
    result.hidden = queue.length - next
    return result
  })
  return { spines, rows: named }
}

// The box a spine's button covers (its outline included), in art pixels.
export function spineBox(spine) {
  return { x: spine.x - 1, y: spine.y - 1, w: spine.w + spine.lean + 2, h: spine.h + 2 }
}

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16)
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v * f))))
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

// Draws one spine at (x, y) with the town's 1 px outline. A leaning spine is drawn a row at a
// time, each row shifted a little further over towards the top.
export function drawSpine(ctx, spine, dy = 0) {
  const { x, w, h, colour, ink, band, lean } = spine
  const y = spine.y + dy
  const shift = (r) => (lean ? Math.round(((h - 1 - r) / (h - 1)) * lean) : 0)
  for (let r = -1; r <= h; r++) {
    const row = Math.min(h - 1, Math.max(0, r))
    const sx = x + shift(row)
    ctx.fillStyle = PALETTE.outline
    ctx.fillRect(sx - 1, y + r, w + 2, 1)
    if (r < 0 || r >= h) continue
    ctx.fillStyle = colour
    ctx.fillRect(sx, y + r, w, 1)
    // the spine's right edge in shadow, its left catching the light
    ctx.fillStyle = shade(colour, 0.85)
    ctx.fillRect(sx + w - 1, y + r, 1, 1)
    ctx.fillStyle = shade(colour, 1.1)
    ctx.fillRect(sx, y + r, 1, 1)
    // gold bands near the top and bottom, and a few marks for the title
    const fromTop = r
    const fromBottom = h - 1 - r
    if (fromTop === 2 + band || fromBottom === 2 + band) {
      ctx.fillStyle = PALETTE.bookBand
      ctx.fillRect(sx, y + r, w, 1)
    } else if (fromTop > 6 && fromTop < h - 8 && fromTop % 3 === 0 && w > 4) {
      ctx.fillStyle = ink
      ctx.fillRect(sx + Math.floor(w / 2) - 1, y + r, 2, 1)
    }
  }
}
