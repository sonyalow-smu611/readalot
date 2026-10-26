// Scaffolded with AI assistance — see AI_USAGE.md
// The reader's character as a 3D chibi figure for the salon podium, like a little vinyl toy:
// the same parts and colours as the drawings (toDrawParams from lib/avatar/catalogue.js), a face
// painted onto the head like the drawings' face, sculpted hair locks, a rounded body, soft
// shading and a thin outline. Feet stand at y 0, facing +z.
import * as THREE from 'three'

const OUTLINE = 0x4a3540
const HEAD_Y = 1.84
const HEAD_R = 0.64
const HEAD_SCALE = [1.06, 0.96, 1]

function material(color, opacity = 1) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0, transparent: opacity < 1, opacity })
}

// One shape. Outlined shapes get a slightly bigger dark copy behind them (an inverted hull).
function part(geometry, color, { at = [0, 0, 0], scale = [1, 1, 1], rot = [0, 0, 0], outline = true, opacity = 1 } = {}) {
  const mesh = new THREE.Mesh(geometry, material(color, opacity))
  mesh.position.set(...at)
  mesh.scale.set(...scale)
  mesh.rotation.set(...rot)
  if (outline) {
    geometry.computeBoundingSphere()
    const hull = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: OUTLINE, side: THREE.BackSide }))
    hull.scale.setScalar(1 + 0.014 / Math.max(0.04, geometry.boundingSphere.radius))
    mesh.add(hull)
  }
  return mesh
}

const sphere = (r, ...rest) => new THREE.SphereGeometry(r, 40, 28, ...rest)
const capsule = (r, length) => new THREE.CapsuleGeometry(r, length, 10, 20)
const cylinder = (top, bottom, height, open = false) => new THREE.CylinderGeometry(top, bottom, height, 32, 1, open)
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d)
const torus = (r, tube, arc = Math.PI * 2) => new THREE.TorusGeometry(r, tube, 14, 40, arc)
// a smooth turned shape from [radius, height] points, bottom to top
const lathe = (points) => new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), 40)

// ------------------------------------------------------------------ the painted face

function faceTexture(p) {
  const W = 512
  const H = 272
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const x = canvas.getContext('2d')
  const eyes = [0.31 * W, 0.69 * W]
  const eyeY = 0.52 * H

  // rosy cheeks
  for (const cx of [0.19 * W, 0.81 * W]) {
    const glow = x.createRadialGradient(cx, 0.75 * H, 2, cx, 0.75 * H, 40)
    glow.addColorStop(0, `${p.blush}cc`)
    glow.addColorStop(1, `${p.blush}00`)
    x.fillStyle = glow
    x.beginPath()
    x.ellipse(cx, 0.75 * H, 42, 24, 0, 0, Math.PI * 2)
    x.fill()
  }

  // big shiny eyes with a soft iris, two highlights and a flick of lashes
  for (const [i, cx] of eyes.entries()) {
    x.fillStyle = '#2b2230'
    x.beginPath()
    x.ellipse(cx, eyeY, 25, 37, 0, 0, Math.PI * 2)
    x.fill()
    const iris = x.createLinearGradient(0, eyeY - 10, 0, eyeY + 37)
    iris.addColorStop(0, 'rgba(110, 86, 130, 0)')
    iris.addColorStop(1, 'rgba(150, 120, 175, 0.9)')
    x.fillStyle = iris
    x.beginPath()
    x.ellipse(cx, eyeY + 6, 19, 28, 0, 0, Math.PI * 2)
    x.fill()
    x.fillStyle = '#ffffff'
    x.beginPath()
    x.arc(cx + 8, eyeY - 13, 10, 0, Math.PI * 2)
    x.fill()
    x.beginPath()
    x.arc(cx - 9, eyeY + 15, 4.5, 0, Math.PI * 2)
    x.fill()
    const out = i === 0 ? -1 : 1
    x.strokeStyle = '#2b2230'
    x.lineWidth = 6
    x.lineCap = 'round'
    x.beginPath()
    x.moveTo(cx + out * 18, eyeY - 30)
    x.quadraticCurveTo(cx + out * 30, eyeY - 38, cx + out * 36, eyeY - 34)
    x.stroke()
  }

  // brows
  x.strokeStyle = p.brow ?? p.hairS
  x.lineWidth = 8
  for (const cx of eyes) {
    x.beginPath()
    x.moveTo(cx - 22, 0.24 * H)
    x.quadraticCurveTo(cx, 0.17 * H, cx + 22, 0.23 * H)
    x.stroke()
  }

  // a little nose and a smile
  x.fillStyle = p.skinS
  x.beginPath()
  x.ellipse(W / 2, 0.71 * H, 6, 4, 0, 0, Math.PI * 2)
  x.fill()
  x.strokeStyle = p.lips
  x.lineWidth = 6
  x.beginPath()
  x.moveTo(W / 2 - 18, 0.84 * H)
  x.quadraticCurveTo(W / 2, 0.97 * H, W / 2 + 18, 0.84 * H)
  x.stroke()

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

// The face sits on a slice of a sphere just outside the head's front, from brow to chin.
function face(p) {
  const spread = 1.7
  const geometry = sphere(HEAD_R + 0.004, Math.PI / 2 - spread / 2, spread, 1.15, 0.9)
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ map: faceTexture(p), transparent: true, roughness: 0.6, depthWrite: false }),
  )
  mesh.position.set(0, HEAD_Y, 0)
  mesh.scale.set(...HEAD_SCALE)
  return mesh
}

