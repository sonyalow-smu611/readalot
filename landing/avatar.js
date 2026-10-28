// Scaffolded with AI assistance — see AI_USAGE.md
// The app's character drawing and catalogue, bundled for the landing page as one plain script
// (a page opened from a file can't load ES modules). Copied unchanged, apart from the
// import/export lines, from client/src/lib/avatar/draw.js and catalogue.js: re-copy if those
// change. Everything is on window.IKDAAvatar.
(function () {
// Scaffolded with AI assistance — see AI_USAGE.md
// Draws one town character (28 x 56, plus a 1px outline) onto a canvas, pixel by pixel.
// Shared by the app (the salon, Welcome) and scripts/draw-town-map.mjs, which makes the PNGs in
// public/town/avatars/. Plain browser code with no imports, so the map script can run it as is.
// rnd is the random generator: the map script passes its own, the app passes makeRnd(seed).

// Pixel helpers, the same as scripts/town-art/helpers.js.
const mk = (w, h) => {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const x = c.getContext('2d')
  x.imageSmoothingEnabled = false
  return [c, x]
}
const R = (x, X, Y, W, H, col) => {
  x.fillStyle = col
  x.fillRect(Math.round(X), Math.round(Y), Math.round(W), Math.round(H))
}
const P = (x, X, Y, col) => R(x, X, Y, 1, 1, col)
const E = (x, cx, cy, rx, ry, col) => {
  x.fillStyle = col
  cx = Math.round(cx)
  cy = Math.round(cy)
  for (let yy = -ry; yy <= ry; yy++) {
    const half = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (yy * yy) / ((ry + 0.4) * (ry + 0.4)))))
    x.fillRect(cx - half, cy + yy, half * 2 + 1, 1)
  }
}
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16)
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v * f))))
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('')
}
// crisp convex polygon: the left and right edge of each pixel row
const span = (pts, y) => {
  let lo = Infinity
  let hi = -Infinity
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i]
    const [x2, y2] = pts[(i + 1) % pts.length]
    if ((y >= Math.min(y1, y2)) && (y <= Math.max(y1, y2)) && y1 !== y2) {
      const xx = x1 + ((y - y1) * (x2 - x1)) / (y2 - y1)
      lo = Math.min(lo, xx)
      hi = Math.max(hi, xx)
    } else if (y1 === y2 && y === y1) {
      lo = Math.min(lo, x1, x2)
      hi = Math.max(hi, x1, x2)
    }
  }
  return lo <= hi ? [Math.round(lo), Math.round(hi)] : null
}
const polyRows = (pts, fn) => {
  const ys = pts.map((p) => p[1])
  for (let y = Math.round(Math.min(...ys)); y <= Math.round(Math.max(...ys)); y++) {
    const s = span(pts, y + 0.5)
    if (s) fn(y, s[0], s[1])
  }
}
const fillPoly = (x, pts, col) => polyRows(pts, (y, a, b) => R(x, a, y, b - a, 1, col))
const outline = (c, col = '#1e1a24') => {
  const [o, ox] = mk(c.width + 2, c.height + 2)
  ox.drawImage(c, 1, 1)
  const W = o.width
  const H = o.height
  const a = ox.getImageData(0, 0, W, H).data
  const solid = (i, j) => i >= 0 && j >= 0 && i < W && j < H && a[(j * W + i) * 4 + 3] > 100
  ox.fillStyle = col
  for (let j = 0; j < H; j++)
    for (let i = 0; i < W; i++)
      if (!solid(i, j) && (solid(i - 1, j) || solid(i + 1, j) || solid(i, j - 1) || solid(i, j + 1))) ox.fillRect(i, j, 1, 1)
  return o
}

