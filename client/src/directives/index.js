// Scaffolded with AI assistance (Phase 1) — see AI_USAGE.md
import { vPop } from './pop'
import { vWiggle } from './wiggle'

/** Registers the shared motion vocabulary globally: v-pop and v-wiggle. */
export function registerMotionDirectives(app) {
  app.directive('pop', vPop)
  app.directive('wiggle', vWiggle)
}
