// Scaffolded with AI assistance — see AI_USAGE.md
// The names floating over friends' houses and readers out walking, drawn as page text over the
// map instead of on it. The map canvas has one pixel per CSS pixel and a phone stretches it two
// or three times, which blurs any text on it; text on the page stays sharp on any screen and at
// any zoom. The scene says where each name is in the town (move) and, after drawing each frame,
// puts them all where they are on screen (draw).
//
// Sizes are in map pixels, as the tags were drawn on the canvas, and grow and shrink with the
// camera's zoom (--z on the layer).
const LOOKS = {
  // over a friend's house: bigger, and it bobs
  house: { font: 26, height: 42, pad: 16, border: 4, dot: 14 },
  // over a reader out walking
  walker: { font: 20, height: 32, pad: 12, border: 3, dot: 11 },
}

export class NameLabels {
  // layer: the element over the canvas the names go in
  constructor(layer) {
    this.layer = layer
    // by key: { el, x, y }
    this.items = new Map()
    this.zoom = null
  }

  // Adds a name, or changes one already there. look: 'house' or 'walker'; accent: its ring colour
  // (a CSS colour); online puts a green dot before the name.
  set(key, { text, look, accent, online = false }) {
    let item = this.items.get(key)
    if (!item) {
      const el = document.createElement('div')
      el.className = `town-label town-label--${look}`
      el.innerHTML = '<span class="town-label__pill"><span class="town-label__dot"></span><span class="town-label__text"></span></span>'
      const size = LOOKS[look]
      for (const [name, value] of Object.entries(size)) el.style.setProperty(`--${name}`, String(value))
      // off screen until it has been placed
      el.style.transform = 'translate3d(-9999px, -9999px, 0)'
      this.layer?.appendChild(el)
      item = { el, x: 0, y: 0, placed: false }
      this.items.set(key, item)
    }
    item.el.style.setProperty('--accent', accent)
    item.el.classList.toggle('is-online', online)
    item.el.querySelector('.town-label__text').textContent = text
  }

  // Where the name is in the town, in map pixels (its middle).
  move(key, x, y) {
    const item = this.items.get(key)
    if (!item) return
    item.x = x
    item.y = y
    item.placed = true
  }

  remove(key) {
    this.items.get(key)?.el.remove()
    this.items.delete(key)
  }

  // Puts every name where it is on screen, for this camera's view of the town.
  draw(cam) {
    if (!this.layer) return
    const { zoom } = cam
    if (zoom !== this.zoom) {
      this.zoom = zoom
      this.layer.style.setProperty('--z', String(zoom))
    }
    const view = cam.worldView
    for (const item of this.items.values()) {
      if (!item.placed) continue
      const x = Math.round((item.x - view.x) * zoom)
      const y = Math.round((item.y - view.y) * zoom)
      item.el.style.transform = `translate3d(${x}px, ${y}px, 0)`
    }
  }

  destroy() {
    for (const item of this.items.values()) item.el.remove()
    this.items.clear()
  }
}
