// Scaffolded with AI assistance — see AI_USAGE.md
// The campfire by the tent: flames, sparks and a little smoke over the fire in the picture, and
// a warm flickering glow that lights up the clearing after dark.
import Phaser from 'phaser'
import mapData from './map-data.json'
import { SKY_DEPTH } from './sky.js'

const FLICKER_EVERY = 90 // ms
// how strongly the fire lights things up (0 to 1)
const DAY_GLOW = 0.22
const NIGHT_GLOW = 0.56
const EMBER_GLOW = 0.6
const FLAME_ALPHA = 0.64
const SPARK_ALPHA = 0.75

function makeTexture(scene) {
  if (scene.textures.exists('ember')) return
  const g = scene.make.graphics({ add: false })
  g.fillStyle(0xffffff, 1).fillRect(0, 0, 4, 4)
  g.generateTexture('ember', 4, 4)
  g.destroy()
}

export class Campfire {
  // `glow(x, y, options)` adds a light to the sky's night lights (see Sky.glow).
  constructor(scene, { reducedMotion, glow }) {
    const [x, y] = mapData.campfire
    makeTexture(scene)

    // a faint warmth by day; the night light is much brighter
    const dayGlow = scene.add.image(x, y - 6, 'glow').setScale(1.3, 0.9).setTint(0xff9a3c).setAlpha(DAY_GLOW).setDepth(y + 1)
    dayGlow.setBlendMode(Phaser.BlendModes.ADD)
    const nightGlow = glow(x, y - 8, { scale: 3.4, scaleY: 2.4, tint: 0xff9a3c, alpha: NIGHT_GLOW })
    const ember = glow(x, y - 4, { scale: 0.9, tint: 0xffd27a, alpha: EMBER_GLOW })
    if (reducedMotion) return

    // flames sit above the night tint so the fire stays bright in the dark
    const depth = SKY_DEPTH + 2
    scene.add
      .particles(x, y, 'ember', {
        x: { min: -9, max: 9 },
        speedY: { min: -95, max: -50 },
        speedX: { min: -8, max: 8 },
        lifespan: { min: 380, max: 700 },
        frequency: 30,
        scale: { start: 2.6, end: 0.4 },
        color: [0xffd06a, 0xff9a3c, 0xd9442a, 0x6a2216],
        alpha: { start: FLAME_ALPHA, end: 0 },
        blendMode: 'ADD',
      })
      .setDepth(depth)
    // sparks that drift up past the flames
    scene.add
      .particles(x, y - 10, 'ember', {
        x: { min: -6, max: 6 },
        speedY: { min: -130, max: -70 },
        speedX: { min: -35, max: 35 },
        lifespan: { min: 800, max: 1400 },
        frequency: 180,
        scale: { start: 0.9, end: 0.3 },
        tint: 0xffc565,
        alpha: { start: SPARK_ALPHA, end: 0 },
        blendMode: 'ADD',
      })
      .setDepth(depth)
    // a thin curl of smoke
    scene.add
      .particles(x, y - 26, 'ember', {
        speedY: { min: -30, max: -18 },
        speedX: { min: -6, max: 10 },
        lifespan: 2200,
        frequency: 260,
        scale: { start: 1.6, end: 4.5 },
        tint: 0x8a8a8a,
        alpha: { start: 0.28, end: 0 },
      })
      .setDepth(depth - 1)

    // firelight never holds still
    scene.time.addEvent({
      delay: FLICKER_EVERY,
      loop: true,
      callback: () => {
        const f = Phaser.Math.FloatBetween(0.85, 1.1)
        nightGlow.setScale(3.4 * f, 2.4 * f).setAlpha(NIGHT_GLOW * f)
        ember.setAlpha(EMBER_GLOW * f)
        dayGlow.setAlpha(DAY_GLOW * f)
      },
    })
  }
}
