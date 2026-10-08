// Scaffolded with AI assistance (Phase 1) — see AI_USAGE.md
import { gsap, prefersReducedMotion } from '@/lib/motion'

// Remember each element's listener so it can be removed on unmount.
const hoverHandlers = new WeakMap()

function wiggle(el) {
  if (prefersReducedMotion() || gsap.isTweening(el)) return
  // Wiggle around the element's resting tilt so pre-rotated stickers stay tilted.
  const rest = gsap.getProperty(el, 'rotation')
  gsap.to(el, {
    keyframes: { rotation: [rest, rest - 6, rest + 5, rest - 3, rest] },
    duration: 0.5,
    ease: 'power1.inOut',
  })
}

/** v-wiggle — a quick, flat (2D) wiggle when the pointer hovers the element. */
export const vWiggle = {
  mounted(el) {
    const handler = () => wiggle(el)
    hoverHandlers.set(el, handler)
    el.addEventListener('mouseenter', handler)
  },
  unmounted(el) {
    el.removeEventListener('mouseenter', hoverHandlers.get(el))
    hoverHandlers.delete(el)
    gsap.killTweensOf(el)
  },
}
