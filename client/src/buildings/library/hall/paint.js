// Scaffolded with AI assistance — see AI_USAGE.md
// Paints the library hall onto one canvas at art resolution (one canvas pixel per art pixel);
// the page stretches it by a whole number with hard edges. In order: the wall, its panelling and
// the floor, every piece by layer (furniture with a shadow on the wall, hanging lamps with their
// strings), then the light: by day warm pools round the lamps, and over it all the tint for the
// live weather, as in My Room. After dark the lamps light the hall instead, ring by ring.
//
// `weather` is { scene: 'sunny' | 'cloudy' | 'rain', night }; the windows show that sky.
// `off` is the ids of the lamps the reader has turned off: they go dark and give no light.
// `offset` is how many rows of extra wall stand above the hall as designed, so a piece at art y
// is drawn at canvas y `offset + y`. The canvas is as tall as the screen needs; any rows below
// the hall are more floor.
import { FEET, HALL, LAYERS, LIGHTS, PIECES, WAINSCOT } from './layout.js'
import { PAL as C } from './palette.js'
import { E, R, panel, shade } from './pixel.js'
import { getSprite } from './sprites.js'

const SHADOW = 'rgba(59, 42, 26, 0.16)'

export function paintHall(ctx, { offset, weather = { scene: 'sunny', night: false }, off = [] }) {
  const { width, height: rows } = ctx.canvas
  ctx.imageSmoothingEnabled = false
  paintWall(ctx, width, offset)
  paintFloor(ctx, width, rows, offset)
  for (const layer of LAYERS) {
    for (const piece of PIECES) if (piece.layer === layer) paintPiece(ctx, spriteFor(piece, weather, off), piece, offset)
  }
  const lit = LIGHTS.filter((light) => !off.includes(light.lamp))
  if (!weather.night) paintLights(ctx, offset, lit)
  paintWeather(ctx, offset, weather, lit)
}

// the sprite a piece is drawn with: windows show the sky, a lamp turned off is dark
function spriteFor(piece, weather, off) {
  if (isWindow(piece)) return `${piece.sprite}@${skyOf(weather)}`
  if (piece.lamp && off.includes(piece.lamp)) return `${piece.sprite}@off`
  return piece.sprite
}

// The look of the sky through the windows, as a sprite's `@look`: e.g. `rain`, `sunny-night`.
export function skyOf({ scene, night }) {
  const kind = ['sunny', 'cloudy', 'rain'].includes(scene) ? scene : 'cloudy'
  return night ? `${kind}-night` : kind
}

function paintWall(ctx, width, offset) {
  R(ctx, 0, 0, width, offset + HALL.floor, C.wall)
  // faint stripes in the wallpaper
  for (let x = 6; x < width; x += 12) R(ctx, x, 0, 2, offset + WAINSCOT, C.wallShade)
  // a picture rail a little below the ceiling
  R(ctx, 0, offset + 28, width, 2, C.wallDeep)
  // the crown moulding along the ceiling, at the very top however tall the screen is
  R(ctx, 0, 0, width, 6, C.crown)
  R(ctx, 0, 6, width, 1, shade(C.crown, 1.25))
  R(ctx, 0, 7, width, 2, C.wallDeep)
  // wood panelling below the chair rail, in boxes 40 px wide
  const top = offset + WAINSCOT
  const bottom = offset + HALL.floor
  R(ctx, 0, top, width, bottom - top, C.panel)
  for (let x = 4; x < width; x += 40) panel(ctx, x, top + 8, 32, bottom - top - 18, C.panelDark, 0.9, 1.15)
  panel(ctx, 0, top - 3, width, 4, C.panelLight, 1.12, 0.8)
  // the skirting board
  R(ctx, 0, bottom - 5, width, 5, C.woodDeep)
}

function paintFloor(ctx, width, rows, offset) {
  const top = offset + HALL.floor
  R(ctx, 0, top, width, rows - top, C.floor)
  R(ctx, 0, top, width, 1, C.floorLight)
  // planks: a line every 6 rows, their joints staggered
  for (let y = top + 6, row = 0; y < rows; y += 6, row++) {
    R(ctx, 0, y, width, 1, C.floorLine)
    for (let x = (row % 2) * 30; x < width; x += 60) R(ctx, x, y - 5, 1, 5, C.floorLine)
  }
  // a long red runner down the hall, with a gold edge
  const rug = offset + FEET + 6
  R(ctx, 30, rug, width - 60, 6, C.rug)
  R(ctx, 30, rug, width - 60, 1, C.rugGold)
  R(ctx, 30, rug + 5, width - 60, 1, C.rugShade)
  for (let x = 36; x < width - 36; x += 8) R(ctx, x, rug + 3, 2, 1, C.rugGold)
}