// The same generator as the map script, started from any seed, so a drawing never changes.
function makeRnd(seed) {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

// A character, front view. Habbo-style: big head, dark outline. p holds the parts and colours
// (see catalogue.js). Curly and puff hair and the fuzzy top use rnd(); in the map script only the
// five pickable characters may, or the town map changes.
function drawAvatar(p, rnd) {
  const [c, x] = mk(28, 56)
  const dark = '#2b2230'

  // hair behind the body
  if (p.hair === 'messy' || p.hair === 'bob') {
    R(x, 5, 6, 18, p.hair === 'bob' ? 15 : 17, p.hairC)
    R(x, 21, 8, 2, p.hair === 'bob' ? 13 : 15, p.hairS)
  }
  if (p.hair === 'wavy') {
    R(x, 4, 7, 20, 34, p.hairC)
    R(x, 22, 9, 2, 32, p.hairS)
    for (let yy = 12; yy < 40; yy += 4) {
      P(x, 4, yy, p.hairS)
      P(x, 5, yy + 1, p.hairS)
      P(x, 23, yy + 2, shade(p.hairS, 0.85))
    }
  }
  if (p.hair === 'mop') {
    E(x, 14, 11, 12, 11, p.hairC)
    for (let i = 0; i < 30; i++) P(x, 3 + ((i * 7) % 22), 2 + ((i * 5) % 19), p.hairS)
  }
  if (p.hair === 'long') {
    R(x, 4, 7, 20, 32, p.hairC)
    R(x, 5, 38, 18, 2, p.hairC)
    R(x, 22, 9, 2, 30, p.hairS)
  }
  if (p.hair === 'curly') {
    E(x, 14, 11, 12, 10, p.hairC)
    for (let k = 0; k < 40; k++) P(x, 3 + Math.floor(rnd() * 22), 2 + Math.floor(rnd() * 18), p.hairS)
  }
  if (p.hair === 'puff') E(x, 14, 9, 11, 8, p.hairC)

  // legs and bottoms
  const legTop = 38
  if (p.bottom === 'skirt') {
    R(x, 10, 43, 3, 7, p.sock)
    R(x, 15, 43, 3, 7, p.sock)
    R(x, 10, 43, 3, 1, p.skinS)
    R(x, 15, 43, 3, 1, p.skinS)
    R(x, 8, 36, 12, 4, p.botC)
    R(x, 7, 40, 14, 3, p.botC)
    R(x, 7, 42, 14, 1, p.botS)
    for (let i = 8; i < 21; i += 3) P(x, i, 41, p.botS)
  } else if (p.bottom === 'long') {
    // a long skirt down to the ankles
    R(x, 8, 36, 12, 14, p.botC)
    R(x, 18, 36, 2, 14, p.botS)
    R(x, 8, 49, 12, 1, p.botS)
    R(x, 13, 40, 1, 9, p.botS)
  } else {
    const baggy = p.bottom === 'baggy' || p.bottom === 'cargo'
    R(x, baggy ? 8 : 9, legTop, baggy ? 6 : 5, 12, p.botC)
    R(x, 14, legTop, baggy ? 6 : 5, 12, p.botS)
    R(x, 13, legTop + 3, 1, 9, p.botS)
    if (baggy) {
      R(x, 8, 46, 6, 1, p.botS)
      R(x, 14, 45, 6, 1, shade(p.botS, 0.85))
    }
    if (p.bottom === 'ripped') {
      R(x, 10, 42, 3, 2, '#c9d9e6')
      P(x, 11, 43, p.skin)
      R(x, 15, 45, 3, 2, '#c9d9e6')
      E(x, 16, 41, 1, 1, '#d0453d')
    }
    if (p.bottom === 'cargo') {
      R(x, 8, 42, 2, 3, p.botS)
      R(x, 18, 41, 2, 3, shade(p.botS, 0.85))
    }
  }
  // shoes, or boots up the shin
  if (p.boots) {
    R(x, 8, 46, 6, 5, p.shoe)
    R(x, 14, 46, 6, 5, shade(p.shoe, 0.85))
    P(x, 10, 47, shade(p.shoe, 1.3))
    P(x, 16, 47, shade(p.shoe, 1.2))
  }
  R(x, 8, 50, 6, 3, p.shoe)
  R(x, 14, 50, 6, 3, p.shoe)
  R(x, 8, 52, 6, 1, p.sole)
  R(x, 14, 52, 6, 1, p.sole)
  P(x, 9, 50, shade(p.shoe, 1.3))
  P(x, 15, 50, shade(p.shoe, 1.3))

  // body and arms
  const puffy = p.top === 'puffer' || p.top === 'fuzzy'
  const tx = puffy ? 7 : 8
  const tw = puffy ? 14 : 12
  const long = p.top === 'coat'
  R(x, tx, 24, tw, long ? 20 : 14, p.topC)
  R(x, tx + tw - 2, 24, 2, long ? 20 : 14, p.topS)
  const ax = puffy ? 3 : 5
  const aw = puffy ? 4 : 3
  const bare = p.top === 'tank' || p.top === 'tube'
  const sleeve = bare ? p.skin : p.sleeve ?? p.topC
  R(x, ax, 25, aw, 12, sleeve)
  R(x, 28 - ax - aw, 25, aw, 12, bare ? p.skinS : shade(sleeve, 0.82))
  if (p.shortSleeves) {
    R(x, ax, 31, aw, 6, p.skin)
    R(x, 28 - ax - aw, 31, aw, 6, p.skinS)
  }
  R(x, ax, 37, aw, 2, p.skin)
  R(x, 28 - ax - aw, 37, aw, 2, p.skinS)
  if (p.top === 'puffer') {
    for (let yy = 27; yy < 38; yy += 3) {
      R(x, tx, yy, tw, 1, p.topS)
      R(x, ax, yy, aw * 1, 1, p.topS)
      R(x, 28 - ax - aw, yy, aw, 1, shade(p.topS, 0.85))
    }
    R(x, 12, 24, 4, 9, p.inner)
    R(x, 10, 23, 8, 2, p.topC)
  }
  if (p.top === 'fuzzy') {
    for (let k = 0; k < 70; k++) {
      const px = tx + Math.floor(rnd() * tw)
      const py = 24 + Math.floor(rnd() * 14)
      P(x, px, py, rnd() < 0.5 ? p.topS : shade(p.topC, 1.12))
    }
    for (let k = 0; k < 24; k++) P(x, ax + Math.floor(rnd() * aw), 25 + Math.floor(rnd() * 12), p.topS)
    R(x, 13, 24, 2, 14, p.topS)
  }
  if (p.top === 'coat') {
    R(x, 11, 24, 6, 13, p.inner)
    R(x, 10, 24, 1, 20, p.topS)
    R(x, 17, 24, 1, 20, p.topS)
    P(x, 13, 27, dark)
    P(x, 14, 27, dark)
    R(x, 12, 30, 4, 1, '#3a3a48')
  }
  if (p.top === 'pinafore') {
    R(x, 9, 26, 10, 12, p.topC)
    R(x, 11, 24, 6, 2, p.inner)
    R(x, 13, 26, 2, 2, p.inner)
    R(x, 17, 26, 2, 12, p.topS)
    // argyle sleeve
    for (let yy = 27; yy < 36; yy += 3) {
      P(x, 6, yy, '#e3b04b')
      P(x, 5, yy + 1, '#c0567a')
      P(x, 7, yy + 1, '#c0567a')
    }
  }
  if (p.top === 'tank') {
    R(x, 8, 24, 2, 3, p.skin)
    R(x, 18, 24, 2, 3, p.skinS)
    R(x, 11, 24, 6, 2, p.skin)
    R(x, 10, 24, 1, 3, p.topS)
    R(x, 17, 24, 1, 3, p.topS)
    R(x, 8, 36, 12, 1, p.topS)
  }
  if (p.top === 'tube') {
    R(x, 8, 24, 12, 3, p.skin)
    R(x, 18, 24, 2, 3, p.skinS)
    R(x, 8, 27, 12, 1, shade(p.topC, 1.12))
    R(x, 8, 33, 12, 1, p.topS)
  }
  if (p.top === 'hoodie') {
    R(x, 10, 32, 8, 4, shade(p.topC, 0.85))
    R(x, 10, 32, 8, 1, p.topS)
    R(x, 12, 25, 1, 4, '#d9d0c4')
    R(x, 15, 25, 1, 4, '#d9d0c4')
  }
  if (p.print) {
    R(x, 11, 28, 6, 5, p.print)
    R(x, 12, 29, 2, 2, shade(p.print, 1.25))
    P(x, 15, 31, shade(p.print, 0.75))
  }
  if (p.top === 'vest') {
    for (let yy = 27; yy < 38; yy += 3) for (let xx = 9; xx < 19; xx += 4) P(x, xx + (yy % 2), yy, p.topS)
    fillPoly(x, [[10, 24], [18, 24], [14, 30]], p.inner)
    R(x, 13, 24, 2, 6, '#2b3a5a')
    P(x, 13, 24, '#3d5280')
  }
  if (p.pattern) {
    // a flame across the chest
    for (let xx = 8; xx < 20; xx++) {
      const h = 2 + ((xx * 3) % 4)
      R(x, xx, 33 - h, 1, h + 2, p.pattern)
      P(x, xx, 33 - h, shade(p.pattern, 1.25))
    }
  }
  if (p.top === 'cardigan') {
    R(x, 11, 24, 6, 14, p.inner)
    R(x, 10, 24, 1, 14, p.topS)
    R(x, 17, 24, 1, 14, p.topS)
    for (const [fx, fy] of [[12, 29], [15, 32], [13, 35]]) P(x, fx, fy, '#f2a0b8')
  }
  if (p.top === 'blazer') {
    for (let xx = 8; xx < 20; xx += 2) R(x, xx, 24, 1, 14, p.topS)
    for (let xx = 0; xx < 3; xx += 2) {
      R(x, 5 + xx, 25, 1, 12, p.topS)
      R(x, 20 + xx, 25, 1, 12, p.topS)
    }
    R(x, 11, 24, 6, 10, p.inner)
    R(x, 10, 24, 1, 12, dark)
    R(x, 17, 24, 1, 12, dark)
    R(x, 11, 24, 6, 2, '#8a8a8a')
    P(x, 13, 24, '#5a5a5a')
    P(x, 14, 24, '#5a5a5a')
  }
  if (p.bag) {
    // a tote bag on the shoulder
    R(x, 19, 24, 1, 8, shade(p.bag, 0.7))
    R(x, 17, 31, 9, 9, p.bag)
    for (let yy = 32; yy < 40; yy += 2) R(x, 17, yy, 9, 1, shade(p.bag, 0.88))
    R(x, 24, 31, 2, 9, shade(p.bag, 0.8))
  }
  if (p.scarf) {
    R(x, 9, 22, 10, 3, p.scarf)
    R(x, 16, 24, 3, 6, p.scarf)
    R(x, 16, 29, 3, 1, shade(p.scarf, 0.8))
  }

  // a hood bunched up round the head
  if (p.hood) {
    E(x, 14, 13, 10, 11, p.hood)
    R(x, 21, 9, 2, 13, shade(p.hood, 0.8))
  }

  // neck and head
  R(x, 12, 21, 4, 3, p.skinS)
  R(x, 9, 5, 10, 1, p.skin)
  R(x, 8, 6, 12, 1, p.skin)
  R(x, 7, 7, 14, 13, p.skin)
  R(x, 8, 20, 12, 1, p.skin)
  R(x, 9, 21, 10, 1, p.skin)
  R(x, 20, 8, 1, 12, p.skinS)
  R(x, 9, 21, 10, 1, p.skinS)
  R(x, 6, 12, 1, 3, p.skin)
  R(x, 21, 12, 1, 3, p.skinS)

  // face
  R(x, 9, 11, 3, 1, dark)
  R(x, 16, 11, 3, 1, dark)
  R(x, 10, 12, 2, 2, dark)
  R(x, 16, 12, 2, 2, dark)
  P(x, 10, 12, '#ffffff')
  P(x, 16, 12, '#ffffff')
  R(x, 10, 9, 2, 1, p.brow ?? p.hairS)
  R(x, 16, 9, 2, 1, p.brow ?? p.hairS)
  P(x, 14, 15, p.skinS)
  R(x, 13, 17, 2, 1, p.lips)
  R(x, 8, 15, 2, 1, p.blush)
  R(x, 18, 15, 2, 1, p.blush)

  if (p.shades) {
    R(x, 8, 11, 12, 3, '#1e1a24')
    R(x, 9, 11, 3, 1, '#4a4a5a')
    R(x, 15, 11, 3, 1, '#4a4a5a')
  }
  if (p.goggles) {
    R(x, 7, 10, 14, 5, '#5a5a68')
    R(x, 8, 11, 5, 3, '#9fc4d9')
    R(x, 15, 11, 5, 3, '#9fc4d9')
    P(x, 9, 11, '#e8f7fc')
    P(x, 16, 11, '#e8f7fc')
  }

  // hair in front
  if (p.hair === 'long') {
    R(x, 9, 3, 10, 1, p.hairC)
    R(x, 7, 4, 14, 2, p.hairC)
    R(x, 6, 6, 16, 3, p.hairC)
    R(x, 6, 9, 3, 15, p.hairC)
    R(x, 19, 9, 3, 15, p.hairS)
    R(x, 9, 9, 4, 1, p.hairC)
    R(x, 15, 9, 2, 1, p.hairC)
    R(x, 10, 4, 4, 1, shade(p.hairC, 1.2))
  }
  if (p.hair === 'bun') {
    E(x, 14, 2, 3, 2, p.hairC)
    P(x, 13, 1, shade(p.hairC, 1.25))
    R(x, 8, 4, 12, 2, p.hairC)
    R(x, 7, 6, 14, 3, p.hairC)
    R(x, 6, 8, 2, 8, p.hairC)
    R(x, 20, 8, 2, 8, p.hairS)
    R(x, 8, 9, 2, 6, p.hairC)
    R(x, 10, 5, 5, 1, shade(p.hairC, 1.2))
    R(x, 18, 9, 1, 10, p.hairS)
  }
  if (p.hair === 'curly') {
    for (let i = 5; i < 23; i += 2) E(x, i, 6 + (i % 4 === 1 ? 0 : 1), 2, 2, p.hairC)
    R(x, 6, 8, 3, 10, p.hairC)
    R(x, 19, 8, 3, 10, p.hairS)
    for (let k = 0; k < 14; k++) P(x, 5 + Math.floor(rnd() * 18), 4 + Math.floor(rnd() * 5), p.hairS)
    if (p.flower) {
      R(x, 9, 3, 3, 3, p.flower)
      P(x, 10, 2, p.flower)
      P(x, 8, 4, p.flower)
      P(x, 12, 4, p.flower)
      P(x, 10, 4, '#f6e27a')
    }
  }
  if (p.hair === 'twists') {
    R(x, 8, 3, 12, 6, p.hairC)
    R(x, 7, 5, 1, 4, p.hairC)
    R(x, 20, 5, 1, 4, p.hairS)
    for (let i = 8; i < 20; i += 2) R(x, i, 3, 1, 6, p.hairS)
    R(x, 8, 8, 12, 1, p.roots)
  }
  if (p.hair === 'puff') {
    for (let i = 4; i < 25; i += 3) E(x, i, 5 + (i % 2), 2, 2, p.hairC)
    R(x, 6, 6, 16, 3, p.hairC)
    R(x, 5, 8, 3, 8, p.hairC)
    R(x, 20, 8, 3, 8, p.hairS)
    for (let k = 0; k < 30; k++) P(x, 4 + Math.floor(rnd() * 20), 2 + Math.floor(rnd() * 12), rnd() < 0.5 ? p.hairS : shade(p.hairC, 1.2))
  }
  if (p.hair === 'messy') {
    R(x, 9, 3, 10, 1, p.hairC)
    R(x, 7, 4, 14, 2, p.hairC)
    R(x, 6, 6, 16, 3, p.hairC)
    R(x, 6, 9, 3, 11, p.hairC)
    R(x, 19, 9, 3, 11, p.hairS)
    R(x, 9, 9, 3, 2, p.hairC)
    R(x, 14, 9, 2, 1, p.hairC)
    for (const [hx, hy] of [[8, 2], [12, 1], [13, 2], [17, 2], [19, 3], [5, 5], [22, 6], [5, 12], [22, 14]]) P(x, hx, hy, p.hairC)
    R(x, 10, 4, 3, 1, shade(p.hairC, 1.25))
    P(x, 15, 5, shade(p.hairC, 1.25))
  }
  if (p.hair === 'bob') {
    R(x, 8, 3, 12, 2, p.hairC)
    R(x, 6, 5, 16, 4, p.hairC)
    R(x, 5, 9, 4, 12, p.hairC)
    R(x, 19, 9, 4, 12, p.hairS)
    R(x, 9, 9, 6, 2, p.hairC)
    R(x, 15, 9, 2, 1, p.hairC)
    R(x, 10, 4, 5, 1, shade(p.hairC, 1.22))
  }
  if (p.hair === 'wavy') {
    R(x, 9, 3, 10, 1, p.hairC)
    R(x, 7, 4, 14, 2, p.hairC)
    R(x, 6, 6, 16, 3, p.hairC)
    R(x, 5, 9, 3, 17, p.hairC)
    R(x, 20, 9, 3, 17, p.hairS)
    for (let yy = 11; yy < 26; yy += 4) P(x, 7, yy, p.hairS)
    P(x, 14, 4, p.hairS)
    R(x, 9, 4, 4, 1, shade(p.hairC, 1.2))
  }
  if (p.hair === 'short') {
    R(x, 8, 3, 12, 2, p.hairC)
    R(x, 7, 5, 14, 3, p.hairC)
    R(x, 6, 7, 2, 5, p.hairC)
    R(x, 20, 7, 2, 5, p.hairS)
    R(x, 8, 8, 7, 1, p.hairC)
    for (const [hx, hy] of [[10, 4], [12, 5], [15, 4], [17, 5]]) P(x, hx, hy, shade(p.hairC, 1.6))
  }
  if (p.hair === 'spiky') {
    R(x, 7, 4, 14, 4, p.hairC)
    for (const [sx, sy] of [[6, 1], [9, 0], [12, 0], [15, 0], [18, 0], [21, 2]]) fillPoly(x, [[sx - 3, 6], [sx + 3, 6], [sx, sy]], p.hairC)
    R(x, 6, 7, 2, 5, p.hairC)
    R(x, 20, 7, 2, 5, p.hairS)
    for (const sx of [8, 11, 14, 17]) P(x, sx, 8, p.hairC)
    for (const sx of [9, 13, 17]) R(x, sx, 3, 1, 3, p.hairS)
  }
  if (p.hair === 'mop') {
    for (let i = 4; i < 25; i += 3) E(x, i, 5 + (i % 2), 2, 2, p.hairC)
    R(x, 5, 6, 18, 3, p.hairC)
    R(x, 4, 8, 4, 13, p.hairC)
    R(x, 20, 8, 4, 13, p.hairS)
    R(x, 8, 8, 2, 3, p.hairC)
    R(x, 12, 8, 2, 2, p.hairC)
    for (let i = 0; i < 16; i++) P(x, 4 + ((i * 5) % 20), 3 + ((i * 3) % 16), p.hairS)
  }
  if (p.hair === 'tucked') {
    // what shows under a hat
    R(x, 6, 7, 2, 7, p.hairC)
    R(x, 20, 7, 2, 7, p.hairS)
  }

  // things in the hair and on the head
  if (p.clip) {
    R(x, 6, 5, 5, 5, p.clip)
    R(x, 7, 4, 3, 7, p.clip)
    P(x, 8, 7, shade(p.clip, 0.75))
    P(x, 7, 5, shade(p.clip, 1.15))
  }
  if (p.crown) {
    R(x, 6, 5, 16, 1, shade(p.crown, 0.85))
    for (const sx of [7, 11, 15, 19]) {
      P(x, sx, 2, p.crown)
      R(x, sx - 1, 3, 3, 1, p.crown)
      P(x, sx, 4, p.crown)
      P(x, sx, 3, '#fff1b8')
    }
  }
  if (p.sprout) {
    R(x, 14, 1, 1, 3, '#4f8f3a')
    R(x, 11, 1, 3, 1, '#5aa045')
    R(x, 12, 0, 2, 1, '#5aa045')
    R(x, 15, 0, 3, 1, '#5aa045')
  }
  if (p.hat === 'beanie') {
    R(x, 9, 0, 10, 1, p.hatC)
    R(x, 7, 1, 14, 6, p.hatC)
    for (let xx = 8; xx < 20; xx += 2) R(x, xx, 1, 1, 5, shade(p.hatC, 0.85))
    R(x, 6, 6, 16, 3, shade(p.hatC, 0.82))
    R(x, 6, 6, 16, 1, shade(p.hatC, 1.1))
  }
  if (p.hat === 'fedora') {
    R(x, 8, 0, 12, 6, p.hatC)
    R(x, 12, 0, 4, 1, shade(p.hatC, 0.8))
    for (let xx = 9; xx < 20; xx += 3) P(x, xx, 2, shade(p.hatC, 0.85))
    R(x, 8, 4, 12, 2, p.band)
    R(x, 3, 6, 22, 2, p.hatC)
    R(x, 3, 7, 22, 1, shade(p.hatC, 0.8))
  }
  if (p.earring) {
    P(x, 6, 15, p.earring)
    R(x, 5, 16, 2, 2, p.earring)
  }
  return outline(c)
}

// Scaffolded with AI assistance — see AI_USAGE.md
// Every part a reader can give their character, the five ready-made characters, and the rules
// for turning a saved character (ids only) into the settings drawAvatar() needs.
// Prices live here and nowhere else. price 0 is free; anything else is locked until coins are
// saved (see isUnlocked).

const CREAM = '#fdf7ec'

// A colour swatch: c is the main colour, s its shadow (worked out when not given).
const swatch = (id, label, c, extra = {}) => ({ id, label, c, s: extra.s ?? shade(c, 0.78), ...extra })

const SLOTS = [
  { id: 'hair', label: 'Hair style', tab: 'hair' },
  { id: 'hairColour', label: 'Hair colour', tab: 'hair', colour: true },
  { id: 'skin', label: 'Skin tone', tab: 'skin' },
  { id: 'top', label: 'Top', tab: 'outfit' },
  { id: 'topColour', label: 'Top colour', tab: 'outfit', colour: true },
  { id: 'bottom', label: 'Bottoms', tab: 'outfit' },
  { id: 'bottomColour', label: 'Bottoms colour', tab: 'outfit', colour: true },
  { id: 'shoes', label: 'Shoes', tab: 'outfit' },
  { id: 'shoeColour', label: 'Shoe colour', tab: 'outfit', colour: true },
  { id: 'eyes', label: 'Glasses', tab: 'extras', optional: true },
  { id: 'head', label: 'On your head', tab: 'extras', optional: true },
  { id: 'hairAccessory', label: 'In your hair', tab: 'extras', optional: true },
  { id: 'neck', label: 'Scarf', tab: 'extras', optional: true },
  { id: 'ears', label: 'Earrings', tab: 'extras', optional: true },
  { id: 'bag', label: 'Bag', tab: 'extras', optional: true },
]

const CATALOGUE = {
  hair: [
    { id: 'long', label: 'Long', price: 0 },
    { id: 'bun', label: 'Bun', price: 0 },
    { id: 'curly', label: 'Curly', price: 0 },
    { id: 'twists', label: 'Twists', price: 0 },
    { id: 'puff', label: 'Puff', price: 0 },
    { id: 'bob', label: 'Bob', price: 120 },
    { id: 'wavy', label: 'Wavy', price: 120 },
    { id: 'messy', label: 'Messy', price: 120 },
    { id: 'short', label: 'Short', price: 120 },
    { id: 'spiky', label: 'Spiky', price: 120 },
    { id: 'mop', label: 'Mop', price: 120 },
  ],
  hairColour: [
    swatch('pink', 'Pink', '#e27aa0', { s: '#b8547a' }),
    swatch('chestnut', 'Chestnut', '#6b4a34', { s: '#4a3122' }),
    swatch('black', 'Black', '#2b2630', { s: '#4a4452', brow: '#2b2630' }),
    swatch('blonde', 'Blonde', '#e8cf8a', { s: '#c9a95e', roots: '#3a2a20', brow: '#3a2a20' }),
    swatch('ginger', 'Ginger', '#c0502f', { s: '#8e3520' }),
    swatch('auburn', 'Auburn', '#b8572f', { s: '#8e3d1e' }),
    swatch('ash', 'Ash brown', '#b49a7a', { s: '#8a7458' }),
    swatch('sandy', 'Sandy', '#c9a95e', { s: '#a8873e' }),
    swatch('honey', 'Honey', '#d9c48a', { s: '#b8a25e' }),
    swatch('lilac', 'Lilac', '#a98ad9'),
  ],
  // Skin tones are always free. Lightest first; each has its own shadow, lips and blush.
  skin: [
    { id: 'tone-1', label: 'Skin tone 1', skin: '#f6dcc6', skinS: '#e0bea2', lips: '#c0566a', blush: '#f2a0b8' },
    { id: 'tone-2', label: 'Skin tone 2', skin: '#f6d6bd', skinS: '#e0b796', lips: '#c0566a', blush: '#f2a0a8' },
    { id: 'tone-3', label: 'Skin tone 3', skin: '#f3d2b8', skinS: '#dcb294', lips: '#a8574f', blush: '#f3d2b8' },
    { id: 'tone-4', label: 'Skin tone 4', skin: '#f1c9a5', skinS: '#d9a982', lips: '#b4554f', blush: '#ebaa98' },
    { id: 'tone-5', label: 'Skin tone 5', skin: '#e8c0a0', skinS: '#cfa07e', lips: '#a8574f', blush: '#e8c0a0' },
    { id: 'tone-6', label: 'Skin tone 6', skin: '#e0b48e', skinS: '#c49470', lips: '#a8574f', blush: '#e88f80' },
    { id: 'tone-7', label: 'Skin tone 7', skin: '#d9a06a', skinS: '#bd8450', lips: '#8a4a3a', blush: '#d9a06a' },
    { id: 'tone-8', label: 'Skin tone 8', skin: '#b5835c', skinS: '#966644', lips: '#7a4232', blush: '#c4876a' },
    { id: 'tone-9', label: 'Skin tone 9', skin: '#8a5a3c', skinS: '#6e452c', lips: '#5e3624', blush: '#8a5a3c' },
    { id: 'tone-10', label: 'Skin tone 10', skin: '#6b4128', skinS: '#54301c', lips: '#4a2418', blush: '#6b4128' },
  ].map((tone) => ({ ...tone, price: 0 })),
  top: [
    { id: 'pinafore', label: 'Pinafore', price: 0, p: { inner: CREAM, sleeve: CREAM } },
    { id: 'puffer', label: 'Puffer jacket', price: 0, p: {} },
    { id: 'coat', label: 'Long coat', price: 0, p: { inner: '#f4efe2' } },
    { id: 'fuzzy', label: 'Fuzzy jumper', price: 0, p: {} },
    { id: 'tee', label: 'T-shirt', price: 150, p: { shortSleeves: true, print: '#e98aa8' } },
    { id: 'tank', label: 'Tank top', price: 150, p: {} },
    { id: 'tube', label: 'Tube top', price: 150, p: {} },
    { id: 'hoodie', label: 'Hoodie', price: 150, p: {} },
    { id: 'vest', label: 'Sweater vest', price: 150, p: { inner: '#f2b8c0', sleeve: '#f2b8c0' } },
    { id: 'sweater', label: 'Flame jumper', price: 150, p: { pattern: '#d9842f' } },
    { id: 'cardigan', label: 'Cardigan', price: 150, p: { inner: '#6b7a3a' } },
    { id: 'blazer', label: 'Blazer', price: 150, p: { inner: CREAM } },
  ],
  topColour: [
    swatch('pink', 'Pink', '#e98aa8', { s: '#c96a88' }),
    swatch('red', 'Red', '#c0392f', { s: '#8e2a22' }),
    swatch('brown', 'Brown', '#8a6448', { s: '#6b4a34' }),
    swatch('mustard', 'Mustard', '#f0c23a', { s: '#c99a1e' }),
    swatch('charcoal', 'Charcoal', '#2b2b33', { s: '#16161c', inner: '#5a6070' }),
    swatch('sage', 'Sage', '#9cc79a', { s: '#6fa06d' }),
    swatch('sky', 'Sky blue', '#8fb8d9'),
    swatch('lilac', 'Lilac', '#b9a0d9'),
    swatch('cream', 'Cream', '#f4efe2', { s: '#d9d0c4' }),
    swatch('navy', 'Navy', '#2f4a7a'),
  ],
  bottom: [
    { id: 'skirt', label: 'Skirt', price: 0, p: { sock: CREAM } },
    { id: 'baggy', label: 'Baggy trousers', price: 0, p: {} },
    { id: 'pants', label: 'Trousers', price: 0, p: {} },
    { id: 'ripped', label: 'Ripped jeans', price: 0, p: {} },
    { id: 'long', label: 'Long skirt', price: 120, p: {} },
    { id: 'cargo', label: 'Cargo trousers', price: 120, p: {} },
  ],
  bottomColour: [
    swatch('cream', 'Cream', CREAM, { s: '#d9d0c4' }),
    swatch('slate', 'Slate', '#6b6e78', { s: '#53565f' }),
    swatch('grey', 'Grey', '#9aa0ab', { s: '#7d838e' }),
    swatch('denim', 'Denim', '#8fa8bf', { s: '#7690a8' }),
    swatch('charcoal', 'Charcoal', '#2b2b33', { s: '#1e1e26' }),
    swatch('khaki', 'Khaki', '#6b5a3e', { s: '#54452f' }),
    swatch('olive', 'Olive', '#6b7a3a', { s: '#53602c' }),
    swatch('plum', 'Plum', '#4a2a6a', { s: '#341c4e' }),
  ],
  shoes: [
    { id: 'trainers', label: 'Trainers', price: 0, p: { sole: CREAM } },
    { id: 'shoes', label: 'Shoes', price: 0, p: { sole: '#4a4452' } },
    { id: 'skaters', label: 'Skate shoes', price: 0, p: { sole: '#5a5a68' } },
    { id: 'boots', label: 'Boots', price: 100, p: { boots: true, sole: '#5a3a24' } },
  ],
  shoeColour: [
    swatch('ink', 'Black', '#2b2230'),
    swatch('pink', 'Pink', '#e98aa8'),
    swatch('brown', 'Brown', '#8a6440'),
    swatch('cream', 'Cream', '#e8dcc0'),
    swatch('grey', 'Grey', '#8a8f99'),
    swatch('red', 'Red', '#c0392f'),
    swatch('sky', 'Pale blue', '#b9c9d3'),
  ],
  eyes: [
    { id: 'shades', label: 'Shades', price: 0, p: { shades: true } },
    { id: 'goggles', label: 'Goggles', price: 0, p: { goggles: true } },
  ],
  // Hats and the hood tuck the hair in, as on the townsfolk who wear them.
  head: [
    { id: 'beanie', label: 'Beanie', price: 100, tucksHair: true, p: { hat: 'beanie', hatC: '#55585f' } },
    { id: 'fedora', label: 'Fedora', price: 150, tucksHair: true, p: { hat: 'fedora', hatC: '#c9a46a', band: '#4a5a3a' } },
    { id: 'hood', label: 'Hood', price: 100, tucksHair: true, p: { hood: '#4a4d55' } },
    { id: 'crown', label: 'Crown', price: 300, p: { crown: '#f6c84a' } },
  ],
  hairAccessory: [
    { id: 'flower-red', label: 'Red flower', price: 0, requires: { hair: ['curly'] }, p: { flower: '#d0453d' } },
    { id: 'flower-pink', label: 'Pink flower', price: 0, requires: { hair: ['curly'] }, p: { flower: '#f2a0b8' } },
    { id: 'clip', label: 'Hair clip', price: 60, p: { clip: '#9fd4b0' } },
    { id: 'sprout', label: 'Sprout', price: 60, p: { sprout: true } },
  ],
  neck: [
    { id: 'scarf-grey', label: 'Grey scarf', price: 0, p: { scarf: '#5a6070' } },
    { id: 'scarf-red', label: 'Red scarf', price: 0, p: { scarf: '#c0392f' } },
    { id: 'scarf-mustard', label: 'Mustard scarf', price: 0, p: { scarf: '#e3b04b' } },
  ],
  ears: [
    { id: 'earring-gold', label: 'Gold earrings', price: 80, p: { earring: '#f6c84a' } },
    { id: 'earring-blue', label: 'Blue earrings', price: 80, p: { earring: '#9fd4ee' } },
  ],
  bag: [{ id: 'tote', label: 'Tote bag', price: 100, p: { bag: '#bcd6e2' } }],
}

// Colour swatches are free.
for (const slot of SLOTS) if (slot.colour) for (const item of CATALOGUE[slot.id]) item.price = 0

const NO_EXTRAS = { eyes: null, head: null, hairAccessory: null, neck: null, ears: null, bag: null }

// The five ready-made characters, matching public/town/avatars/<id>.png exactly. seed is where
// the map script's random numbers stood when it drew each one (curly, puff and fuzzy use them).
const PRESETS = [
  {
    id: 'rosie',
    label: 'Rosie',
    seed: 23,
    character: { hair: 'long', hairColour: 'pink', skin: 'tone-2', top: 'pinafore', topColour: 'pink', bottom: 'skirt', bottomColour: 'cream', shoes: 'trainers', shoeColour: 'pink', ...NO_EXTRAS },
  },
  {
    id: 'maya',
    label: 'Maya',
    seed: 23,
    character: { hair: 'bun', hairColour: 'chestnut', skin: 'tone-4', top: 'puffer', topColour: 'red', bottom: 'baggy', bottomColour: 'slate', shoes: 'trainers', shoeColour: 'ink', ...NO_EXTRAS },
  },
  {
    id: 'rex',
    label: 'Rex',
    seed: 23,
    character: { hair: 'curly', hairColour: 'black', skin: 'tone-3', top: 'coat', topColour: 'brown', bottom: 'pants', bottomColour: 'grey', shoes: 'shoes', shoeColour: 'ink', ...NO_EXTRAS, eyes: 'shades', hairAccessory: 'flower-red' },
  },
  {
    id: 'jay',
    label: 'Jay',
    seed: 770898176,
    character: { hair: 'twists', hairColour: 'blonde', skin: 'tone-9', top: 'fuzzy', topColour: 'mustard', bottom: 'ripped', bottomColour: 'denim', shoes: 'skaters', shoeColour: 'ink', ...NO_EXTRAS, eyes: 'goggles' },
  },
  {
    id: 'nova',
    label: 'Nova',
    seed: 2095571520,
    character: { hair: 'puff', hairColour: 'ginger', skin: 'tone-8', top: 'puffer', topColour: 'charcoal', bottom: 'baggy', bottomColour: 'charcoal', shoes: 'trainers', shoeColour: 'ink', ...NO_EXTRAS, neck: 'scarf-grey' },
  },
]

const DEFAULT_PRESET = 'rosie'

function findItem(slot, id) {
  return CATALOGUE[slot]?.find((item) => item.id === id) ?? null
}

// Until coins are saved, only free items can be chosen.
function isUnlocked(item) {
  return item.price === 0
}

function presetCharacter(id) {
  const preset = PRESETS.find((p) => p.id === id) ?? PRESETS.find((p) => p.id === DEFAULT_PRESET)
  return { v: 1, base: preset.id, ...preset.character }
}

// Why an item can't go with the rest of the character, or null when it can.
function blockedReason(character, slot, id) {
  const item = findItem(slot, id)
  if (!item?.requires) return null
  for (const [other, allowed] of Object.entries(item.requires)) {
    if (!allowed.includes(character[other])) {
      const names = allowed.map((a) => findItem(other, a)?.label.toLowerCase() ?? a).join(' or ')
      return `Only with ${names} ${other === 'hair' ? 'hair' : findSlot(other).label.toLowerCase()}`
    }
  }
  return null
}

function findSlot(id) {
  return SLOTS.find((slot) => slot.id === id)
}

// The character with one slot changed. Extras that no longer fit are taken off.
function applyChoice(character, slot, id) {
  const next = { ...character, [slot]: id }
  for (const other of SLOTS) {
    if (other.optional && next[other.id] && blockedReason(next, other.id, next[other.id])) next[other.id] = null
  }
  return next
}

// Anything read back from an account becomes a complete, valid character. An unknown, locked or
// clashing part falls back to the base character's part; a bare preset id (e.g. 'maya') works.
// allowLocked keeps locked parts, for drawing a preview of something not yet owned.
function normaliseCharacter(raw, { allowLocked = false } = {}) {
  if (typeof raw === 'string') return presetCharacter(raw)
  if (!raw || typeof raw !== 'object') return presetCharacter(DEFAULT_PRESET)
  const fallback = presetCharacter(raw.base)
  const out = { v: 1, base: fallback.base }
  for (const slot of SLOTS) {
    const id = raw[slot.id]
    const item = id == null ? null : findItem(slot.id, id)
    if (id == null && slot.optional) out[slot.id] = null
    else out[slot.id] = item && (allowLocked || isUnlocked(item)) ? id : fallback[slot.id]
  }
  for (const slot of SLOTS) {
    if (out[slot.id] && blockedReason(out, slot.id, out[slot.id])) {
      out[slot.id] = slot.optional ? null : fallback[slot.id]
    }
  }
  return out
}

// The random seed to draw this character with, so it always comes out the same.
function characterSeed(character) {
  return (PRESETS.find((p) => p.id === character.base) ?? PRESETS[0]).seed
}

// The settings drawAvatar() reads. character must be normalised.
function toDrawParams(character) {
  const pick = (slot) => findItem(slot, character[slot])
  const hairColour = pick('hairColour')
  const topColour = pick('topColour')
  const bottomColour = pick('bottomColour')
  const top = pick('top')
  const { skin, skinS, lips, blush } = pick('skin')
  const p = {
    hair: character.hair,
    hairC: hairColour.c,
    hairS: hairColour.s,
    roots: hairColour.roots ?? hairColour.s,
    skin,
    skinS,
    lips,
    blush,
    top: top.id,
    topC: topColour.c,
    topS: topColour.s,
    ...top.p,
    inner: topColour.inner ?? top.p.inner ?? CREAM,
    bottom: character.bottom,
    botC: bottomColour.c,
    botS: bottomColour.s,
    ...pick('bottom').p,
    shoe: pick('shoeColour').c,
    ...pick('shoes').p,
  }
  if (hairColour.brow) p.brow = hairColour.brow
  for (const slot of SLOTS) {
    if (!slot.optional || !character[slot.id]) continue
    const item = pick(slot.id)
    Object.assign(p, item.p)
    if (item.tucksHair) p.hair = 'tucked'
  }
  return p
}

// The character in words, for screen readers: "Pink long hair, skin tone 2, pink pinafore, …".
function describeCharacter(character) {
  const label = (slot) => findItem(slot, character[slot])?.label.toLowerCase() ?? ''
  const parts = [
    `${findItem('hairColour', character.hairColour).label} ${label('hair')} hair`,
    label('skin'),
    `${label('topColour')} ${label('top')}`,
    `${label('bottomColour')} ${label('bottom')}`,
    `${label('shoeColour')} ${label('shoes')}`,
  ]
  const extras = SLOTS.filter((slot) => slot.optional && character[slot.id]).map((slot) => label(slot.id))
  return parts.join(', ') + (extras.length ? `, with ${extras.join(' and ')}` : '')
}

// A random look made only of free parts, for "Surprise me". Extras are left off about half the
// time, and anything that clashes (a flower without curly hair) is skipped.
function randomCharacter(base = DEFAULT_PRESET, random = Math.random) {
  let character = presetCharacter(base)
  for (const slot of SLOTS) {
    const free = CATALOGUE[slot.id].filter(isUnlocked)
    // an optional part with nothing free yet (earrings, bags) stays off
    const id = !free.length || (slot.optional && random() < 0.5) ? null : free[Math.floor(random() * free.length)].id
    if (id === null || !blockedReason(character, slot.id, id)) character = applyChoice(character, slot.id, id)
  }
  return character
}

  window.IKDAAvatar = { CATALOGUE, DEFAULT_PRESET, E, P, PRESETS, R, SLOTS, applyChoice, blockedReason, characterSeed, describeCharacter, drawAvatar, fillPoly, findItem, isUnlocked, makeRnd, mk, normaliseCharacter, outline, presetCharacter, randomCharacter, shade, toDrawParams };
})();