// ------------------------------------------------------------------ body and clothes

function legsAndShoes(g, p) {
  const trousers = ['pants', 'baggy', 'ripped', 'cargo'].includes(p.bottom)
  const baggy = p.bottom === 'baggy' || p.bottom === 'cargo'
  for (const side of [-1, 1]) {
    const x = side * 0.15
    if (trousers) {
      g.add(part(cylinder(baggy ? 0.15 : 0.125, baggy ? 0.16 : 0.115, 0.5), side < 0 ? p.botC : p.botS, { at: [x, 0.42, 0] }))
      g.add(part(torus(baggy ? 0.15 : 0.115, 0.022), p.botS, { at: [x, 0.18, 0], rot: [Math.PI / 2, 0, 0], outline: false }))
    } else {
      g.add(part(capsule(0.1, 0.36), p.skin, { at: [x, 0.38, 0] }))
      if (p.bottom === 'skirt') g.add(part(cylinder(0.106, 0.1, 0.24), p.sock ?? p.skin, { at: [x, 0.24, 0] }))
    }
    if (p.bottom === 'ripped') g.add(part(sphere(0.055), p.skin, { at: [x, 0.47, 0.115], scale: [1, 0.7, 0.4], outline: false }))
    if (p.bottom === 'cargo') g.add(part(box(0.07, 0.13, 0.13), p.botS, { at: [side * 0.3, 0.5, 0] }))

    // rounded shoes: a toe bulb on a soft sole
    if (p.boots) g.add(part(cylinder(0.135, 0.13, 0.3), p.shoe, { at: [x, 0.22, 0] }))
    g.add(part(sphere(0.135), p.shoe, { at: [x, 0.1, 0.06], scale: [1, 0.75, 1.35] }))
    g.add(part(sphere(0.14), p.sole, { at: [x, 0.035, 0.06], scale: [1.02, 0.28, 1.38] }))
    g.add(part(sphere(0.035), 0xffffff, { at: [x - 0.04, 0.17, 0.17], outline: false, opacity: 0.55 }))
  }
  if (trousers) g.add(part(lathe([[0, 0.6], [0.3, 0.6], [0.34, 0.68], [0.34, 0.8], [0, 0.8]]), p.botC))
  if (p.bottom === 'skirt') g.add(part(lathe([[0, 0.48], [0.5, 0.48], [0.47, 0.56], [0.36, 0.8], [0, 0.8]]), p.botC, { scale: [1, 1, 0.9] }))
  if (p.bottom === 'long') g.add(part(lathe([[0, 0.14], [0.52, 0.14], [0.48, 0.3], [0.36, 0.8], [0, 0.8]]), p.botC, { scale: [1, 1, 0.9] }))
}

