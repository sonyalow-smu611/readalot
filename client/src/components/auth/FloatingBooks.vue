<script setup>
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
  border-radius: 2px 5px 5px 2px;
  background:
    linear-gradient(var(--band), var(--band)) 14% 12% / 72% 22% no-repeat,
    linear-gradient(var(--page), var(--page)) 14% 42% / 72% 36% no-repeat,
    var(--cover);
  box-shadow: 2px 3px 0 rgba(63, 46, 36, 0.12);
  transform: rotate(var(--tilt));
}

@media (prefers-reduced-motion: reduce) {
  .flyer {
    transform: rotate(var(--tilt));
  }
}
</style>
