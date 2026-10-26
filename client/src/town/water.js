// Scaffolded with AI assistance — see AI_USAGE.md
// Moving water on top of the map picture: the waterfall pours, ripples drift down the river,
// the lake glints, fish swim in the lake and the park pond, and the plaza fountain sprays.
// Positions come from map-data.json.
import Phaser from 'phaser'
import mapData from './map-data.json'

const FLOW_SPEED = 70 // map px a second, down the river
const RIPPLES = 36
// how far either side of the river's middle a ripple can be, inside the water
const RIVER_HALF = 54
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
  const draw = (key, w, h, paint) => {
    if (scene.textures.exists(key)) return
    const g = scene.make.graphics({ add: false })
    paint(g)
    g.generateTexture(key, w, h)
    g.destroy()
  }
  draw('ripple', 14, 2, (g) => g.fillStyle(0xdff3fb, 1).fillRect(0, 0, 14, 2))
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
    // bridges and the waterfall sit over the river: no ripples there
    this.covers = [...mapData.bridges, mapData.waterfall]
    this.ripples = Array.from({ length: RIPPLES }, () => {
      const ripple = { image: this.scene.add.image(0, 0, 'ripple').setDepth(1) }
      this.respawn(ripple)
      ripple.life = Math.random()
      return ripple
    })
  }

  respawn(ripple) {
    ripple.at = Math.random() * this.riverLength
    ripple.side = (Math.random() * 2 - 1) * RIVER_HALF
    ripple.life = 0
    ripple.lasts = 1.8 + Math.random() * 1.6
  }

  // The point `side` px off the river's middle, `at` px down it.
  riverPoint(at, side) {
    let i = 1
    while (i < this.path.length - 1 && this.path[i].at < at) i++
    const a = this.path[i - 1]
    const b = this.path[i]
    const t = (at - a.at) / Math.max(1, b.at - a.at)
    const len = Math.max(1, b.at - a.at)
    const nx = -(b.y - a.y) / len
    const ny = (b.x - a.x) / len
    return [a.x + (b.x - a.x) * t + nx * side, a.y + (b.y - a.y) * t + ny * side]
  }

  addLake() {
    const { x, y, rx, ry } = mapData.lake
    for (let k = 0; k < 16; k++) {
      const [gx, gy] = this.spotIn({ x, y, rx: rx * 1.04, ry: ry * 1.04 })
      const glint = this.scene.add.image(gx, gy, 'ripple').setDepth(1).setAlpha(0)
      this.scene.tweens.add({
        targets: glint,
        alpha: 0.9,
        x: glint.x + 10,
        duration: 1400 + Math.random() * 1200,
        delay: Math.random() * 3000,
        yoyo: true,
        repeat: -1,
        repeatDelay: Math.random() * 2000,
      })
    }
  }

  addFountain() {
    const [sx, sy] = mapData.fountain.spout
    const [, by] = mapData.fountain.basin
    this.scene.add
      .particles(sx, sy, 'drop', {
        speedY: { min: -170, max: -120 },
        speedX: { min: -45, max: 45 },
        gravityY: 420,
        lifespan: 850,
        frequency: 25,
        tint: 0xcdeefa,
        scale: { start: 1.2, end: 0.6 },
        alpha: { start: 1, end: 0.2 },
      })
      .setDepth(by + 10)
  }

  update(delta) {
    if (this.reducedMotion) return
    const seconds = delta / 1000
    this.falls.tilePositionY -= 140 * seconds
    for (const ripple of this.ripples) {
      ripple.life += seconds / ripple.lasts
      ripple.at += FLOW_SPEED * seconds
      if (ripple.life >= 1 || ripple.at >= this.riverLength) this.respawn(ripple)
      const [x, y] = this.riverPoint(ripple.at, ripple.side)
      const hidden = this.covers.some((box) => inside(x, y, box))
      ripple.image.setPosition(x, y).setAlpha(hidden ? 0 : 0.85 * Math.sin(Math.PI * ripple.life))
    }
  }
}
