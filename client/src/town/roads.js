// Scaffolded with AI assistance — see AI_USAGE.md
// The roads as a little network of centre lines (map pixels), for the cars and the people
// walking. A Traveller picks a random way at every junction and keeps to one side of the road:
// cars drive on the left like in Singapore, walkers keep to a pavement. walkingRoute finds the
// way along the pavements to one place, for the reader's own character.
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

// --- Walking somewhere on purpose --------------------------------------------------------
// The reader's own character finds the shortest way along the pavements. People may also use
// the dead-end road west of the salon, which cars never take.
const WALK_NODES = { ...NODES, salonWest: [2830, 1984] }
const WALK_ROADS = [...ROADS, ['salonBend', 'salonWest']]
const WALK_NEIGHBOURS = {}
for (const [a, b] of WALK_ROADS) {
  ;(WALK_NEIGHBOURS[a] ??= []).push(b)
  ;(WALK_NEIGHBOURS[b] ??= []).push(a)
}

const keepInside = ([x, y]) => [Math.min(Math.max(x, 30), MAP_W - 30), Math.min(Math.max(y, 140), MAP_H - 12)]
const gap = ([ax, ay], [bx, by]) => Math.hypot(bx - ax, by - ay)

// The point on a road's centre line nearest to `point`, and the road it is on.
function nearestRoad([px, py]) {
  let best = null
  for (const [a, b] of WALK_ROADS) {
    const [ax, ay] = WALK_NODES[a]
    const [bx, by] = WALK_NODES[b]
    const t = Phaser.Math.Clamp(((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2), 0, 1)
    const on = keepInside([ax + t * (bx - ax), ay + t * (by - ay)])
    const distance = gap(on, [px, py])
    if (!best || distance < best.distance) best = { a, b, on, distance }
  }
  return best
}

// Junctions along the shortest way from road `start` to road `end` (Dijkstra; the town is small).
function junctionsBetween(start, end) {
  const dist = { [start.a]: gap(start.on, WALK_NODES[start.a]), [start.b]: gap(start.on, WALK_NODES[start.b]) }
  const prev = {}
  const todo = new Set(Object.keys(WALK_NODES))
  while (todo.size) {
    let node = null
    for (const id of todo) if (dist[id] !== undefined && (node === null || dist[id] < dist[node])) node = id
    if (node === null) break
    todo.delete(node)
    for (const next of WALK_NEIGHBOURS[node]) {
      const d = dist[node] + gap(WALK_NODES[node], WALK_NODES[next])
      if (dist[next] === undefined || d < dist[next]) {
        dist[next] = d
        prev[next] = node
      }
    }
  }
  const sameRoad = (start.a === end.a && start.b === end.b) || (start.a === end.b && start.b === end.a)
  const viaA = dist[end.a] + gap(WALK_NODES[end.a], end.on)
  const viaB = dist[end.b] + gap(WALK_NODES[end.b], end.on)
  if (sameRoad && gap(start.on, end.on) <= Math.min(viaA, viaB)) return []
  const path = []
  for (let id = viaA <= viaB ? end.a : end.b; id !== undefined; id = prev[id]) path.unshift(id)
  return path
}

const leftOf = (from, to) => {
  const length = gap(from, to)
  return [(to[1] - from[1]) / length, -(to[0] - from[0]) / length]
}
const offset = ([x, y], [nx, ny], by) => [x + nx * by, y + ny * by]

// The corners to walk through, from `from` to `to` (both [x, y] in map pixels): onto the nearest
// pavement, along it (crossing at junctions like the walkers do), across the road if `to` is on
// the other side, and up to `to` itself.
export function walkingRoute(from, to) {
  const start = nearestRoad(from)
  const end = nearestRoad(to)
  const line = [start.on, ...junctionsBetween(start, end).map((id) => keepInside(WALK_NODES[id])), end.on]
    // a start or end right on a junction would give a leg with no length
    .filter((point, i, all) => i === 0 || gap(point, all[i - 1]) > 1)
  if (line.length < 2) return [to]

  let normal = leftOf(line[0], line[1])
  // +1 keeps the pavement on your left, -1 on your right: whichever side you start on
  let side = (from[0] - line[0][0]) * normal[0] + (from[1] - line[0][1]) * normal[1] >= 0 ? 1 : -1
  const points = [offset(line[0], normal, side * PAVEMENT)]
  for (let i = 1; i < line.length - 1; i++) {
    const out = leftOf(line[i], line[i + 1])
    let corner = offset(line[i], normal, side * PAVEMENT)
    // a corner: where this pavement meets the next road's
    if (Math.abs(normal[0] * out[0] + normal[1] * out[1]) < 0.5) corner = offset(corner, out, side * PAVEMENT)
    points.push(corner)
    normal = out
  }
  const last = line[line.length - 1]
  points.push(offset(last, normal, side * PAVEMENT))
  // cross over if the place is on the other side of the road
  const across = (to[0] - last[0]) * normal[0] + (to[1] - last[1]) * normal[1] >= 0 ? 1 : -1
  if (across !== side) points.push(offset(last, normal, across * PAVEMENT))
  points.push(to)
  return points.map(keepInside)
}

// A random spot on a pavement somewhere in town, for wandering.
export function somewhereToWalk() {
  const [a, b] = pick(WALK_ROADS)
  const t = Math.random()
  const [ax, ay] = WALK_NODES[a]
  const [bx, by] = WALK_NODES[b]
  const on = [ax + t * (bx - ax), ay + t * (by - ay)]
  return keepInside(offset(on, leftOf(WALK_NODES[a], WALK_NODES[b]), (Math.random() < 0.5 ? 1 : -1) * PAVEMENT))
}
