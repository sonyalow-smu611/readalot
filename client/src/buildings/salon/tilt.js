// Scaffolded with AI assistance — see AI_USAGE.md
// v-tilt: a salon card leans toward the mouse and pops when pressed (salon/pixel.css has the
// pop). Nothing moves with reduced motion, and touch only gets the pop.
import { prefersReducedMotion } from '@/lib/motion'

const LEAN_X = 5
const LEAN_Y = 6

export const vTilt = {
  mounted(el) {
    if (prefersReducedMotion()) return
    const move = (event) => {
      if (event.pointerType !== 'mouse') return
      const box = el.getBoundingClientRect()
      const dx = (event.clientX - box.left) / box.width - 0.5
      const dy = (event.clientY - box.top) / box.height - 0.5
      el.style.transform = `perspective(800px) rotateX(${-dy * LEAN_X}deg) rotateY(${dx * LEAN_Y}deg) translateY(-2px)`
    }
    const leave = () => {
      el.style.transform = ''
    }
    const press = () => {
      el.classList.remove('is-popping')
      // restart the pop if it is already playing
      void el.offsetWidth
      el.classList.add('is-popping')
    }
    const done = () => el.classList.remove('is-popping')
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    el.addEventListener('pointerdown', press)
    el.addEventListener('animationend', done)
    el.tilt = { move, leave, press, done }
  },
  unmounted(el) {
    if (!el.tilt) return
    el.removeEventListener('pointermove', el.tilt.move)
    el.removeEventListener('pointerleave', el.tilt.leave)
    el.removeEventListener('pointerdown', el.tilt.press)
    el.removeEventListener('animationend', el.tilt.done)
  },
}
