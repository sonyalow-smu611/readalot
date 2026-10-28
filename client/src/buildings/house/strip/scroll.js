// Moving along the room. The room is a sideways scrolling box, so touch swipes (with the phone's
// own glide), trackpads and the ends of the room all work as they do on any page. On top:
//   a mouse wheel turned up and down moves the room sideways
//   a mouse can drag the room, and it glides on a little when let go
//   the left and right arrow keys move a third of the view
//   glideTo() eases the room to a spot (the Places menu), at once with reduced motion
// While `locked()` (a book is out), none of these move the room.
import { prefersReducedMotion } from '@/lib/motion'

const DRAG_START = 5 // px a press must move before it is a drag, not a tap
const FRICTION = 0.92 // how much of its speed a glide keeps each frame
const GLIDE_MS = 480

export function createScroll(el, { locked = () => false, onMove = () => {} } = {}) {
  let press = null
  let dragged = false
  let frame = 0

  function stop() {
    cancelAnimationFrame(frame)
    frame = 0
  }

  function moved() {
    onMove()
  }

  function onWheel(event) {
    if (locked()) {
      event.preventDefault()
      return
    }
    // sideways scrolls (trackpads) the browser does itself; a plain wheel goes sideways too
    if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
      event.preventDefault()
      stop()
      el.scrollLeft += event.deltaY
      moved()
    }
  }

  function onPointerDown(event) {
    if (event.pointerType !== 'mouse' || event.button !== 0 || locked()) return
    stop()
    dragged = false
    press = { x: event.clientX, left: el.scrollLeft, id: event.pointerId, last: event.clientX, time: event.timeStamp, speed: 0 }
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
    const dt = Math.max(1, event.timeStamp - press.time)
    press.speed = (press.last - event.clientX) / dt
    press.last = event.clientX
    press.time = event.timeStamp
    el.scrollLeft = press.left - dx
    moved()
  }

  function onPointerUp(event) {
    if (!press || event.pointerId !== press.id) return
    const speed = press.speed * 16
    press = null
    el.classList.remove('is-dragging')
    if (dragged && Math.abs(speed) > 1 && !prefersReducedMotion()) glide(speed)
  }

  function glide(speed) {
    stop()
    const step = () => {
      speed *= FRICTION
      el.scrollLeft += speed
      if (Math.abs(speed) > 0.5) frame = requestAnimationFrame(step)
      else frame = 0
    }
    frame = requestAnimationFrame(step)
  }

  // a press that turned into a drag does not also tap what it started on
  function onClick(event) {
    if (!dragged) return
    dragged = false
    event.stopPropagation()
    event.preventDefault()
  }

  function onKey(event) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    if (locked()) return
    const step = el.clientWidth / 3
    glideTo(el.scrollLeft + (event.key === 'ArrowRight' ? step : -step))
  }

  // eases the room so its scroll is at `left` (clamped to the room's ends)
  function glideTo(left, { instant = false } = {}) {
    stop()
    const target = Math.max(0, Math.min(el.scrollWidth - el.clientWidth, left))
    if (instant || prefersReducedMotion()) {
      el.scrollLeft = target
      moved()
      return
    }
    const start = el.scrollLeft
    const began = performance.now()
    const step = (now) => {
      const t = Math.min(1, (now - began) / GLIDE_MS)
      const eased = 1 - (1 - t) ** 3
      el.scrollLeft = start + (target - start) * eased
      if (t < 1) frame = requestAnimationFrame(step)
      else frame = 0
    }
    frame = requestAnimationFrame(step)
    moved()
  }

  el.addEventListener('wheel', onWheel, { passive: false })
  el.addEventListener('pointerdown', onPointerDown)
  el.addEventListener('pointermove', onPointerMove)
  el.addEventListener('pointerup', onPointerUp)
  el.addEventListener('pointercancel', onPointerUp)
  el.addEventListener('click', onClick, true)
  el.addEventListener('keydown', onKey)

  function dispose() {
    stop()
    el.removeEventListener('wheel', onWheel)
    el.removeEventListener('pointerdown', onPointerDown)
    el.removeEventListener('pointermove', onPointerMove)
    el.removeEventListener('pointerup', onPointerUp)
    el.removeEventListener('pointercancel', onPointerUp)
    el.removeEventListener('click', onClick, true)
    el.removeEventListener('keydown', onKey)
  }

  return { glideTo, wasDrag: () => dragged, dispose }
}
