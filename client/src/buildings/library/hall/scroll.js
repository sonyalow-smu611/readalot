// Scaffolded with AI assistance — see AI_USAGE.md
// Moving along the hall. The hall is a sideways scrolling box, so touch swipes and trackpads work
// as they do on any page. On top of that:
//   a mouse wheel turned up and down moves the hall sideways
//   a mouse can drag the hall (and a drag does not also tap the bookcase it started on)
//   the left and right arrow keys move a third of the view
//   glideTo() eases the hall to a spot (the bar of places), at once with reduced motion
import { prefersReducedMotion } from '@/lib/motion'

const DRAG_START = 5 // px a press must move before it is a drag, not a tap
const GLIDE_MS = 480

export function createScroll(el) {
  let press = null
  let dragged = false
  let frame = 0

  function onWheel(event) {
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return
    event.preventDefault()
    cancelAnimationFrame(frame)
    el.scrollLeft += event.deltaY
  }

  function onPointerDown(event) {
    if (event.pointerType !== 'mouse' || event.button !== 0) return
    cancelAnimationFrame(frame)
    dragged = false
    press = { x: event.clientX, left: el.scrollLeft, id: event.pointerId }
  }

  function onPointerMove(event) {
    if (!press || event.pointerId !== press.id) return
    const dx = event.clientX - press.x
    if (!dragged && Math.abs(dx) < DRAG_START) return
    if (!dragged) {
      dragged = true
      el.setPointerCapture?.(event.pointerId)
      el.classList.add('is-dragging')
    }
    el.scrollLeft = press.left - dx
  }

  function onPointerUp(event) {
    if (!press || event.pointerId !== press.id) return
    press = null
    el.classList.remove('is-dragging')
  }

  function onClick(event) {
    if (!dragged) return
    dragged = false
    event.stopPropagation()
    event.preventDefault()
  }

  function onKey(event) {
    if (event.target !== el || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return
    event.preventDefault()
    const step = el.clientWidth / 3
    glideTo(el.scrollLeft + (event.key === 'ArrowRight' ? step : -step))
  }

  // eases the hall so its scroll is at `left` (kept within the hall's ends)
  function glideTo(left, { instant = false } = {}) {
    cancelAnimationFrame(frame)
    const target = Math.max(0, Math.min(el.scrollWidth - el.clientWidth, left))
    if (instant || prefersReducedMotion()) {
      el.scrollLeft = target
      return
    }
    const start = el.scrollLeft
    const began = performance.now()
    const step = (now) => {
      const t = Math.min(1, (now - began) / GLIDE_MS)
      el.scrollLeft = start + (target - start) * (1 - (1 - t) ** 3)
      if (t < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
  }

  el.addEventListener('wheel', onWheel, { passive: false })
  el.addEventListener('pointerdown', onPointerDown)
  el.addEventListener('pointermove', onPointerMove)
  el.addEventListener('pointerup', onPointerUp)
  el.addEventListener('pointercancel', onPointerUp)
  el.addEventListener('click', onClick, true)
  el.addEventListener('keydown', onKey)

  function dispose() {
    cancelAnimationFrame(frame)
    el.removeEventListener('wheel', onWheel)
    el.removeEventListener('pointerdown', onPointerDown)
    el.removeEventListener('pointermove', onPointerMove)
    el.removeEventListener('pointerup', onPointerUp)
    el.removeEventListener('pointercancel', onPointerUp)
    el.removeEventListener('click', onClick, true)
    el.removeEventListener('keydown', onKey)
  }

  return { glideTo, dispose }
}