function torso(g, p) {
  const puffy = p.top === 'puffer' || p.top === 'fuzzy'
  const bare = p.top === 'tank' || p.top === 'tube'
  const k = puffy ? 1.14 : 1
  const coat = p.top === 'coat'
  // a bean-shaped body with shoulders, wider at the bottom
  const profile = [
    [0, coat ? 0.4 : 0.62],
    [0.36 * k, coat ? 0.4 : 0.62],
    [0.4 * k, coat ? 0.5 : 0.7],
    [0.39 * k, 0.86],
    [0.36 * k, 1.04],
    [0.37 * k, 1.18],
    [0.32 * k, 1.3],
    [0.18, 1.38],
    [0, 1.39],
  ]
  const front = 0.36 * k * 0.86 + 0.01
  g.add(part(lathe(profile), p.top === 'pinafore' ? p.inner : p.topC, { scale: [1, 1, 0.86] }))

  if (p.top === 'pinafore') {
    g.add(part(lathe([[0, 0.62], [0.41, 0.62], [0.4, 0.7], [0.37, 0.94], [0, 0.94]]), p.topC, { scale: [1.02, 1, 0.9] }))
    for (const side of [-1, 1]) g.add(part(box(0.08, 0.36, 0.03), p.topC, { at: [side * 0.16, 1.1, front], rot: [-0.12, 0, 0], outline: false }))
    g.add(part(torus(0.17, 0.035), p.inner, { at: [0, 1.36, 0.04], rot: [Math.PI / 2 - 0.2, 0, 0], outline: false }))
  }
  if (p.top === 'puffer') {
    for (const y of [0.8, 0.98, 1.16]) g.add(part(torus(0.4 * k * (y > 1.1 ? 0.92 : 1), 0.035), p.topS, { at: [0, y, 0], rot: [Math.PI / 2, 0, 0], scale: [1, 0.86, 1], outline: false }))
    g.add(part(torus(0.2, 0.07), p.topC, { at: [0, 1.36, 0], rot: [Math.PI / 2, 0, 0] }))
    g.add(part(box(0.04, 0.62, 0.02), p.inner, { at: [0, 1.0, front + 0.02], outline: false }))
  }
  if (coat || p.top === 'cardigan' || p.top === 'blazer') {
    g.add(part(box(0.18, coat ? 0.8 : 0.64, 0.02), p.inner, { at: [0, coat ? 0.92 : 1.0, front], outline: false }))
    if (p.top !== 'cardigan') {
      for (const side of [-1, 1]) g.add(part(box(0.11, 0.28, 0.025), p.topS, { at: [side * 0.12, 1.18, front + 0.01], rot: [0, 0, side * 0.4], outline: false }))
    }
    for (const y of [0.84, 0.98]) g.add(part(sphere(0.024), p.top === 'cardigan' ? 0xf2a0b8 : 0x3b2a35, { at: [0.11, y, front + 0.015], outline: false }))
  }
  if (p.top === 'fuzzy') {
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2 + (i % 3) * 0.2
      const y = 0.76 + (i % 5) * 0.11
      g.add(part(sphere(0.05), i % 2 ? p.topS : 0xffe58a, { at: [Math.sin(a) * 0.4 * k, y, Math.cos(a) * 0.4 * k * 0.86], scale: [1, 1, 0.5], outline: false }))
    }
  }
  if (p.print) g.add(part(sphere(0.12), p.print, { at: [0, 1.02, front - 0.06], scale: [1.1, 1, 0.3], outline: false }))
  if (p.pattern) {
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2
      g.add(part(new THREE.ConeGeometry(0.08, 0.2, 12), p.pattern, { at: [Math.sin(a) * 0.38, 0.95, Math.cos(a) * 0.38 * 0.86], outline: false }))
    }
  }
  if (p.top === 'tube') g.add(part(lathe([[0.3, 1.22], [0.33, 1.26], [0.3, 1.32], [0.18, 1.38], [0, 1.39]]), p.skin, { scale: [1.02, 1, 0.88], outline: false }))
  if (p.top === 'tank') g.add(part(sphere(0.15), p.skin, { at: [0, 1.28, front - 0.07], scale: [1.3, 0.6, 0.4], outline: false }))
  if (p.top === 'hoodie') {
    g.add(part(sphere(0.16), p.topS, { at: [0, 0.82, front - 0.06], scale: [1.4, 0.6, 0.35], outline: false }))
    g.add(part(torus(0.2, 0.085), p.topC, { at: [0, 1.36, -0.12], rot: [0.5, 0, 0] }))
  }
  if (p.top === 'vest') g.add(part(new THREE.ConeGeometry(0.1, 0.2, 3), p.inner, { at: [0, 1.24, front], rot: [Math.PI, 0, 0], scale: [1, 1, 0.2], outline: false }))

  // soft arms with mitten hands, held a little away from the body
  const sleeve = bare ? p.skin : p.sleeve ?? p.topC
  const armR = puffy ? 0.105 : 0.088
  for (const side of [-1, 1]) {
    const shoulder = [side * 0.37 * k, 1.2, 0]
    const arm = new THREE.Group()
    arm.position.set(...shoulder)
    arm.rotation.set(0.08, 0, side * 0.32)
    arm.add(part(capsule(armR, 0.32), sleeve, { at: [0, -0.22, 0] }))
    if (p.shortSleeves) arm.add(part(capsule(0.075, 0.18), p.skin, { at: [0, -0.34, 0] }))
    else arm.add(part(torus(armR * 0.92, 0.02), p.topS, { at: [0, -0.4, 0], rot: [Math.PI / 2, 0, 0], outline: false }))
    arm.add(part(sphere(0.1), p.skin, { at: [0, -0.5, 0.01], scale: [0.95, 1.05, 0.8] }))
    arm.add(part(sphere(0.04), p.skin, { at: [-side * 0.07, -0.46, 0.05] }))
    g.add(arm)
  }

  if (p.scarf) {
    // wrapped just under the chin (the big head hides the neck)
    g.add(part(torus(0.31, 0.1), p.scarf, { at: [0, 1.26, 0.04], rot: [Math.PI / 2 - 0.15, 0, 0], scale: [1, 0.9, 1] }))
    g.add(part(capsule(0.065, 0.26), p.scarf, { at: [0.16, 1.02, front + 0.05], rot: [0, 0, 0.12], scale: [1.3, 1, 0.5] }))
  }
  if (p.bag) {
    g.add(part(torus(0.52, 0.018, Math.PI), p.bag, { at: [0.04, 1.0, 0.02], rot: [0, 0, -0.75], outline: false }))
    g.add(part(sphere(0.15), p.bag, { at: [0.5, 0.74, 0.14], scale: [1, 1, 0.45] }))
  }
}

