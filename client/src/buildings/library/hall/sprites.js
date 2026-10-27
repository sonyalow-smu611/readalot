// Scaffolded with AI assistance — see AI_USAGE.md
// Every piece of the library hall, drawn at 1x (one canvas pixel per art pixel) with the helpers
// in pixel.js, each with the town's 1 px outline. Sprites are drawn once, the first time the hall
// asks for them. A bookcase is `bookcase:<category key>`, filled with that category's colours.
import { CATEGORIES } from '../categories.js'
import { BOOKCASE, DESK, SCANNER } from './layout.js'
import { PAL as C } from './palette.js'
import { E, P, R, canvas, leaf, panel, seeded, shade, sprite } from './pixel.js'

// --- Bookcase ----------------------------------------------------------------------------------
const SIDE = 6
const ROW = 24
const BOARD = 4
const TOP = 10

function bookcase(category) {
  const { w: W, h: H } = BOOKCASE
  const { rnd, ri, pick } = seeded(category.key)
  return sprite(W, H, (x) => {
    panel(x, 0, 0, W, H, C.wood, 1.08, 0.82)
    R(x, SIDE, TOP, W - 2 * SIDE, H - TOP - 10, C.woodDeep)
    // crown and plinth
    panel(x, 0, 0, W, 8, C.woodLight, 1.12, 0.85)
    R(x, 2, 8, W - 4, 1, C.woodDark)
    panel(x, 0, H - 10, W, 10, C.woodLight, 1.12, 0.8)
    for (let row = 0; row < 5; row++) {
      const top = TOP + row * (ROW + BOARD)
      const base = top + ROW
      if (row < 4) panel(x, SIDE, base, W - 2 * SIDE, BOARD, C.woodLight, 1.14, 0.82)
      fillRow(x, top, base)
    }
  })

  // One row of books from the left side to the right: mostly upright spines, now and then a gap
  // or a few books lying flat.
  function fillRow(x, top, base) {
    const end = W - SIDE - 1
    let at = SIDE + 1
    while (at < end - 2) {
      const left = end - at
      const roll = rnd()
      if (roll < 0.06 && left > 10) {
        at += ri(3, 6)
      } else if (roll < 0.12 && left > 18) {
        const wide = Math.min(left - 1, ri(14, 18))
        for (let k = 0; k < ri(2, 4); k++) {
          const col = pick(category.spines)
          panel(x, at, base - 4 * (k + 1), wide - k, 4, col, 1.12, 0.8)
        }
        at += wide + 1
      } else {
        const wide = Math.min(left, ri(3, 6))
        const tall = ri(ROW - 9, ROW - 2)
        const col = shade(pick(category.spines), 0.9 + rnd() * 0.2)
        panel(x, at, base - tall, wide, tall, col, 1.15, 0.8)
        // a band near the top, gold or a darker tone, on about half the spines
        if (rnd() < 0.5) R(x, at, base - tall + 3, wide, 1, rnd() < 0.5 ? C.brass : shade(col, 0.7))
        if (wide > 3 && rnd() < 0.4) P(x, at + Math.floor(wide / 2), base - Math.floor(tall / 2), C.paper)
        at += wide
      }
    }
  }
}

// --- Windows ------------------------------------------------------------------------------------
// An arched window: wooden frame, glazing bars, a sill, and the sky outside for `look` (see
// skyOf in paint.js): sunny, cloudy or rain, by day or at night.
function windowArched(W, H, look = 'sunny') {
  return sprite(W, H, (x) => {
    const r = Math.floor(W / 2)
    const cx = r - (W % 2 ? 0 : 1)
    E(x, cx, r, r, r, C.woodDark)
    R(x, 0, r, W, H - r, C.woodDark)
    x.drawImage(sky(W, H, r, cx, look), 0, 0)
    // glazing bars
    R(x, cx - 1, 3, 2, H - 10, C.woodDark)
    R(x, 3, Math.floor(H * 0.48), W - 6, 2, C.woodDark)
    // the sill
    panel(x, 0, H - 6, W, 6, C.cream, 1.08, 0.82)
  })
}

