// Scaffolded with AI assistance — see AI_USAGE.md
import { onBeforeUnmount, onMounted, unref } from 'vue'
import { prefersReducedMotion } from '@/lib/motion'

/**
 * Scroll-linked fade for full-screen sections inside a scrolling container: each item marked
 * `data-fade` is clear while it sits in the middle of the view, and fades (drifting slightly)
 * as it scrolls in from below or away off the top. With reduced motion everything stays clear.
 */
export function useScrollFade(scrollerRef, { selector = '[data-fade]', hold = 0.15, span = 0.4, drift = 40 } = {}) {
  let frame = 0
  let scroller = null

  function paint() {
    frame = 0
    const view = scroller.getBoundingClientRect()
    const middle = view.top + view.height / 2
    for (const item of scroller.querySelectorAll(selector)) {
      const box = item.getBoundingClientRect()
      // how far the item's middle is from the view's middle, in screen heights
      const offset = (box.top + box.height / 2 - middle) / view.height
      const fade = Math.min(1, Math.max(0, (Math.abs(offset) - hold) / span))
      item.style.opacity = String(1 - fade)
      item.style.transform = `translateY(${(offset > 0 ? fade : -fade) * drift}px)`
    }
  }

  function schedule() {
    if (!frame) frame = window.requestAnimationFrame(paint)
  }

  onMounted(() => {
    scroller = unref(scrollerRef)
    if (!scroller || prefersReducedMotion()) return
    scroller.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    paint()
  })

  onBeforeUnmount(() => {
    window.cancelAnimationFrame(frame)
    scroller?.removeEventListener('scroll', schedule)
    window.removeEventListener('resize', schedule)
  })
}
