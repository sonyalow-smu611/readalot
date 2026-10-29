// Scaffolded with AI assistance — see AI_USAGE.md
import { onBeforeUnmount, onMounted, unref } from 'vue'
import { prefersReducedMotion } from '@/lib/motion'

/**
 * Scroll-linked fade for sections inside a scrolling container: each item marked `data-fade` is
 * clear while it covers the middle of the view (however tall it is), and fades (drifting
 * slightly) as it scrolls in from below or away off the top. `hold` and `span` are in screen
 * heights, measured from the middle of the view to the item's nearest edge. With reduced motion
 * everything stays clear.
 */
export function useScrollFade(scrollerRef, { selector = '[data-fade]', hold = 0.15, span = 0.35, drift = 40 } = {}) {
  let frame = 0
  let scroller = null

  function paint() {
    frame = 0
    const view = scroller.getBoundingClientRect()
    const middle = view.top + view.height / 2
    for (const item of scroller.querySelectorAll(selector)) {
      const box = item.getBoundingClientRect()
      // how far the item's nearest edge is from the view's middle, in screen heights (0 while
      // the item covers the middle)
      const offset = box.top > middle ? (box.top - middle) / view.height : box.bottom < middle ? (box.bottom - middle) / view.height : 0
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
