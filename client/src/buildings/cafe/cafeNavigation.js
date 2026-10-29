// AI-assisted pathfinding scaffold — review the furniture collision zones with your team.
// Coordinates match the 1200 × 820 desktop cafe artwork; never change for mobile.
// A* on a small grid plus line-of-sight smoothing. This module has no Vue or browser dependencies.
export const WORLD = Object.freeze({ width: 1200, height: 820 })
export const SPAWN = Object.freeze({ x: 600, y: 778 })
export const WALK_SPEED = 175 // World pixels / second; camera zoom never changes while moving.
export const SEATS = Object.freeze([
  { id: 'booth-1', x: 170, y: 386, approach: { x: 168, y: 486 } },
  { id: 'booth-2', x: 456, y: 386, approach: { x: 452, y: 486 } },
  { id: 'booth-3', x: 742, y: 386, approach: { x: 738, y: 486 } },
  { id: 'booth-4', x: 1028, y: 386, approach: { x: 1024, y: 486 } },
  { id: 'table-1', x: 150, y: 615, approach: { x: 150, y: 743 } },
  { id: 'table-2', x: 450, y: 615, approach: { x: 450, y: 743 } },
  { id: 'table-3', x: 750, y: 615, approach: { x: 750, y: 743 } },
  { id: 'table-4', x: 1050, y: 615, approach: { x: 1050, y: 743 } },
])

// Furniture occupies the blocked area; the avatar additionally needs breathing room.
// Booth geometry includes the upholstered seat and its foreground coffee table.
export const BLOCKED = Object.freeze([
  ...[45, 331, 617, 903].map((x) => ({ x: x - 6, y: 309, w: 262, h: 144 })),
  ...[150, 450, 750, 1050].map((x) => ({ x: x - 87, y: 581, w: 174, h: 126 })),
  { x: 13, y: 740, w: 116, h: 70 },
  { x: 1071, y: 740, w: 115, h: 70 },
  { x: 267, y: 698, w: 60, h: 69 },
  { x: 866, y: 698, w: 60, h: 69 },
])

export const RADIUS = 9
const CELL = 12
const MIN_Y = 290
const MAX_Y = 802
const MIN_X = 16
const MAX_X = WORLD.width - 16

export function walkable(x, y) {
  if (x < MIN_X || x > MAX_X || y < MIN_Y || y > MAX_Y) return false
  return !BLOCKED.some((r) => x + RADIUS > r.x && x - RADIUS < r.x + r.w &&
    y + RADIUS > r.y && y - RADIUS < r.y + r.h)
}

// A straight segment is clear only when the entire avatar fits along it.
export function clearSegment(a, b) {
  const distance = Math.hypot(b.x - a.x, b.y - a.y)
  const steps = Math.max(1, Math.ceil(distance / 5))
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    if (!walkable(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)) return false
  }
  return true
}

const dirs = [
  [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
  [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2],
]
const toXY = (ix, iy) => ({ x: MIN_X + ix * CELL, y: MIN_Y + iy * CELL })
const toNode = (p) => [Math.round((p.x - MIN_X) / CELL), Math.round((p.y - MIN_Y) / CELL)]
const key = (x, y) => `${x},${y}`

export function findCafePath(from, to) {
  if (!walkable(from.x, from.y) || !walkable(to.x, to.y)) return []
  if (clearSegment(from, to)) return [{ ...to }]

  const [sx, sy] = toNode(from)
  const [gx, gy] = toNode(to)
  const start = { x: sx, y: sy, g: 0, f: 0 }
  const pending = [start]
  const best = new Map([[key(sx, sy), 0]])
  const parents = new Map()
  const settled = new Set()
  const heuristic = (x, y) => Math.hypot(x - gx, y - gy)
  start.f = heuristic(sx, sy)

  let goal = null
  const maxIterations = 18000
  for (let iter = 0; pending.length && iter < maxIterations; iter++) {
    // Small cafe grid: this direct min scan keeps the implementation easy to audit.
    let minIndex = 0
    for (let i = 1; i < pending.length; i++) if (pending[i].f < pending[minIndex].f) minIndex = i
    const cur = pending.splice(minIndex, 1)[0]
    const id = key(cur.x, cur.y)
    if (settled.has(id)) continue
    settled.add(id)
    const currentPoint = toXY(cur.x, cur.y)

    if (clearSegment(currentPoint, to)) {
      goal = id
      break
    }

    for (const [dx, dy, weight] of dirs) {
      const nx = cur.x + dx, ny = cur.y + dy
      const nextPoint = toXY(nx, ny)
      const nid = key(nx, ny)
      if (settled.has(nid) || !walkable(nextPoint.x, nextPoint.y)) continue
      // Check the entire diagonal, not just its endpoint: no corner cutting.
      if (!clearSegment(currentPoint, nextPoint)) continue
      const g = cur.g + weight
      if (g >= (best.get(nid) ?? Infinity)) continue
      best.set(nid, g)
      parents.set(nid, id)
      pending.push({ x: nx, y: ny, g, f: g + heuristic(nx, ny) })
    }
  }

  if (!goal) return []
  const reversed = []
  let current = goal
  while (current && current !== key(sx, sy)) {
    const [ix, iy] = current.split(',').map(Number)
    reversed.push(toXY(ix, iy))
    current = parents.get(current)
  }
  reversed.reverse()
  reversed.push({ ...to })

  // Greedily skip intermediate grid points when a clear walking segment exists.
  const smooth = []
  let anchor = { ...from }
  for (let i = 0; i < reversed.length;) {
    let farthest = i
    for (let j = reversed.length - 1; j >= i; j--) {
      if (clearSegment(anchor, reversed[j])) { farthest = j; break }
    }
    const point = reversed[farthest]
    if (!point || !clearSegment(anchor, point)) return []
    smooth.push(point)
    anchor = point
    i = farthest + 1
  }
  return smooth
}
