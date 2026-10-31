// AI-assisted cafe art scaffold; record the team's reviewed changes in AI_USAGE.md.
// Same low-resolution pixel drawing primitives as the town and hair salon.
// Images are generated locally; there are no external art assets or API calls.
import { E, P, R, mk } from '@/lib/avatar/draw.js'

export const CAFE_W = 360
export const CAFE_H = 500

const C = {
  ink: '#302529', inkLight: '#574038', cream: '#fff3d8', plaster: '#eed6b7',
  wall: '#ddbc94', wood: '#b37b4c', woodLight: '#d6a16d', woodDark: '#765037',
  emerald: '#39735e', emeraldDark: '#265643', leaf: '#6b9e57', gold: '#ffdf8a',
  floor: '#c99a6c', cafePink: '#d78f80', glass: '#a5c9c0',
}

function frame(x, px, py, w, h, face, edge = C.ink) {
  R(x, px - 2, py - 2, w + 4, h + 4, edge)
  R(x, px, py, w, h, face)
}

function plant(x, px, py, scale = 1) {
  const s = scale
  E(x, px, py + 8 * s, 10 * s, 3 * s, '#8d674c')
  frame(x, px - 6 * s, py, 12 * s, 10 * s, '#b96e50', C.inkLight)
  R(x, px - 3 * s, py + 2 * s, 6 * s, 2 * s, '#e7a077')
  R(x, px, py - 17 * s, 2 * s, 17 * s, C.emeraldDark)
  for (const [dx, dy, rx, ry] of [[-6, -14, 7, 5], [8, -15, 8, 5], [-1, -23, 7, 7], [-10, -25, 6, 5]]) {
    E(x, px + dx * s, py + dy * s, rx * s, ry * s, C.emeraldDark)
    E(x, px + (dx - 1) * s, py + (dy - 2) * s, (rx - 2) * s, (ry - 2) * s, C.leaf)
  }
}

function shelf(x, px, py, w, h) {
  frame(x, px, py, w, h, C.woodDark)
  R(x, px + 4, py + 4, w - 8, h - 7, '#624633')
  for (let row = 0; row < 3; row++) {
    const yy = py + 4 + row * (h - 7) / 3
    const colors = ['#d47767', '#7a9a8e', '#e8c680', '#8e83a8', '#74a775', '#d28e63']
    let bx = px + 6
    for (let col = 0; col < Math.floor((w - 12) / 9); col++) {
      const height = 10 + ((row * 7 + col * 3) % 5)
      const color = colors[(col + row) % colors.length]
      R(x, bx, yy + 16 - height, 6, height, C.ink)
      R(x, bx + 1, yy + 17 - height, 4, height - 2, color)
      P(x, bx + 2, yy + 15, C.cream)
      bx += 9
    }
    R(x, px + 3, yy + 17, w - 6, 3, C.woodLight)
  }
}

function window(x, px, py, w, h) {
  frame(x, px, py, w, h, '#fdf3dc', '#5f4b3d')
  R(x, px + 4, py + 4, w - 8, h - 8, '#93c5cb')
  R(x, px + 5, py + h - 21, w - 10, 16, '#9ac77d')
  for (let i = 0; i < 7; i++) {
    R(x, px + 7 + i * 8, py + h - 21 - (i % 3) * 2, 3, 18 + (i % 3) * 2, '#5e9868')
  }
  R(x, px + Math.floor(w / 2) - 2, py + 2, 4, h - 4, C.cream)
  R(x, px + 2, py + Math.floor(h / 2) - 2, w - 4, 4, C.cream)
  R(x, px + 7, py + 8, 4, 24, '#e7f6ef')
  R(x, px + 12, py + 8, 2, 17, '#e7f6ef')
}

function lamp(x, px, py) {
  R(x, px, py, 2, 17, C.inkLight)
  E(x, px + 1, py + 17, 12, 6, C.ink)
  E(x, px + 1, py + 16, 10, 4, C.emerald)
  R(x, px - 8, py + 20, 18, 2, C.gold)
  for (const i of [-8, -4, 4, 8]) P(x, px + i, py + 23, '#fff0b7')
}

function pastry(x, cx, cy) {
  E(x, cx, cy + 1, 9, 3, '#f6e5c5')
  E(x, cx, cy, 7, 3, '#bd773b')
  E(x, cx - 2, cy - 1, 4, 2, '#eab468')
  P(x, cx + 3, cy - 1, C.cream)
}

