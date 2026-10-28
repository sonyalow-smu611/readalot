<!--
  Scaffolded with AI assistance — see AI_USAGE.md
  The room's places behind one labelled button: Places (with a hamburger icon) opens a short
  list, and picking a place emits `go` with its id and closes the list. Esc, the button again or
  a tap anywhere else closes it too; focus goes back to the button.
-->
<template>
  <div ref="root" class="places">
    <button
      ref="toggle"
      type="button"
      class="places__toggle"
      :aria-expanded="open"
      aria-controls="room-places"
      @click="open = !open"
    >
      <span class="places__bars" aria-hidden="true"><i /><i /><i /></span>
      Places
    </button>
    <nav v-show="open" id="room-places" class="places__list" aria-label="Places in the room" @keydown.esc="close">
      <button v-for="place in places" :key="place.id" type="button" class="places__item" @click="pick(place.id)">
        {{ place.label }}
      </button>
    </nav>
  </div>
</template>

<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'

defineProps({
  // [{ id, label }], in the order they're listed
  places: { type: Array, required: true },
})
const emit = defineEmits(['go'])

const root = ref(null)
const toggle = ref(null)
const open = ref(false)

function close() {
  if (!open.value) return
  open.value = false
  toggle.value?.focus()
}

function pick(id) {
  open.value = false
  emit('go', id)
}

function onOutside(event) {
  if (!root.value?.contains(event.target)) open.value = false
}

function onKey(event) {
  if (event.key === 'Escape') close()
}

watch(open, (isOpen) => {
  if (isOpen) {
    window.addEventListener('pointerdown', onOutside)
    window.addEventListener('keydown', onKey)
  } else {
    window.removeEventListener('pointerdown', onOutside)
    window.removeEventListener('keydown', onKey)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('pointerdown', onOutside)
  window.removeEventListener('keydown', onKey)
})
</script>

<style scoped>
.places {
  position: relative;
}

/* the town's chips (TownHud): white, a fine line and a soft shadow */
.places__toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 14px 0 12px;
  border: 1px solid var(--rl-line);
  border-radius: 999px;
  background: var(--rl-surface);
  box-shadow: 0 4px 14px rgba(63, 46, 36, 0.15);
  font-size: 13px;
  font-weight: 700;
  color: var(--rl-text);
}

.places__toggle[aria-expanded='true'] {
  border-color: var(--house-accent, var(--rl-primary));
}

.places__bars {
  display: grid;
  gap: 3px;
  width: 16px;
}

.places__bars i {
  display: block;
  height: 2px;
  border-radius: 1px;
  background: currentColor;
}

.places__list {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  display: flex;
  flex-direction: column;
  min-width: 160px;
  padding: 6px;
  border: 1px solid var(--rl-line);
  border-radius: 16px;
  background: var(--rl-surface);
  box-shadow: 0 10px 28px rgba(63, 46, 36, 0.22);
}

.places__item {
  min-height: 40px;
  padding: 0 12px;
  border: 0;
  border-radius: 10px;
  background: none;
  font-size: 14px;
  font-weight: 700;
  text-align: left;
  color: var(--rl-text);
}

.places__item:hover,
.places__item:focus-visible {
  background: var(--house-accent, var(--rl-primary));
  color: var(--rl-surface);
}
</style>
