// Paints the room onto one canvas at art resolution (one canvas pixel per art pixel); the page
// stretches it by a whole number with hard edges. In order: the wall and floor, the window's
// glass left see-through (the view outside shows behind it), every piece by layer (wall pieces
// with their flat shadow, hanging pieces with their strings), the books and the clock's hands,
// then the light: the town's tint for the weather and time of day, and stepped glows round the
// lamps after dark.
import PALETTE from './palette.json'
import { LAYERS, LIGHTS, PIECES, ROOM, SPRITES, WALK, clockOf, glassOf } from './layout.js'
import { LIFT, drawSpine } from './books.js'
import { FURNITURE } from '../furniture.js'
import { THEMES } from '../themes.js'

// how far a piece's shadow falls on the wall, by layer
const SHADOW = { wall: [2, 2], hang: [2, 2], furniture: [3, 1] }
const SKIRTING = 8

const silhouettes = new Map()

// the sprite filled with one colour, for its shadow
function silhouette(image, colour) {
  const key = `${image.src}|${colour}`
  if (!silhouettes.has(key)) {
    const canvas = document.createElement('canvas')
    canvas.width = image.width
    canvas.height = image.height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(image, 0, 0)
    ctx.globalCompositeOperation = 'source-in'
    ctx.fillStyle = colour
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    silhouettes.set(key, canvas)
  }
  return silhouettes.get(key)
}

// a filled circle made of whole-pixel rows, like the town's E()
function disc(ctx, cx, cy, r) {
  for (let dy = -r; dy <= r; dy++) {
    const half = Math.floor(Math.sqrt(Math.max(0, r * r - dy * dy)))
    ctx.fillRect(Math.round(cx) - half, Math.round(cy) + dy, half * 2 + 1, 1)
  }
}

function rgba(hex, alpha) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

// a 1 px line from (x0, y0) to (x1, y1)
function line(ctx, x0, y0, x1, y1) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1)
  const dx = Math.abs(x1 - x0)
  const sx = x0 < x1 ? 1 : -1
  const dy = -Math.abs(y1 - y0)
  const sy = y0 < y1 ? 1 : -1
  let err = dx + dy
  for (;;) {
    ctx.fillRect(x0, y0, 1, 1)
    if (x0 === x1 && y0 === y1) break
    const e2 = 2 * err
    if (e2 >= dy) { err += dy; x0 += sx }
    if (e2 <= dx) { err += dx; y0 += sy }
  }
}

let scratch = null
function scratchCanvas(width, height) {
  scratch ??= document.createElement('canvas')
  if (scratch.width !== width || scratch.height !== height) {
    scratch.width = width
    scratch.height = height
  }
  const ctx = scratch.getContext('2d')
  ctx.globalCompositeOperation = 'source-over'
  ctx.clearRect(0, 0, width, height)
  return ctx
}

// Lays `fill` over the room only where the room is drawn (never over the see-through glass),
// blended with `mode`.
function overRoom(ctx, mode, fill) {
  const { width, height } = ctx.canvas
  const layer = scratchCanvas(width, height)
  fill(layer)
  layer.globalCompositeOperation = 'destination-in'
  layer.drawImage(ctx.canvas, 0, 0)
  ctx.globalCompositeOperation = mode
  ctx.drawImage(layer.canvas, 0, 0)
  ctx.globalCompositeOperation = 'source-over'
}

// The tint for the weather, like the town's sky (town/sky.js): clear by day, grey in rain, blue
// at night.
export function tintFor({ scene, night }) {
  if (night) return scene === 'rain' ? PALETTE.tints.rainyNight : PALETTE.tints.night
  if (scene === 'rain') return PALETTE.tints.rain
  if (scene === 'cloudy') return PALETTE.tints.cloudy
  return PALETTE.tints.clear
}

