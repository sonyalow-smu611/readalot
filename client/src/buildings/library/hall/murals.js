// Scaffolded with AI assistance — see AI_USAGE.md
// The art on the wall behind each bookcase, so each genre's corner of the hall looks like that
// genre: hearts and fairy lights for romance, a moonlit castle for fantasy, a case board for
// mystery and so on. Each is one panel (MURAL in layout.js), a little wider than its bookcase,
// from the picture rail down to the panelling; the bookcase stands in front of its lower part,
// so the art sits in the band above it (where its sign hangs, in the middle) and at its sides.
import { MURAL } from './layout.js'
import { drawIcon } from './icons.js'
import { E, P, R, seeded, sprite } from './pixel.js'

const { w: W, h: H } = MURAL

// The sign hangs in the middle of the band above the bookcase, from about here down: the art
// keeps to the corners below this line.
const BAND = 30

export function mural(category) {
  const tools = seeded(`wall-${category.key}`)
  return sprite(W, H, (x) => {
    R(x, 0, 0, W, H, category.backdrop)
    WALLS[category.wall]?.(x, tools)
    // a thin trim round the panel in the bookcase's wood
    const trim = category.wood.dark
    R(x, 0, 0, W, 2, trim)
    R(x, 0, H - 2, W, 2, trim)
    R(x, 0, 0, 2, H, trim)
    R(x, W - 2, 0, 2, H, trim)
  })
}

// --- Helpers ------------------------------------------------------------------------------------

// a 1 px line from (x0, y0) to (x1, y1)
function line(x, x0, y0, x1, y1, col) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1)
  for (let i = 0; i <= steps; i++) P(x, Math.round(x0 + ((x1 - x0) * i) / steps), Math.round(y0 + ((y1 - y0) * i) / steps), col)
}

// `count` single pixels scattered over the panel, in one of `cols`
function speckle(x, { ri, pick }, count, cols, bottom = H) {
  for (let i = 0; i < count; i++) P(x, ri(3, W - 4), ri(3, bottom - 4), pick(cols))
}

// a cobweb across a top corner: threads out from the corner and rings across them
function cobweb(x, right, col) {
  const at = (dx, dy) => [right ? W - 3 - dx : 2 + dx, 2 + dy]
  for (const [dx, dy] of [[16, 0], [14, 7], [10, 12], [0, 16]]) line(x, ...at(0, 0), ...at(dx, dy), col)
  for (const r of [5, 10, 15]) {
    for (let a = 0; a <= 8; a++) {
      const turn = (a / 8) * (Math.PI / 2)
      P(x, ...at(Math.round(Math.cos(turn) * r), Math.round(Math.sin(turn) * r)), col)
    }
  }
}

