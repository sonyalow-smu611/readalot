// Scaffolded with AI assistance — see AI_USAGE.md
// Cars driving the roads (on the left, with headlights after dark) and readers wandering the
// pavements. Both find their way with a Traveller from roads.js.
import Phaser from 'phaser'
import mapData from './map-data.json'
import { WALKERS } from './places.js'
import { JUNCTIONS, LANE, PAVEMENT, ROAD_ENDS, Traveller, startingRoads } from './roads.js'

const CAR_SPEED = 150 // map px a second
const CARS = 5
const pick = (list) => list[Math.floor(Math.random() * list.length)]

export class Traffic {
  // `lights` is the sky's container of things that glow at night (see sky.js).
  constructor(scene, { reducedMotion, lights }) {
    this.scene = scene
    this.reducedMotion = reducedMotion
    this.lights = lights
    // the first cars start out in town, each on its own road, so the roads are not empty
    const starts = startingRoads()
    for (let i = 0; i < CARS; i++) this.addCar(mapData.cars[i % mapData.cars.length], starts[i % starts.length])
    for (const walker of WALKERS) this.addWalker(walker)
  }

  // --- Cars --------------------------------------------------------------------------------
  addCar(colour, { from, to }) {
    const body = this.scene.add.image(0, 0, `car-${colour}`)
    const beam = this.scene.add.image(0, 0, 'glow').setScale(1.4, 0.7).setTint(0xfff1b8).setAlpha(0.8)
    beam.setBlendMode(Phaser.BlendModes.ADD)
    this.lights.add(beam)
    this.setOff({ body, beam }, new Traveller({ from, to, offset: LANE }))
  }

  setOff(car, route) {
    car.route = route
    const [x, y] = route.start()
    car.body.setPosition(x, y).setVisible(true)
    car.first = true
    this.drive(car)
  }

  drive(car) {
    const { body } = car
    const { point, end } = car.route.next()
    const [x, y] = point
    const distance = Math.hypot(x - body.x, y - body.y)
    const angle = Phaser.Math.RadToDeg(Math.atan2(y - body.y, x - body.x))
    if (car.first || this.reducedMotion) body.setAngle(angle)
    else this.scene.tweens.add({ targets: body, angle: body.angle + Phaser.Math.Angle.ShortestBetween(body.angle, angle), duration: 260 })
    car.first = false
    this.follow(car)
    if (this.reducedMotion) return

    this.scene.tweens.add({
      targets: body,
      x,
      y,
      duration: (distance / CAR_SPEED) * 1000,
      onUpdate: () => this.follow(car),
      onComplete: () => {
        if (!end) {
          this.drive(car)
          return
        }
        // off the edge of the map: come back in somewhere else a little later
        body.setVisible(false)
        this.scene.time.delayedCall(Phaser.Math.Between(800, 4000), () => {
          this.setOff(car, new Traveller({ from: pick(ROAD_ENDS), offset: LANE }))
        })
      },
    })
  }

  // Keeps the headlights just ahead of the car, and nearer cars in front.
  follow({ body, beam }) {
    const turn = Phaser.Math.DegToRad(body.angle)
    beam.setPosition(body.x + Math.cos(turn) * 96, body.y + Math.sin(turn) * 96).setRotation(turn)
    beam.setVisible(body.visible)
    body.setDepth(body.y + 32)
  }

  // --- People walking ----------------------------------------------------------------------
  addWalker({ avatar, speed }) {
    const route = new Traveller({ from: pick(JUNCTIONS), offset: PAVEMENT, inside: true })
    route.side = Math.random() < 0.5 ? 1 : -1
    const [x, y] = route.start()
    const body = this.scene.add.image(x, y, `avatar-${avatar}`).setOrigin(0.5, 1).setDepth(y)
    if (this.reducedMotion) return
    // a little bounce in every step
    const step = this.scene.tweens.add({ targets: body, scaleY: 0.94, duration: 170, yoyo: true, repeat: -1 })
    this.walk({ body, route, speed, step })
  }

  walk(walker) {
    const { body, route, speed, step } = walker
    const [x, y] = route.next().point
    if (Math.abs(x - body.x) > 1) body.setFlipX(x < body.x)
    step.resume()
    this.scene.tweens.add({
      targets: body,
      x,
      y,
      duration: (Math.hypot(x - body.x, y - body.y) / speed) * 1000,
      onUpdate: () => body.setDepth(body.y),
      onComplete: () => {
        // now and then stop on a corner for a moment
        if (Math.random() < 0.3) {
          step.pause()
          body.setScale(1)
          this.scene.time.delayedCall(Phaser.Math.Between(600, 2400), () => this.walk(walker))
        } else this.walk(walker)
      },
    })
  }
}
