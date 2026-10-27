// A book taken off the shelf: it lifts out of its row, flies up to the middle of the room as its
// front cover (the book's own cover picture once that has loaded, else cloth in its spine colour
// with its title), and the cover swings open on its pages. It goes back the same way, or fades
// when the book was taken off the shelf for good. Drawn in the page over the room, not on the
// canvas, so the cover picture stays sharp.
import { gsap } from '@/lib/motion'

const COVER = { width: 128, height: 184 }

export function createFlight(host) {
  let current = null

  function build(book, look) {
    const el = document.createElement('div')
    el.className = 'flight'
    el.setAttribute('aria-hidden', 'true')
    el.innerHTML = `
      <div class="flight__book">
        <div class="flight__pages"><i></i><i></i><i></i><i></i></div>
        <div class="flight__cover">
          <div class="flight__cloth"><span class="flight__title"></span><span class="flight__author"></span></div>
          <img class="flight__picture" alt="" />
          <div class="flight__inside"></div>
        </div>
      </div>`
    el.querySelector('.flight__cloth').style.background = look.colour
    el.querySelector('.flight__cloth').style.color = look.ink
    el.querySelector('.flight__title').textContent = book.title || 'Untitled'
    el.querySelector('.flight__author').textContent = book.authors?.[0] ?? ''
    // the book's own cover, only once it has loaded: a picture that fails keeps the cloth
    const url = book.cover || book.coverUrl
    const picture = el.querySelector('.flight__picture')
    if (url) {
      picture.addEventListener('load', () => picture.classList.add('is-loaded'), { once: true })
      picture.addEventListener('error', () => picture.remove(), { once: true })
      picture.src = url
    } else picture.remove()
    host.appendChild(el)
    return el
  }

  // `from`: the spine's box in px, relative to the host. Resolves once the book lies open.
  function open(from, book, look) {
    current?.el.remove()
    const el = build(book, look)
    const cover = el.querySelector('.flight__cover')
    const width = Math.min(COVER.width, host.clientWidth * 0.42)
    const height = width * (COVER.height / COVER.width)
    const to = {
      left: host.clientWidth / 2 - width / 2,
      // high in the room: the book's details cover the bottom of the screen
      top: Math.max(12, host.clientHeight * 0.3 - height / 2),
      width,
      height,
    }
    gsap.set(el, { left: from.left, top: from.top, width: from.width, height: from.height })
    return new Promise((resolve) => {
      const timeline = gsap.timeline({ onComplete: resolve })
      timeline
        .to(el, { top: from.top - 10, duration: 0.18, ease: 'power2.out' })
        .to(el, { ...to, duration: 0.6, ease: 'power2.inOut' })
        .to(cover, { rotateY: -160, duration: 0.55, ease: 'power2.inOut' }, '+=0.12')
      current = { el, timeline }
    })
  }

  // a tap while the book comes out: straight to it lying open
  function skip() {
    current?.timeline.progress(1)
  }

  // back onto the shelf, the way it came
  function close() {
    const flight = current
    if (!flight) return Promise.resolve()
    return new Promise((resolve) => {
      flight.timeline.eventCallback('onReverseComplete', () => {
        flight.el.remove()
        if (current === flight) current = null
        resolve()
      })
      flight.timeline.timeScale(1.6).reverse()
    })
  }

  // taken off the shelf for good: it fades where it is
  function fade() {
    const flight = current
    if (!flight) return Promise.resolve()
    return new Promise((resolve) => {
      gsap.to(flight.el, {
        opacity: 0,
        duration: 0.35,
        onComplete: () => {
          flight.el.remove()
          if (current === flight) current = null
          resolve()
        },
      })
    })
  }

  function dispose() {
    current?.timeline.kill()
    current?.el.remove()
    current = null
  }

  return { open, skip, close, fade, dispose }
}
