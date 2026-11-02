// Scaffolded with AI assistance — see AI_USAGE.md
// Where the reader's own character can stand when you tap the map. The picture has no record of
// what can be walked on, so this works it out from what map-data.json does know: the buildings,
// the lake, the pond and the river, with its bridges. A tap on any of those walks you as far
// towards it as you can get.
import mapData from './map-data.json'
import { keepInside, walkingRoute } from './roads.js'

// how far either side of the river's middle counts as water (water.js keeps currents inside 54)
const RIVER_HALF = 64
// how often a straight line is checked, in map pixels: less than a character's width
const CHECK_EVERY = 12
// a tap closer than this, with nothing in the way, is walked straight to rather than by the pavement
const SHORT_WALK = 500

const gap = ([ax, ay], [bx, by]) => Math.hypot(bx - ax, by - ay)
const inBox = ([x, y], box) => x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h
const inOval = ([x, y], { x: cx, y: cy, rx, ry }) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1

function nearRiver([x, y]) {
  return mapData.river.some(([ax, ay], i) => {
    const next = mapData.river[i + 1]
    if (!next) return false
    const [bx, by] = next
    const t = Math.min(1, Math.max(0, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2 || 1)))
    return Math.hypot(x - (ax + t * (bx - ax)), y - (ay + t * (by - ay))) < RIVER_HALF
  })
}

// Whether the point is on a building or in water. `emptyPlots`: art names of friends' plots with
// no house on them yet, which are plain lawn.
function blocked(point, emptyPlots) {
  if (Object.entries(mapData.buildings).some(([art, box]) => !emptyPlots.includes(art) && inBox(point, box))) return true
  if (mapData.bridges.some((bridge) => inBox(point, bridge))) return false
  if (mapData.overLake.some((pier) => inBox(point, pier))) return false
  return inOval(point, mapData.lake) || inOval(point, mapData.pond) || nearRiver(point)
}

// The furthest point along the straight line from `from` to `to` you can reach.
function furthestClear(from, to, emptyPlots) {
  const steps = Math.ceil(gap(from, to) / CHECK_EVERY)
  let reached = from
  for (let i = 1; i <= steps; i++) {
    const point = [from[0] + ((to[0] - from[0]) * i) / steps, from[1] + ((to[1] - from[1]) * i) / steps]
    if (blocked(point, emptyPlots)) break
    reached = point
  }
  return reached
}

// The corners to walk through to get as near `spot` as you can: straight there if it's close and
// nothing is in the way, otherwise along the pavements and across the last stretch.
export function routeTo(from, spot, emptyPlots = []) {
  const to = keepInside(spot)
  const short = gap(from, to) <= SHORT_WALK
  if (short && !blocked(from, emptyPlots) && gap(furthestClear(from, to, emptyPlots), to) < 1) return [to]
  const points = walkingRoute(from, to)
  const lastCorner = points[points.length - 2] ?? from
  return [...points.slice(0, -1), furthestClear(lastCorner, to, emptyPlots)]
}
