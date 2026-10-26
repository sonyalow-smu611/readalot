// Scaffolded with AI assistance — see AI_USAGE.md
// The inside of the Hair Salon in the town map's pixel style: drawn with the map's own pixel
// helpers and dark outline, in the salon building's colours (pale walls, pink trim, pink panes).
//   backdrop: the whole room (walls, window, shelves, dryers, floor), behind everything
//   station:  the reader's corner: a vanity mirror with the barber chair in front of it, and a
//             round podium for the reader to stand on
import { E, R, P, fillPoly, mk, outline } from '@/lib/avatar/draw.js'

export const ROOM_W = 320
export const ROOM_H = 180
export const STATION_W = 128
export const STATION_H = 120

// The podium's middle, and the box the reader's 3D model is drawn in (feet on the podium).
export const PODIUM = { x: 90, y: 104 }
export const MODEL_BOX = { x: 58, y: 0, width: 64, height: 108 }

const PINK = '#c77fa6'
const PINK_DARK = '#a8648a'
const PANE = '#f4c3d8'
const CREAM = '#fdf7ec'
const SEAT = '#d0608e'
const SEAT_DARK = '#a84874'
const CHROME = '#b9c9d3'
const STEEL = '#8a8f99'
const WOOD = '#a87e5a'

function room(x) {
  // striped wallpaper, a pink dado rail and panelling below
  for (let px = 0; px < ROOM_W; px += 16) {
    R(x, px, 0, 8, 100, '#f7eef2')
    R(x, px + 8, 0, 8, 100, '#f2ede4')
  }
  for (let px = 4; px < ROOM_W; px += 16) for (let py = 12; py < 96; py += 14) P(x, px, py + ((px / 16) % 2) * 7, '#e8bfd2')
  R(x, 0, 0, ROOM_W, 4, PINK)
  R(x, 0, 4, ROOM_W, 1, PINK_DARK)
  R(x, 0, 100, ROOM_W, 32, '#ecd3df')
  R(x, 0, 100, ROOM_W, 3, PINK)
  for (let px = 6; px < ROOM_W; px += 20) R(x, px, 107, 14, 19, '#e4c3d3')
  R(x, 0, 130, ROOM_W, 2, PINK_DARK)
  // black and white checked floor
  for (let ty = 0; ty * 8 + 132 < ROOM_H; ty++) {
    for (let tx = 0; tx * 10 < ROOM_W; tx++) {
      R(x, tx * 10, 132 + ty * 8, 10, 8, (tx + ty) % 2 ? '#3a3a48' : '#efe6da')
    }
  }
  R(x, 0, 132, ROOM_W, 1, '#d9cfc4')
}

function roomThings(x) {
  // an arched window onto the town's grass, with pink panes and a flower box
  R(x, 12, 26, 38, 56, CREAM)
  E(x, 31, 26, 19, 12, CREAM)
  R(x, 16, 28, 14, 24, PANE)
  R(x, 32, 28, 14, 24, PANE)
  E(x, 31, 27, 15, 9, PANE)
  R(x, 30, 18, 2, 34, CREAM)
  R(x, 16, 54, 14, 24, '#9fdc7a')
  R(x, 32, 54, 14, 24, '#9fdc7a')
  R(x, 16, 54, 14, 6, PANE)
  R(x, 32, 54, 14, 6, PANE)
  R(x, 17, 30, 4, 1, '#fbe3ee')
  R(x, 9, 82, 44, 5, PINK)
  for (const fx of [12, 19, 26, 33, 40, 47]) {
    P(x, fx, 81, '#f2a0b8')
    P(x, fx + 1, 80, '#e27aa0')
    P(x, fx, 80, '#5aa045')
  }

  // lamps along the ceiling
  for (const lx of [40, 120, 200, 280]) {
    R(x, lx, 5, 1, 6, '#5a5a68')
    fillPoly(x, [[lx - 6, 16], [lx + 6, 16], [lx + 3, 11], [lx - 3, 11]], '#f6e27a')
    R(x, lx - 1, 16, 3, 1, '#fff1b8')
  }

  // shelves of bottles and towels
  for (const sy of [52, 78]) {
    R(x, 168, sy, 60, 3, WOOD)
    R(x, 170, sy + 3, 2, 4, '#7a5640')
    R(x, 224, sy + 3, 2, 4, '#7a5640')
  }
  const bottles = ['#e27aa0', '#8fb8d9', '#f0c23a', '#9cc79a', '#b9a0d9', '#e98aa8', '#c0502f', '#8fb8d9']
  bottles.forEach((col, i) => {
    const bx = 171 + i * 7
    const tall = 7 + (i % 3) * 2
    R(x, bx, 52 - tall, 5, tall, col)
    R(x, bx + 1, 52 - tall - 2, 3, 2, i % 2 ? CREAM : '#5a6070')
    P(x, bx + 1, 52 - tall + 2, '#ffffff')
  })
  for (const [tx, col] of [[172, '#f4c3d8'], [190, '#cfe3ec'], [208, '#fdf7ec']]) {
    for (let k = 0; k < 3; k++) {
      R(x, tx, 78 - 5 - k * 5, 16, 5, col)
      R(x, tx, 78 - 1 - k * 5, 16, 1, '#d9cfc4')
    }
  }

  // two hood dryers
  for (const dx of [254, 292]) {
    R(x, dx - 1, 70, 3, 58, STEEL)
    E(x, dx, 62, 14, 10, '#ecd3df')
    R(x, dx - 15, 64, 30, 3, PINK)
    R(x, dx - 9, 127, 18, 3, '#5a5a68')
    R(x, dx - 10, 98, 20, 8, '#b9a0d9')
    R(x, dx - 10, 98, 20, 2, '#cdb8e6')
  }

  // plants in the corners, like the town's bushes
  for (const [px, pot] of [[66, '#c0502f'], [226, '#2f5fb3']]) {
    R(x, px, 116, 16, 14, pot)
    R(x, px, 116, 16, 2, '#f6e27a')
    E(x, px + 8, 106, 11, 9, '#3f7d3a')
    E(x, px + 7, 104, 9, 7, '#5aa045')
    E(x, px + 5, 101, 3, 2, '#86c463')
  }
}

