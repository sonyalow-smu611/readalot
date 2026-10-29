// Scaffolded with AI assistance — see AI_USAGE.md
// The inside of the Hair Salon in the town map's pixel style, at the same fine pixel size as the
// cafe and the library: drawn with the map's own pixel helpers and dark outline, in the salon
// building's colours (pale pink walls, pink trim, a black and white floor).
//   backdrop: the whole room (walls, window, neon sign, posters, shelves, lamps, basin, dryers)
//   mirror:   the reader's corner, behind them: a tall mirror ringed with bulbs (their reflection
//             is shown in its glass, MIRROR_GLASS)
//   front:    in front of the reflection: the counter under the mirror and the barber chair
// The reader stands beside the chair in CHARACTER_BOX, drawn by the page as their sprite.
import { E, R, P, mk, outline } from '@/lib/avatar/draw.js'

export const ROOM_W = 480
export const ROOM_H = 270
export const STATION_W = 168
export const STATION_H = 150

// Where the reader stands (their sprite at twice the station's pixel size), and the mirror's
// glass, where their reflection shows.
export const CHARACTER_BOX = { x: 104, y: 28, width: 60, height: 116 }
export const MIRROR_GLASS = { x: 16, y: 8, width: 64, height: 88 }
export const FEET = { x: 134, y: 144 }

const INK = '#1e1a24'
const PINK = '#c77fa6'
const PINK_DARK = '#a8648a'
const PINK_LIGHT = '#f2b8cf'
const CREAM = '#fdf7ec'
const SEAT = '#d0608e'
const SEAT_DARK = '#a84874'
const CHROME = '#c9d6de'
const STEEL = '#8a8f99'
const WOOD = '#a87e5a'
const WOOD_DARK = '#7a5640'
const GLASS = '#cfe3ec'
const BULB = '#fff0a8'
const NEON = '#ff8cc6'
const LEAF = '#6b9e57'
const LEAF_DARK = '#3f7a4a'
const FLOOR_Y = 196

function room(x) {
  // striped wallpaper with little diamonds
  for (let px = 0; px < ROOM_W; px += 20) {
    R(x, px, 0, 10, FLOOR_Y, '#f7e6ee')
    R(x, px + 10, 0, 10, FLOOR_Y, '#fbf1f4')
  }
  for (let px = 5; px < ROOM_W; px += 20) {
    for (let py = 18; py < 150; py += 22) {
      const dy = (px / 20) % 2 ? 11 : 0
      P(x, px, py + dy, '#e3b4c8')
      R(x, px - 1, py + dy + 1, 3, 1, '#e3b4c8')
      P(x, px, py + dy + 2, '#e3b4c8')
    }
  }
  // crown moulding with little blocks under it
  R(x, 0, 0, ROOM_W, 6, PINK)
  R(x, 0, 6, ROOM_W, 2, PINK_DARK)
  for (let px = 2; px < ROOM_W; px += 8) R(x, px, 8, 4, 2, PINK_LIGHT)
  // panelling below a pink rail
  R(x, 0, 156, ROOM_W, 40, '#ecccda')
  R(x, 0, 154, ROOM_W, 4, PINK)
  R(x, 0, 158, ROOM_W, 1, PINK_DARK)
  for (let px = 6; px < ROOM_W; px += 34) {
    R(x, px, 164, 26, 24, '#e4bccd')
    R(x, px + 2, 166, 22, 20, '#f0d4e0')
  }
  R(x, 0, 192, ROOM_W, 4, PINK_DARK)
  // a black and white floor, its rows growing towards you
  let y = FLOOR_Y
  for (let row = 0; y < ROOM_H; row++) {
    const h = 10 + row * 3
    for (let col = 0; col * 18 < ROOM_W; col++) {
      R(x, col * 18, y, 18, h, (row + col) % 2 ? '#3b3440' : '#f3ede4')
    }
    y += h
  }
  R(x, 0, FLOOR_Y, ROOM_W, 2, 'rgba(30, 26, 36, 0.25)')
}

