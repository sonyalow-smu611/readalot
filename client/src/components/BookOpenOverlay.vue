<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The single fullscreen layer that owns a book once it's lifted off the shelf. Mounted once
// in App.vue; driven entirely by the shared useBookOpen() state.
//   FEATURED — the book floats centre-screen as a big cover, morphing out of its spine (a 2D
//              position+scale tween).
//   OPEN     — a flat two-page spread; a cover "flap" folds back in 2D (scaleX) to reveal it.
// Both show the shelf actions for the book (finish, start, review...) when it is on the shelf.
import { computed, nextTick, ref, watch } from 'vue'
import { gsap, prefersReducedMotion } from '@/lib/motion'
import { useBookOpen } from '@/composables/useBookOpen'
import BookCover from '@/components/BookCover.vue'
import BookDetailsContent from '@/components/book/BookDetailsContent.vue'
import ShelfBookActions from '@/components/ShelfBookActions.vue'

const { state, read, close, finishClose, getOriginEl } = useBookOpen()

const visible = computed(() => state.phase !== 'closed')
// Which layout to render. Held independently of phase so the exit animation keeps showing
// the right thing while phase is already 'closing'.
const view = ref('featured')

const backdrop = ref(null)
const featuredEl = ref(null)
const spreadEl = ref(null)
const flapEl = ref(null)

const book = computed(() => state.book)

// A 2D "FLIP": tween an element from where its origin spine sits to its own resting spot.
function morphFromOrigin(el) {
  const origin = getOriginEl()
  if (!el || !origin) return gsap.from(el, { autoAlpha: 0, scale: 0.9, duration: 0.3 })

  const a = origin.getBoundingClientRect()
  const b = el.getBoundingClientRect()
  const dx = a.left + a.width / 2 - (b.left + b.width / 2)
  const dy = a.top + a.height / 2 - (b.top + b.height / 2)
  return gsap.from(el, {
    x: dx,
    y: dy,
    scaleX: a.width / b.width,
    scaleY: a.height / b.height,
    autoAlpha: 0,
    duration: 0.5,
    ease: 'power3.out',
  })
}

function fadeBackdrop() {
  if (backdrop.value) gsap.from(backdrop.value, { autoAlpha: 0, duration: 0.3 })
}

function animateFeaturedIn() {
  if (prefersReducedMotion()) return
  fadeBackdrop()
  morphFromOrigin(featuredEl.value)
}

function animateOpen() {
  if (prefersReducedMotion()) return
  if (spreadEl.value) {
    gsap.from(spreadEl.value, { autoAlpha: 0, scale: 0.92, y: 20, duration: 0.4, ease: 'back.out(1.5)' })
  }
  // The cover flap folds away flat (left-hinged scaleX) to reveal the right-hand page.
  if (flapEl.value) {
    gsap.fromTo(
      flapEl.value,
      { scaleX: 1 },
      { scaleX: 0, transformOrigin: 'left center', duration: 0.55, ease: 'power2.inOut' },
    )
  }
}

function animateOut() {
  if (prefersReducedMotion()) {
    finishClose()
    return
  }
  const el = view.value === 'open' ? spreadEl.value : featuredEl.value
  const tl = gsap.timeline({ onComplete: finishClose })
  if (el) tl.to(el, { autoAlpha: 0, scale: 0.9, duration: 0.3, ease: 'power2.in' }, 0)
  if (backdrop.value) tl.to(backdrop.value, { autoAlpha: 0, duration: 0.3 }, 0)
}

watch(
  () => state.phase,
  async (phase) => {
    if (phase === 'featured') {
      view.value = 'featured'
      await nextTick()
      animateFeaturedIn()
    } else if (phase === 'open') {
      view.value = 'open'
      await nextTick()
      animateOpen()
    } else if (phase === 'closing') {
      animateOut()
    }
  },
)

function onBackdropClick() {
  close()
}
</script>

<template>
    <div v-if="visible" ref="backdrop" class="book-overlay" @click.self="onBackdropClick">
      <button type="button" class="btn btn-secondary btn-icon book-overlay__close" aria-label="Close book" @click="close">✕</button>

      <!-- FEATURED: giant cover, tap to read; what to do with the book sits under it -->
      <div v-if="view === 'featured'" ref="featuredEl" class="featured">
        <button type="button" class="featured__book" @click="read">
          <!-- a book without a cover image gets a plain cloth cover in its spine colour -->
          <BookCover class="featured__cover" :cover-url="book?.cover" :title="book?.title" :seed="book?.id" />
          <span class="featured__hint">Tap to open</span>
        </button>
        <ShelfBookActions :book="book" @leave="close" />
      </div>

      <!-- OPEN: flat two-page spread -->
      <div v-else ref="spreadEl" class="spread" role="dialog" aria-label="Book details">
        <div class="page page--left">
          <BookCover class="page__cover" :cover-url="book?.cover" :title="book?.title" :seed="book?.id" />
        </div>
        <div class="page page--right">
          <BookDetailsContent :book="book" :show-cover="false" @leave="close" />
        </div>
        <!-- The flap that folds back (2D) to reveal the right page -->
        <div ref="flapEl" class="spread__flap" aria-hidden="true"></div>
      </div>
    </div>
</template>

<style scoped>
.book-overlay {
  position: absolute;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  overflow-y: auto;
  background: rgba(28, 27, 25, 0.46);
  backdrop-filter: blur(2px);
}

.book-overlay__close {
  position: absolute;
  top: 18px;
  right: 18px;
}

/* --- FEATURED --- */
.featured {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  width: min(74vw, 300px);
  margin: auto;
}

.featured__book {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
}

.featured__book:focus-visible {
  outline: 1px solid var(--paper);
  outline-offset: 4px;
}

.featured__cover {
  width: min(60vw, 240px);
  font-size: 1.3rem;
  aspect-ratio: 2 / 3;
  object-fit: cover;
  border: 1px solid rgba(28, 27, 25, 0.35);
  border-radius: 1px;
  box-shadow: 0 8px 20px rgba(28, 27, 25, 0.18);
}

.featured__hint {
  padding: 2px 8px;
  font-family: var(--font-serif);
  font-size: 0.85rem;
  color: var(--ink);
  background: var(--paper);
}

/* --- OPEN SPREAD --- */
.spread {
  position: relative;
  display: flex;
  width: min(92vw, 560px);
  max-height: 80vh;
  background: var(--paper);
  border: 1px solid rgba(28, 27, 25, 0.28);
  border-radius: 2px;
  overflow: hidden;
}

.page {
  flex: 1 1 50%;
  padding: 18px;
  overflow-y: auto;
}

.page--left {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--page-edge);
  border-right: 1px solid rgba(28, 27, 25, 0.22);
}

.page--right {
  background: var(--paper);
}

.page__cover {
  width: 100%;
  max-width: 180px;
  aspect-ratio: 2 / 3;
  object-fit: cover;
  border: 1px solid rgba(28, 27, 25, 0.35);
  border-radius: 1px;
}

/* The fold-back flap: a cream panel over the right page that scaleX-collapses on open. */
.spread__flap {
  position: absolute;
  top: 0;
  right: 0;
  width: 50%;
  height: 100%;
  background: var(--page-edge);
  border-left: 1px solid rgba(28, 27, 25, 0.22);
  pointer-events: none;
}

@media (max-width: 420px) {
  .spread {
    flex-direction: column;
  }
  .page--left {
    border-right: none;
    border-bottom: 1px solid rgba(28, 27, 25, 0.22);
  }
  .spread__flap {
    display: none;
  }
}
</style>