function mirrorAndChair(x) {
  // a vanity mirror in a pink frame, ringed with bulbs
  R(x, 4, 16, 49, 66, PINK)
  E(x, 28, 16, 24, 13, PINK)
  R(x, 8, 18, 41, 60, '#cfe3ec')
  E(x, 28, 18, 20, 10, '#cfe3ec')
  for (let k = 0; k < 10; k++) P(x, 12 + k, 30 - k, '#e9f5fa')
  for (let k = 0; k < 6; k++) P(x, 13 + k, 36 - k, '#e9f5fa')
  for (const [bx, by] of [[28, 3], [10, 12], [46, 12], [5, 30], [51, 30], [5, 46], [51, 46], [5, 62], [51, 62]]) {
    E(x, bx, by, 2, 2, '#f6e27a')
  }

  // the counter under it, with a bottle and a jar
  R(x, 0, 80, 58, 3, WOOD)
  R(x, 1, 83, 56, 12, '#8a6448')
  R(x, 4, 85, 23, 8, '#7a5640')
  R(x, 31, 85, 23, 8, '#7a5640')
  R(x, 4, 71, 5, 9, '#e27aa0')
  R(x, 5, 68, 3, 3, CREAM)
  R(x, 46, 74, 7, 6, '#8fb8d9')
  R(x, 46, 73, 7, 1, '#5a6070')

  // the barber chair in front of the mirror, seen from behind
  R(x, 21, 44, 14, 7, SEAT)
  R(x, 15, 50, 26, 34, SEAT)
  R(x, 38, 50, 3, 34, SEAT_DARK)
  for (let ty = 56; ty < 82; ty += 8) for (const tx of [21, 28, 35]) P(x, tx, ty, SEAT_DARK)
  R(x, 9, 74, 7, 3, CHROME)
  R(x, 40, 74, 7, 3, CHROME)
  R(x, 12, 84, 32, 5, SEAT_DARK)
  R(x, 25, 89, 6, 18, STEEL)
  R(x, 27, 89, 2, 18, CHROME)
  E(x, 28, 109, 15, 3, '#5a5a68')
}

// a round pink podium with a ring of lights, for the reader to stand on
function podium(x) {
  E(x, PODIUM.x, 112, 31, 6, PINK_DARK)
  R(x, PODIUM.x - 31, 104, 63, 8, PINK)
  for (let lx = PODIUM.x - 27; lx < PODIUM.x + 30; lx += 6) R(x, lx, 107, 2, 2, '#f6e27a')
  E(x, PODIUM.x, 104, 31, 7, '#f2a0b8')
  E(x, PODIUM.x, 104, 24, 5, '#f8c9da')
}

// Draws onto a canvas of the given size; outlined steps get the map's dark edge.
function picture(w, h, ...steps) {
  const [c, x] = mk(w, h)
  for (const step of steps) {
    if (step.outlined) {
      const [part, px] = mk(w, h)
      step.draw(px)
      x.drawImage(outline(part), -1, -1)
    } else {
      step.draw(x)
    }
  }
  return c.toDataURL('image/png')
}

export function drawSalon() {
  return {
    backdrop: picture(ROOM_W, ROOM_H, { draw: room }, { draw: roomThings, outlined: true }),
    station: picture(STATION_W, STATION_H, { draw: mirrorAndChair, outlined: true }, { draw: podium, outlined: true }),
  }
}