// ------------------------------------------------------------------ head and hair

function head(g, p) {
  g.add(part(sphere(HEAD_R), p.skin, { at: [0, HEAD_Y, 0], scale: HEAD_SCALE }))
  for (const side of [-1, 1]) {
    g.add(part(sphere(0.1), p.skin, { at: [side * 0.66, HEAD_Y - 0.06, -0.02], scale: [0.7, 1, 0.9] }))
    if (p.earring) g.add(part(sphere(0.042), p.earring, { at: [side * 0.68, HEAD_Y - 0.2, 0] }))
  }
  g.add(face(p))

  if (p.shades) {
    for (const side of [-1, 1]) g.add(part(capsule(0.08, 0.1), 0x1e1a24, { at: [side * 0.21, HEAD_Y - 0.03, 0.6], rot: [0, 0, Math.PI / 2], scale: [1, 1, 0.35] }))
    g.add(part(box(0.12, 0.02, 0.02), 0x1e1a24, { at: [0, HEAD_Y, 0.63], outline: false }))
  }
  if (p.goggles) {
    g.add(part(torus(0.665, 0.035), 0x5a6070, { at: [0, HEAD_Y - 0.03, 0], rot: [Math.PI / 2, 0, 0], scale: [1.06, 1, 1], outline: false }))
    for (const side of [-1, 1]) {
      g.add(part(torus(0.11, 0.035), 0x5a5a68, { at: [side * 0.21, HEAD_Y - 0.03, 0.6] }))
      g.add(part(sphere(0.1), 0x9fc4d9, { at: [side * 0.21, HEAD_Y - 0.03, 0.59], scale: [1, 1, 0.3], opacity: 0.75, outline: false }))
    }
  }
}

