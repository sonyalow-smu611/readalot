// Scaffolded with AI assistance (Phase 1) — see AI_USAGE.md
// GSAP (GreenSock, free standard build) — timeline-based animation engine behind every
// motion effect in the app: pops, wiggles, reveals, press squish and the intro.
// All motion code imports gsap from here so reduced-motion handling stays in one place.
import { gsap } from 'gsap'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

// Checked at call time (not cached) so toggling the OS setting takes effect immediately.
export function prefersReducedMotion() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches
}

export { gsap }
