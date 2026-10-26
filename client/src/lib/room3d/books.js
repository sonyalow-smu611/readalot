// The reader's books, stood along the bookcase's shelves with their titles on their spines.
// Sizes follow bookshelf.blend (client/blender): each book's thickness, height and depth come
// from the same ranges, picked by a generator seeded with the book's id, so a book is the same
// size on every visit.
import * as THREE from 'three'
import { spineLook } from '@/services/shelves.js'

// Each of the reader's shelves has a row of the bookcase to itself, from the top row down, so
// Reading sits at eye level between the books to come and the books done with.
export const SHELF_ROWS = [
  { status: 'want_to_read', label: 'To be read' },
  { status: 'reading', label: 'Reading' },
  { status: 'read', label: 'Finished' },
]
// thickness and depth in metres, height as a share of the row
const SIZE = { thickness: [0.03, 0.08], height: [0.62, 0.93], depth: [0.22, 0.31] }
const GAP = 0.004
// a book at the end of the shelf, with room beside it, may lean on its neighbour (degrees)
const LEAN = [12, 22]
const TEXTURE = { width: 64, height: 352 }
// The brass label plate on the front of each row's board, in metres. A little taller than the
// board (4cm), like a label holder clipped over its edge; `proud` is how far the board's front
// stands out from the row (see loadRoom.js).
const PLAQUE = { height: 0.05, depth: 0.004, padding: 0.016, pxPerMetre: 2400 }
const BOARD = { below: 0.02, proud: 0.01 }

