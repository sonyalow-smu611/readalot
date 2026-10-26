// Scaffolded with AI assistance — see AI_USAGE.md
// An open book in the town map's pixel style, as a sprite sheet: one page lifts and turns over
// across the frames. Show it with a steps() animation on background-position.
import { R, fillPoly, mk, outline } from '@/lib/avatar/draw.js'

const W = 50
const H = 32
export const BOOK_FRAMES = 10

const PAGE = '#fdf7ec'
const LINE = '#cfc4b4'

function openBook(x) {
  // the cover behind the pages, and its edge
  R(x, 1, 4, 48, 25, '#2f5fb3')
  R(x, 1, 26, 48, 3, '#244a8c')
  // the two pages, and the shadow in the spine
  R(x, 3, 3, 21, 23, PAGE)
  R(x, 26, 3, 21, 23, PAGE)
  R(x, 24, 2, 2, 25, '#d9cfc4')
  for (let y = 7; y < 23; y += 3) {
    R(x, 6, y, y === 16 ? 9 : 15, 1, LINE)
    R(x, 29, y, y === 13 ? 10 : 15, 1, LINE)
  }
  // a ribbon bookmark
  R(x, 40, 26, 2, 5, '#c0392f')
}

// the page turning over: flat on the right, standing up, then flat on the left
function turningPage(x, t) {
  const angle = t * Math.PI
  const tip = Math.round(25 + Math.cos(angle) * 21)
  const lift = Math.round(Math.sin(angle) * 5)
  const left = Math.min(25, tip)
  const right = Math.max(25, tip)
  if (right - left < 1) {
    R(x, 24, 3 - lift, 2, 23, '#efe6da')
    return
  }
  fillPoly(x, [[left, tip < 25 ? 3 - lift : 3], [right, tip < 25 ? 3 : 3 - lift], [right, 26], [left, 26]], t < 0.5 ? '#ffffff' : '#f4ede2')
  R(x, tip < 25 ? left + 2 : left + 3, 9, Math.max(1, right - left - 5), 1, LINE)
  R(x, tip < 25 ? left + 2 : left + 3, 13, Math.max(1, right - left - 7), 1, LINE)
}

export function drawPixelBook() {
  const frameW = W + 2
  const frameH = H + 2
  const [sheet, sx] = mk(frameW * BOOK_FRAMES, frameH)
  for (let f = 0; f < BOOK_FRAMES; f++) {
    const [c, x] = mk(W, H)
    openBook(x)
    // the first and last frames rest; the page turns in between
    if (f > 0 && f < BOOK_FRAMES - 1) turningPage(x, f / (BOOK_FRAMES - 1))
    sx.drawImage(outline(c), f * frameW, 0)
  }
  return { src: sheet.toDataURL('image/png'), frameW, frameH }
}