// state: { images (sprite id -> loaded Image), offset (rows of extra wall above the room),
//          weather, spines, lifted (book id), out (book id taken off the shelf), time,
//          extras (furniture the reader has put in the room, as pieces: { sprite, x, y, layer },
//          and `replaces`: the id of a piece of the room's it stands in for, drawn in its place),
//          notes (how many visitors' notes to pin on the corkboard, three at most),
//          theme (the house's look, from themes.js: its wall and floor colours),
//          lamps (each lamp on or off: { 'floor-lamp': true, … }) }
export function paintRoom(ctx, state) {
  const { images, offset, weather, spines, lifted, out, time, extras = [], notes = 0, theme = PALETTE, lamps = {} } = state
  const instead = new Map(extras.filter((piece) => piece.replaces).map((piece) => [piece.replaces, piece]))
  const pieces = [
    ...PIECES.filter((piece) => !instead.has(piece.with)).map((piece) => instead.get(piece.id) ?? piece),
    ...extras.filter((piece) => !piece.replaces),
  ]
  const { width, height } = ctx.canvas
  const night = Boolean(weather.night)
  const floorY = offset + ROOM.floor
  ctx.globalCompositeOperation = 'source-over'
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, width, height)

  // wall, with the ceiling's edge along the top and the corners in shade
  ctx.fillStyle = theme.wall
  ctx.fillRect(0, 0, width, floorY)
  ctx.fillStyle = theme.ceiling
  ctx.fillRect(0, 0, width, 4)
  ctx.fillStyle = theme.wallDeep
  ctx.fillRect(0, 4, width, 1)
  ctx.fillStyle = theme.wallShade
  ctx.fillRect(0, 5, width, 1)
  ctx.fillRect(0, 0, 4, floorY)
  ctx.fillRect(width - 4, 0, 4, floorY)
  // skirting board
  ctx.fillStyle = theme.skirting
  ctx.fillRect(0, floorY - SKIRTING, width, SKIRTING)
  ctx.fillStyle = theme.skirtingShade
  ctx.fillRect(0, floorY - SKIRTING, width, 1)
  ctx.fillRect(0, floorY - 1, width, 1)
  // floor band, with a lighter front edge and board seams
  ctx.fillStyle = theme.floor
  ctx.fillRect(0, floorY, width, height - floorY)
  ctx.fillStyle = theme.floorShade
  ctx.fillRect(0, floorY, width, 2)
  ctx.fillStyle = theme.floorLine
  for (let x = 30, k = 0; x < width; x += 64, k++) ctx.fillRect(x + (k % 2) * 20, floorY + 4, 1, height - floorY - 4)
  ctx.fillStyle = theme.floorLight
  ctx.fillRect(0, floorY + 9, width, 1)

  // the glass, see-through: the view outside is behind the canvas
  const glass = glassOf()
  ctx.clearRect(glass.x, offset + glass.y, glass.w, glass.h)

  for (const layer of LAYERS) {
    for (const piece of pieces) {
      if (piece.layer !== layer) continue
      // the house's own version of the piece (its curtains, bedding, lamps, rug), if it has one
      // a lamp shows its lit shade while it's on, day or night
      const on = piece.lit && (lamps[piece.id] ?? night)
      const own = on ? piece.lit : piece.sprite
      const image = images[theme.sprites?.[own] ?? own]
      if (!image) continue
      const x = piece.x
      const y = offset + piece.y - image.height
      const shadow = SHADOW[layer]
      if (shadow) {
        // shadows fall on the wall only: never on the floor, nor on the window's glass
        ctx.save()
        ctx.beginPath()
        ctx.rect(0, 0, width, floorY - SKIRTING)
        ctx.rect(glass.x, offset + glass.y, glass.w, glass.h)
        ctx.clip('evenodd')
        ctx.drawImage(silhouette(image, theme.wallShade), x + shadow[0], y + shadow[1])
        ctx.restore()
      }
      if (layer === 'hang') {
        ctx.fillStyle = PALETTE.string
        ctx.fillRect(x + Math.floor(image.width / 2), 0, 1, y + 1)
      }
      ctx.drawImage(image, x, y)
      if (piece.id === 'bookshelf') paintBooks(ctx, spines, offset, lifted, out)
      if (piece.id === 'clock') paintHands(ctx, offset, time)
      if (piece.id === 'corkboard') paintNotes(ctx, x, y, notes)
    }
  }

  // The light: the tint for the weather multiplied over the room. After dark each lamp lights
  // its corner: round it the tint steps from night blue to lamplight, ring by ring, so the room
  // is lit by its lamps (and cool light from the window) rather than washed over with a glow.
  const tint = tintFor(weather)
  if (tint !== PALETTE.tints.clear) {
    overRoom(ctx, 'multiply', (layer) => {
      layer.fillStyle = tint
      layer.fillRect(0, 0, width, height)
      if (!night) return
      // the window's cool light first, so the lamps' warm pools sit over it
      for (const light of LIGHTS) {
        // a lamp that's switched off lights nothing
        if (lamps[light.lamp] === false) continue
        const colour = light.kind === 'window' ? PALETTE.windowSpill : light.kind === 'bulb' ? PALETTE.bulbGlow : PALETTE.lampGlow
        const steps = light.kind === 'bulb' ? 1 : RINGS
        for (let step = 1; step <= steps; step++) {
          layer.fillStyle = mix(tint, colour, step / steps)
          disc(layer, light.x, offset + light.y, Math.round((light.radius * (steps + 1 - step)) / steps))
        }
      }
    })
  }
  if (night) {
    // a little bloom on the lamps' shades and the fairy lights themselves
    overRoom(ctx, 'screen', (layer) => {
      for (const light of LIGHTS) {
        if (light.kind === 'window' || lamps[light.lamp] === false) continue
        layer.fillStyle = rgba(PALETTE.bulbGlow, light.kind === 'bulb' ? 0.45 : 0.3)
        disc(layer, light.x, offset + light.y, light.kind === 'bulb' ? 3 : 12)
      }
    })
  }
}