function paintPiece(ctx, name, piece, offset) {
  const image = getSprite(name)
  if (!image) return
  // the sprite carries a 1 px outline on every side
  const left = piece.x - 1
  const top = offset + piece.y - (image.height - 2) - 1
  if (piece.layer === 'furniture') {
    // a soft shadow on the wall behind, down to the floor
    const bottom = Math.min(top + image.height, offset + HALL.floor)
    R(ctx, left + 4, top + 3, image.width, Math.max(0, bottom - top - 3), SHADOW)
  }
  if (piece.layer === 'hang') {
    // the lamp's string, up to the top of the canvas
    const mid = left + Math.floor(image.width / 2)
    R(ctx, mid, 0, 1, top + 1, C.woodDeep)
  }
  ctx.drawImage(image, left, top)
}

// Stepped circles of warm light, the way the town and My Room light their lamps.
function paintLights(ctx, offset, lights) {
  ctx.save()
  ctx.globalAlpha = 0.07
  for (const light of lights) {
    for (const step of [1, 0.7, 0.4]) {
      const r = Math.round(light.r * step)
      E(ctx, light.x, offset + light.y, r, r, C.glow)
    }
  }
  ctx.restore()
}

const isWindow = (piece) => piece.sprite.startsWith('window')

// The tint for the weather, like My Room's (buildings/house/strip/paint.js) and the town's sky.
function tintFor({ scene, night }) {
  if (night) return scene === 'rain' ? C.tints.rainyNight : C.tints.night
  if (scene === 'rain') return C.tints.rain
  if (scene === 'cloudy') return C.tints.cloudy
  return C.tints.clear
}


// rings of light round a lamp, from the edge of its pool to its middle
const RINGS = 4

// The tint multiplied over the hall. After dark each window lets in a little cool light and each
// lamp lights its part of the hall: round it the tint steps from night blue to lamplight, ring
// by ring, then a soft bloom on the lamp itself.
function paintWeather(ctx, offset, weather, lit) {
  const tint = tintFor(weather)
  if (tint === C.tints.clear) return
  const { width, height } = ctx.canvas
  const layer = scratchCanvas(width, height)
  layer.fillStyle = tint
  layer.fillRect(0, 0, width, height)
  if (weather.night) {
    const pools = [
      ...PIECES.filter(isWindow).map((piece) => {
        const image = getSprite(`${piece.sprite}@${skyOf(weather)}`)
        return { x: piece.x + image.width / 2, y: piece.y - image.height / 2, r: image.width, colour: C.windowSpill }
      }),
      ...lit.map((light) => ({ ...light, colour: C.lampGlow })),
    ]
    for (const pool of pools) {
      for (let step = 1; step <= RINGS; step++) {
        const r = Math.round((pool.r * (RINGS + 1 - step)) / RINGS)
        E(layer, pool.x, offset + pool.y, r, r, mix(tint, pool.colour, step / RINGS))
      }
    }
  }
  ctx.globalCompositeOperation = 'multiply'
  ctx.drawImage(layer.canvas, 0, 0)
  ctx.globalCompositeOperation = 'source-over'

  if (weather.night) {
    ctx.save()
    ctx.globalAlpha = 0.3
    ctx.globalCompositeOperation = 'screen'
    for (const light of lit) E(ctx, light.x, offset + light.y, 10, 10, C.glow)
    ctx.restore()
  }
}

let scratch = null
function scratchCanvas(width, height) {
  scratch ??= document.createElement('canvas')
  if (scratch.width !== width || scratch.height !== height) {
    scratch.width = width
    scratch.height = height
  }
  return scratch.getContext('2d')
}

// the colour `amount` of the way from `from` to `to`
function mix(from, to, amount) {
  const a = parseInt(from.slice(1), 16)
  const b = parseInt(to.slice(1), 16)
  const channel = (shift) => Math.round(((a >> shift) & 255) + (((b >> shift) & 255) - ((a >> shift) & 255)) * amount)
  return `rgb(${channel(16)}, ${channel(8)}, ${channel(0)})`
}
