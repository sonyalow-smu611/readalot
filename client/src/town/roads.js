// Scaffolded with AI assistance — see AI_USAGE.md
// The roads as a little network of centre lines (map pixels), for the cars and the people
// walking. A Traveller picks a random way at every junction and keeps to one side of the road:
// cars drive on the left like in Singapore, walkers keep to a pavement.
import Phaser from 'phaser'
import { MAP_H, MAP_W } from './places.js'

// Junctions, and the places a road leaves the map (just past the edge).
const NODES = {
  westEnd: [-80, 1216],
  northCross: [1472, 1216],
  southCross: [1984, 1216],
  eastCross: [3392, 1216],
  eastEnd: [MAP_W + 80, 1216],
  northEnd: [1472, -80],
  lakeCross: [1984, 1856],
  southEnd: [1984, MAP_H + 80],
  lakeEnd: [-80, 1856],
  salonBend: [3392, 1984],
  salonEnd: [MAP_W + 80, 1984],
}

const ROADS = [
  ['westEnd', 'northCross'],
  ['northCross', 'southCross'],
  ['southCross', 'eastCross'],
  ['eastCross', 'eastEnd'],
  ['northCross', 'northEnd'],
  ['southCross', 'lakeCross'],
  ['lakeCross', 'southEnd'],
  ['lakeCross', 'lakeEnd'],
  ['eastCross', 'salonBend'],
  ['salonBend', 'salonEnd'],
]

const NEIGHBOURS = {}
for (const [a, b] of ROADS) {
  ;(NEIGHBOURS[a] ??= []).push(b)
  ;(NEIGHBOURS[b] ??= []).push(a)
}

// Where roads leave the map: cars come and go here, walkers turn round.
export const ROAD_ENDS = Object.keys(NEIGHBOURS).filter((id) => NEIGHBOURS[id].length === 1)
export const JUNCTIONS = Object.keys(NEIGHBOURS).filter((id) => NEIGHBOURS[id].length > 1)

// Every way out of every junction, shuffled: a different place to start for each car.
export function startingRoads() {
  const roads = JUNCTIONS.flatMap((from) => NEIGHBOURS[from].map((to) => ({ from, to })))
  return Phaser.Utils.Array.Shuffle(roads)
}

// Half a road is 64 px; the middle of a lane is 32 px out and the pavement 76 px out.
export const LANE = 32
export const PAVEMENT = 76

// Direction of travel from a to b, and the normal on its left (y points down the map).
function heading(a, b) {
  const [ax, ay] = NODES[a]
  const [bx, by] = NODES[b]
  const length = Math.hypot(bx - ax, by - ay)
  const dx = (bx - ax) / length
  const dy = (by - ay) / length
  return { dx, dy, nx: dy, ny: -dx }
}

const pick = (list) => list[Math.floor(Math.random() * list.length)]

export class Traveller {
  // Starts at node `from` heading for `to` (a random neighbour when left out). `offset` is how
  // far left of the centre line to keep; `inside` keeps the turn-round points on the map.
  constructor({ from, to, offset, inside = false }) {
    this.from = from
    this.to = to ?? pick(NEIGHBOURS[from])
    this.offset = offset
    this.inside = inside
    // +1 keeps to the left of the way you face, -1 to the right
    this.side = 1
  }

  start() {
    const h = heading(this.from, this.to)
    const [x, y] = NODES[this.from]
    return this.clamp([x + h.nx * this.offset * this.side, y + h.ny * this.offset * this.side])
  }

  // Moves on to the next node and returns { point, end }: where to head for, and whether that
  // is the end of a road (the edge of the map).
  next() {
    const a = this.from
    const b = this.to
    const ways = NEIGHBOURS[b].filter((id) => id !== a)
    const c = ways.length ? pick(ways) : a
    const end = !ways.length
    const into = heading(a, b)
    const out = heading(b, c)
    const turn = into.dx * out.dx + into.dy * out.dy
    // turning back puts the other side of the road on your left: swap so you stay on yours
    const sideOut = turn < -0.5 ? -this.side : this.side
    const o = this.offset
    let [x, y] = NODES[b]
    x += into.nx * o * this.side
    y += into.ny * o * this.side
    // a corner: where this lane meets the next road's lane
    if (Math.abs(turn) <= 0.5) {
      x += out.nx * o * sideOut
      y += out.ny * o * sideOut
    }
    this.from = b
    this.to = c
    this.side = sideOut
    return { point: this.clamp([x, y]), end }
  }

  clamp([x, y]) {
    if (!this.inside) return [x, y]
    // walkers are drawn from their feet up, so leave room above for their heads
    return [Math.min(Math.max(x, 30), MAP_W - 30), Math.min(Math.max(y, 140), MAP_H - 12)]
  }
}
