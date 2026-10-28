// Scaffolded with AI assistance — see AI_USAGE.md
// A reader walking about town: drawn from their character's parts (the same drawing as the
// salon's) with a soft glow round them and a pool of light at their feet, like the street lamps
// throw, so they stand out from the townsfolk. They are drawn above the night sky's shade, so
// after dark they stay lit in their own colours. They wander the pavements, resting now and then.
// Your own character (you.js) glows white; friends who are online (friend.js) glow orange.
import Phaser from 'phaser'
import { drawAvatar, makeRnd, mk } from '@/lib/avatar/draw.js'
import { characterSeed, normaliseCharacter, toDrawParams } from '@/lib/avatar/catalogue.js'
import { somewhereToWalk, walkingRoute } from './roads.js'
import { SKY_DEPTH } from './sky.js'

// The town draws characters at twice their pixel size (60 x 116, like public/town/avatars/).
const SCALE = 2
// How far the glow reaches, in map pixels; the picture has this much room on every side.
const GLOW = 16
const WANDER_SPEED = 70 // map px a second

// The character at town size, and its glow on its own (with a hole where the character is), so
// the glow can sit above the night sky without hiding the character under it.
function drawLook(character, colour) {
  const valid = normaliseCharacter(character)
  const sprite = drawAvatar(toDrawParams(valid), makeRnd(characterSeed(valid)))
  const w = sprite.width * SCALE
  const h = sprite.height * SCALE
  const [shape, s] = mk(w, h)
  s.drawImage(sprite, 0, 0, w, h)
  s.globalCompositeOperation = 'source-in'
  s.fillStyle = '#ffffff'
  s.fillRect(0, 0, w, h)

  const [body, b] = mk(w + GLOW * 2, h + GLOW * 2)
  b.drawImage(sprite, GLOW, GLOW, w, h)

  const [glow, g] = mk(w + GLOW * 2, h + GLOW * 2)
  g.shadowColor = colour
  // a wide soft haze, then a tighter bright one close in; each pass makes it brighter
  g.shadowBlur = GLOW
  for (let i = 0; i < 4; i++) g.drawImage(shape, GLOW, GLOW)
  g.shadowBlur = GLOW / 3
  for (let i = 0; i < 3; i++) g.drawImage(shape, GLOW, GLOW)
  g.shadowBlur = 0
  g.globalCompositeOperation = 'destination-out'
  g.drawImage(shape, GLOW, GLOW)
  return { body, glow }
}

let readers = 0

export class TownReader {
  // at: [x, y] where they stand; glow: the CSS colour round them; light: the tint of the light
  // at their feet.
  constructor(scene, { character, at, glow = '#ffffff', light = 0xfff0c4, reducedMotion }) {
    this.scene = scene
    this.reducedMotion = reducedMotion
    this.glowColour = glow
    this.key = `reader-${++readers}`
    this.looks = 0
    this.shine = { level: 1 }
    const [x, y] = at
    // light on the ground round their feet ('pool' is the lamps' light, see sky.js)
    this.pool = scene.add
      .image(x, y, 'pool')
      .setScale(1.5, 0.55)
      .setTint(light)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(SKY_DEPTH + 1.5)
    // above the night shade and the lamps' light, below the rain
    this.body = scene.add.image(x, y, '__DEFAULT').setDepth(SKY_DEPTH + 2)
    this.glow = scene.add.image(x, y, '__DEFAULT').setDepth(SKY_DEPTH + 3)
    this.setLook(character)
    if (reducedMotion) return
    scene.tweens.add({ targets: this.shine, level: 0.8, duration: 1100, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 })
    // a little bounce in every step
    this.step = scene.tweens.add({ targets: this.body, scaleY: 0.94, duration: 170, yoyo: true, repeat: -1, paused: true })
  }

  // Redraws the character, e.g. once the profile has loaded.
  setLook(character) {
    const old = [this.body.texture.key, this.glow.texture.key]
    const n = ++this.looks
    const { body, glow } = drawLook(character, this.glowColour)
    this.scene.textures.addCanvas(`${this.key}-${n}`, body)
    this.scene.textures.addCanvas(`${this.key}-glow-${n}`, glow)
    // the feet sit GLOW px above the bottom of the picture
    const feet = 1 - GLOW / body.height
    this.body.setTexture(`${this.key}-${n}`).setOrigin(0.5, feet)
    this.glow.setTexture(`${this.key}-glow-${n}`).setOrigin(0.5, feet)
    for (const key of old) if (key.startsWith(`${this.key}-`)) this.scene.textures.remove(key)
    this.sync()
  }

  // Keeps the glow and the light with them; runs every frame.
  sync() {
    const { body } = this
    this.pool.setPosition(body.x, body.y + 4).setAlpha(0.65 * body.alpha * this.shine.level)
    this.glow
      .setPosition(body.x, body.y)
      .setScale(body.scaleX, body.scaleY)
      .setFlipX(body.flipX)
      .setAlpha(body.alpha * this.shine.level)
  }

  // --- Wandering -----------------------------------------------------------------------------
  rest() {
    if (this.reducedMotion) return
    this.step.pause()
    this.body.setScale(1)
    this.timer = this.scene.time.delayedCall(Phaser.Math.Between(1200, 3600), () => {
      this.walk(walkingRoute([this.body.x, this.body.y], somewhereToWalk()), WANDER_SPEED, () => this.rest())
    })
  }

  // Walks through `points` one by one, then calls done().
  walk(points, speed, done) {
    const [point, ...rest] = points
    if (!point) {
      done()
      return
    }
    const [x, y] = point
    if (Math.abs(x - this.body.x) > 1) this.body.setFlipX(x < this.body.x)
    this.step.resume()
    this.leg = this.scene.tweens.add({
      targets: this.body,
      x,
      y,
      duration: (Math.hypot(x - this.body.x, y - this.body.y) / speed) * 1000,
      onComplete: () => this.walk(rest, speed, done),
    })
  }

  // Stops where they are, standing still.
  stop() {
    this.timer?.remove()
    this.leg?.stop()
    this.step?.pause()
    if (!this.reducedMotion) this.body.setScale(1)
  }

  destroy() {
    this.stop()
    this.scene.tweens.killTweensOf([this.body, this.shine])
    for (const part of [this.pool, this.body, this.glow]) part.destroy()
  }
}
