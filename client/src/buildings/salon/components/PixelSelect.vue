<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// A drop-down in the app's own look instead of the browser's: a pixel button showing the choice,
// and a card of options under it. Works with a mouse, a finger and the keyboard (Arrow keys move,
// Enter or Space choose, Escape closes).
import { nextTick, onBeforeUnmount, ref } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  options: { type: Array, required: true },
  // the id of the button, so a label can point at it
  id: { type: String, required: true },
  placeholder: { type: String, default: 'Choose one' },
  invalid: { type: Boolean, default: false },
  describedby: { type: String, default: undefined },
})
const emit = defineEmits(['update:modelValue', 'change'])

const open = ref(false)
// opens upward when there is more room above the button than below it
const up = ref(false)
const active = ref(-1)
const root = ref(null)
const list = ref(null)

function show() {
  const box = root.value.getBoundingClientRect()
  const below = window.innerHeight - box.bottom
  up.value = below < 260 && box.top > below
  open.value = true
  active.value = Math.max(props.options.indexOf(props.modelValue), 0)
  document.addEventListener('pointerdown', away)
  nextTick(() => list.value?.querySelector('[aria-selected="true"], .is-active')?.scrollIntoView({ block: 'nearest' }))
}

function hide() {
  open.value = false
  document.removeEventListener('pointerdown', away)
}

// a tap anywhere else shuts it
function away(event) {
  if (!root.value?.contains(event.target)) hide()
}

function choose(option) {
  emit('update:modelValue', option)
  emit('change', option)
  hide()
  document.getElementById(props.id)?.focus()
}

function move(step) {
  active.value = (active.value + step + props.options.length) % props.options.length
  nextTick(() => list.value?.querySelector('.is-active')?.scrollIntoView({ block: 'nearest' }))
}

function onKey(event) {
  if (event.key === 'Escape' && open.value) {
    // only the list closes, not the card being edited
    event.stopPropagation()
    hide()
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    if (open.value) move(1)
    else show()
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    if (open.value) move(-1)
    else show()
  } else if ((event.key === 'Enter' || event.key === ' ') && open.value) {
    event.preventDefault()
    choose(props.options[active.value])
  }
}

onBeforeUnmount(() => document.removeEventListener('pointerdown', away))
</script>

<template>
  <div ref="root" class="pselect" @keydown="onKey">
    <button
      :id="id"
      type="button"
      class="btn btn-secondary pselect__button"
      :class="{ 'is-empty': !modelValue }"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-invalid="invalid"
      :aria-describedby="describedby"
      @click="open ? hide() : show()"
    >
      <span class="pselect__value">{{ modelValue || placeholder }}</span>
      <svg class="pselect__arrow" :class="{ 'is-open': open }" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
    </button>
    <ul v-if="open" ref="list" class="pselect__list" :class="{ 'is-up': up }" role="listbox" :aria-labelledby="id">
      <li
        v-for="(option, index) in options"
        :key="option"
        class="pselect__option"
        :class="{ 'is-active': index === active, 'is-chosen': option === modelValue }"
        role="option"
        :aria-selected="option === modelValue"
        @pointerenter="active = index"
        @click="choose(option)"
      >
        <span class="pselect__tick" aria-hidden="true">{{ option === modelValue ? '✓' : '' }}</span>
        {{ option }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.pselect {
  position: relative;
}

.pselect__button {
  width: 100%;
  justify-content: space-between;
  text-align: left;
}

.pselect__button.is-empty .pselect__value {
  font-weight: 400;
  color: var(--rl-muted);
}

.pselect__arrow {
  flex: none;
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 3;
  stroke-linecap: square;
  transition: transform 0.12s steps(2);
}

.pselect__arrow.is-open {
  transform: rotate(180deg);
}

/* the options: a pixel card under the button, in the profile's pink */
.pselect__list {
  position: absolute;
  z-index: 30;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  max-height: 232px;
  margin: 0;
  padding: 4px;
  overflow-y: auto;
  border: 2px solid #1e1a24;
  background: #fff;
  box-shadow: 3px 3px 0 #1e1a24;
  list-style: none;
}

.pselect__list.is-up {
  top: auto;
  bottom: calc(100% + 6px);
}

.pselect__option {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 6px 10px;
  font-weight: 700;
  cursor: pointer;
}

.pselect__option.is-active {
  background: #fbe7f0;
}

.pselect__option.is-chosen {
  background: #fff2c9;
}

.pselect__option.is-active.is-chosen {
  background: #f6c9dc;
}

.pselect__tick {
  flex: none;
  width: 16px;
  color: #a84874;
}
</style>
