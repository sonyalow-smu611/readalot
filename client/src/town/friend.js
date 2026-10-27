// Scaffolded with AI assistance — see AI_USAGE.md
// A friend who is online, out walking: a TownReader (reader.js) with an orange glow, setting off
// from their own front door, with their name (and a green online dot) always floating over their
// head. Tapping them calls onTap; while you talk they stand still and face you.
import { SKY_DEPTH } from './sky.js'
import { TownReader } from './reader.js'

const ORANGE = 0xf08a3c
const ONLINE_GREEN = 0x3fae5a
// how far above their feet the name floats: the character is 116 px tall
const TAG_ABOVE = 140

function nameTag(scene, name) {
  const text = scene.add.text(0, 0, name, {
    fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
    fontSize: '20px',
    fontStyle: 'bold',
    color: '#3f2e24',
  })
  // room on the left for the online dot
  const dot = 16
  text.setOrigin(0.5).setResolution(2).setX(dot / 2)
  const w = text.width + 24 + dot
  const h = 32
  const pill = scene.add.graphics()
  pill.fillStyle(0xfffdf9, 0.96).fillRoundedRect(-w / 2, -h / 2, w, h, h / 2)
  pill.lineStyle(3, ORANGE, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2)
  pill.fillStyle(ONLINE_GREEN, 1).fillCircle(-w / 2 + 16, 0, 5.5)
  // over the walkers and the night, under the buildings' name tags
  return scene.add.container(0, 0, [pill, text]).setDepth(SKY_DEPTH + 29)
}

export class Friend extends TownReader {
  // friend: { id, displayName, character }; at: [x, y] to start from
  constructor(scene, { friend, at, reducedMotion, onTap }) {
    super(scene, { character: friend.character, at, glow: '#ff9a3c', light: 0xffb060, reducedMotion })
    this.id = friend.id
    this.held = false
    this.tag = nameTag(scene, friend.displayName.split(' ')[0])
    this.sync()
    this.body.setInteractive({ useHandCursor: true })
    this.body.on('pointerup', onTap)
    this.rest()
  }

  sync() {
    super.sync()
    this.tag?.setPosition(this.body.x, this.body.y - TAG_ABOVE)
  }

  rest() {
    if (!this.held) super.rest()
  }

  // Stops to talk, turned towards (x, y).
  hold([x]) {
    this.held = true
    this.stop()
    if (Math.abs(x - this.body.x) > 1) this.body.setFlipX(x < this.body.x)
  }

  release() {
    this.held = false
    this.rest()
  }

  destroy() {
    super.destroy()
    this.tag.destroy()
  }
}
