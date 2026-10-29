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
      class="btn btn-secondary places__toggle"
      :aria-expanded="open"
      aria-controls="room-places"
      @click="open = !open"
    >
      <span class="places__bars" aria-hidden="true"><i /><i /><i /></span>
      Places
    </button>
    <nav v-show="open" id="room-places" class="places__list" aria-label="Places in the room" @keydown.esc="close">
      <button v-for="place in places" :key="place.id" type="button" class="btn btn-secondary places__item" @click="pick(place.id)">
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

.places__toggle {
  gap: 8px;
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
  top: calc(100% + 8px);
  left: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 160px;
}

.places__item {
  justify-content: flex-start;
}
</style>