// an arched window onto the town: sky, a cloud, grass, a neighbour's roof
function townWindow(x, px, py, w, h) {
  const mid = px + w / 2
  R(x, px, py + 16, w, h - 16, CREAM)
  E(x, mid, py + 18, w / 2, 18, CREAM)
  R(x, px + 4, py + 18, w - 8, h - 22, '#bfe3f2')
  E(x, mid, py + 20, w / 2 - 4, 15, '#bfe3f2')
  R(x, px + 4, py + 48, w - 8, 20, '#d9f0f7')
  E(x, px + 22, py + 30, 9, 4, '#ffffff')
  E(x, px + 30, py + 28, 7, 4, '#ffffff')
  R(x, px + 4, py + h - 26, w - 8, 22, '#8cc56b')
  for (const [tx, r] of [[px + 14, 7], [px + 56, 9], [px + 68, 6]]) E(x, tx, py + h - 28, r, r, '#5e9868')
  R(x, px + 30, py + h - 34, 18, 10, '#e9dcc4')
  for (let k = 0; k < 8; k++) R(x, px + 39 - k * 1.5, py + h - 44 + k, k * 3 + 1, 1, '#c45a4a')
  R(x, px + 27, py + h - 36, 24, 3, '#c45a4a')
  // the frame's cross
  R(x, mid - 2, py + 4, 4, h - 6, CREAM)
  R(x, px + 2, py + 52, w - 4, 4, CREAM)
  // curtains tied back, and a flower box
  for (const cx of [px - 10, px + w]) {
    R(x, cx, py + 2, 10, h - 10, PINK_LIGHT)
    R(x, cx + 2, py + 2, 2, h - 10, '#f7d0df')
    R(x, cx, py + h - 40, 10, 4, PINK_DARK)
  }
  R(x, px - 14, py, w + 28, 4, WOOD_DARK)
  R(x, px - 4, py + h, w + 8, 10, WOOD)
  for (let fx = px; fx < px + w; fx += 9) {
    E(x, fx + 3, py + h - 2, 3, 3, LEAF)
    E(x, fx + 3, py + h - 4, 2, 2, ['#f27aa0', '#f6e27a', '#ffffff'][(fx / 9) % 3 | 0])
  }
}

// a dark sign with a pink neon pair of scissors and a comb
function neonSign(x, px, py) {
  R(x, px, py, 112, 38, '#3b2a3a')
  R(x, px + 2, py + 2, 108, 34, '#4b3549')
  const n = (X, Y, W, H) => R(x, px + X, py + Y, W, H, NEON)
  // scissors: two rings and two crossed blades
  E(x, px + 20, py + 24, 6, 6, NEON)
  E(x, px + 20, py + 24, 3, 3, '#4b3549')
  E(x, px + 20, py + 12, 6, 6, NEON)
  E(x, px + 20, py + 12, 3, 3, '#4b3549')
  for (let k = 0; k < 18; k++) {
    n(26 + k * 1.8, 22 - k * 0.6, 2, 2)
    n(26 + k * 1.8, 14 + k * 0.6, 2, 2)
  }
  // comb
  n(66, 10, 34, 5)
  for (let k = 0; k < 11; k++) n(67 + k * 3, 15, 2, 9)
  // sparkles
  for (const [sx, sy] of [[58, 6], [104, 30], [8, 6]]) {
    P(x, px + sx, py + sy, '#ffffff')
    R(x, px + sx - 1, py + sy + 1, 3, 1, NEON)
    P(x, px + sx, py + sy + 2, '#ffffff')
  }
}

// a framed poster of a hairdo
function poster(x, px, py, hair, colour) {
  R(x, px, py, 38, 44, WOOD_DARK)
  R(x, px + 3, py + 3, 32, 38, CREAM)
  const cx = px + 19
  if (hair === 'afro') E(x, cx, py + 18, 13, 12, colour)
  if (hair === 'bob') {
    E(x, cx, py + 17, 11, 10, colour)
    R(x, cx - 11, py + 17, 22, 12, colour)
  }
  E(x, cx, py + 21, 7, 8, '#f1c7a5')
  P(x, cx - 3, py + 21, INK)
  P(x, cx + 3, py + 21, INK)
  R(x, cx - 1, py + 25, 3, 1, '#d0608e')
  if (hair === 'bob') R(x, cx - 8, py + 11, 16, 5, colour)
  R(x, cx - 8, py + 30, 16, 9, PINK_LIGHT)
}

function lampShade(x, cx) {
  R(x, cx, 8, 2, 22, '#5a4f5f')
  E(x, cx + 1, 34, 11, 6, PINK)
  R(x, cx - 10, 34, 22, 3, PINK_DARK)
  E(x, cx + 1, 37, 4, 2, BULB)
}

