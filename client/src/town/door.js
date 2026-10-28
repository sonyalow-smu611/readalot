// Scaffolded with AI assistance — see AI_USAGE.md
// A building's front door swinging open, with lamplight inside, as your character goes in.
// Where each door is, and its colour, come from map-data.json (the map script records them).
import Phaser from 'phaser'
import mapData from './map-data.json'
import { shade } from '@/lib/avatar/draw.js'
import { SKY_DEPTH } from './sky.js'

const WARM = 0xffd27a
// how long the door takes to swing open, in ms
export const DOOR_OPENS = 560
const toColour = (hex) => Phaser.Display.Color.HexStringToColor(hex).color

const doorOf = (place) => mapData.doors[place.art ?? place.id] ?? null

// Where to go in: `front` is on the step in front of the door, `beside` is just to its right,
// out of the way while it swings open. A building with no door recorded is gone into from the
// middle of its front.
export function doorstep(place) {
  const door = doorOf(place)
  if (!door) {
    const front = [place.x + place.w / 2, place.y + place.h - 6]
    return { front, beside: front }
  }
  const y = door.y + door.h + 8
  return { front: [door.x + door.w / 2, y], beside: [door.x + door.w + 34, y] }
}

// Opens the place's door over the picture. Returns the doorway ({ x, y, w, h } in map pixels),
// so whoever walks in can be drawn in front of it and through it, or null when the building has
// no door recorded.
export function openDoor(scene, place) {
  const door = doorOf(place)
  if (!door) return null
  const { x, y, w, h } = door
  const depth = y + h
  // the room behind: dark, with a lamp lit inside
  scene.add.rectangle(x, y, w, h, 0x2b1d16).setOrigin(0).setDepth(depth)
  const lamp = scene.add.image(x + w / 2, y + h * 0.55, 'glow').setTint(WARM).setDisplaySize(w * 1.2, h * 1.1).setAlpha(0).setDepth(depth)
  // light spilling out onto the step, bright even after dark
  const spill = scene.add
    .image(x + w / 2, y + h, 'pool')
    .setTint(WARM)
    .setDisplaySize(w * 2.4, h * 0.7)
    .setBlendMode(Phaser.BlendModes.ADD)
    .setAlpha(0)
    .setDepth(SKY_DEPTH + 2)
  // a double door opens both ways from the middle; a single one swings on its left
  const leaves = (door.double ? [[x, w / 2, 1], [x + w, w / 2, -1]] : [[x, w, 1]]).map(([hinge, width, side]) =>
    drawLeaf(scene, hinge, y, width, h, door.colour, side).setDepth(depth),
  )
  scene.tweens.add({ targets: leaves, scaleX: 0.14, duration: DOOR_OPENS, ease: 'Cubic.easeInOut' })
  scene.tweens.add({ targets: lamp, alpha: 0.9, duration: DOOR_OPENS })
  scene.tweens.add({ targets: spill, alpha: 0.75, duration: DOOR_OPENS * 1.5 })
  return { x, y, w, h }
}

// One door leaf, drawn like the map's doors (see scripts/town-art/town.js), hinged at `hinge`:
// it reaches right of the hinge when side is 1 and left when -1, so squashing it swings it open.
function drawLeaf(scene, hinge, y, width, h, colour, side) {
  const left = side > 0 ? 0 : -width
  const leaf = scene.add.graphics({ x: hinge, y })
  leaf.fillStyle(toColour(colour)).fillRect(left, 0, width, h)
  leaf.fillStyle(toColour(shade(colour, 0.82)))
  leaf.fillRect(left + 6, 8, width - 14, h / 2 - 12)
  leaf.fillRect(left + 6, h / 2 + 4, width - 14, h / 2 - 12)
  // the handle, on the side away from the hinge
  leaf.fillStyle(0xe3b04b).fillRect(side > 0 ? left + width - 10 : left + 6, h / 2, 4, 6)
  return leaf
}
