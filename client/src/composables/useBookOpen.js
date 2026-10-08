// Scaffolded with AI assistance — see AI_USAGE.md
// A tiny module-level store (shared singleton) for "which book is currently lifted off the
// shelf". A Book spine calls open() with itself and its DOM node; the single
// <BookOpenOverlay> mounted in App.vue watches this state and runs the animation.
// Guardrail-safe: FEATURED is a 2D scale/position morph, OPEN is a flat two-page spread.
import { reactive } from 'vue'

// phase: 'closed' | 'featured' | 'open' | 'closing'
const state = reactive({ book: null, phase: 'closed' })

// The spine element the book flew out of. Kept outside reactive state on purpose — it's a raw
// DOM node used only by the overlay's animation, and should never trigger re-renders.
let originEl = null

export function useBookOpen() {
  // Lift a book off the shelf. Pass the spine element so the overlay can morph from it.
  function open(book, el = null) {
    originEl = el
    state.book = book
    state.phase = 'featured'
  }

  // FEATURED -> OPEN (tap the lifted book to read it).
  function read() {
    if (state.phase === 'featured') state.phase = 'open'
  }

  // Begin closing; the overlay plays the reverse, then calls finishClose().
  function close() {
    if (state.phase === 'closed') return
    state.phase = 'closing'
  }

  // Overlay signals the exit animation is done.
  function finishClose() {
    state.phase = 'closed'
    state.book = null
    originEl = null
  }

  function getOriginEl() {
    return originEl
  }

  return { state, open, read, close, finishClose, getOriginEl }
}