function shelves(x, px, py) {
  for (const sy of [py, py + 40]) {
    R(x, px, sy, 72, 4, WOOD)
    R(x, px + 6, sy + 4, 3, 6, WOOD_DARK)
    R(x, px + 63, sy + 4, 3, 6, WOOD_DARK)
  }
  // bottles of every colour on the top shelf
  const bottles = [['#e27aa0', 14], ['#8fb8d9', 18], ['#f6e27a', 12], ['#9fd39a', 16], ['#c9a0e8', 14], ['#f3a46b', 18]]
  bottles.forEach(([colour, h], i) => {
    const bx = px + 4 + i * 11
    R(x, bx, py - h, 8, h, colour)
    R(x, bx + 2, py - h - 3, 4, 3, CREAM)
    R(x, bx + 1, py - h + 3, 2, h - 6, 'rgba(255, 255, 255, 0.55)')
  })
  // rolled towels on the lower shelf
  for (let i = 0; i < 5; i++) {
    E(x, px + 9 + i * 13, py + 32, 6, 6, i % 2 ? '#ffffff' : PINK_LIGHT)
    E(x, px + 9 + i * 13, py + 32, 2, 2, i % 2 ? '#e6dde3' : PINK)
  }
}

function basin(x, px, py) {
  R(x, px, py + 14, 80, 34, PINK)
  R(x, px + 4, py + 18, 34, 26, '#d993b6')
  R(x, px + 42, py + 18, 34, 26, '#d993b6')
  R(x, px - 2, py + 10, 84, 5, CREAM)
  E(x, px + 40, py + 10, 20, 5, '#ffffff')
  E(x, px + 40, py + 11, 16, 3, GLASS)
  R(x, px + 38, py - 6, 4, 14, CHROME)
  R(x, px + 38, py - 6, 12, 3, CHROME)
  E(x, px + 22, py + 2, 4, 2, CHROME)
}

function dryerChair(x, px, py) {
  // a hood dryer on its stand, over a pink chair
  R(x, px + 18, py + 10, 4, 40, STEEL)
  E(x, px + 20, py + 8, 16, 12, CHROME)
  E(x, px + 20, py + 12, 12, 7, '#9fb0bb')
  R(x, px + 4, py + 32, 32, 22, SEAT)
  R(x, px + 4, py + 28, 32, 6, SEAT_DARK)
  R(x, px + 2, py + 50, 36, 6, SEAT_DARK)
  R(x, px + 6, py + 56, 3, 10, STEEL)
  R(x, px + 31, py + 56, 3, 10, STEEL)
}

function pottedPlant(x, px, py) {
  R(x, px - 7, py, 14, 14, '#b96e50')
  R(x, px - 8, py, 16, 3, '#d38a63')
  R(x, px - 1, py - 18, 2, 18, LEAF_DARK)
  for (const [dx, dy, rx, ry] of [[-7, -14, 7, 5], [8, -16, 8, 5], [0, -26, 7, 7], [-9, -26, 5, 4]]) {
    E(x, px + dx, py + dy, rx, ry, LEAF_DARK)
    E(x, px + dx - 1, py + dy - 1, rx - 2, ry - 2, LEAF)
  }
}

function clock(x, cx, cy) {
  E(x, cx, cy, 11, 11, PINK)
  E(x, cx, cy, 8, 8, CREAM)
  R(x, cx, cy - 6, 1, 6, INK)
  R(x, cx, cy, 5, 1, INK)
}

function roomThings(x) {
  clock(x, 120, 46)
  townWindow(x, 168, 30, 80, 98)
  neonSign(x, 278, 24)
  poster(x, 284, 78, 'bob', '#d0608e')
  poster(x, 336, 78, 'afro', '#7a5ab0')
  for (const cx of [64, 330, 440]) lampShade(x, cx)
  shelves(x, 398, 74)
  basin(x, 262, 150)
  dryerChair(x, 386, 132)
  dryerChair(x, 430, 132)
  pottedPlant(x, 152, 182)
  pottedPlant(x, 470, 182)
}

// soft light under the lamps and from the sign, drawn over the outlines
function lights(x) {
  for (const cx of [65, 331, 441]) {
    x.fillStyle = 'rgba(255, 240, 168, 0.18)'
    for (let r = 26; r > 6; r -= 6) {
      x.beginPath()
      x.ellipse(cx, 44, r * 1.6, r, 0, 0, Math.PI * 2)
      x.fill()
    }
  }
  x.fillStyle = 'rgba(255, 140, 198, 0.1)'
  x.fillRect(272, 20, 124, 48)
}