// The sky through a window's glass: two bands of sky, then the sun or moon and stars, clouds,
// or rain, cut to the shape of the glass.
function sky(W, H, r, cx, look) {
  const [scene, time] = look.split('-')
  const night = time === 'night'
  const [top, low] = C.skies[night ? (scene === 'rain' ? 'rainyNight' : 'night') : scene] ?? C.skies.sunny
  const { ri } = seeded(`${W}:${look}`)
  const [el, g] = canvas(W, H)
  R(g, 0, 0, W, H, top)
  R(g, 0, Math.floor(H * 0.55), W, H, low)

  if (night && scene !== 'rain') {
    for (let k = 0; k < 7; k++) P(g, ri(4, W - 5), ri(4, Math.floor(H * 0.5)), C.star)
  }
  if (scene === 'sunny') {
    const sx = cx + Math.floor(r / 3)
    const sy = Math.floor(H * 0.2)
    if (night) {
      // a crescent moon: a disc with a bite out of it in the sky's colour
      E(g, sx, sy, 4, 4, C.moon)
      E(g, sx + 2, sy - 1, 3, 3, top)
    } else {
      E(g, sx, sy, 4, 4, C.sunRim)
      E(g, sx, sy, 3, 3, C.sun)
      cloud(g, cx - 5, Math.floor(H * 0.4), 5, C.cloud)
    }
  } else {
    const col = scene === 'rain' ? C.rainCloud : night ? C.skies.night[1] : C.cloud
    cloud(g, cx - 4, Math.floor(H * 0.22), 7, col)
    cloud(g, cx + 6, Math.floor(H * 0.38), 5, col)
  }
  if (scene === 'rain') {
    // short slanting streaks of rain, every few pixels
    for (let px = 4; px < W - 3; px += 4) {
      for (let py = ri(14, 22); py < H - 9; py += ri(10, 14)) {
        P(g, px, py, C.raindrop)
        P(g, px - 1, py + 1, C.raindrop)
        P(g, px - 1, py + 2, C.raindrop)
      }
    }
  }

  // cut it to the glass (the arch, then the rest down to the sill), drawn whole on its own canvas
  // first, since `destination-in` keeps only what each single drawing covers
  const [glass, m] = canvas(W, H)
  E(m, cx, r, r - 3, r - 3, '#000')
  R(m, 3, r, W - 6, H - r - 8, '#000')
  g.globalCompositeOperation = 'destination-in'
  g.drawImage(glass, 0, 0)
  return el
}

// a puff of cloud `w` wide either side of (cx, cy), with a darker underside
function cloud(g, cx, cy, w, col) {
  E(g, cx, cy, w, 2, col)
  E(g, cx + Math.floor(w / 3), cy - 2, Math.ceil(w / 2), 2, col)
  R(g, cx - w + 1, cy + 2, w * 2 - 1, 1, shade(col, 0.88))
}

// --- Furniture ----------------------------------------------------------------------------------
function desk() {
  const { w: W, h: H } = DESK
  return sprite(W, H, (x) => {
    panel(x, 0, 6, W, H - 6, C.wood, 1.08, 0.82)
    panel(x, 0, 0, W, 6, C.woodLight, 1.12, 0.8)
    // three sunken panels along the front, the middle one with a brass plate
    for (const px of [8, 46, 84]) panel(x, px, 13, 28, H - 20, C.woodDark, 0.92, 1.1)
    panel(x, 52, 20, 16, 6, C.brass, 1.15, 0.8)
    R(x, 0, H - 3, W, 3, C.woodDeep)
  })
}

function table() {
  return sprite(130, 30, (x, W, H) => {
    panel(x, 0, 0, W, 5, C.woodLight, 1.12, 0.8)
    R(x, 4, 5, W - 8, 4, C.wood)
    R(x, 4, 8, W - 8, 1, C.woodDark)
    panel(x, 6, 9, 5, H - 9, C.wood)
    panel(x, W - 11, 9, 5, H - 9, C.wood)
    R(x, 11, H - 9, W - 22, 2, C.woodDark)
  })
}

