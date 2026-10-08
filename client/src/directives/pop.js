// Scaffolded with AI assistance (Phase 1) — see AI_USAGE.md
import { gsap, prefersReducedMotion } from '@/lib/motion'

/**
 * v-pop — the element pops in like a sticker being slapped down when it mounts.
 * Optional delay in seconds: v-pop="0.2"
 */
export const vPop = {
  mounted(el, binding) {
    if (prefersReducedMotion()) return
    gsap.from(el, {
      scale: 0.4,
      autoAlpha: 0,
      duration: 0.6,
      delay: Number(binding.value) || 0,
      ease: 'back.out(2.5)',
      clearProps: 'transform,opacity,visibility',
    })
  },
  unmounted(el) {
    gsap.killTweensOf(el)
  },
}
