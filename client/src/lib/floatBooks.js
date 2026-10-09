import { prefersReducedMotion } from '@/lib/motion'

const TONES = [
  { cover: '#3f2e24', band: '#c49264', page: '#e7d3bc' },
  { cover: '#6b4a34', band: '#fffdf9', page: '#efe4d4' },
  { cover: '#9a7a55', band: '#3f2e24', page: '#fffdf9' },
  { cover: '#2c241e', band: '#d9b256', page: '#f4efe6' },
]

// Spots are percentages. Each one is a book, spaced through the open background.
export function bookSpots(points) {
  return points.map((point, n) => {
    const tone = TONES[n % TONES.length]
    return {
      id: `${point[0]}-${point[1]}-${n}`,
      left: point[0],
      top: point[1],
      w: n % 2 === 0 ? 22 : 26,
      h: n % 2 === 0 ? 30 : 36,
      tilt: ((n % 5) - 2) * 7,
      phase: n * 1.35,
      period: 6800 + (n % 4) * 1100,
      ...tone,
    }
  })
}

// The cursor shoves a nearby book aside. That new spot is kept; the book does not spring back.
export function mountFloatingBooks(root) {
  if (!root || prefersReducedMotion()) return () => {}
  const books = [...root.querySelectorAll('[data-flyer]')]
  const slide = new WeakMap()
  books.forEach((el) => slide.set(el, { x: 0, y: 0, drift: 1, nudged: false }))
  let pointer = null
  let raf = 0

  function onMove(event) {
    const bounds = root.getBoundingClientRect()
    const inside = event.clientX >= bounds.left && event.clientX <= bounds.right
      && event.clientY >= bounds.top && event.clientY <= bounds.bottom
    pointer = inside ? { x: event.clientX, y: event.clientY } : null
  }

  function frame(now) {
    books.forEach((el) => {
      const phase = Number(el.dataset.phase) || 0
      const period = Number(el.dataset.period) || 8000
      const tilt = Number(el.dataset.tilt) || 0
      const parent = el.offsetParent?.getBoundingClientRect()
      const restX = (parent?.left || 0) + el.offsetLeft + el.offsetWidth / 2
      const restY = (parent?.top || 0) + el.offsetTop + el.offsetHeight / 2
      const home = slide.get(el)
      if (pointer) {
        const dx = restX + home.x - pointer.x
        const dy = restY + home.y - pointer.y
        const dist = Math.hypot(dx, dy)
        const radius = 72
        if (dist < radius) {
          const nx = dist < 1 ? 0 : dx / dist
          const ny = dist < 1 ? -1 : dy / dist
          const force = (radius - dist) / radius
          home.x += nx * force * 5
          home.y += ny * force * 5
          home.nudged = true
        }
      }
      if (home.nudged) home.drift += (0 - home.drift) * 0.25
      const minX = -el.offsetLeft
      const maxX = root.clientWidth - el.offsetLeft - el.offsetWidth
      const minY = -el.offsetTop
      const maxY = root.clientHeight - el.offsetTop - el.offsetHeight
      home.x = Math.min(maxX, Math.max(minX, home.x))
      home.y = Math.min(maxY, Math.max(minY, home.y))
      const floatX = Math.sin(now / period + phase) * 8 * home.drift
      const floatY = Math.cos(now / (period * 0.8) + phase) * 14 * home.drift
      el.style.transform = `translate(${floatX + home.x}px, ${floatY + home.y}px) rotate(${tilt}deg)`
    })
    raf = requestAnimationFrame(frame)
  }

  window.addEventListener('pointermove', onMove)
  raf = requestAnimationFrame(frame)
  return () => {
    window.removeEventListener('pointermove', onMove)
    cancelAnimationFrame(raf)
  }
}