// The same numbers for the same id every time (FNV-1a hash into mulberry32).
function randomFor(id) {
  let seed = 2166136261
  for (const ch of String(id)) seed = Math.imul(seed ^ ch.charCodeAt(0), 16777619)
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function between([low, high], amount) {
  return low + (high - low) * amount
}

function sizeOf(book, row) {
  const random = randomFor(book.id)
  return {
    thickness: between(SIZE.thickness, random()),
    height: between(SIZE.height, random()) * row.height,
    depth: Math.min(between(SIZE.depth, random()), row.depth),
    lean: random() < 0.5 ? THREE.MathUtils.degToRad(between(LEAN, random())) : 0,
  }
}

function titleTexture(book, look) {
  const canvas = document.createElement('canvas')
  canvas.width = TEXTURE.width
  canvas.height = TEXTURE.height
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = look.colour
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  // gold bands near the top and bottom, as on bookshelf.blend's leather bindings
  ctx.fillStyle = '#B08A3E'
  ctx.globalAlpha = 0.85
  ctx.fillRect(0, 18, canvas.width, 4)
  ctx.fillRect(0, 26, canvas.width, 2)
  ctx.fillRect(0, canvas.height - 30, canvas.width, 2)
  ctx.fillRect(0, canvas.height - 24, canvas.width, 4)
  ctx.globalAlpha = 1

  // the title runs down the spine, top to bottom, as on English-language books
  const title = book.title || 'Untitled'
  ctx.save()
  ctx.translate(canvas.width / 2, 40)
  ctx.rotate(Math.PI / 2)
  ctx.fillStyle = look.ink
  ctx.font = '600 26px Georgia, serif'
  ctx.textBaseline = 'middle'
  ctx.fillText(fit(ctx, title, canvas.height - 84), 0, 0)
  ctx.restore()

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

// the title cut with an ellipsis to fit `width` pixels
function fit(ctx, text, width) {
  if (ctx.measureText(text).width <= width) return text
  let cut = text
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > width) cut = cut.slice(0, -1)
  return `${cut.trimEnd()}…`
}

// A brass plate with `text` engraved on it, and `count` in a darker oval after it when given.
// As wide as the words need, up to `maxWidth` metres. Faces +z, like a book's spine.
export function plaqueMesh(text, count, maxWidth) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const tall = Math.round(PLAQUE.height * PLAQUE.pxPerMetre)
  const font = `700 ${Math.round(tall * 0.5)}px Georgia, serif`
  const small = `700 ${Math.round(tall * 0.4)}px Georgia, serif`
  const pad = PLAQUE.padding * PLAQUE.pxPerMetre
  ctx.font = small
  const oval = count == null ? 0 : Math.max(tall * 0.62, ctx.measureText(String(count)).width + tall * 0.34)
  ctx.font = font
  const words = ctx.measureText(text).width
  const wide = Math.min(maxWidth * PLAQUE.pxPerMetre, pad * 2 + words + (oval ? oval + tall * 0.22 : 0))
  // rounded up, so the words are never a pixel too wide for their plate and cut short
  canvas.width = Math.ceil(wide) + 2
  canvas.height = tall

  // brushed brass, a dark rim and a pin at each end
  const shine = ctx.createLinearGradient(0, 0, 0, tall)
  shine.addColorStop(0, '#ecd08f')
  shine.addColorStop(0.45, '#c9a45c')
  shine.addColorStop(1, '#9c7a38')
  ctx.fillStyle = shine
  ctx.fillRect(0, 0, canvas.width, tall)
  ctx.strokeStyle = '#5c4119'
  ctx.lineWidth = 6
  ctx.strokeRect(3, 3, canvas.width - 6, tall - 6)
  ctx.strokeStyle = 'rgba(255, 240, 200, 0.55)'
  ctx.lineWidth = 2
  ctx.strokeRect(9, 9, canvas.width - 18, tall - 18)
  ctx.fillStyle = '#7a5a26'
  for (const x of [pad * 0.45, canvas.width - pad * 0.45]) {
    ctx.beginPath()
    ctx.arc(x, tall / 2, tall * 0.06, 0, Math.PI * 2)
    ctx.fill()
  }

  // engraved: a light edge under dark letters
  const textRight = canvas.width - pad - (oval ? oval + tall * 0.22 : 0)
  ctx.font = font
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  const shown = fit(ctx, text, textRight - pad)
  ctx.fillStyle = 'rgba(255, 244, 214, 0.6)'
  ctx.fillText(shown, pad, tall / 2 + 3)
  ctx.fillStyle = '#3a2a14'
  ctx.fillText(shown, pad, tall / 2)
  if (oval) {
    const x = canvas.width - pad - oval
    ctx.fillStyle = 'rgba(58, 42, 20, 0.22)'
    ctx.beginPath()
    ctx.roundRect(x, tall * 0.2, oval, tall * 0.6, tall * 0.3)
    ctx.fill()
    ctx.font = small
    ctx.textAlign = 'center'
    ctx.fillStyle = '#3a2a14'
    ctx.fillText(String(count), x + oval / 2, tall / 2 + 1)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  const brass = new THREE.MeshStandardMaterial({ color: '#a8843f', roughness: 0.45 })
  // lit a little from within, so it reads on a dim shelf
  const face = new THREE.MeshStandardMaterial({
    map: texture,
    emissive: '#ffffff',
    emissiveMap: texture,
    emissiveIntensity: 0.22,
    roughness: 0.45,
  })
  const geometry = new THREE.BoxGeometry(canvas.width / PLAQUE.pxPerMetre, PLAQUE.height, PLAQUE.depth)
  const mesh = new THREE.Mesh(geometry, [brass, brass, brass, brass, face, brass])
  mesh.castShadow = true
  return mesh
}

// Fixes a plate to the front of a row's board: `side` 'left' or 'right' end.
function onBoard(plaque, inside, side) {
  const { min, max } = inside
  const half = plaque.geometry.parameters.width / 2
  const x = side === 'left' ? min.x + 0.01 + half : max.x - 0.01 - half
  plaque.position.set(x, min.y - BOARD.below, max.z + BOARD.proud + PLAQUE.depth / 2)
  return plaque
}

// In the shelf's own space the bookcase faces +z, so a book's spine is its +z face.
function spineMesh(book, size) {
  const look = spineLook(book)
  const geometry = new THREE.BoxGeometry(size.thickness, size.height, size.depth)
  const side = new THREE.MeshStandardMaterial({ color: look.colour, roughness: 0.7 })
  const pages = new THREE.MeshStandardMaterial({ color: '#F3EADB', roughness: 0.9 })
  const spine = new THREE.MeshStandardMaterial({ map: titleTexture(book, look), roughness: 0.65 })
  // BoxGeometry faces: +x, -x, +y, -y, +z, -z
  const mesh = new THREE.Mesh(geometry, [side, side, pages, pages, spine, pages])
  mesh.castShadow = true
  mesh.receiveShadow = true
  mesh.userData.bookId = book.id
  return mesh
}

// The box round a book's spine in the room. Only the spine, not the whole book: seen at an
// angle, a whole book's box would cover its neighbours' spines too.
export function spineBox(mesh) {
  mesh.geometry.computeBoundingBox()
  const face = mesh.geometry.boundingBox.clone()
  face.min.z = face.max.z
  return face.applyMatrix4(mesh.matrixWorld)
}

// a book on no shelf the app knows waits on To be read
function shelfOf(book) {
  return SHELF_ROWS.some((row) => row.status === book.status) ? book.status : 'want_to_read'
}

// Stands each shelf's books on its own row of the bookcase. A row's books are laid out in the
// row's own space (see loadRoom.js), so they face out of the bookcase on whichever wall it
// stands. Each row's board has its name on a brass plate (and "+N more" at the other end when
// not every book fits). Returns the group, the books' meshes (each knowing its shelf as
// `userData.status`, and where it stands as `userData.rest`), and for each row its shelf, how
// many books it has and how many did not fit.
export function buildBooks(shelves, books) {
  const group = new THREE.Group()
  group.name = 'books'
  const meshes = []
  const fromTop = [...shelves].sort((a, b) => a.row - b.row)

  const rows = SHELF_ROWS.map(({ status, label }, index) => {
    const shelf = fromTop[index] ?? null
    const queue = books.filter((book) => shelfOf(book) === status)
    const row = { status, label, shelf, count: queue.length, hidden: queue.length }
    if (!shelf) return row

    const holder = new THREE.Group()
    holder.matrixAutoUpdate = false
    holder.matrix.copy(shelf.frame)
    group.add(holder)
    const { min, max } = shelf.inside
    const space = { height: max.y - min.y, depth: max.z - min.z }
    // facing the case, books run from left (-x) to right, with their spines at the front
    let x = min.x
    let next = 0
    while (next < queue.length) {
      const size = sizeOf(queue[next], space)
      if (x + size.thickness > max.x) break
      const mesh = spineMesh(queue[next], size)
      mesh.userData.status = status
      mesh.position.set(x + size.thickness / 2, min.y + size.height / 2, max.z - size.depth / 2)
      // the row's last book leans on its neighbour, when it was dealt a lean and has the room
      const span = size.height * Math.sin(size.lean) + size.thickness * Math.cos(size.lean)
      if (next === queue.length - 1 && next > 0 && size.lean && x + span <= max.x) {
        mesh.rotation.z = size.lean
        mesh.position.x = x + span / 2
        mesh.position.y = min.y + (size.height * Math.cos(size.lean) + size.thickness * Math.sin(size.lean)) / 2
      }
      mesh.userData.rest = mesh.position.clone()
      holder.add(mesh)
      meshes.push(mesh)
      x += size.thickness + GAP
      next += 1
    }
    row.hidden = queue.length - next

    const width = max.x - min.x
    holder.add(onBoard(plaqueMesh(label, queue.length, width / 2), shelf.inside, 'left'))
    if (row.hidden) holder.add(onBoard(plaqueMesh(`+${row.hidden} more`, null, width / 3), shelf.inside, 'right'))
    return row
  })

  return { group, meshes, rows, hidden: rows.reduce((sum, row) => sum + row.hidden, 0) }
}

export function disposeBooks(group) {
  group.traverse((node) => {
    if (!node.isMesh) return
    node.geometry.dispose()
    for (const material of node.material) {
      material.map?.dispose()
      material.dispose()
    }
  })
}
