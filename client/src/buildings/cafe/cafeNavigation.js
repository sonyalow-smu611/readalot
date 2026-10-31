// AI-assisted starter — teammate review required under PROJECT.md / AI_USAGE.md.
// This wide 1200 x 600 cafe is the SAME world on desktop and mobile.
// Collision rectangles match the furniture drawn in cafeWeatherArt.js.
export const WORLD = Object.freeze({ width: 1200, height: 600 })
export const SPAWN = Object.freeze({ x: 600, y: 568 })
export const WALK_SPEED = 160

// The four demo readers occupy 0, 2, 4, 6. Other seats are for existing nearby API profiles.
export const SEATS = Object.freeze([
  { id: 'booth-1', x: 140, y: 285, approach: { x: 140, y: 374 } },
  { id: 'booth-2', x: 372, y: 285, approach: { x: 372, y: 374 } },
  { id: 'booth-3', x: 604, y: 285, approach: { x: 604, y: 374 } },
  { id: 'booth-4', x: 836, y: 285, approach: { x: 836, y: 374 } },
  { id: 'table-1', x: 150, y: 484, approach: { x: 150, y: 564 } },
  { id: 'table-2', x: 420, y: 484, approach: { x: 420, y: 564 } },
  { id: 'table-3', x: 700, y: 484, approach: { x: 700, y: 564 } },
  { id: 'table-4', x: 980, y: 484, approach: { x: 980, y: 564 } },
])

// Wall, bar, bookshelves, seating, and table/chair collision envelopes.
export const BLOCKED = Object.freeze([
  { x: 0, y: 0, w: 1200, h: 210 },
  ...[40, 272, 504, 736].map((x) => ({ x, y: 217, w: 200, h: 119 })),
  { x: 952, y: 210, w: 246, h: 135 },
  ...[150, 420, 700, 980].map((x) => ({ x: x - 87, y: 434, w: 174, h: 103 })),
  { x: 0, y: 524, w: 100, h: 76 },
  { x: 1098, y: 526, w: 102, h: 74 },
  { x: 274, y: 513, w: 32, h: 35 },
  { x: 828, y: 513, w: 32, h: 35 },
])

export const RADIUS = 8
const CELL = 10
const MIN_X = 12
const MAX_X = 1188
const MIN_Y = 214
const MAX_Y = 585
const NODE_COLS = Math.floor((MAX_X - MIN_X) / CELL) + 1
const NODE_ROWS = Math.floor((MAX_Y - MIN_Y) / CELL) + 1

export function walkable(x, y) {
  if (x < MIN_X || x > MAX_X || y < MIN_Y || y > MAX_Y) return false
  return !BLOCKED.some((rect) => (
    x + RADIUS > rect.x && x - RADIUS < rect.x + rect.w &&
    y + RADIUS > rect.y && y - RADIUS < rect.y + rect.h
  ))
}

// Check the entire segment to prevent passing through corners when smoothing the route.
export function clearSegment(a, b) {
  const distance = Math.hypot(b.x - a.x, b.y - a.y)
  const samples = Math.max(1, Math.ceil(distance / 4))
  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    if (!walkable(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)) return false
  }
  return true
}

const directions = [
  [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
  [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2],
]
const coordinates = (ix, iy) => ({ x: MIN_X + ix * CELL, y: MIN_Y + iy * CELL })
const indices = (p) => [Math.round((p.x - MIN_X) / CELL), Math.round((p.y - MIN_Y) / CELL)]
const key = (x, y) => `${x},${y}`

export function findCafePath(from, to) {
  if (!walkable(from.x, from.y) || !walkable(to.x, to.y)) return []
  if (clearSegment(from, to)) return [{ ...to }]

  const [sx, sy] = indices(from)
  const [gx, gy] = indices(to)
  const start = { x: sx, y: sy, g: 0, f: 0 }
  start.f = Math.hypot(gx - sx, gy - sy)
  const queue = [start]
  const best = new Map([[key(sx, sy), 0]])
  const parent = new Map()
  const visited = new Set()
  let found = null

  // The grid is small, making a simple A* implementation easier for teammates to review.
  for (let step = 0; queue.length && step < 20000; step++) {
    let smallest = 0
    for (let i = 1; i < queue.length; i++) if (queue[i].f < queue[smallest].f) smallest = i
    const current = queue.splice(smallest, 1)[0]
    const currentKey = key(current.x, current.y)
    if (visited.has(currentKey)) continue
    visited.add(currentKey)
    const currentPosition = coordinates(current.x, current.y)
    if (clearSegment(currentPosition, to)) { found = currentKey; break }

    for (const [dx, dy, cost] of directions) {
      const nx = current.x + dx
      const ny = current.y + dy
      if (nx < 0 || nx >= NODE_COLS || ny < 0 || ny >= NODE_ROWS) continue
      const nextPosition = coordinates(nx, ny)
      const nextKey = key(nx, ny)
      if (visited.has(nextKey) || !walkable(nextPosition.x, nextPosition.y)) continue
      if (!clearSegment(currentPosition, nextPosition)) continue
      const g = current.g + cost
      if (g >= (best.get(nextKey) ?? Infinity)) continue
      best.set(nextKey, g)
      parent.set(nextKey, currentKey)
      queue.push({ x: nx, y: ny, g, f: g + Math.hypot(nx - gx, ny - gy) })
    }
  }
  if (!found) return []

  const route = []
  let node = found
  while (node && node !== key(sx, sy)) {
    const [ix, iy] = node.split(',').map(Number)
    route.push(coordinates(ix, iy))
    node = parent.get(node)
  }
  route.reverse()
  route.push({ ...to })

  const smooth = []
  let anchor = { ...from }
  for (let i = 0; i < route.length;) {
    let furthest = i
    for (let j = route.length - 1; j >= i; j--) {
      if (clearSegment(anchor, route[j])) { furthest = j; break }
    }
    if (!clearSegment(anchor, route[furthest])) return []
    smooth.push(route[furthest])
    anchor = route[furthest]
    i = furthest + 1
  }
  return smooth
}
