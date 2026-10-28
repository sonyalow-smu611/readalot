// Scaffolded with AI assistance — see AI_USAGE.md
// Moving water on top of the map picture: the waterfall pours, currents flow down the river
// and drift across the lake, fish swim in the lake and the park pond, and the plaza fountain
// sprays.
// Positions come from map-data.json.
import Phaser from 'phaser'
import mapData from './map-data.json'

const FLOW_SPEED = 70 // map px a second, down the middle of the river
const CURRENTS = 64
// how far either side of the river's middle a current can be, inside the water
const RIVER_HALF = 54
const FOAM = 0xe0f4fb
// [texture, body colour, back colour]: koi, goldfish, a silver one and a blue one
const FISH = [
  ['fish-koi', 0xf08a3c, 0xfdf7ec],
  ['fish-gold', 0xf2c14e, 0xffe08a],
  ['fish-silver', 0xb9c4cc, 0xe6eef2],
  ['fish-blue', 0x4f7fa8, 0x7fa8c9],
]

const shadeOf = (colour) => {
  const c = Phaser.Display.Color.IntegerToColor(colour).darken(20)
  return c.color
}

function makeTextures(scene) {
  // a current: one soft wave, faded out at both ends so it melts into the water
  if (!scene.textures.exists('current')) {
    const current = scene.textures.createCanvas('current', 72, 10)
    const ctx = current.getContext()
    const fade = ctx.createLinearGradient(0, 0, 72, 0)
    fade.addColorStop(0, 'rgba(224,244,251,0)')
    fade.addColorStop(0.5, 'rgba(224,244,251,0.9)')
    fade.addColorStop(1, 'rgba(224,244,251,0)')
    ctx.strokeStyle = fade
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.beginPath()
    for (let x = 2; x <= 70; x++) {
      const y = 5 + Math.sin(((x - 2) / 68) * Math.PI * 2) * 2.5
      if (x === 2) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    current.refresh()
  }
  const draw = (key, w, h, paint) => {
    if (scene.textures.exists(key)) return
    const g = scene.make.graphics({ add: false })
    paint(g)
    g.generateTexture(key, w, h)
    g.destroy()
  }
  draw('ring', 24, 12, (g) => g.lineStyle(2, 0xdff3fb, 1).strokeEllipse(12, 6, 20, 8))
  // fish seen from above, facing right: tail, body, a lighter back and an eye
  for (const [key, body, back] of FISH) {
    draw(key, 14, 7, (g) => {
      g.fillStyle(shadeOf(body), 1).fillTriangle(0, 0, 0, 6, 4, 3)
      g.fillStyle(body, 1).fillEllipse(8, 3.5, 10, 5)
      g.fillStyle(back, 1).fillRect(6, 2, 4, 2)
      g.fillStyle(0x1e1a24, 1).fillRect(11, 2, 1, 1)
    })
  }
  draw('drop', 4, 4, (g) => g.fillStyle(0xffffff, 1).fillRect(0, 0, 4, 4))
  // falling water: light streaks of different lengths that tile top to bottom
  draw('falls', 24, 48, (g) => {
    for (const [x, y, h, a] of [[0, 0, 30, 0.7], [4, 20, 26, 0.5], [8, 6, 34, 0.8], [12, 30, 18, 0.5], [16, 2, 22, 0.7], [20, 26, 22, 0.6]]) {
      g.fillStyle(0xffffff, a).fillRect(x, y, 2, h)
      if (y + h > 48) g.fillRect(x, 0, 2, y + h - 48)
    }
  })
}

const inside = (x, y, { x: bx, y: by, w, h }) => x >= bx && x <= bx + w && y >= by && y <= by + h

export class Water {
  constructor(scene, { reducedMotion }) {
    this.scene = scene
    this.reducedMotion = reducedMotion
    if (reducedMotion) return
    makeTextures(scene)
    this.addWaterfall()
    this.addRiver()
    this.addLake()
    this.addFountain()
    this.addFish(mapData.lake, 8, 3)
    this.addFish(mapData.pond, 3, 2)
  }

  // --- Fish --------------------------------------------------------------------------------
  // `count` fish swimming about inside the water's ellipse, drawn `size` times their pixels.
  addFish(water, count, size) {
    for (let i = 0; i < count; i++) {
      const [key] = FISH[i % FISH.length]
      const [x, y] = this.spotIn(water)
      const fish = this.scene.add.image(x, y, key).setScale(size).setAlpha(0.95).setDepth(1)
      this.swim(fish, water, size)
    }
  }

  // A random point well inside the water, clear of the dock and the boat.
  spotIn({ x, y, rx, ry }) {
    for (let tries = 0; tries < 20; tries++) {
      const angle = Math.random() * Math.PI * 2
      const d = Math.sqrt(Math.random()) * 0.72
      const spot = [x + Math.cos(angle) * rx * d, y + Math.sin(angle) * ry * d]
      if (!mapData.overLake.some((box) => inside(spot[0], spot[1], box))) return spot
    }
    return [x, y]
  }

  swim(fish, water, size) {
    const [x, y] = this.spotIn(water)
    const distance = Math.hypot(x - fish.x, y - fish.y)
    if (Math.abs(x - fish.x) > 2) fish.setFlipX(x < fish.x)
    // a slight tilt up or down the way it is heading
    const tilt = Phaser.Math.Clamp(((y - fish.y) / Math.max(1, Math.abs(x - fish.x))) * 12, -20, 20)
    fish.setAngle(fish.flipX ? -tilt : tilt)
    this.scene.tweens.add({
      targets: fish,
      x,
      y,
      duration: (distance / Phaser.Math.Between(35, 70)) * 1000,
      ease: 'Sine.easeInOut',
      onUpdate: () => fish.setVisible(!mapData.overLake.some((box) => inside(fish.x, fish.y, box))),
      onComplete: () => {
        // sometimes come up for a bite, with a ring on the water
        if (Math.random() < 0.3) this.ring(fish.x, fish.y, size)
        this.scene.time.delayedCall(Phaser.Math.Between(300, 1800), () => this.swim(fish, water, size))
      },
    })
  }

  ring(x, y, size) {
    const ring = this.scene.add.image(x, y, 'ring').setDepth(1).setScale(size * 0.3).setAlpha(0.9)
    this.scene.tweens.add({ targets: ring, scale: size * 1.1, alpha: 0, duration: 900, onComplete: () => ring.destroy() })
  }

  addWaterfall() {
    const { x, y, w, h } = mapData.waterfall
    this.falls = this.scene.add.tileSprite(x, y, w, h, 'falls').setOrigin(0).setAlpha(0.55).setDepth(2)
    this.scene.add
      .particles(x + w / 2, y + h - 4, 'drop', {
        x: { min: -w / 2, max: w / 2 },
        speedY: { min: -50, max: -10 },
        speedX: { min: -40, max: 40 },
        gravityY: 60,
        lifespan: 700,
        frequency: 40,
        quantity: 2,
        scale: { start: 1.4, end: 0.2 },
        alpha: { start: 0.9, end: 0 },
      })
      .setDepth(3)
  }

  addRiver() {
    // the river as a line with the distance along it at every point
    const points = mapData.river
    this.path = [{ x: points[0][0], y: points[0][1], at: 0 }]
    for (let i = 1; i < points.length; i++) {
      const [x, y] = points[i]
      const prev = this.path[i - 1]
      this.path.push({ x, y, at: prev.at + Math.hypot(x - prev.x, y - prev.y) })
    }
    this.riverLength = this.path[this.path.length - 1].at
    // bridges and the waterfall sit over the river: no currents there
    this.covers = [...mapData.bridges, mapData.waterfall]
    this.currents = Array.from({ length: CURRENTS }, () => {
      const current = { image: this.scene.add.image(0, 0, 'current').setDepth(1) }
      this.respawn(current)
      current.life = Math.random()
      return current
    })
  }

  respawn(current) {
    current.at = Math.random() * this.riverLength
    current.side = (Math.random() * 2 - 1) * RIVER_HALF
    // water runs fastest down the middle and slowest by the banks
    current.speed = FLOW_SPEED * (1.35 - 0.7 * (Math.abs(current.side) / RIVER_HALF))
    current.length = 0.7 + Math.random() * 0.9
    current.life = 0
    current.lasts = 2.4 + Math.random() * 2
  }

  // The point `side` px off the river's middle, `at` px down it, and which way the water runs
  // there (radians).
  riverPoint(at, side) {
    let i = 1
    while (i < this.path.length - 1 && this.path[i].at < at) i++
    const a = this.path[i - 1]
    const b = this.path[i]
    const t = (at - a.at) / Math.max(1, b.at - a.at)
    const len = Math.max(1, b.at - a.at)
    const nx = -(b.y - a.y) / len
    const ny = (b.x - a.x) / len
    return [a.x + (b.x - a.x) * t + nx * side, a.y + (b.y - a.y) * t + ny * side, Math.atan2(b.y - a.y, b.x - a.x)]
  }

  addLake() {
    const { x, y, rx, ry } = mapData.lake
    // slow currents drifting across the still water with the breeze
    for (let k = 0; k < 14; k++) {
      const [gx, gy] = this.spotIn({ x, y, rx: rx * 1.04, ry: ry * 1.04 })
      const drift = this.scene.add
        .image(gx, gy, 'current')
        .setDepth(1)
        .setAlpha(0)
        .setScale(0.6 + Math.random() * 0.5, 1)
      this.scene.tweens.add({
        targets: drift,
        alpha: 0.5,
        x: drift.x + 40,
        duration: 2600 + Math.random() * 1800,
        delay: Math.random() * 3000,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
        repeatDelay: Math.random() * 1500,
      })
    }
  }

  addFountain() {
    const [sx, sy] = mapData.fountain.spout
    const [bx, by] = mapData.fountain.basin
    const depth = by + 10
    // the jet: a tall spray from the top that falls back into the basin
    this.scene.add
      .particles(sx, sy, 'drop', {
        speedY: { min: -260, max: -190 },
        speedX: { min: -55, max: 55 },
        gravityY: 600,
        lifespan: 1000,
        frequency: 10,
        quantity: 2,
        tint: [0xcdeefa, 0xffffff, FOAM],
        scale: { start: 1.4, end: 0.6 },
        alpha: { start: 1, end: 0.3 },
      })
      .setDepth(depth)
    // water spilling over the rim of the top bowl
    this.scene.add
      .particles(sx, sy + 32, 'drop', {
        x: { min: -20, max: 20 },
        speedX: { min: -35, max: 35 },
        speedY: { min: -10, max: 10 },
        gravityY: 500,
        lifespan: 420,
        frequency: 20,
        quantity: 2,
        tint: FOAM,
        scale: { start: 1, end: 0.5 },
        alpha: { start: 0.9, end: 0.2 },
      })
      .setDepth(depth)
    // rings spreading where the drops land in the basin
    this.scene.time.addEvent({
      delay: 260,
      loop: true,
      callback: () => {
        const angle = Math.random() * Math.PI * 2
        const d = 0.3 + Math.random() * 0.55
        this.ring(bx + Math.cos(angle) * 64 * d, by + Math.sin(angle) * 18 * d, 1.4)
      },
    })
  }

  update(delta) {
    if (this.reducedMotion) return
    const seconds = delta / 1000
    this.falls.tilePositionY -= 140 * seconds
    for (const current of this.currents) {
      current.life += seconds / current.lasts
      current.at += current.speed * seconds
      if (current.life >= 1 || current.at >= this.riverLength) this.respawn(current)
      const [x, y, angle] = this.riverPoint(current.at, current.side)
      const hidden = this.covers.some((box) => inside(x, y, box))
      // each one stretches out a little as it is carried along, and fades in and out
      current.image
        .setPosition(x, y)
        .setRotation(angle)
        .setScale(current.length * (0.8 + 0.4 * current.life), 1)
        .setAlpha(hidden ? 0 : 0.6 * Math.sin(Math.PI * current.life))
    }
  }
}