function cup(x, cx, cy, { cold = false } = {}) {
  if (cold) {
    frame(x, cx - 5, cy - 6, 10, 14, '#a6bd9c', '#59483e')
    R(x, cx - 2, cy - 11, 2, 5, '#f2d2bf')
    R(x, cx + 1, cy - 13, 2, 7, '#fff1d0')
  } else {
    E(x, cx, cy + 3, 9, 3, C.inkLight)
    E(x, cx, cy + 2, 7, 3, '#fff5d9')
    R(x, cx - 6, cy - 6, 12, 9, C.inkLight)
    R(x, cx - 5, cy - 5, 10, 8, '#fff9e9')
    E(x, cx, cy - 5, 5, 2, '#8f5739')
    R(x, cx + 6, cy - 4, 4, 2, C.inkLight)
    R(x, cx + 7, cy - 3, 3, 4, '#fff9e9')
  }
}

function book(x, px, py, color, w = 15) {
  R(x, px - 1, py - 1, w + 2, 12, C.ink)
  R(x, px, py, w, 10, color)
  R(x, px + 2, py + 3, w - 4, 1, C.cream)
  R(x, px + 2, py + 6, w - 5, 1, C.cream)
  R(x, px + w - 3, py, 2, 10, '#fff1d5')
}

function drawFloor(x) {
  R(x, 0, 0, CAFE_W, CAFE_H, C.ink)
  R(x, 4, 4, CAFE_W - 8, 124, C.plaster)
  for (let yy = 7; yy < 120; yy += 12) {
    R(x, 4, yy, 352, 1, '#e0bd96')
    for (let xx = 4 + ((yy / 12) % 2 ? 0 : 14); xx < 354; xx += 28) R(x, xx, yy + 1, 1, 11, '#e3c7a5')
  }
  R(x, 4, 124, 352, 5, C.woodDark)
  R(x, 4, 130, 352, 366, C.floor)
  for (let yy = 130; yy < 497; yy += 15) {
    R(x, 5, yy, 350, 1, '#a8754d')
    for (let xx = 5 + ((Math.floor(yy / 15) % 2) * 22); xx < 353; xx += 45) {
      R(x, xx, yy + 1, 1, 13, '#b47e58')
      P(x, xx + 3, yy + 4, '#d6a77a')
    }
  }
  R(x, 4, 492, 352, 4, C.woodDark)
  R(x, 0, 0, 4, CAFE_H, C.ink)
  R(x, 356, 0, 4, CAFE_H, C.ink)
}

function drawWall(x) {
  window(x, 13, 23, 77, 77)
  shelf(x, 105, 15, 82, 101)
  // wall display and coffee area
  frame(x, 243, 13, 105, 45, '#3b5b46')
  R(x, 249, 20, 92, 2, '#d8c69c')
  x.font = 'bold 10px monospace'
  x.fillStyle = C.cream
  x.textAlign = 'center'
  x.fillText('BREW & BOOKS', 295, 36)
  x.font = '7px monospace'
  x.fillText('coffee  +  stories', 295, 47)
  // coffee machine / behind bar
  frame(x, 212, 69, 57, 48, '#6a6c65')
  R(x, 218, 75, 45, 20, '#b8c2b8')
  R(x, 224, 79, 33, 10, '#39363a')
  R(x, 224, 90, 4, 18, C.inkLight)
  R(x, 251, 90, 4, 18, C.inkLight)
  E(x, 238, 105, 14, 4, '#d9e4d8')
  R(x, 277, 84, 8, 20, '#efdeb5')
  R(x, 291, 80, 8, 24, '#efdeb5')
  R(x, 305, 89, 8, 15, '#efdeb5')
  // wooden counter front / pastry display
  frame(x, 196, 113, 154, 27, C.woodDark)
  R(x, 199, 114, 149, 4, C.woodLight)
  R(x, 205, 122, 77, 12, '#acd0c6')
  for (const px of [217, 239, 260]) pastry(x, px, 128)
  for (let i = 0; i < 3; i++) R(x, 286 + i * 20, 124, 13, 11, '#a27654')
  lamp(x, 218, 40)
  lamp(x, 311, 42)
  // framed wall print on left
  frame(x, 18, 108, 65, 12, C.wood)
  R(x, 22, 111, 57, 5, '#f7dba8')
  x.font = 'bold 6px monospace'
  x.fillStyle = '#544237'
  x.fillText('GOOD BOOKS HERE', 50, 116)
}

