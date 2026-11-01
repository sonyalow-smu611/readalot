<!--
  Scaffolded with AI assistance — see AI_USAGE.md
  The library's places behind one labelled button in the bottom right, copied from My Room's
  Places menu (buildings/house/components/PlacesMenu.vue) so the two buildings work the same way.
  Places (with a hamburger icon) opens a short list that rises above the button, in groups;
  picking a place emits `go` with its id and closes the list. Esc, the button again or a tap
  anywhere else closes it too; focus goes back to the button.
-->
<template>
  <div ref="root" class="places">
    <nav v-show="open" id="library-places" class="places__list" aria-label="Places in the library" @keydown.esc="close">
      <section v-for="group in groups" :key="group.label" class="places__group" :aria-label="group.label">
        <p class="places__heading" aria-hidden="true">{{ group.label }}</p>
        <button v-for="place in group.places" :key="place.id" type="button" class="btn btn-secondary btn-sm places__item" @click="pick(place.id)">
          {{ place.label }}
        </button>
      </section>
    </nav>
    <button
      ref="toggle"
      type="button"
      class="btn btn-secondary places__toggle"
      :aria-expanded="open"
      aria-controls="library-places"
      @click="open = !open"
    >
      <span class="places__bars" aria-hidden="true"><i /><i /><i /></span>
      Places
    </button>
  </div>
</template>

<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'

defineProps({
  // [{ label, places: [{ id, label }] }], each group's places in the order they're listed
  groups: { type: Array, required: true },
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
  background: currentColor;
}

/* rises above the button, kept to the right edge; a long list scrolls inside itself */
.places__list {
  position: absolute;
  right: 0;
  bottom: calc(100% + 10px);
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 200px;
  max-height: calc(100vh - 170px);
  max-height: calc(100dvh - 170px);
  /* room for the buttons' pixel shadow, which the scroll would clip */
  padding: 10px 13px 13px 10px;
  overflow-y: auto;
  border: var(--px-border);
  background: var(--px-paper);
  box-shadow: var(--px-shadow);
}

.places__group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.places__heading {
  margin: 0;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--rl-muted);
}

.places__item {
  justify-content: flex-start;
}
</style>