// A lock of hair lying along the head: a soft flat teardrop that starts at a point on the
// head (turn: around from the front, down: from the top, in radians) and follows its curve.
// hang: how far it tips out from straight down (radians); by default it follows the head
function lock(g, color, turn, down, { length = 0.32, width = 0.13, lift = 0.02, hang = null } = {}) {
  const holder = new THREE.Group()
  holder.position.set(0, HEAD_Y, 0)
  holder.rotation.y = turn
  const r = 0.68 + lift
  const geometry = new THREE.SphereGeometry(1, 20, 14)
  geometry.translate(0, -1, 0)
  holder.add(
    part(geometry, color, {
      at: [0, Math.cos(down) * r * HEAD_SCALE[1], Math.sin(down) * r],
      rot: [hang ?? down - Math.PI / 2, 0, 0],
      scale: [width, length / 2, 0.07],
    }),
  )
  g.add(holder)
}

// The base of every hairstyle: the top of the head down to the hairline, and the sides and back
// down to `sides` (radians from the top), leaving an opening for the face.
function hairShell(g, c, { sides = 2.0, top = 0.85, size = 0.68, opening = 1.5 } = {}) {
  g.add(part(sphere(size, 0, Math.PI * 2, 0, top), c, { at: [0, HEAD_Y, 0], scale: HEAD_SCALE }))
  g.add(part(sphere(size, Math.PI / 2 + opening / 2, Math.PI * 2 - opening, 0, sides), c, { at: [0, HEAD_Y, 0], scale: HEAD_SCALE }))
}

// a fringe of locks across the forehead
function fringe(g, c, s, { count = 7, length = 0.34, top = 0.85, spread = 0.62 } = {}) {
  for (let i = 0; i < count; i++) {
    const t = (i / (count - 1)) * 2 - 1
    lock(g, i % 2 ? s : c, t * spread, top - 0.08, { length: length * (1 - Math.abs(t) * 0.25), width: 0.15 })
  }
}

// locks framing the face, and strands falling down the back
function sideLocks(g, c, s, length) {
  for (const side of [-1, 1]) lock(g, side < 0 ? c : s, side * 0.9, 1.0, { length, width: 0.13, hang: -0.08 })
}

function backStrands(g, c, s, { count = 9, length = 1.0, wave = false } = {}) {
  for (let i = 0; i < count; i++) {
    const t = (i / (count - 1)) * 2 - 1
    lock(g, i % 2 ? s : c, Math.PI + t * 1.25, 1.35, { length: length + (wave ? Math.sin(i * 1.9) * 0.08 : 0), width: 0.19, lift: 0.03, hang: -0.12 })
  }
}

