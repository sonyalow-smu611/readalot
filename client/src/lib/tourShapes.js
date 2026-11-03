// Scaffolded with AI assistance — see AI_USAGE.md
// The shapes the walkthrough outlines (components/GuideTour.vue): the exact outline of the thing
// it points at, never a loose box around it.
//   a button, card or input: its own box, with its own rounded corners
//   a picture drawn in pixel art (a building, a bookcase, a clock): the picture's own shape,
//   traced from its pixels. An element opts in with data-tour-mask="…":
//     /path.png       an image file
//     room:<sprite>   My Room's sprite (public/room/strip/<sprite>.png)
//     hall:<sprite>   the library hall's sprite (buildings/library/hall/sprites.js)
//   The picture is stretched over the element's box; when its shape doesn't match the box (the
//   box is only part of the picture), the box is outlined instead.

export const OUTLINE_LIGHT = '#fffdf9'
export const OUTLINE_DARK = '#2b2133'
export const GLOW = '#f2d48a'
// the light band and the dark band round it, in px
export const LIGHT_BAND = 3
export const DARK_BAND = 2
const RING_PAD = 10

const pictures = new Map()

// The picture a data-tour-mask names, once loaded (null until then, and null when there isn't one).
export function maskPicture(spec) {
  if (!pictures.has(spec)) {
    pictures.set(spec, null)
    load(spec).then((picture) => pictures.set(spec, picture))
  }
  return pictures.get(spec)
}

async function load(spec) {
  try {
    if (spec.startsWith('hall:')) {
      const { getSprite } = await import('@/buildings/library/hall/sprites.js')
      return getSprite(spec.slice(5)) ?? null
    }
    const url = spec.startsWith('room:') ? `/room/strip/${spec.slice(5)}.png` : spec
    return await new Promise((resolve) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => resolve(null)
      image.src = url
    })
  } catch {
    return null
  }
}

// Where the picture goes for an element's box, or null when it doesn't fit it. The hall's sprites
// carry a 1 px outline on every side that the box leaves out.
export function placePicture(spec, picture, box) {
  const margin = spec.startsWith('hall:') ? 1 : 0
  const scale = box.width / (picture.width - margin * 2)
  const height = (picture.height - margin * 2) * scale
  if (Math.abs(height / box.height - 1) > 0.08) return null
  return {
    x: box.x - margin * scale,
    y: box.y - margin * scale,
    w: picture.width * scale,
    h: picture.height * scale,
  }
}

// An element's four corner radii as [rx, ry] pairs (top left, top right, bottom right, bottom
// left), the way CSS draws them: percentages of the box, and squeezed when they'd overlap.
export function cornerRadii(element, w, h) {
  const style = getComputedStyle(element)
  const pair = (value) => {
    const [a, b = a] = value.split(' ')
    const px = (part, size) => (part.endsWith('%') ? (parseFloat(part) / 100) * size : parseFloat(part) || 0)
    return [px(a, w), px(b, h)]
  }
  const radii = ['TopLeft', 'TopRight', 'BottomRight', 'BottomLeft'].map((corner) => pair(style[`border${corner}Radius`]))
  const [tl, tr, br, bl] = radii
  const squeeze = Math.min(
    1,
    w / Math.max(1, tl[0] + tr[0]),
    w / Math.max(1, bl[0] + br[0]),
    h / Math.max(1, tl[1] + bl[1]),
    h / Math.max(1, tr[1] + br[1]),
  )
  return radii.map(([rx, ry]) => [rx * squeeze, ry * squeeze])
}

// A rounded box as a path, grown by `grow` px all round with its corners growing to match.
export function roundedPath(ctx, x, y, w, h, radii, grow = 0) {
  const left = x - grow
  const top = y - grow
  const width = w + grow * 2
  const height = h + grow * 2
  const [tl, tr, br, bl] = radii.map(([rx, ry]) => [rx ? rx + grow : 0, ry ? ry + grow : 0])
  ctx.beginPath()
  ctx.moveTo(left + tl[0], top)
  ctx.lineTo(left + width - tr[0], top)
  if (tr[0]) ctx.ellipse(left + width - tr[0], top + tr[1], tr[0], tr[1], 0, -Math.PI / 2, 0)
  ctx.lineTo(left + width, top + height - br[1])
  if (br[0]) ctx.ellipse(left + width - br[0], top + height - br[1], br[0], br[1], 0, 0, Math.PI / 2)
  ctx.lineTo(left + bl[0], top + height)
  if (bl[0]) ctx.ellipse(left + bl[0], top + height - bl[1], bl[0], bl[1], 0, Math.PI / 2, Math.PI)
  ctx.lineTo(left, top + tl[1])
  if (tl[0]) ctx.ellipse(left + tl[0], top + tl[1], tl[0], tl[1], 0, Math.PI, Math.PI * 1.5)
  ctx.closePath()
}

function scratch(width, height) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.ceil(width))
  canvas.height = Math.max(1, Math.ceil(height))
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false
  return { canvas, ctx }
}

// The picture's shape grown by `by` px and filled in one colour.
function grown(picture, w, h, by, colour) {
  const { canvas, ctx } = scratch(w + RING_PAD * 2, h + RING_PAD * 2)
  for (let step = 0; step < 24; step += 1) {
    const angle = (step / 24) * Math.PI * 2
    ctx.drawImage(picture, RING_PAD + Math.cos(angle) * by, RING_PAD + Math.sin(angle) * by, w, h)
  }
  ctx.drawImage(picture, RING_PAD, RING_PAD, w, h)
  ctx.globalCompositeOperation = 'source-in'
  ctx.fillStyle = colour
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  return canvas
}

const rings = new WeakMap()

// The outline hugging a picture's shape: the light band against it, the dark band round that,
// and nothing over the picture itself. A canvas RING_PAD px bigger than the picture all round.
export function ringOf(picture, w, h) {
  const key = `${Math.round(w)}x${Math.round(h)}`
  if (!rings.has(picture)) rings.set(picture, new Map())
  const made = rings.get(picture)
  if (!made.has(key)) {
    const { canvas, ctx } = scratch(w + RING_PAD * 2, h + RING_PAD * 2)
    ctx.drawImage(grown(picture, w, h, LIGHT_BAND + DARK_BAND, OUTLINE_DARK), 0, 0)
    ctx.drawImage(grown(picture, w, h, LIGHT_BAND, OUTLINE_LIGHT), 0, 0)
    ctx.globalCompositeOperation = 'destination-out'
    ctx.drawImage(picture, RING_PAD, RING_PAD, w, h)
    made.set(key, canvas)
  }
  return made.get(key)
}

export const RING_MARGIN = RING_PAD
