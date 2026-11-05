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
import { playSfx } from '@/lib/sfx.js'

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
    // Footsteps, only on the trips you send it on (not while it wanders): one each time the
    // step's bounce lands, so they keep pace with the walk. `surface` is 'pavement' or 'grass'.
    this.surface = null
    this.step?.on('yoyo', () => {
      if (this.surface) playSfx(this.surface)
    })
    this.rest()
  }

  // an interrupted trip is over too, so wandering afterwards stays quiet
  stop() {
    this.surface = null
    this.tripLegs = null
    super.stop()
  }

  // Each leg of a trip says what's underfoot. A trip's legs follow the pavements, except a
  // tap's last stretch (or a short walk straight to it), which crosses the grass.
  walk(points, speed, done) {
    if (this.tripLegs != null) {
      const fromEnd = points.length
      this.surface = fromEnd === 0 ? null : this.grassLegs >= fromEnd ? 'grass' : 'pavement'
    }
    super.walk(points, speed, done)
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
  // grassLegs: how many of the route's last legs cross grass rather than pavement.
  trip(route, done, grassLegs = 0) {
    let length = 0
    route.reduce((from, to) => {
      length += Math.hypot(to[0] - from[0], to[1] - from[1])
      return to
    }, [this.body.x, this.body.y])
    this.step.timeScale = 1.8
    this.tripLegs = route.length
    this.grassLegs = grassLegs
    this.walk(route, Math.max(TRIP_SPEED, length / MAX_TRIP), () => {
      this.tripLegs = null
      this.surface = null
      done()
    })
  }

  // Walks the route (from the map's tap, see ground.js) and stays where it ends.
  goTo(route) {
    this.stop()
    this.stayPut = true
    if (this.reducedMotion) {
      this.body.setPosition(...route[route.length - 1])
      return
    }
    // see ground.js routeTo: a single leg is a short walk straight across; otherwise only the
    // last stretch, from the pavement to the spot, is off the pavement
    this.trip(
      route,
      () => {
        this.step.pause()
        this.step.timeScale = 1
        this.body.setScale(1)
      },
      1,
    )
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
      playSfx('door')
      inside()
      return
    }
    this.stop()
    const { front, beside } = doorstep(place)
    // to a door it's pavement all the way
    this.trip(walkingRoute([this.body.x, this.body.y], beside), () => {
      this.step.pause()
      this.body.setScale(1)
      const doorway = openDoor(this.scene, place)
      playSfx('door')
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