function hair(g, p) {
  const c = p.hairC
  const s = p.hairS
  switch (p.hair) {
    case 'long':
    case 'wavy':
      hairShell(g, c, { sides: 2.1 })
      fringe(g, c, s)
      sideLocks(g, c, s, 0.75)
      backStrands(g, c, s, { length: 1.05, wave: p.hair === 'wavy' })
      break
    case 'bun':
      hairShell(g, c, { sides: 1.85 })
      fringe(g, c, s, { count: 5, length: 0.22 })
      g.add(part(sphere(0.24), c, { at: [0, HEAD_Y + 0.62, -0.18] }))
      g.add(part(torus(0.16, 0.035), s, { at: [0, HEAD_Y + 0.5, -0.14], rot: [Math.PI / 2 - 0.4, 0, 0], outline: false }))
      break
    case 'curly':
      hairShell(g, c, { sides: 1.9 })
      for (let i = 0; i < 30; i++) {
        const turn = (i / 30) * Math.PI * 2 * 2.3
        const down = 0.35 + (i % 5) * 0.28
        // keep curls off the face
        if (Math.cos(turn) > 0.35 && down > 0.75) continue
        const r = 0.7
        g.add(part(sphere(0.12 + (i % 3) * 0.025), i % 3 ? c : s, {
          at: [Math.sin(turn) * Math.sin(down) * r, HEAD_Y + Math.cos(down) * r * 0.96, Math.cos(turn) * Math.sin(down) * r],
        }))
      }
      fringe(g, c, s, { count: 5, length: 0.22 })
      if (p.flower) {
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * Math.PI * 2
          g.add(part(sphere(0.055), p.flower, { at: [-0.42 + Math.cos(a) * 0.07, HEAD_Y + 0.46 + Math.sin(a) * 0.07, 0.42], scale: [1, 1, 0.6] }))
        }
        g.add(part(sphere(0.04), 0xf6e27a, { at: [-0.42, HEAD_Y + 0.46, 0.46], outline: false }))
      }
      break
    case 'twists':
      hairShell(g, c, { sides: 1.7, top: 0.8 })
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2
        const ring = i % 2 ? 0.46 : 0.28
        g.add(part(capsule(0.045, 0.22), i % 2 ? s : c, { at: [Math.sin(a) * ring, HEAD_Y + 0.52 + (i % 2 ? 0 : 0.08), Math.cos(a) * ring - 0.06], rot: [Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.5] }))
      }
      g.add(part(torus(0.58, 0.03), p.roots, { at: [0, HEAD_Y + 0.42, 0], rot: [Math.PI / 2, 0, 0], outline: false }))
      break
    case 'puff':
      hairShell(g, c, { sides: 1.6, top: 0.8 })
      for (let i = 0; i < 16; i++) {
        const turn = (i / 16) * Math.PI * 2
        const down = 0.3 + (i % 3) * 0.3
        if (Math.cos(turn) > 0.5 && down > 0.5) continue
        g.add(part(sphere(0.24 + (i % 3) * 0.04), i % 4 ? c : s, {
          at: [Math.sin(turn) * Math.sin(down) * 0.72, HEAD_Y + 0.12 + Math.cos(down) * 0.7, Math.cos(turn) * Math.sin(down) * 0.66 - 0.05],
        }))
      }
      fringe(g, c, s, { count: 5, length: 0.2 })
      break
    case 'bob':
      hairShell(g, c, { sides: 2.25, size: 0.7 })
      fringe(g, c, s, { count: 8, length: 0.36, spread: 0.68 })
      sideLocks(g, c, s, 0.55)
      break
    case 'messy':
      hairShell(g, c, { sides: 1.9 })
      fringe(g, c, s, { count: 5, length: 0.3 })
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2
        const spike = new THREE.Group()
        spike.position.set(Math.sin(a) * 0.36, HEAD_Y + 0.6, Math.cos(a) * 0.36 - 0.06)
        spike.rotation.set(Math.cos(a) * 0.7, 0, -Math.sin(a) * 0.7)
        spike.add(part(new THREE.ConeGeometry(0.1, 0.28, 14), i % 2 ? c : s))
        g.add(spike)
      }
      break
    case 'short':
      hairShell(g, c, { sides: 1.75, top: 0.8 })
      fringe(g, c, s, { count: 6, length: 0.18 })
      break
    case 'spiky':
      hairShell(g, c, { sides: 1.7, top: 0.8 })
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2
        g.add(part(new THREE.ConeGeometry(0.11, 0.36, 14), i % 2 ? c : s, { at: [Math.sin(a) * 0.32, HEAD_Y + 0.68, Math.cos(a) * 0.32 - 0.06], rot: [Math.cos(a) * 0.55, 0, -Math.sin(a) * 0.55] }))
      }
      break
    case 'mop':
      hairShell(g, c, { sides: 2.0, size: 0.7 })
      fringe(g, c, s, { count: 9, length: 0.4, spread: 0.7 })
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2
        g.add(part(sphere(0.17), i % 2 ? c : s, { at: [Math.sin(a) * 0.5, HEAD_Y + 0.36, Math.cos(a) * 0.46 - 0.08] }))
      }
      break
    case 'tucked':
      for (const side of [-1, 1]) lock(g, c, side * 1.3, 1.2, { length: 0.4, width: 0.16 })
      break
    default:
      break
  }
}