// a chair side on, its back to the left (`flip` turns it to face the other way)
function chair(flip) {
  return sprite(24, 44, (x, W, H) => {
    const X = (n, w = 1) => (flip ? W - n - w : n)
    R(x, X(0, 4), 0, 4, H, C.woodDark)
    R(x, X(1, 2), 1, 2, 18, C.wood)
    panel(x, X(0, W), 22, W, 4, C.wood)
    R(x, X(4, 18), 19, 18, 3, C.teal)
    R(x, X(4, 18), 19, 18, 1, C.tealLight)
    R(x, X(20, 3), 26, 3, H - 26, C.woodDark)
    R(x, X(1, 3), 26, 3, H - 26, C.woodDark)
    R(x, X(4, 16), H - 10, 16, 2, C.wood)
  })
}

function ladder() {
  return sprite(18, 182, (x, W, H) => {
    R(x, 1, 6, 3, H - 6, C.woodLight)
    R(x, W - 4, 6, 3, H - 6, C.woodLight)
    R(x, 1, 6, 1, H - 6, shade(C.woodLight, 1.1))
    for (let y = 14; y < H - 4; y += 14) panel(x, 4, y, W - 8, 2, C.wood)
    // the brass hook it hangs from, and its wheels
    R(x, 0, 0, W, 3, C.brass)
    R(x, 2, 3, 2, 3, C.brassShade)
    R(x, W - 4, 3, 2, 3, C.brassShade)
    E(x, 2, H - 2, 2, 2, C.woodDeep)
    E(x, W - 3, H - 2, 2, 2, C.woodDeep)
  })
}

function globe() {
  return sprite(22, 38, (x, W, H) => {
    E(x, 11, 11, 9, 9, C.teal)
    E(x, 9, 9, 3, 2, C.green)
    E(x, 14, 13, 3, 3, C.green)
    P(x, 7, 6, C.tealLight)
    P(x, 8, 5, C.tealLight)
    // the brass ring round it and its stand
    R(x, 1, 10, 2, 3, C.brass)
    R(x, W - 3, 10, 2, 3, C.brass)
    R(x, 10, 20, 2, H - 24, C.woodDark)
    panel(x, 4, H - 4, 14, 4, C.wood)
  })
}

function plant() {
  return sprite(24, 34, (x) => {
    leaf(x, 7, 12, 4, 6, C.leaf)
    leaf(x, 16, 10, 4, 7, C.leafLight)
    leaf(x, 12, 6, 3, 6, C.leafDark)
    leaf(x, 4, 18, 3, 4, C.leafDark)
    leaf(x, 19, 17, 3, 4, C.leaf)
    panel(x, 5, 20, 14, 14, C.pot, 1.1, 0.82)
    R(x, 4, 19, 16, 3, C.potShade)
  })
}

function bankerLamp() {
  return sprite(18, 20, (x, W, H) => {
    // green glass shade, lit underneath
    R(x, 1, 2, W - 2, 5, C.green)
    R(x, 2, 1, W - 4, 1, C.greenLight)
    R(x, 1, 2, W - 2, 1, C.greenLight)
    R(x, 3, 7, W - 6, 1, C.lampLit)
    // brass stem and base
    R(x, 8, 8, 2, H - 11, C.brass)
    panel(x, 3, H - 3, 12, 3, C.brass, 1.15, 0.8)
  })
}

function bookPile() {
  return sprite(20, 14, (x) => {
    panel(x, 0, 10, 20, 4, '#a8483a', 1.12, 0.8)
    panel(x, 2, 6, 16, 4, '#3f6b78', 1.12, 0.8)
    panel(x, 1, 3, 17, 3, '#e0b65e', 1.12, 0.8)
    panel(x, 4, 0, 12, 3, '#7f9a62', 1.12, 0.8)
  })
}

