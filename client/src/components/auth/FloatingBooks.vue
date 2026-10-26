<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// Little books drifting in the air; the pointer shoves them aside (lib/floatBooks.js).
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { mountFloatingBooks } from '@/lib/floatBooks'

defineProps({
  books: { type: Array, required: true },
})

const root = ref(null)
let stop = () => {}

onMounted(() => {
  stop = mountFloatingBooks(root.value)
})

onBeforeUnmount(() => stop())
</script>

<template>
  <div ref="root" class="float-books">
    <span
      v-for="book in books"
      :key="book.id"
      class="flyer"
      data-flyer
      :data-phase="book.phase"
      :data-period="book.period"
      :data-tilt="book.tilt"
      :style="{
        left: `${book.left}%`,
        top: `${book.top}%`,
        width: `${book.w}px`,
        height: `${book.h}px`,
        '--cover': book.cover,
        '--band': book.band,
        '--page': book.page,
        '--tilt': `${book.tilt}deg`,
      }"
    />
  </div>
</template>

<style scoped>
.float-books {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.flyer {
  position: absolute;
  /* rounded, with the characters' dark outline and a soft shadow */
  border: 2.5px solid #3b2a35;
  border-radius: 3px 7px 7px 3px;
  background:
    linear-gradient(var(--band), var(--band)) 5px 5px / calc(100% - 10px) 5px no-repeat,
    linear-gradient(var(--page), var(--page)) 5px 14px / calc(100% - 10px) 8px no-repeat,
    linear-gradient(rgba(0, 0, 0, 0.16), rgba(0, 0, 0, 0.16)) 0 0 / 4px 100% no-repeat,
    var(--cover);
  box-shadow: 0 6px 12px rgba(30, 26, 36, 0.25);
  transform: rotate(var(--tilt));
}

@media (prefers-reduced-motion: reduce) {
  .flyer {
    transform: rotate(var(--tilt));
  }
}
</style>
