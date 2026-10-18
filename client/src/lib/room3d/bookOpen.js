// Taking a book off the shelf and opening it, the way bookshelf.blend's hero book does
// (client/blender): it pulls straight out of the shelf, flies towards the reader turning its
// front cover to them, then the cover swings open and the pages flip. The flight is worked out
// here for whichever book was tapped; the cover and the pages play the animation exported with
// the hero book. Closing plays it all backwards.
import * as THREE from 'three'
import { gsap } from '@/lib/motion'

// bookshelf.blend's keyframes, at 24 frames a second
const FPS = 24
const FRAME = { start: 1, pulled: 25, arrived: 55, end: 176 }
const PULL = 0.28 // metres straight out of the shelf
// how much faster than in Blender it plays: about 3.7 seconds to open, 2.4 to close
const SPEED = { open: 2, close: 3 }
// the open book fills this share of the view's width, and stands this share of the view's
// height above the middle (the book's details cover the bottom of the screen)
const FILL = 0.8
const RAISE = 0.17
const UP = new THREE.Vector3(0, 1, 0)
// a quarter turn so the front cover, not the spine, faces the reader
const COVER_TO_READER = new THREE.Quaternion().setFromAxisAngle(UP, -Math.PI / 2)
const COVER = { width: 256, height: 352 }
const PAPER = '#F3EADB'

// Blender's default Bezier keys ease in and out
function ease(amount) {
  const t = THREE.MathUtils.clamp(amount, 0, 1)
  return t * t * (3 - 2 * t)
}

export function createBookOpener({ template, clip, camera, scene }) {
  const parts = partsOf(template)
  // the hero book's covers and spine have no texture coordinates; they get a flat projection
  // over their outside face
  if (parts.front) projectUvs(parts.front.geometry, { u: 'z', flipU: true, v: 'y', outside: 'x' })
  if (parts.spine) projectUvs(parts.spine.geometry, { u: 'x', v: 'y', outside: 'z' })
  // how tall the hero book stands: a copy is scaled to the tapped book's height
  const height = new THREE.Box3().setFromObject(template.clone()).getSize(new THREE.Vector3()).y

  let current = null
  const loader = new THREE.TextureLoader().setCrossOrigin('anonymous')

  // Takes a copy of the hero book off the shelf in place of `mesh` (the tapped book's spine)
  // and opens it. Resolves once it is open, or skipped to open.
  function open(mesh, book) {
    const copy = template.clone()
    copy.visible = true
    const materials = dress(copy, mesh, book)
    copy.scale.setScalar(mesh.geometry.parameters.height / height)
    scene.add(copy)

    let mixer = null
    let action = null
    if (clip) {
      mixer = new THREE.AnimationMixer(copy)
      action = mixer.clipAction(clip)
      action.setLoop(THREE.LoopOnce, 1)
      action.clampWhenFinished = true
      action.play()
    }

    // where the book stands in the room, and the way out of its shelf (its spine's side, +z)
    const from = mesh.getWorldPosition(new THREE.Vector3())
    current = {
      copy,
      mesh,
      materials,
      mixer,
      action,
      from,
      startTurn: mesh.getWorldQuaternion(new THREE.Quaternion()),
      pulled: from.clone().addScaledVector(mesh.getWorldDirection(new THREE.Vector3()), PULL),
      endTurn: camera.quaternion.clone().multiply(COVER_TO_READER),
      spot: new THREE.Vector3(),
      state: { frame: FRAME.start },
      tween: null,
    }
    current.spot = readingSpot(current)
    pose(FRAME.start)
    mesh.visible = false
    if (book.cover) putOnCover(current, book.cover)

    return new Promise((resolve) => {
      current.tween = gsap.to(current.state, {
        frame: FRAME.end,
        duration: (FRAME.end - FRAME.start) / FPS / SPEED.open,
        ease: 'none',
        onUpdate: () => pose(current.state.frame),
        onComplete: resolve,
      })
    })
  }

  // jumps to the book lying open
  function skip() {
    current?.tween?.progress(1)
  }

  // Plays it all backwards, back into the gap on the shelf.
  function close() {
    if (!current) return Promise.resolve()
    const { tween, state } = current
    tween.kill()
    return new Promise((resolve) => {
      current.tween = gsap.to(state, {
        frame: FRAME.start,
        duration: (state.frame - FRAME.start) / FPS / SPEED.close,
        ease: 'none',
        onUpdate: () => pose(state.frame),
        onComplete: () => {
          putAway({ showSpine: true })
          resolve()
        },
      })
    })
  }

  // A book taken off the shelf for good: it fades where it is.
  function fade() {
    if (!current) return Promise.resolve()
    current.tween.kill()
    for (const material of current.materials) material.transparent = true
    return new Promise((resolve) => {
      current.tween = gsap.to(current.materials, {
        opacity: 0,
        duration: 0.35,
        onComplete: () => {
          putAway({ showSpine: false })
          resolve()
        },
      })
    })
  }

  // The book's own cover picture, in place of the cloth cover once it has loaded. It never holds
  // the book up; a picture whose site does not allow it (no CORS headers) keeps the cloth cover.
  function putOnCover(book, url) {
    const front = partsOf(book.copy).front
    if (!front) return
    loader.load(
      url,
      (texture) => {
        if (current !== book) {
          texture.dispose()
          return
        }
        texture.colorSpace = THREE.SRGBColorSpace
        texture.userData.ownedByCover = true
        front.material.map.dispose()
        front.material.map = texture
        front.material.needsUpdate = true
      },
      undefined,
      () => {},
    )
  }

  function putAway({ showSpine }) {
    const { copy, mesh, materials, mixer } = current
    scene.remove(copy)
    mixer?.stopAllAction()
    for (const material of materials) {
      material.map?.userData.ownedByCover && material.map.dispose()
      material.dispose()
    }
    if (showSpine) mesh.visible = true
    current = null
  }

  function pose(frame) {
    const { copy, from, pulled, spot, startTurn, endTurn, action, mixer } = current
    const out = ease((frame - FRAME.start) / (FRAME.pulled - FRAME.start))
    const flight = ease((frame - FRAME.pulled) / (FRAME.arrived - FRAME.pulled))
    copy.position.copy(from).lerp(pulled, out).lerp(spot, flight)
    copy.quaternion.copy(startTurn).slerp(endTurn, flight)
    if (action) {
      action.time = Math.min(frame / FPS, clip.duration)
      mixer.update(0)
    }
  }

  // In front of the camera, near enough that the open book fills most of the view's width,
  // raised clear of the book's details.
  function readingSpot(book) {
    const forward = camera.getWorldDirection(new THREE.Vector3())
    const up = UP.clone().applyQuaternion(camera.quaternion)
    const tall = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)
    const wide = tall * camera.aspect

    // how big the book is lying open, and how far its middle is from where it is held
    book.spot.copy(camera.position)
    pose(FRAME.end)
    const box = new THREE.Box3().setFromObject(book.copy)
    const size = box.getSize(new THREE.Vector3())
    const offset = box.getCenter(new THREE.Vector3()).sub(book.copy.position)

    const distance = Math.max(Math.max(size.x, size.z) / (FILL * wide), size.y / (0.45 * tall))
    return camera.position
      .clone()
      .addScaledVector(forward, distance)
      .addScaledVector(up, RAISE * tall * distance)
      .sub(offset)
  }

  return {
    open,
    skip,
    close,
    fade,
    dispose() {
      current?.tween?.kill()
      if (current) putAway({ showSpine: true })
    },
  }
}

