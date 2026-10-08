<!-- Sticky note pinned to the room wall. Tapping it opens the Quote of the Day. -->
<template>
  <button class="note" type="button" aria-haspopup="dialog">
    <span class="note__tape" aria-hidden="true" />
    <span class="note__text">Quote of the day</span>
  </button>
</template>

<style scoped>
.note {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  aspect-ratio: 1 / 0.92;
  padding: calc(9 * var(--u)) calc(5 * var(--u)) calc(5 * var(--u));
  transform: rotate(-5deg);
  transform-origin: 50% 0;
  border: 0;
  /* the lower right corner curls up off the wall */
  border-radius: 1px 1px calc(12 * var(--u)) 1px / 1px 1px calc(4 * var(--u)) 1px;
  background: linear-gradient(170deg, #f6e7ad, #efd98f);
  box-shadow: calc(2 * var(--u)) calc(4 * var(--u)) calc(6 * var(--u)) rgba(63, 46, 36, 0.28);
  color: var(--rl-primary);
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.note__tape {
  position: absolute;
  top: calc(-4 * var(--u));
  left: 50%;
  width: 42%;
  height: calc(9 * var(--u));
  transform: translateX(-50%) rotate(3deg);
  background: rgba(255, 253, 249, 0.6);
  box-shadow: 0 1px 1px rgba(63, 46, 36, 0.12);
}

.note__text {
  font-family: var(--rl-font-title);
  font-size: max(10px, calc(10.5 * var(--u)));
  font-style: italic;
  font-weight: 700;
  line-height: 1.15;
  text-align: center;
}

.note:hover,
.note:focus-visible {
  transform: rotate(-2deg) translateY(calc(-2 * var(--u)));
  box-shadow: calc(3 * var(--u)) calc(7 * var(--u)) calc(9 * var(--u)) rgba(63, 46, 36, 0.3);
}

@media (prefers-reduced-motion: reduce) {
  .note {
    transition: none;
  }
}
</style>
