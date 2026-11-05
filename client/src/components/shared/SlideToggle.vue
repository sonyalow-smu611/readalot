<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// A two-way switch with a thumb that slides between the choices (Spines / Covers): the thumb glides
// to the choice you press, and the labels change colour with it. Each choice is still a button
// (pressed or not) for the keyboard and screen readers; the arrow keys move between them.
import { computed, nextTick, ref } from 'vue'

const props = defineProps({
  // the value of the chosen option
  modelValue: { type: String, required: true },
  // [{ value, label }], two or three choices
  options: { type: Array, required: true },
  // what the switch is for, read out with it
  label: { type: String, required: true },
})
const emit = defineEmits(['update:modelValue'])

const track = ref(null)
const index = computed(() => Math.max(0, props.options.findIndex((option) => option.value === props.modelValue)))

function choose(value) {
  if (value !== props.modelValue) emit('update:modelValue', value)
}

// Left and Right choose the neighbour and move the focus with it.
async function move(event, step) {
  event.preventDefault()
  const next = props.options[(index.value + step + props.options.length) % props.options.length]
  choose(next.value)
  await nextTick()
  track.value?.querySelectorAll('button')[props.options.indexOf(next)]?.focus()
}
</script>

<template>
  <div
    ref="track"
    class="slide-toggle"
    role="group"
    :aria-label="label"
    :style="{ '--count': options.length, '--at': index }"
    @keydown.right="move($event, 1)"
    @keydown.left="move($event, -1)"
  >
    <span class="slide-toggle__thumb" aria-hidden="true"></span>
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="slide-toggle__option"
      :class="{ 'is-on': option.value === modelValue }"
      :aria-pressed="option.value === modelValue"
      @click="choose(option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<style scoped>
.slide-toggle {
  position: relative;
  display: inline-grid;
  grid-template-columns: repeat(var(--count), minmax(86px, 1fr));
  border: 2px solid var(--px-outline, #1e1a24);
  background: var(--px-paper, #f9f3e6);
  box-shadow: 3px 3px 0 var(--px-outline, #1e1a24), inset 0 -2px 0 var(--px-paper-shade, #e6dccb);
  isolation: isolate;
}

/* the thumb is one choice wide and slides by whole choices */
.slide-toggle__thumb {
  position: absolute;
  z-index: 0;
  top: 2px;
  bottom: 2px;
  left: 2px;
  width: calc((100% - 4px) / var(--count));
  background: var(--room-woodDeep, #7a5d4d);
  box-shadow:
    inset 0 2px 0 var(--room-woodDark, #94755c),
    inset 0 -2px 0 var(--room-brown, #574f3c);
  transform: translateX(calc(var(--at) * 100%));
  transition: transform 0.34s cubic-bezier(0.45, 0, 0.2, 1);
  will-change: transform;
}

.slide-toggle__option {
  position: relative;
  z-index: 1;
  min-height: 40px;
  padding: 0 14px;
  border: 0;
  background: transparent;
  color: var(--px-outline, #1e1a24);
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  transition: color 0.34s ease;
}

.slide-toggle__option.is-on {
  color: var(--px-paper, #f9f3e6);
}

.slide-toggle__option:focus-visible {
  outline: 3px solid #de9951;
  outline-offset: -5px;
}

@media (prefers-reduced-motion: reduce) {
  .slide-toggle__thumb,
  .slide-toggle__option {
    transition: none;
  }
}
</style>
