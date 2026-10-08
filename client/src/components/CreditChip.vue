<script setup>
import { useDecor } from '@/composables/useDecor'

defineProps({
  tone: { type: String, default: 'dark' },
})

const { credits } = useDecor()
</script>

<template>
  <p class="chip" :class="tone === 'light' ? 'chip--light' : 'chip--dark'">
    <span class="chip__mark" aria-hidden="true">$</span>
    <span>{{ credits }}</span>
    <span class="visually-hidden">credits</span>
  </p>
</template>

<style scoped>
.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 4px 10px 4px 6px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.chip--dark {
  background: rgba(28, 27, 25, 0.08);
  color: var(--ink);
}

.chip--light {
  background: rgba(246, 241, 232, 0.14);
  color: #f6f1e8;
}

.chip__mark {
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #c4a15a;
  color: #2a241c;
  font-size: 0.72rem;
  line-height: 1;
}
</style>