function headwear(g, p) {
  if (p.hat === 'beanie') {
    g.add(part(sphere(0.72, 0, Math.PI * 2, 0, 1.5), p.hatC, { at: [0, HEAD_Y + 0.02, 0], scale: HEAD_SCALE, rot: [-0.2, 0, 0] }))
    g.add(part(torus(0.7, 0.08), p.hatC, { at: [0, HEAD_Y + 0.08, -0.03], rot: [Math.PI / 2 - 0.2, 0, 0], scale: [1.05, 1, 1] }))
    g.add(part(sphere(0.15), p.hatC, { at: [0, HEAD_Y + 0.78, -0.12] }))
  }
  if (p.hat === 'fedora') {
    g.add(part(cylinder(0.95, 0.95, 0.04), p.hatC, { at: [0, HEAD_Y + 0.36, 0] }))
    g.add(part(cylinder(0.44, 0.5, 0.38), p.hatC, { at: [0, HEAD_Y + 0.56, 0] }))
    g.add(part(cylinder(0.505, 0.505, 0.08, true), p.band, { at: [0, HEAD_Y + 0.42, 0], outline: false }))
  }
  if (p.hood) g.add(part(sphere(0.84, 0, Math.PI * 2, 0, 2.0), p.hood, { at: [0, HEAD_Y, -0.08], rot: [-0.95, 0, 0] }))
  if (p.crown) {
    g.add(part(cylinder(0.3, 0.3, 0.14, true), p.crown, { at: [0, HEAD_Y + 0.68, -0.04] }))
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2
      g.add(part(new THREE.ConeGeometry(0.05, 0.15, 10), p.crown, { at: [Math.sin(a) * 0.3, HEAD_Y + 0.82, Math.cos(a) * 0.3 - 0.04] }))
    }
    g.add(part(sphere(0.05), 0xe27aa0, { at: [0, HEAD_Y + 0.68, 0.27] }))
  }
  if (p.clip) g.add(part(capsule(0.04, 0.14), p.clip, { at: [-0.42, HEAD_Y + 0.36, 0.4], rot: [0, 0, 1.1] }))
  if (p.sprout) {
    g.add(part(cylinder(0.015, 0.015, 0.24), 0x4f8f3a, { at: [0, HEAD_Y + 0.76, 0], outline: false }))
    for (const side of [-1, 1]) g.add(part(sphere(0.09), 0x5aa045, { at: [side * 0.1, HEAD_Y + 0.88, 0], scale: [1.4, 0.55, 0.8] }))
  }
}

// a soft round shadow on the floor
function shadow() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const x = canvas.getContext('2d')
  const glow = x.createRadialGradient(64, 64, 4, 64, 64, 62)
  glow.addColorStop(0, 'rgba(59, 42, 53, 0.45)')
  glow.addColorStop(1, 'rgba(59, 42, 53, 0)')
  x.fillStyle = glow
  x.fillRect(0, 0, 128, 128)
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 0.9),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false }),
  )
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = 0.005
  return mesh
}

// The whole character as one group, ready to add to a scene.
export function buildCharacter(p) {
  const g = new THREE.Group()
  g.add(shadow())
  legsAndShoes(g, p)
  torso(g, p)
  head(g, p)
  hair(g, p)
  headwear(g, p)
  return g
}

// Frees the GPU memory a built character used.
export function disposeCharacter(group) {
  group?.traverse((node) => {
    if (node.isMesh) {
      node.geometry.dispose()
      node.material.map?.dispose()
      node.material.dispose()
    }
  })
}