function mirror(x) {
  // a tall arched mirror in a pink frame, ringed with bulbs
  R(x, 10, 26, 76, 74, PINK)
  E(x, 48, 26, 38, 22, PINK)
  R(x, 16, 30, 64, 66, GLASS)
  E(x, 48, 30, 32, 18, GLASS)
  R(x, 16, 70, 64, 26, '#bcd7e3')
  for (let k = 0; k < 14; k++) P(x, 22 + k, 44 - k, '#eef8fc')
  for (let k = 0; k < 8; k++) P(x, 24 + k, 52 - k, '#eef8fc')
  for (let k = 0; k < 10; k++) P(x, 66 + k * 0.6, 60 - k, '#eef8fc')
  const bulbs = [[48, 4], [28, 9], [68, 9], [16, 20], [80, 20], [12, 38], [84, 38], [12, 56], [84, 56], [12, 74], [84, 74], [12, 92], [84, 92]]
  for (const [bx, by] of bulbs) {
    E(x, bx, by, 3, 3, BULB)
    P(x, bx - 1, by - 1, '#ffffff')
  }
}

function front(x) {
  // the counter under the mirror, with a spray bottle, a comb, scissors and a jar
  R(x, 0, 96, 98, 4, WOOD)
  R(x, 1, 100, 96, 16, '#8a6448')
  R(x, 5, 103, 40, 10, WOOD_DARK)
  R(x, 53, 103, 40, 10, WOOD_DARK)
  R(x, 23, 107, 4, 2, '#d8b48a')
  R(x, 71, 107, 4, 2, '#d8b48a')
  R(x, 6, 84, 6, 12, '#e27aa0')
  R(x, 7, 80, 4, 4, CREAM)
  R(x, 11, 81, 4, 2, CREAM)
  R(x, 18, 93, 14, 2, '#3b3440')
  for (let k = 0; k < 6; k++) P(x, 19 + k * 2, 95, '#3b3440')
  E(x, 82, 92, 3, 3, CHROME)
  E(x, 82, 92, 1, 1, '#8a6448')
  R(x, 84, 92, 8, 1, CHROME)
  R(x, 86, 86, 8, 10, '#8fb8d9')
  R(x, 86, 85, 8, 2, '#5a6070')
  // the barber chair in front of the mirror, seen from behind
  R(x, 40, 70, 16, 9, SEAT)
  R(x, 42, 79, 12, 3, STEEL)
  R(x, 32, 82, 32, 32, SEAT)
  R(x, 60, 82, 4, 32, SEAT_DARK)
  for (let ty = 88; ty < 112; ty += 7) for (const tx of [38, 46, 54]) P(x, tx, ty, SEAT_DARK)
  R(x, 26, 100, 8, 4, CHROME)
  R(x, 62, 100, 8, 4, CHROME)
  R(x, 28, 113, 40, 6, SEAT_DARK)
  R(x, 45, 119, 6, 20, STEEL)
  R(x, 47, 119, 2, 20, CHROME)
  E(x, 48, 140, 18, 4, '#5a5a68')
  R(x, 36, 128, 24, 3, CHROME)
}

// the reader's shadow on the floor
function shadow(x) {
  x.fillStyle = 'rgba(30, 26, 36, 0.28)'
  x.beginPath()
  x.ellipse(FEET.x, FEET.y + 1, 22, 4, 0, 0, Math.PI * 2)
  x.fill()
}

// Draws onto a canvas of the given size; outlined steps get the map's dark edge.
function picture(w, h, ...steps) {
  const [c, x] = mk(w, h)
  for (const step of steps) {
    if (step.outlined) {
      const [part, px] = mk(w, h)
      step.draw(px)
      x.drawImage(outline(part, INK), -1, -1)
    } else {
      step.draw(x)
    }
  }
  return c.toDataURL('image/png')
}

export function drawSalon() {
  return {
    backdrop: picture(ROOM_W, ROOM_H, { draw: room }, { draw: roomThings, outlined: true }, { draw: lights }),
    mirror: picture(STATION_W, STATION_H, { draw: mirror, outlined: true }),
    front: picture(STATION_W, STATION_H, { draw: shadow }, { draw: front, outlined: true }),
  }
}
