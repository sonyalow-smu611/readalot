<script setup>
// AI-assisted visual styling; review and document in AI_USAGE.md.
// A reader's profile as a popup over the cafe. The parent continues to own reader selection.
import { computed } from 'vue'
import ReaderProfile from '@/components/people/ReaderProfile.vue'
import { PROFILE_COLOURS } from '@/components/people/profileColours.js'

const props = defineProps({
  reader: { type: Object, required: true },
})
const emit = defineEmits(['close'])

const name = computed(() => props.reader.displayName || props.reader.username || 'Reader')
</script>

<template>
  <aside class="reader-popup" role="dialog" :aria-label="`Meet ${name}`" aria-modal="false" :style="PROFILE_COLOURS">
    <button class="reader-popup__close" type="button" aria-label="Close reader profile" @click="emit('close')">×</button>
    <div class="reader-popup__body">
      <ReaderProfile :reader-id="reader.id" compact />
    </div>
  </aside>
</template>

<style scoped>
.reader-popup {
  box-sizing: border-box;
  position: absolute;
  z-index: 20;
  display: flex;
  border: 4px solid #25202a;
  background: var(--profile-wall);
  box-shadow: 5px 5px 0 #25202a, 0 12px 30px #241b2070;
  color: var(--px-outline);
}
.reader-popup__body {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding: 16px;
}
.reader-popup__close {
  position: absolute;
  top: -4px;
  right: -4px;
  z-index: 2;
  width: 44px;
  height: 44px;
  border: 3px solid #25202a;
  background: #fff9ec;
  box-shadow: 3px 3px 0 #25202a;
  color: #25202a;
  font: 700 22px/1 Arial, sans-serif;
  cursor: pointer;
}
.reader-popup :focus-visible { outline: 3px solid #de9951; outline-offset: 2px; }
/* one column: the reader card reaches the corner, so it starts under the close button */
@media (max-width: 767px) {
  .reader-popup__body { padding-top: 50px; }
}
</style>
