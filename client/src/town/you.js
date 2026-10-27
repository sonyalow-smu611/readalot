// Scaffolded with AI assistance — see AI_USAGE.md
// The reader's own character in town: drawn from their saved parts (the same drawing as the
// salon's) with a soft white glow round it and a pool of light at its feet, like the street
// lamps throw, so it stands out from the townsfolk. It is drawn above the night sky's shade, so
// after dark it stays lit in its own colours.
// It wanders the pavements until the reader picks a building, then walks to the door, which
// swings open (door.js), and steps inside.
import Phaser from 'phaser'
import { drawAvatar, makeRnd, mk } from '@/lib/avatar/draw.js'
import { characterSeed, normaliseCharacter, toDrawParams } from '@/lib/avatar/catalogue.js'
import { SPAWN } from './places.js'
import { somewhereToWalk, walkingRoute } from './roads.js'
import { SKY_DEPTH } from './sky.js'
import { DOOR_OPENS, doorstep, openDoor } from './door.js'

// The town draws characters at twice their pixel size (60 x 116, like public/town/avatars/).
const SCALE = 2
// How far the glow reaches, in map pixels; the picture has this much room on every side.
const GLOW = 16
const WANDER_SPEED = 70 // map px a second
// On the way to a building: at least this fast, and never longer than MAX_TRIP seconds.
const TRIP_SPEED = 380
const MAX_TRIP = 3.2

// The character at town size, and its glow on its own (with a hole where the character is), so
// the glow can sit above the night sky without hiding the character under it.
function drawLook(character) {
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
  g.shadowColor = '#ffffff'
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

export class You {
  constructor(scene, { character, reducedMotion }) {
    this.scene = scene
    this.reducedMotion = reducedMotion
    this.looks = 0
    this.shine = { level: 1 }
    // light on the ground round your feet ('pool' is the lamps' light, see sky.js)
    this.pool = scene.add
      .image(SPAWN.x, SPAWN.y, 'pool')
      .setScale(1.5, 0.55)
      .setTint(0xfff0c4)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(SKY_DEPTH + 1.5)
    // above the night shade and the lamps' light, below the rain
    this.body = scene.add.image(SPAWN.x, SPAWN.y, '__DEFAULT').setDepth(SKY_DEPTH + 2)
    this.glow = scene.add.image(SPAWN.x, SPAWN.y, '__DEFAULT').setDepth(SKY_DEPTH + 3)
    this.setLook(character)
    this.sync()
    if (reducedMotion) return
    scene.tweens.add({ targets: this.shine, level: 0.8, duration: 1100, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 })
    // a little bounce in every step
    this.step = scene.tweens.add({ targets: this.body, scaleY: 0.94, duration: 170, yoyo: true, repeat: -1, paused: true })
    this.rest()
  }

  // Redraws the character, e.g. once the profile has loaded.
  setLook(character) {
    const old = [this.body.texture.key, this.glow.texture.key]
    const n = ++this.looks
    const { body, glow } = drawLook(character)
    this.scene.textures.addCanvas(`you-${n}`, body)
    this.scene.textures.addCanvas(`you-glow-${n}`, glow)
    // the feet sit GLOW px above the bottom of the picture
    const feet = 1 - GLOW / body.height
    this.body.setTexture(`you-${n}`).setOrigin(0.5, feet)
    this.glow.setTexture(`you-glow-${n}`).setOrigin(0.5, feet)
    for (const key of old) if (key.startsWith('you-')) this.scene.textures.remove(key)
  }

  // Keeps the glow and the light with you; runs every frame.
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

  stop() {
    this.timer?.remove()
    this.leg?.stop()
  }

  // From here on you show only inside the doorway (and on the step below it), so you vanish
  // into the building instead of over its wall.
  through(doorway) {
    if (!doorway) return
    const { x, y, w, h } = doorway
    const shape = this.scene.make.graphics({}, false)
    shape.fillStyle(0xffffff)
    shape.fillRect(x, y - 4, w, h + 4)
    shape.fillRect(x - 200, y + h, w + 400, 300)
    const mask = shape.createGeometryMask()
    this.body.setMask(mask)
    this.glow.setMask(mask)
  }

  // --- Going in --------------------------------------------------------------------------------
  // Walks to the building's door; atDoor() runs as it swings open, inside() once you are through.
  goIn(place, { atDoor, inside }) {
    if (this.reducedMotion) {
      inside()
      return
    }
    this.stop()
    const { front, beside } = doorstep(place)
    const route = walkingRoute([this.body.x, this.body.y], beside)
    let length = 0
    route.reduce((from, to) => {
      length += Math.hypot(to[0] - from[0], to[1] - from[1])
      return to
    }, [this.body.x, this.body.y])
    // hurry, so a far building is still only a few seconds away
    this.step.timeScale = 1.8
    this.walk(route, Math.max(TRIP_SPEED, length / MAX_TRIP), () => {
      this.step.pause()
      this.body.setScale(1)
      const doorway = openDoor(this.scene, place)
      atDoor()
      // wait beside the door, facing it, while it swings open; then step in front of it and go
      // through the doorway, a little smaller the further in you go
      this.body.setFlipX(front[0] < beside[0])
      this.scene.tweens.chain({
        targets: this.body,
        tweens: [
          {
            x: front[0],
            delay: DOOR_OPENS,
            duration: 260,
            ease: 'Sine.easeInOut',
            onStart: () => this.step.resume(),
            onComplete: () => {
              this.step.pause()
              this.body.setScale(1)
            },
          },
          {
            y: front[1] - 30,
            scale: 0.78,
            duration: 560,
            ease: 'Sine.easeInOut',
            onStart: () => this.through(doorway),
          },
        ],
      })
      this.scene.tweens.add({ targets: this.body, alpha: 0, delay: DOOR_OPENS + 540, duration: 300, onComplete: inside })
    })
  }
}