// the hero book's parts, by the names they have in Blender
function partsOf(root) {
  const parts = {}
  root.traverse((node) => {
    const name = node.userData.name ?? node.name
    if (name === 'herobook.cover.front') parts.front = node
    else if (name === 'herobook.cover.back') parts.back = node
    else if (name === 'herobook.spine') parts.spine = node
  })
  return parts
}

// Dresses a copy of the hero book as the tapped book: a cloth cover in its spine colour with its
// title, and the spine from the shelf. Returns the materials made for it.
function dress(copy, mesh, book) {
  const parts = partsOf(copy)
  const [side, , , , spine] = mesh.material
  const colour = side.color
  const made = []
  const use = (node, material) => {
    if (!node) return
    node.material = material
    made.push(material)
  }
  use(parts.front, new THREE.MeshStandardMaterial({ map: coverTexture(book, colour), roughness: 0.7 }))
  use(parts.back, new THREE.MeshStandardMaterial({ color: colour, roughness: 0.7 }))
  use(parts.spine, new THREE.MeshStandardMaterial({ map: spine.map, roughness: 0.65 }))
  // the pages: the shelf's paper, lit a little from within so they read as paper when the book
  // is turned away from the room's lights
  copy.traverse((node) => {
    if (node.isMesh && !made.includes(node.material)) {
      use(node, new THREE.MeshStandardMaterial({ color: PAPER, emissive: PAPER, emissiveIntensity: 0.3, roughness: 0.9 }))
    }
  })
  return made
}

// A plain cloth cover in the book's colour, with its title and author in gold.
function coverTexture(book, colour) {
  const canvas = document.createElement('canvas')
  canvas.width = COVER.width
  canvas.height = COVER.height
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = `#${colour.getHexString(THREE.SRGBColorSpace)}`
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.strokeStyle = '#B08A3E'
  ctx.lineWidth = 3
  ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32)

  ctx.fillStyle = '#E2C77E'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '600 24px Georgia, serif'
  const lines = wrap(ctx, book.title || 'Untitled', canvas.width - 64).slice(0, 4)
  lines.forEach((line, index) => ctx.fillText(line, canvas.width / 2, 120 + (index - (lines.length - 1) / 2) * 30))
  const author = book.authors?.[0]
  if (author) {
    ctx.font = 'italic 16px Georgia, serif'
    ctx.fillText(author, canvas.width / 2, canvas.height - 60)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.userData.ownedByCover = true
  return texture
}

function wrap(ctx, text, width) {
  const lines = []
  let line = ''
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word
    if (line && ctx.measureText(next).width > width) {
      lines.push(line)
      line = word
    } else line = next
  }
  if (line) lines.push(line)
  return lines
}

// Texture coordinates projected flat across a box's outside face (`outside`: the axis it faces
// along, +). The other faces all take one spot near the top edge, where the texture is plain.
function projectUvs(geometry, { u, v, outside, flipU = false }) {
  geometry.computeBoundingBox()
  const { min, max } = geometry.boundingBox
  const position = geometry.attributes.position
  const normal = geometry.attributes.normal
  const axis = { x: 0, y: 1, z: 2 }
  const uvs = new Float32Array(position.count * 2)
  for (let i = 0; i < position.count; i += 1) {
    if (normal.getComponent(i, axis[outside]) > 0.5) {
      const across = (position.getComponent(i, axis[u]) - min[u]) / (max[u] - min[u])
      uvs[i * 2] = flipU ? 1 - across : across
      uvs[i * 2 + 1] = (position.getComponent(i, axis[v]) - min[v]) / (max[v] - min[v])
    } else {
      uvs[i * 2] = 0.5
      uvs[i * 2 + 1] = 0.995
    }
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
}
