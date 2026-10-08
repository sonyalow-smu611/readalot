<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// Three covers at a time. Left and right step the row. Flat motion only: translate, no rotateY.
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { gsap, prefersReducedMotion } from '@/lib/motion'
import { useBookOpen } from '@/composables/useBookOpen'

const props = defineProps({
  books: { type: Array, default: () => [] },
  title: { type: String, default: '' },
})

const { open } = useBookOpen()
const frame = ref(null)
const track = ref(null)
const page = ref(0)
const cardW = ref(0)

const VISIBLE = 3

const maxPage = computed(() => Math.max(0, props.books.length - VISIBLE))

function measure() {
  if (!frame.value) return
  cardW.value = Math.max(0, (frame.value.clientWidth - 16) / VISIBLE)
}

function slide(animated) {
  if (!track.value) return
  const x = -page.value * (cardW.value + 8)
  if (!animated || prefersReducedMotion()) {
    gsap.set(track.value, { x })
    return
  }
  gsap.to(track.value, { x, duration: 0.55, ease: 'power3.inOut', force3D: false })
}

function go(direction) {
  const next = Math.min(maxPage.value, Math.max(0, page.value + direction))
  if (next === page.value) return
  page.value = next
  slide(true)
  const arrow = direction < 0 ? frame.value?.querySelector('.covers__arrow--prev') : frame.value?.querySelector('.covers__arrow--next')
  if (arrow && !prefersReducedMotion()) {
    gsap.fromTo(arrow, { scale: 0.86 }, { scale: 1, duration: 0.35, ease: 'back.out(2)' })
  }
}

onMounted(async () => {
  await nextTick()
  measure()
  slide(false)
})

watch(
  () => props.books.length,
  async () => {
    page.value = Math.min(page.value, maxPage.value)
    await nextTick()
    measure()
    slide(false)
  },
)
</script>

<template>
  <section class="covers">
    <h3 class="covers__title">{{ title }}</h3>
    <p v-if="!books.length" class="covers__empty">Nothing on this shelf yet</p>
    <div v-else ref="frame" class="covers__frame">
      <button
        type="button"
        class="covers__arrow covers__arrow--prev"
        aria-label="Previous covers"
        :disabled="page === 0"
        @click="go(-1)"
      >
        ‹
      </button>
      <div class="covers__window">
        <div ref="track" class="covers__track">
          <button
            v-for="book in books"
            :key="book.id"
            type="button"
            class="covers__card"
            :style="{ width: `${cardW}px` }"
            @click="open(book, $event.currentTarget)"
          >
            <img class="covers__img" :src="book.cover" :alt="`Cover of ${book.title}`" />
            <span class="covers__name">{{ book.title }}</span>
          </button>
        </div>
      </div>
      <button
        type="button"
        class="covers__arrow covers__arrow--next"
        aria-label="Next covers"
        :disabled="page >= maxPage"
        @click="go(1)"
      >
        ›
      </button>
    </div>
    <div class="covers__plank" aria-hidden="true" />
  </section>
</template>

<style scoped>
.covers {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  margin: 0;
}

.covers__title {
  flex: none;
  margin: 0 0 4px;
  font-family: var(--font-serif);
  font-size: 0.85rem;
  font-weight: 500;
  color: #f6f1e8;
}

.covers__empty {
  margin: 0;
  font-size: 0.8rem;
  color: rgba(246, 241, 232, 0.6);
}

.covers__frame {
  position: relative;
  display: flex;
  flex: 1;
  align-items: stretch;
  min-height: 0;
  gap: 4px;
}

.covers__window {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.covers__track {
  display: flex;
  gap: 8px;
  height: 100%;
  will-change: transform;
}

.covers__card {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 4px;
  height: 100%;
  min-height: 0;
  padding: 0;
  border: 0;
  background: none;
  text-align: left;
  cursor: pointer;
}

.covers__img {
  flex: 1 1 auto;
  width: 100%;
  min-height: 0;
  object-fit: cover;
  border-radius: 2px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.35);
}

.covers__name {
  flex: none;
  font-family: var(--font-serif);
  font-size: 0.68rem;
  color: #f6f1e8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.covers__arrow {
  flex: none;
  align-self: center;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 50%;
  background: rgba(246, 241, 232, 0.92);
  color: #2a2118;
  font-size: 1.2rem;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.25);
}

.covers__arrow:disabled {
  opacity: 0.35;
  cursor: default;
}

.covers__plank {
  flex: none;
  height: 7px;
  margin-top: 4px;
  background: linear-gradient(#6d4b32, #4a3120);
  border-radius: 1px;
}

@media (prefers-reduced-motion: reduce) {
  .covers__track {
    will-change: auto;
  }
}
</style>
