// Scaffolded with AI assistance — see AI_USAGE.md
// The reader's own character in town: a TownReader (reader.js) with a white glow and a green
// diamond floating over its head, so you can always tell which one is you, starting outside
// your front door, or outside the place you just left. It wanders the pavements until the reader
// tells it where to be (tap the map, or come back out of a building), then stays there. Picking a
// building walks it to the door, which swings open (door.js), and it steps inside.
import { SPAWN } from './places.js'
import { walkingRoute } from './roads.js'
import { DOOR_OPENS, doorstep, openDoor } from './door.js'
import { TownReader } from './reader.js'
import { SKY_DEPTH } from './sky.js'

// On the way to a building: at least this fast, and never longer than MAX_TRIP seconds.
const TRIP_SPEED = 380
const MAX_TRIP = 3.2
// how far above your feet the diamond floats: the character is 116 px tall
const DIAMOND_ABOVE = 158

// A green gem with a white rim, lighter on top, like light catching it.
function drawDiamond(scene) {
  const gem = (r) => [
    { x: 0, y: -r * 1.3 },
    { x: r, y: 0 },
    { x: 0, y: r * 1.3 },
    { x: -r, y: 0 },
  ]
  const g = scene.add.graphics()
  g.fillStyle(0xffffff, 1).fillPoints(gem(21), true)
  g.fillStyle(0x2f9a4c, 1).fillPoints(gem(16), true)
  g.fillStyle(0x6fd68a, 1).fillPoints([{ x: 0, y: -20.8 }, { x: 16, y: 0 }, { x: -16, y: 0 }], true)
  g.fillStyle(0xd8f7df, 1).fillPoints([{ x: -3, y: -14 }, { x: 3, y: -8 }, { x: -6, y: -2 }], true)
  // over the walkers and the night, with the friends' name tags
  return g.setDepth(SKY_DEPTH + 29)
}

export class You extends TownReader {
  // at: where to stand, [x, y], when it isn't your front door; you stay put there
  constructor(scene, { character, reducedMotion, at = null }) {
    super(scene, { character, reducedMotion, at: at ?? [SPAWN.x, SPAWN.y] })
    this.stayPut = Boolean(at)
    this.float = { y: 0 }
    this.diamond = drawDiamond(scene)
    this.sync()
    if (!reducedMotion) {
      // it bobs, and turns slowly (squashing it side to side looks like it spinning)
      scene.tweens.add({ targets: this.float, y: -8, duration: 900, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 })
      scene.tweens.add({ targets: this.diamond, scaleX: 0.55, duration: 1300, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 })
    }
    this.rest()
  }

  sync() {
    super.sync()
    this.diamond
      ?.setPosition(this.body.x, this.body.y - DIAMOND_ABOVE * this.body.scaleY + this.float.y)
      .setAlpha(this.body.alpha)
  }

  rest() {
    if (!this.stayPut) super.rest()
  }

  // Hurries along the route, so anywhere in town is only a few seconds away, then calls done().
  trip(route, done) {
    let length = 0
    route.reduce((from, to) => {
      length += Math.hypot(to[0] - from[0], to[1] - from[1])
      return to
    }, [this.body.x, this.body.y])
    this.step.timeScale = 1.8
    this.walk(route, Math.max(TRIP_SPEED, length / MAX_TRIP), done)
  }

  // Walks the route (from the map's tap, see ground.js) and stays where it ends.
  goTo(route) {
    this.stop()
    this.stayPut = true
    if (this.reducedMotion) {
      this.body.setPosition(...route[route.length - 1])
      return
    }
    this.trip(route, () => {
      this.step.pause()
      this.step.timeScale = 1
      this.body.setScale(1)
    })
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
    this.trip(walkingRoute([this.body.x, this.body.y], beside), () => {
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
