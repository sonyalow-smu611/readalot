// Scaffolded with AI assistance — see AI_USAGE.md
// Pixel-art drawing helpers for the library hall, in the style of the town's own
// (client/scripts/town-art/helpers.js): whole pixels, no smoothing, and a 1 px dark outline
// round every sprite. Here they run in the browser, so the hall needs no generated pictures.
import { PAL } from './palette.js'

// A generator seeded with a string, so the same bookcase gets the same books every visit.
export function seeded(text) {
  let seed = 23
  for (const char of String(text)) seed = (seed * 31 + char.charCodeAt(0)) & 0x7fffffff
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1))
  const pick = (list) => list[Math.floor(rnd() * list.length)]
  return { rnd, ri, pick }
}

export function canvas(w, h) {
  const el = document.createElement('canvas')
  el.width = w
  el.height = h
  const ctx = el.getContext('2d')
  ctx.imageSmoothingEnabled = false
  return [el, ctx]
}

// a filled rectangle
export function R(x, X, Y, W, H, col) {
  x.fillStyle = col
  x.fillRect(Math.round(X), Math.round(Y), Math.round(W), Math.round(H))
}

// one pixel
export function P(x, X, Y, col) {
  R(x, X, Y, 1, 1, col)
}

// a filled ellipse, row by row
export function E(x, cx, cy, rx, ry, col) {
  x.fillStyle = col
  cx = Math.round(cx)
  cy = Math.round(cy)
  for (let yy = -ry; yy <= ry; yy++) {
    const half = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (yy * yy) / ((ry + 0.4) * (ry + 0.4)))))
    x.fillRect(cx - half, cy + yy, half * 2 + 1, 1)
  }
}

// a colour made lighter (f > 1) or darker (f < 1)
export function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16)
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v * f))))
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('')
}

// a block with a light top and left edge and a dark bottom and right edge
export function panel(x, X, Y, W, H, col, light = 1.1, dark = 0.86) {
  R(x, X, Y, W, H, col)
  R(x, X, Y, W, 1, shade(col, light))
  R(x, X, Y, 1, H, shade(col, (light + 1) / 2))
  R(x, X, Y + H - 1, W, 1, shade(col, dark))
  R(x, X + W - 1, Y, 1, H, shade(col, dark))
}

// a leaf: a small ellipse with a darker middle vein
export function leaf(x, cx, cy, rx, ry, col) {
  E(x, cx, cy, rx, ry, col)
  R(x, cx - Math.max(0, rx - 1), cy, Math.max(1, 2 * rx - 1), 1, shade(col, 0.8))
}

// Draws `draw(ctx, w, h)` on its own w x h canvas and returns it with the town's 1 px outline
// round everything drawn, so the result is (w + 2) x (h + 2).
export function sprite(w, h, draw) {
  const [inner, ctx] = canvas(w, h)
  draw(ctx, w, h)
  const [out, ox] = canvas(w + 2, h + 2)
  ox.drawImage(inner, 1, 1)
  const W = out.width
  const H = out.height
  const data = ox.getImageData(0, 0, W, H).data
  const solid = (i, j) => i >= 0 && j >= 0 && i < W && j < H && data[(j * W + i) * 4 + 3] > 100
  ox.fillStyle = PAL.outline
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      if (!solid(i, j) && (solid(i - 1, j) || solid(i + 1, j) || solid(i, j - 1) || solid(i, j + 1))) ox.fillRect(i, j, 1, 1)
    }
  }
  return out
}
