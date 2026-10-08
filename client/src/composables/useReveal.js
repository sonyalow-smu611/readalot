// Scaffolded with AI assistance (Phase 1) — see AI_USAGE.md
import { onBeforeUnmount, onMounted, unref } from 'vue'
import { gsap, prefersReducedMotion } from '@/lib/motion'

/**
 * Staggered "sticker drop" reveal for the children of a container (lists, shelves, pages).
 * Mark each item to animate with a `data-reveal` attribute (or pass a custom selector).
 */
export function useReveal(containerRef, { selector = '[data-reveal]', stagger = 0.08, y = 24, delay = 0 } = {}) {
  let context = null

  onMounted(() => {
    const container = unref(containerRef)
    if (!container || prefersReducedMotion()) return

    // gsap.context scopes the selector to this container and lets us undo everything on unmount.
    context = gsap.context(() => {
      gsap.from(selector, {
        autoAlpha: 0,
        y,
        scale: 0.96,
        duration: 0.55,
        delay,
        stagger,
        ease: 'back.out(1.7)',
        clearProps: 'transform,opacity,visibility',
      })
    }, container)
  })

  onBeforeUnmount(() => context?.revert())
}