// --- One painter per genre ---------------------------------------------------------------------
const WALLS = {
  bestsellers(x, tools) {
    speckle(x, tools, 70, ['#e53b3b', '#2f6fd6', '#2d8a5a', '#f2c94c'])
    // a red ribbon across the top, its ends cut in a V, with gold stitching
    R(x, 4, 3, W - 8, 8, '#b8323a')
    for (let i = 8; i < W - 8; i += 4) R(x, i, 4, 2, 1, '#f2c94c')
    for (let i = 8; i < W - 8; i += 4) R(x, i, 9, 2, 1, '#f2c94c')
    for (const [end, dir] of [[4, 1], [W - 5, -1]]) {
      P(x, end, 7, '#fdf0d5')
      P(x, end + dir, 7, '#fdf0d5')
    }
    drawIcon(x, 'trophy', W / 2 - 9, 13, 2)
    drawIcon(x, 'star', 6, 15)
    drawIcon(x, 'star', W - 15, 15)
    drawIcon(x, 'crown', 4, BAND + 5)
    drawIcon(x, 'star', W - 13, BAND + 4)
  },

  romance(x) {
    // a wallpaper of little hearts
    for (let y = 6, row = 0; y < H; y += 10, row++) {
      for (let i = (row % 2) * 6 + 4; i < W - 4; i += 12) {
        for (const [dx, dy] of [[0, 0], [2, 0], [0, 1], [1, 1], [2, 1], [1, 2]]) P(x, i + dx, y + dy, '#eab0bd')
      }
    }
    // fairy lights in two swags across the top
    const bulbs = ['#ffd65e', '#ff8fa3', '#9fe0ff', '#b6f29b']
    for (let i = 2; i < W - 2; i++) {
      const y = 4 + Math.round(4 * Math.sin((Math.PI * (i % 54)) / 54))
      P(x, i, y, '#6b4329')
      if (i % 7 === 3) R(x, i, y + 1, 2, 2, bulbs[Math.floor(i / 7) % bulbs.length])
    }
    drawIcon(x, 'heart', W / 2 - 9, 12, 2)
    drawIcon(x, 'heart', 6, 16)
    drawIcon(x, 'heart', W - 15, 16)
    drawIcon(x, 'heart', 4, BAND + 4)
    drawIcon(x, 'heart', W - 13, BAND + 4)
  },

  romantasy(x, tools) {
    speckle(x, tools, 50, ['#f0d48a', '#e2ae98', '#fdf7ec'])
    // a few four-point sparkles
    for (const [cx, cy] of [[26, 8], [86, 22], [14, BAND + 6], [W - 12, BAND + 8]]) {
      R(x, cx - 2, cy, 5, 1, '#f0d48a')
      R(x, cx, cy - 2, 1, 5, '#f0d48a')
    }
    drawIcon(x, 'crown', W / 2 - 9, 10, 2)
    drawIcon(x, 'heart', 6, 12)
    drawIcon(x, 'star', W - 15, 10)
  },

  fantasy(x, tools) {
    speckle(x, tools, 60, ['#fdf7ec', '#f7d154', '#b9a6e8'])
    drawIcon(x, 'moon', 6, 4, 2)
    drawIcon(x, 'star', W / 2 - 4, 6)
    drawIcon(x, 'castle', W - 31, 8, 2)
  },

  mystery(x, tools) {
    speckle(x, tools, 120, ['#a97f52', '#d6b088'])
    const notes = [
      { at: [6, 6], w: 15, h: 13, col: '#f9f3e6' },
      { at: [W / 2 - 8, 3], w: 16, h: 12, col: '#d6cdb8' },
      { at: [W - 22, 8], w: 14, h: 13, col: '#f7e27a' },
    ]
    for (const { at: [nx, ny], w, h, col } of notes) {
      R(x, nx, ny, w, h, col)
      for (let ruled = ny + 4; ruled < ny + h - 2; ruled += 3) R(x, nx + 2, ruled, w - 5, 1, '#9c8f7a')
    }
    // a suspect's photo on the middle note
    E(x, W / 2, 7, 2, 2, '#4a3a2c')
    R(x, W / 2 - 3, 10, 7, 4, '#4a3a2c')
    // red string from pin to pin
    const pins = notes.map(({ at: [nx, ny], w }) => [Math.round(nx + w / 2), ny])
    line(x, ...pins[0], ...pins[1], '#c0392b')
    line(x, ...pins[1], ...pins[2], '#c0392b')
    for (const [px, py] of pins) R(x, px - 1, py - 1, 3, 3, '#d23b3b')
    drawIcon(x, 'magnifier', W - 14, BAND + 3)
    // footprints
    for (const [fx, fy] of [[4, BAND + 2], [8, BAND + 7], [4, BAND + 12]]) R(x, fx, fy, 2, 3, '#6b4329')
  },

  horror(x, { ri }) {
    // a full moon
    E(x, 16, 15, 9, 9, '#f3eee0')
    E(x, 13, 12, 2, 2, '#d6cdb8')
    E(x, 19, 18, 3, 2, '#d6cdb8')
    for (const [bx, by] of [[38, 6], [62, 13], [80, 4], [30, 20]]) drawIcon(x, 'bat', bx, by)
    cobweb(x, true, '#8c8494')
    // blood dripping from the top edge
    for (const dx of [44, 52, 70, 96]) {
      const long = ri(4, 12)
      R(x, dx, 2, 1, long, '#8a1f24')
      R(x, dx - 1, 2 + long, 3, 2, '#a8262c')
    }
    drawIcon(x, 'skull', 4, BAND + 4)
  },

  scifi(x, tools) {
    speckle(x, tools, 70, ['#ffffff', '#6ff0d8', '#9fb8e6'])
    // a ringed planet
    E(x, 18, 16, 9, 9, '#e08a3c')
    R(x, 10, 14, 17, 2, '#c96f2a')
    for (let i = -15; i <= 15; i++) P(x, 18 + i, 16 + Math.round(i * 0.25), '#f3eee0')
    E(x, W - 14, BAND + 6, 4, 4, '#6ff0d8')
    drawIcon(x, 'rocket', W - 28, 2, 2)
  },

  historical(x, tools) {
    // stains on the old map
    for (let i = 0; i < 7; i++) E(x, tools.ri(8, W - 8), tools.ri(6, H - 8), tools.ri(3, 7), tools.ri(2, 5), '#d6bd88')
    // a coastline, a dotted route and the X that marks the spot
    let [cx, cy] = [8, 22]
    while (cx < W - 10) {
      const nx = cx + tools.ri(3, 6)
      const ny = Math.max(10, Math.min(28, cy + tools.ri(-3, 3)))
      line(x, cx, cy, nx, ny, '#9c7b4f')
      ;[cx, cy] = [nx, ny]
    }
    for (let i = 30; i < 80; i += 4) R(x, i, 14 + Math.round(3 * Math.sin(i / 6)), 2, 1, '#a8483a')
    line(x, 80, 10, 84, 14, '#a8483a')
    line(x, 84, 10, 80, 14, '#a8483a')
    cobweb(x, false, '#b8b0a2')
    cobweb(x, true, '#b8b0a2')
    drawIcon(x, 'candle', 4, BAND + 6)
    drawIcon(x, 'candle', W - 9, BAND + 6)
  },

  ya(x, { ri, pick }) {
    const pens = ['#ef6f9b', '#5ec4b6', '#9b7fd4', '#f28c6b']
    // doodled zigzags
    for (let i = 0; i < 5; i++) {
      const [zx, zy] = [ri(6, W - 20), ri(4, H - 10)]
      const col = pick(pens)
      for (let k = 0; k < 12; k++) P(x, zx + k, zy + (k % 4 < 2 ? k % 2 : 1 - (k % 2)), col)
    }
    // two polaroids
    for (const [px, py, col] of [[6, 5, '#5ec4b6'], [W - 22, 9, '#ef6f9b']]) {
      R(x, px, py, 14, 16, '#ffffff')
      R(x, px + 2, py + 2, 10, 10, col)
    }
    drawIcon(x, 'star', W / 2 - 9, 6, 2)
    drawIcon(x, 'heart', 5, BAND + 4)
    drawIcon(x, 'lightning', W - 11, BAND + 4)
  },

  memoir(x) {
    for (let i = 4; i < W; i += 8) R(x, i, 0, 2, H, '#e4d5b8')
    // framed family photos
    const frames = [
      [6, 5, 16, 18],
      [W / 2 - 9, 3, 18, 13],
      [W - 22, 8, 16, 16],
    ]
    for (const [fx, fy, w, h] of frames) {
      R(x, fx, fy, w, h, '#8a5d36')
      R(x, fx + 2, fy + 2, w - 4, h - 4, '#c9a77c')
      const mid = Math.round(fx + w / 2)
      E(x, mid, fy + 6, 2, 2, '#6b4f36')
      R(x, mid - 3, fy + 9, 7, h - 11, '#6b4f36')
    }
    drawIcon(x, 'quill', 4, BAND + 4)
  },

  graphic(x) {
    // halftone dots, bigger towards the top
    for (let y = 4; y < H - 3; y += 4) {
      for (let i = 4 + ((y / 4) % 2) * 2; i < W - 3; i += 4) R(x, i, y, y < 20 ? 2 : 1, y < 20 ? 2 : 1, '#f2c94c')
    }
    // a POW burst: spikes, a red star and the word
    const [cx, cy] = [20, 15]
    for (let a = 0; a < 12; a++) {
      const turn = (a / 12) * Math.PI * 2
      line(x, cx, cy, cx + Math.round(Math.cos(turn) * 16), cy + Math.round(Math.sin(turn) * 12), '#e53b3b')
    }
    E(x, cx, cy, 12, 8, '#e53b3b')
    E(x, cx, cy, 10, 6, '#f7d154')
    const letters = {
      P: ['111', '101', '111', '100', '100'],
      O: ['111', '101', '101', '101', '111'],
      W: ['101', '101', '101', '111', '101'],
    }
    ;['P', 'O', 'W'].forEach((letter, n) => {
      letters[letter].forEach((row, j) => {
        for (let i = 0; i < 3; i++) if (row[i] === '1') P(x, cx - 6 + n * 4 + i, cy - 2 + j, '#1e1a24')
      })
    })
    drawIcon(x, 'bubble', W - 24, 6, 2)
    drawIcon(x, 'lightning', W / 2 - 3, 6)
  },
}