// The cats, on their own canvas over the room (they move every frame; the room doesn't): each
// one's frame from its sheet, standing on the walk line, flipped to face left when it walks
// left, then the weather's tint over them, so they're lit like the room.
// state: { images, offset, weather, cats: [{ sprite, frame (its name), x (art x of its middle), face }] }
export function paintCats(ctx, { images, offset, weather, cats }) {
  const { width, height } = ctx.canvas
  ctx.globalCompositeOperation = 'source-over'
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, width, height)
  for (const cat of cats) {
    const image = images[cat.sprite]
    const meta = SPRITES[cat.sprite]
    if (!image || !meta?.cell) continue
    const { w, h } = meta.cell
    const sx = Math.max(0, meta.frames.indexOf(cat.frame)) * w
    const x = Math.round(cat.x - w / 2)
    const y = offset + WALK.y - h + 1
    ctx.save()
    if (cat.face === 'left') {
      ctx.translate(x + w, y)
      ctx.scale(-1, 1)
    } else ctx.translate(x, y)
    ctx.drawImage(image, sx, 0, w, h, 0, 0, w, h)
    ctx.restore()
  }
  const tint = tintFor(weather)
  if (cats.length && tint !== PALETTE.tints.clear) {
    overRoom(ctx, 'multiply', (layer) => {
      layer.fillStyle = tint
      layer.fillRect(0, 0, width, height)
    })
  }
}

// rings of light round a lamp, from the edge of its pool to its middle
const RINGS = 4

// the colour `amount` of the way from `from` to `to`
function mix(from, to, amount) {
  const a = parseInt(from.slice(1), 16)
  const b = parseInt(to.slice(1), 16)
  const channel = (shift) => Math.round(((a >> shift) & 255) + ((((b >> shift) & 255) - ((a >> shift) & 255)) * amount))
  return `rgb(${channel(16)}, ${channel(8)}, ${channel(0)})`
}

function paintBooks(ctx, spines, offset, lifted, out) {
  for (const spine of spines) {
    if (spine.book.id === out) continue
    drawSpine(ctx, { ...spine, y: offset + spine.y }, spine.book.id === lifted ? -LIFT : 0)
  }
}

// Visitors' notes, pinned on the corkboard over what's already there: a small paper note each,
// with its shadow on the cork, two lines of writing and a pin. `x`, `y` are the corkboard's top
// left; the newest note goes up first.
const NOTE_SPOTS = [
  { x: 26, y: 27, paper: '#fbe7a1', edge: '#e2c46f', pin: '#c8553d' },
  { x: 56, y: 52, paper: '#f6d3cb', edge: '#dfaea3', pin: '#3f7fa8' },
  { x: 86, y: 30, paper: '#fdf7ec', edge: '#e2d7c3', pin: '#3d9a8b' },
]
const NOTE = { w: 16, h: 14 }

function paintNotes(ctx, x, y, count) {
  for (const spot of NOTE_SPOTS.slice(0, Math.min(count, NOTE_SPOTS.length))) {
    const nx = x + spot.x
    const ny = y + spot.y
    ctx.fillStyle = '#a9824f'
    ctx.fillRect(nx + 1, ny + 1, NOTE.w, NOTE.h)
    ctx.fillStyle = spot.paper
    ctx.fillRect(nx, ny, NOTE.w, NOTE.h)
    ctx.fillStyle = spot.edge
    ctx.fillRect(nx, ny + NOTE.h - 1, NOTE.w, 1)
    ctx.fillRect(nx + NOTE.w - 1, ny, 1, NOTE.h)
    ctx.fillStyle = '#9a958c'
    ctx.fillRect(nx + 3, ny + 5, NOTE.w - 6, 1)
    ctx.fillRect(nx + 3, ny + 8, NOTE.w - 9, 1)
    ctx.fillStyle = spot.pin
    ctx.fillRect(nx + 7, ny - 1, 2, 2)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(nx + 7, ny - 1, 1, 1)
  }
}

// the clock's hands, from its middle, for the time { hours, minutes }
function paintHands(ctx, offset, time) {
  if (!time) return
  const { x, y, hands } = clockOf()
  const cy = offset + y
  const minute = (time.minutes / 60) * Math.PI * 2
  const hour = (((time.hours % 12) + time.minutes / 60) / 12) * Math.PI * 2
  ctx.fillStyle = PALETTE.brownDeep
  line(ctx, x, cy, x + Math.sin(minute) * hands.minute, cy - Math.cos(minute) * hands.minute)
  line(ctx, x, cy, x + Math.sin(hour) * hands.hour, cy - Math.cos(hour) * hands.hour)
  ctx.fillStyle = PALETTE.red
  ctx.fillRect(x, cy, 1, 1)
}

// every sprite the room can show, for loading before it does: its own pieces, the themes' versions
// of them and the furniture library's
export function spriteIds() {
  const own = PIECES.flatMap((piece) => [piece.sprite, piece.lit].filter(Boolean))
  const themed = Object.values(THEMES).flatMap((theme) => Object.values(theme.sprites))
  const bought = FURNITURE.flatMap((item) => [item.sprite, ...Object.values(item.swaps ?? {})])
  return [...new Set([...own, ...themed, ...bought])]
}

export { ROOM, SPRITES }