function bell() {
  return sprite(10, 7, (x) => {
    E(x, 5, 4, 4, 3, C.brass)
    R(x, 1, 5, 9, 2, C.brassShade)
    P(x, 5, 0, C.brassShade)
    P(x, 3, 3, C.lampLit)
  })
}

function openBook() {
  return sprite(24, 5, (x, W) => {
    R(x, 0, 2, W, 3, C.paperShade)
    R(x, 1, 0, W / 2 - 1, 3, C.paper)
    R(x, W / 2 + 1, 0, W / 2 - 2, 3, C.paper)
    R(x, W / 2 - 1, 1, 2, 4, C.rug)
  })
}

function sconce() {
  return sprite(10, 16, (x) => {
    E(x, 5, 4, 3, 4, C.lampLit)
    R(x, 2, 7, 6, 2, C.brass)
    R(x, 4, 9, 2, 5, C.brassShade)
    R(x, 2, 14, 6, 2, C.brass)
  })
}

function pendant() {
  return sprite(18, 12, (x, W) => {
    // a dome: the top half of an ellipse
    E(x, 9, 7, 8, 5, C.teal)
    x.clearRect(0, 8, W, 4)
    R(x, 1, 7, W - 2, 1, C.tealLight)
    E(x, 9, 9, 3, 2, C.lampLit)
    R(x, 8, 0, 2, 2, C.brass)
  })
}

// The book scanner: a teal kiosk with a glass plate and a red scan line on top, a glowing green
// screen showing a book, and buttons and a slot on its front.
function scanner() {
  const { w: W, h: H } = SCANNER
  const screen = '#1f3a34'
  const lit = '#8fe0a8'
  return sprite(W, H, (x) => {
    // the cabinet and its plinth
    panel(x, 4, 36, W - 8, H - 42, C.teal, 1.12, 0.8)
    panel(x, 2, H - 6, W - 4, 6, C.woodDeep, 1.2, 0.8)
    // the head, with the screen
    panel(x, 0, 4, W, 32, C.tealLight, 1.12, 0.8)
    R(x, 5, 9, W - 10, 22, screen)
    R(x, 5, 9, W - 10, 1, shade(screen, 1.4))
    // a book on the screen, and two lines of text under it
    R(x, 18, 12, 14, 11, lit)
    R(x, 24, 12, 2, 11, screen)
    R(x, 13, 25, 24, 1, lit)
    R(x, 16, 27, 18, 1, shade(lit, 0.8))
    // the glass plate on top, with its red scan line
    panel(x, 2, 0, W - 4, 5, C.sky, 1.05, 0.85)
    R(x, 4, 2, W - 8, 1, '#e5484d')
    // the front: a slot the photo comes out of, three buttons and a brass plate
    R(x, 12, 42, W - 24, 3, C.outline)
    R(x, 12, 45, W - 24, 1, shade(C.teal, 1.2))
    E(x, 16, 53, 2, 2, '#e5484d')
    E(x, 25, 53, 2, 2, C.brass)
    E(x, 34, 53, 2, 2, lit)
    panel(x, 13, 61, W - 26, 6, C.brass, 1.15, 0.8)
  })
}

const MAKERS = {
  scanner,
  desk,
  table,
  'chair-left': () => chair(true),
  'chair-right': () => chair(false),
  ladder,
  globe,
  plant,
  'banker-lamp': bankerLamp,
  'book-pile': bookPile,
  bell,
  'open-book': openBook,
  sconce,
  pendant,
  window: (look) => windowArched(34, 86, look),
  'window-tall': (look) => windowArched(44, 112, look),
}
for (const category of CATEGORIES) MAKERS[`bookcase:${category.key}`] = () => bookcase(category)

const cache = new Map()

// The sprite called `name`, drawn the first time it is asked for. Null for an unknown name.
// A window is `window@<look>` (e.g. `window@rain-night`), with the sky for that weather.
export function getSprite(name) {
  if (!cache.has(name)) {
    const [base, look] = name.split('@')
    cache.set(name, MAKERS[base] ? MAKERS[base](look) : null)
  }
  return cache.get(name)
}
