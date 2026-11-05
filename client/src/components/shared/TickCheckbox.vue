<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// A checkbox in the app's pixel look whose tick draws itself when you tick it (and rubs out when
// you untick): the box fills green with a small pop, then the tick is drawn stroke by stroke. It is
// a real checkbox underneath, so the keyboard (Space) and screen readers work, and the label is
// part of it, so pressing the words ticks it too.
defineProps({
  modelValue: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <label class="tick-check">
    <input
      class="tick-check__input"
      type="checkbox"
      :checked="modelValue"
      @change="emit('update:modelValue', $event.target.checked)"
    />
    <span class="tick-check__box" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path class="tick-check__tick" d="M5 12.5l4.6 4.6L19 7.4" pathLength="1" />
      </svg>
    </span>
    <span class="tick-check__text"><slot /></span>
  </label>
</template>

<style scoped>
.tick-check {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  cursor: pointer;
  user-select: none;
}

/* hidden but still focusable and clickable through the label */
.tick-check__input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.tick-check__box {
  flex: none;
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border: 2px solid var(--px-outline, #1e1a24);
  background: var(--px-paper, #f9f3e6);
  box-shadow: 2px 2px 0 var(--px-outline, #1e1a24);
  transition:
    background-color 0.22s ease,
    transform 0.28s cubic-bezier(0.34, 1.6, 0.5, 1),
    box-shadow 0.22s ease;
}

.tick-check__box svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: var(--px-paper, #f9f3e6);
  stroke-width: 3.4;
  stroke-linecap: square;
  stroke-linejoin: miter;
}

/* the tick is drawn along its length: hidden when the dash is pushed out of the line */
.tick-check__tick {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  transition: stroke-dashoffset 0.3s ease;
}

.tick-check__input:checked + .tick-check__box {
  background: #3b7330;
  transform: scale(1.08);
}

.tick-check__input:checked + .tick-check__box .tick-check__tick {
  stroke-dashoffset: 0;
  /* starts a moment after the box has filled */
  transition: stroke-dashoffset 0.32s ease 0.1s;
}

.tick-check:active .tick-check__box {
  transform: scale(0.94);
  box-shadow: 1px 1px 0 var(--px-outline, #1e1a24);
}

.tick-check__input:focus-visible + .tick-check__box {
  outline: 3px solid #de9951;
  outline-offset: 2px;
}

.tick-check__text {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--rl-text);
}

@media (prefers-reduced-motion: reduce) {
  .tick-check__box,
  .tick-check__tick,
  .tick-check__input:checked + .tick-check__box .tick-check__tick {
    transition: none;
  }
}
</style>
