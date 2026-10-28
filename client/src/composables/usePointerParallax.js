// Scaffolded with AI assistance — see AI_USAGE.md
import { onBeforeUnmount, onMounted, unref } from 'vue'
import { prefersReducedMotion } from '@/lib/motion'

/**
 * Mouse parallax: sets --px and --py on the element (-1 to 1, where the mouse is across it),
 * easing towards the mouse each frame. Layers inside move by their own depth with
 * `translate: calc(var(--px) * 20px) …`. Touch and pen leave it at rest; so does reduced motion.
 */
export function usePointerParallax(rootRef, { ease = 0.08 } = {}) {
  let root = null
  let frame = 0
  const target = { x: 0, y: 0 }
  const now = { x: 0, y: 0 }

  function step() {
    now.x += (target.x - now.x) * ease
    now.y += (target.y - now.y) * ease
    root.style.setProperty('--px', now.x.toFixed(3))
    root.style.setProperty('--py', now.y.toFixed(3))
    const settled = Math.abs(target.x - now.x) < 0.001 && Math.abs(target.y - now.y) < 0.001
    frame = settled ? 0 : window.requestAnimationFrame(step)
  }

  function move(event) {
    if (event.pointerType !== 'mouse') return
    const box = root.getBoundingClientRect()
    target.x = ((event.clientX - box.left) / box.width) * 2 - 1
    target.y = ((event.clientY - box.top) / box.height) * 2 - 1
    if (!frame) frame = window.requestAnimationFrame(step)
  }

  function leave() {
    target.x = 0
    target.y = 0
    if (!frame) frame = window.requestAnimationFrame(step)
  }

  onMounted(() => {
    root = unref(rootRef)
    if (!root || prefersReducedMotion()) return
    root.addEventListener('pointermove', move)
    root.addEventListener('pointerleave', leave)
  })

  onBeforeUnmount(() => {
    window.cancelAnimationFrame(frame)
    root?.removeEventListener('pointermove', move)
    root?.removeEventListener('pointerleave', leave)
  })
}
