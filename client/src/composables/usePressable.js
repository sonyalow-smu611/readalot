// Scaffolded with AI assistance (Phase 1) — see AI_USAGE.md
import { onBeforeUnmount, onMounted, unref } from 'vue'
import { gsap, prefersReducedMotion } from '@/lib/motion'

const RELEASE_EVENTS = ['pointerup', 'pointerleave', 'pointercancel']

/**
 * Press "squish": shrinks the element while held, then springs back with back.out(2).
 * Pointer events cover mouse, touch and pen with one code path.
 */
export function usePressable(targetRef, { scale = 0.95 } = {}) {
  let element = null

  function press() {
    if (element.disabled || prefersReducedMotion()) return
    gsap.to(element, { scale, duration: 0.12, ease: 'power2.out', overwrite: true })
  }

  function release() {
    if (prefersReducedMotion()) return
    gsap.to(element, { scale: 1, duration: 0.5, ease: 'back.out(2)', overwrite: true })
  }

  onMounted(() => {
    element = unref(targetRef)
    if (!element) return
    element.addEventListener('pointerdown', press)
    RELEASE_EVENTS.forEach((type) => element.addEventListener(type, release))
  })

  onBeforeUnmount(() => {
    if (!element) return
    element.removeEventListener('pointerdown', press)
    RELEASE_EVENTS.forEach((type) => element.removeEventListener(type, release))
    gsap.killTweensOf(element)
  })
}
