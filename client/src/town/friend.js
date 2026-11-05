// Scaffolded with AI assistance — see AI_USAGE.md
// A reader out walking: a TownReader (reader.js) with their name always floating over their head,
// and a green dot when they're online. A friend glows orange and sets off from their own front
// door; a reader nearby glows blue, and where they walk says nothing about where they really are.
// Tapping one calls onTap; while you talk they stand still and face you.
import { TownReader } from './reader.js'

const LOOKS = {
  friend: { ring: '#f08a3c', glow: '#ff9a3c', light: 0xffb060 },
  nearby: { ring: '#3c8fd6', glow: '#5aa9e6', light: 0x9fd0ff },
}
// how far above their feet the name's middle floats: the character is 116 px tall
const TAG_ABOVE = 140

export class Friend extends TownReader {
  // friend: { id, displayName, character, online }; kind: 'friend' or 'nearby'; at: [x, y] to
  // start from
  constructor(scene, { friend, kind = 'friend', at, reducedMotion, onTap }) {
    const { ring, glow, light } = LOOKS[kind]
    super(scene, { character: friend.character, at, glow, light, reducedMotion })
    this.id = friend.id
    this.kind = kind
    this.held = false
    // their name, as sharp page text over the map (labels.js)
    this.tag = `walker:${friend.id}`
    scene.labels.set(this.tag, { text: friend.displayName.split(' ')[0], look: 'walker', accent: ring, online: Boolean(friend.online) })
    this.sync()
    this.body.setInteractive({ useHandCursor: true })
    this.body.on('pointerup', onTap)
    this.rest()
  }

  sync() {
    super.sync()
    if (this.tag) this.scene.labels.move(this.tag, this.body.x, this.body.y - TAG_ABOVE)
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
    this.scene.labels.remove(this.tag)
  }
}
