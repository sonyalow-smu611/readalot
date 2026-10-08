<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// A single wooden shelf of books. One component, three layouts chosen by `mode`:
//   static     — a plain row (good for short, fixed shelves).
//   scroll     — Swiper free-mode momentum scrolling (free/public build) for long rows.
//   draggable  — vue-draggable-plus (SortableJS) so books can be dragged within and between
//                shelves; emits `change` so the parent can re-file them.
// Swiper and drag-and-drop fight over the same row, so a shelf is only ever one of them.
import { computed } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { FreeMode } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/free-mode'
import Book from './Book.vue'
import EmptyShelf from './EmptyShelf.vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  title: { type: String, default: '' },
  emoji: { type: String, default: '📚' },
  mode: {
    type: String,
    default: 'static',
    validator: (v) => ['static', 'scroll', 'draggable'].includes(v),
  },
  // Shared name lets two draggable shelves exchange books.
  group: { type: String, default: 'shelf' },
  compact: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'change'])

const list = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

function onChange(event) {
  emit('change', event)
}

function onWheel(event) {
  const row = event.currentTarget
  if (row.scrollWidth <= row.clientWidth) return
  if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return
  row.scrollLeft += event.deltaY
}
</script>

<template>
  <section class="shelf" :class="{ 'is-compact': compact }">
    <header v-if="title" class="shelf__label">
      <span aria-hidden="true">{{ emoji }}</span>
      <span class="shelf__title">{{ title }}</span>
      <span class="shelf__count">{{ list.length }}</span>
    </header>

    <div class="shelf__board">
      <!-- Draggable stays mounted even when empty, so a book can be dropped onto a bare shelf. -->
      <template v-if="mode === 'draggable'">
        <VueDraggable
          v-model="list"
          :group="group"
          :animation="180"
          class="shelf__books"
          ghost-class="book-ghost"
          @change="onChange"
          @wheel="onWheel"
        >
          <Book v-for="(b, index) in list" :key="b.id" :book="b" :stack="index" :compact="compact" />
        </VueDraggable>
        <p v-if="!list.length" class="shelf__hint">Drag a book here</p>
      </template>

      <EmptyShelf v-else-if="!list.length" />

      <Swiper
        v-else-if="mode === 'scroll'"
        :modules="[FreeMode]"
        free-mode
        slides-per-view="auto"
        :space-between="-4"
        class="shelf__books shelf__books--swiper"
      >
        <SwiperSlide
          v-for="(b, index) in list"
          :key="b.id"
          class="shelf__slide"
          :style="{ zIndex: index, '--slide-stack': String(index) }"
        >
          <Book :book="b" :stack="index" :compact="compact" />
        </SwiperSlide>
      </Swiper>

      <div v-else class="shelf__books">
        <Book v-for="(b, index) in list" :key="b.id" :book="b" :stack="index" :compact="compact" />
      </div>

      <div class="shelf__plank" aria-hidden="true"></div>
    </div>
  </section>
</template>

<style scoped>
.shelf {
  margin-bottom: 20px;
}

.shelf__label {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 6px;
  font-family: var(--font-serif);
  font-weight: 500;
  font-size: 1rem;
  color: var(--ink);
}

.shelf__count {
  margin-left: auto;
  font-family: var(--font-body);
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--ink-muted);
}

.shelf__board {
  position: relative;
}

.shelf__books {
  display: flex;
  align-items: flex-end;
  gap: 0;
  min-height: 184px;
  padding: 12px 16px 0;
}

.shelf__books:not(.shelf__books--swiper) :deep(.book) {
  margin-right: -4px;
}

.shelf__books:not(.shelf__books--swiper) :deep(.book:last-child) {
  margin-right: 0;
}

.shelf__books--swiper {
  display: block;
}

.shelf__books--swiper :deep(.swiper-wrapper) {
  align-items: flex-end;
}

.shelf__books--swiper :deep(.swiper-slide:last-child) {
  margin-right: 0 !important;
}

.shelf__slide {
  width: auto;
  display: flex;
  align-items: flex-end;
  overflow: visible;
}

.shelf__slide:hover,
.shelf__slide:has(.book.is-holding) {
  z-index: calc(var(--slide-stack, 0) + 20) !important;
}

.shelf__hint {
  position: absolute;
  top: 36%;
  left: 0;
  right: 0;
  margin: 0;
  text-align: center;
  font-family: var(--font-serif);
  font-size: 0.85rem;
  color: var(--ink-muted);
  pointer-events: none;
}

.shelf__plank {
  height: 8px;
  background: linear-gradient(to bottom, var(--wood), var(--wood-deep));
  border: 1px solid rgba(28, 27, 25, 0.25);
  border-radius: 1px;
}

:deep(.book-ghost) {
  opacity: 0.4;
}

.shelf.is-compact {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  margin-bottom: 0;
}

.shelf.is-compact .shelf__label {
  margin-bottom: 2px;
  font-size: 0.82rem;
}

.shelf.is-compact .shelf__board {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 0;
}

.shelf.is-compact .shelf__books {
  min-height: 0;
  padding: 2px 8px 0;
  overflow-x: auto;
  overflow-y: hidden;
}
</style>
