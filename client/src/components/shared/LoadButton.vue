<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// A button for anything that waits on the server: a spinner while it's on its way (`busy`), then
// a tick for a moment once it's done (unless it `failed`). It can't be pressed meanwhile. Its
// classes, aria-label and click pass straight through, so it's styled like any .btn.
import { onBeforeUnmount, ref, watch } from 'vue'
import { DONE_FOR } from '@/lib/loading.js'

const props = defineProps({
  busy: { type: Boolean, default: false },
  // the last try didn't work: no tick when it stops being busy
  failed: { type: Boolean, default: false },
  // what it says while busy and once done; its own label when not given
  busyText: { type: String, default: '' },
  doneText: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  type: { type: String, default: 'button' },
})

const done = ref(false)
let timer = 0

watch(
  () => props.busy,
  (busy, before) => {
    window.clearTimeout(timer)
    done.value = false
    if (busy || !before || props.failed) return
    done.value = true
    timer = window.setTimeout(() => (done.value = false), DONE_FOR)
  },
)

onBeforeUnmount(() => window.clearTimeout(timer))
</script>

<template>
  <button
    :type="type"
    class="load-button"
    :class="{ 'is-busy': busy, 'is-done': done }"
    :disabled="disabled || busy || done"
    :aria-busy="busy"
  >
    <span v-if="busy" class="spinner-border spinner-border-sm load-button__icon" aria-hidden="true" />
    <span v-else-if="done" class="load-button__icon load-button__tick" aria-hidden="true">✓</span>
    <template v-if="busy && busyText">{{ busyText }}</template>
    <template v-else-if="done && doneText">{{ doneText }}</template>
    <slot v-else />
  </button>
</template>

<style scoped>
.load-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

/* waiting and done are states, not "can't press this": they keep their full colour */
.load-button.is-busy:disabled,
.load-button.is-done:disabled {
  opacity: 1;
}

.load-button__icon {
  flex: none;
}

.load-button__tick {
  font-weight: 700;
  animation: load-button-tick 0.25s ease-out;
}

@keyframes load-button-tick {
  from {
    transform: scale(0.4);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .load-button__tick {
    animation: none;
  }
}
</style>
