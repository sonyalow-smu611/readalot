// Scaffolded with AI assistance — see AI_USAGE.md
// Rain blowing past the camera, one drop at a time. Every drop falls at the wind's angle give
// or take a few degrees, and has its own speed: fast drops are long, bright and near, slow ones
// short, faint and far away. Drops are kept in screen pixels so they look the same at any zoom.
import Phaser from 'phaser'

// degrees from straight down, leaning to the right
const ANGLE = 38
const ANGLE_SPREAD = 5
// the wind gusts this many degrees either way
const GUST = 4
// screen px a second
const SLOWEST = 260
const FASTEST = 640
// one drop for this many square screen px
const AREA_PER_DROP = 2600
const MOST_DROPS = 600

const random = Phaser.Math.FloatBetween

export class Rain {
  constructor(scene, depth) {
    this.scene = scene
    this.drops = []
    this.gustClock = 0
    this.graphics = scene.add.graphics().setDepth(depth)
  }

  // A new drop. `anywhere` scatters it over the whole screen (when the rain starts);
  // otherwise it comes in above the top edge.
  spawn(width, height, anywhere) {
    const near = Math.random() // 0 is far away, 1 is close
    const angle = Phaser.Math.DegToRad(ANGLE + random(-ANGLE_SPREAD, ANGLE_SPREAD))
    const length = 6 + near * 16
    // the wind blows drops rightwards, so they also come in from beyond the left edge
    const lean = Math.tan(angle) * height
    return {
      x: random(-lean, width),
      y: anywhere ? random(-length, height) : random(-height * 0.25, 0) - length,
      speed: SLOWEST + near * (FASTEST - SLOWEST) * random(0.85, 1.15),
      angle,
      length,
      width: 1 + near * 0.8,
      alpha: random(0.15, 0.3) + near * 0.45,
    }
  }

  // Moves and draws the drops. `strength` (0 to 1) fades the rain in and out.
  update(delta, strength, still) {
    const g = this.graphics
    g.clear()
    if (strength <= 0.01) {
      this.drops.length = 0
      return
    }
    const cam = this.scene.cameras.main
    const view = cam.worldView
    const zoom = cam.zoom
    const width = view.width * zoom
    const height = view.height * zoom

    // as many drops as the screen size calls for
    const wanted = Math.min(MOST_DROPS, Math.round((width * height) / AREA_PER_DROP))
    const starting = this.drops.length === 0
    while (this.drops.length < wanted) this.drops.push(this.spawn(width, height, starting))
    this.drops.length = wanted

    const seconds = still ? 0 : delta / 1000
    this.gustClock += seconds
    const gust = Phaser.Math.DegToRad(GUST * Math.sin(this.gustClock * 0.8))

    for (const [i, drop] of this.drops.entries()) {
      const angle = drop.angle + gust
      const dx = Math.sin(angle)
      const dy = Math.cos(angle)
      drop.x += dx * drop.speed * seconds
      drop.y += dy * drop.speed * seconds
      if (drop.y > height || drop.x > width + drop.length) {
        this.drops[i] = this.spawn(width, height, false)
        continue
      }
      // screen px to map px
      const x = view.x + drop.x / zoom
      const y = view.y + drop.y / zoom
      g.lineStyle(drop.width / zoom, 0xe1eeff, drop.alpha * strength)
      g.lineBetween(x, y, x - (dx * drop.length) / zoom, y - (dy * drop.length) / zoom)
    }
  }
}
