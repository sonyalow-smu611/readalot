// Looking around the room from one spot: drag to turn, pinch or scroll to zoom, arrow keys
// and +/- from the keyboard, and a glide to face something.
import * as THREE from 'three'
import { gsap, prefersReducedMotion } from '@/lib/motion'

const PITCH_LIMIT = THREE.MathUtils.degToRad(70)
// min: narrow enough to pick out a book from where the camera stands, across the room
export const FOV = { min: 8, max: 80, focus: 48 }
// how far a pointer must travel before a press counts as a drag (and not a tap)
export const DRAG_THRESHOLD = 6

export function createLook(camera, element, { onChange } = {}) {
  const view = { yaw: 0, pitch: 0, fov: camera.fov }
  const pointers = new Map()
  let pinchFrom = null
  let glide = null
  let dragged = false

  function apply() {
    view.pitch = THREE.MathUtils.clamp(view.pitch, -PITCH_LIMIT, PITCH_LIMIT)
    view.fov = THREE.MathUtils.clamp(view.fov, FOV.min, FOV.max)
    camera.rotation.set(view.pitch, view.yaw, 0, 'YXZ')
    if (camera.fov !== view.fov) {
      camera.fov = view.fov
      camera.updateProjectionMatrix()
    }
    onChange?.()
  }

  // starts facing the way the Blender camera faced
  function setFrom(quaternion, fov) {
    const euler = new THREE.Euler().setFromQuaternion(quaternion, 'YXZ')
    view.yaw = euler.y
    view.pitch = euler.x
    view.fov = fov
    apply()
  }

  // degrees of turn per pixel dragged, so the room moves with the finger at any zoom
  function perPixel() {
    return THREE.MathUtils.degToRad(view.fov) / element.clientHeight
  }

  function stopGlide() {
    glide?.kill()
    glide = null
  }

  function onDown(event) {
    if (event.button != null && event.button !== 0) return
    stopGlide()
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY })
    if (pointers.size === 1) dragged = false
    if (pointers.size === 2) pinchFrom = { distance: spread(), fov: view.fov }
  }

  function onMove(event) {
    const pointer = pointers.get(event.pointerId)
    if (!pointer) return
    const dx = event.clientX - pointer.x
    const dy = event.clientY - pointer.y
    pointer.x = event.clientX
    pointer.y = event.clientY
    if (Math.hypot(event.clientX - pointer.startX, event.clientY - pointer.startY) > DRAG_THRESHOLD) dragged = true

    if (pointers.size === 2 && pinchFrom) {
      view.fov = pinchFrom.fov * (pinchFrom.distance / Math.max(1, spread()))
      apply()
      return
    }
    if (!dragged) return
    // dragging the room to the right turns you to the left, as when pulling a photo sphere
    view.yaw += dx * perPixel()
    view.pitch += dy * perPixel()
    apply()
  }

  function onUp(event) {
    pointers.delete(event.pointerId)
    if (pointers.size < 2) pinchFrom = null
  }

  function spread() {
    const [a, b] = [...pointers.values()]
    return Math.hypot(a.x - b.x, a.y - b.y)
  }

  function onWheel(event) {
    event.preventDefault()
    stopGlide()
    view.fov += event.deltaY * 0.03
    apply()
  }

  function onKey(event) {
    const step = THREE.MathUtils.degToRad(10)
    const keys = {
      ArrowLeft: () => (view.yaw += step),
      ArrowRight: () => (view.yaw -= step),
      ArrowUp: () => (view.pitch += step),
      ArrowDown: () => (view.pitch -= step),
      '+': () => (view.fov -= 5),
      '=': () => (view.fov -= 5),
      '-': () => (view.fov += 5),
    }
    const run = keys[event.key]
    if (!run) return
    event.preventDefault()
    stopGlide()
    run()
    apply()
  }

  // Turns to face `point` and zooms to `fov`, taking the short way round.
  function lookAt(point, fov = FOV.focus) {
    stopGlide()
    const direction = point.clone().sub(camera.position).normalize()
    const yaw = Math.atan2(-direction.x, -direction.z)
    const pitch = Math.asin(THREE.MathUtils.clamp(direction.y, -1, 1))
    let turn = yaw - view.yaw
    turn = Math.atan2(Math.sin(turn), Math.cos(turn))
    const target = { yaw: view.yaw + turn, pitch, fov }
    if (prefersReducedMotion()) {
      Object.assign(view, target)
      apply()
      return
    }
    glide = gsap.to(view, { ...target, duration: 0.7, ease: 'power2.inOut', onUpdate: apply })
  }

  element.addEventListener('pointerdown', onDown)
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', onUp)
  element.addEventListener('wheel', onWheel, { passive: false })
  element.addEventListener('keydown', onKey)

  return {
    view,
    setFrom,
    lookAt,
    // true when the press that just ended moved far enough to be a drag
    wasDrag: () => dragged,
    dispose() {
      stopGlide()
      element.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      element.removeEventListener('wheel', onWheel)
      element.removeEventListener('keydown', onKey)
    },
  }
}