function booth(x, px, py, side) {
  // Upholstered booth back, cushions, legs and a little privacy divider
  E(x, px + 59, py + 56, 63, 8, '#735036')
  frame(x, px, py, 119, 68, C.emeraldDark)
  R(x, px + 4, py + 4, 111, 41, C.emerald)
  for (let xx = 13; xx < 112; xx += 24) R(x, px + xx, py + 6, 2, 38, '#275b48')
  R(x, px + 4, py + 47, 111, 17, '#4f8267')
  R(x, px + 12, py + 52, 94, 5, '#659978')
  R(x, px + 8, py + 66, 11, 6, C.woodDark)
  R(x, px + 99, py + 66, 11, 6, C.woodDark)
  R(x, side === 'left' ? px + 111 : px, py, 7, 64, C.woodDark)
}

function drawSeating(x) {
  // Throws / rugs and furniture bodies are behind the characters.
  E(x, 92, 343, 75, 67, '#ad785b')
  E(x, 92, 340, 70, 63, '#d4a27a')
  E(x, 268, 344, 77, 65, '#7f9a76')
  E(x, 268, 341, 71, 60, '#9fc1a0')
  for (const [cx, cy] of [[92, 341], [268, 341]]) {
    E(x, cx, cy + 22, 58, 16, '#896142')
    R(x, cx - 40, cy - 40, 27, 36, '#69503d')
    R(x, cx + 21, cy - 40, 27, 36, '#69503d')
    R(x, cx - 38, cy - 38, 23, 32, '#d5aa79')
    R(x, cx + 23, cy - 38, 23, 32, '#d5aa79')
  }
  booth(x, 12, 154, 'left')
  booth(x, 229, 154, 'right')
  plant(x, 170, 170, 1)
  plant(x, 190, 425, 1)
  plant(x, 17, 294, 1)
  plant(x, 344, 295, 1)
  // A second wooden rack at the bottom behind the walking area
  shelf(x, 8, 425, 62, 50)
  shelf(x, 289, 425, 62, 50)
  // a welcome mat by the door
  frame(x, 136, 472, 88, 19, '#6b855c')
  R(x, 143, 477, 74, 1, '#d3c99d')
  x.font = 'bold 7px monospace'
  x.fillStyle = '#fff5d8'
  x.fillText('WELCOME', 180, 485)
}

function table(x, cx, cy, width = 50) {
  E(x, cx + 1, cy + 7, width + 5, 16, '#70492e')
  E(x, cx, cy + 3, width + 3, 18, C.ink)
  E(x, cx, cy, width, 15, '#a16e45')
  E(x, cx - 1, cy - 3, width - 4, 13, '#cd9762')
  E(x, cx - 8, cy - 8, width - 23, 3, '#e2b17e')
}

function drawTables(x) {
  table(x, 85, 237, 49)
  table(x, 274, 237, 49)
  table(x, 94, 370, 52)
  table(x, 264, 370, 52)
  cup(x, 119, 232)
  cup(x, 241, 233)
  cup(x, 60, 369, { cold: true })
  cup(x, 294, 365)
  pastry(x, 76, 231)
  pastry(x, 276, 235)
  book(x, 107, 363, '#8c735a')
  book(x, 242, 364, '#55847d')
  book(x, 263, 355, '#c96661', 12)
}

function drawSparkles(x) {
  for (const [px, py] of [[141, 143], [188, 228], [194, 406], [150, 400], [80, 268], [297, 287]]) {
    P(x, px, py, '#f2d497')
    P(x, px + 2, py + 1, '#f7e5bb')
  }
}

export function drawCafeArt() {
  const [background, bx] = mk(CAFE_W, CAFE_H)
  drawFloor(bx)
  drawWall(bx)
  drawSeating(bx)
  drawSparkles(bx)

  // Foreground art hides the readers' lower bodies, making them look seated at tables.
  const [foreground, fx] = mk(CAFE_W, CAFE_H)
  drawTables(fx)

  return {
    backdrop: background.toDataURL('image/png'),
    foreground: foreground.toDataURL('image/png'),
  }
}