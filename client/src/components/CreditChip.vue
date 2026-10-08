<script setup>
// The reader's credit balance: a gold coin and the amount.
import { useId } from 'vue'
import { useDecor } from '@/composables/useDecor'

defineProps({
  // 'dark' text for light surfaces (the room wall), 'light' for dark ones (the bookshelf bar)
  tone: { type: String, default: 'dark' },
})

const { credits } = useDecor()
const uid = useId()
</script>

<template>
  <p class="credits" :class="`credits--${tone}`">
    <svg class="credits__coin" viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <radialGradient :id="`${uid}-gold`" cx="35%" cy="30%" r="75%">
          <stop offset="0" stop-color="#f6df9a" />
          <stop offset="0.55" stop-color="#d9b256" />
          <stop offset="1" stop-color="#a8802f" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="11" :fill="`url(#${uid}-gold)`" stroke="#7d5c1c" stroke-width="1" />
      <circle cx="12" cy="12" r="7.6" fill="none" stroke="#8a6a24" stroke-width="0.9" stroke-opacity="0.75" />
      <text x="12" y="16" class="credits__sign">$</text>
    </svg>
    <span class="credits__amount">{{ credits }}</span>
    <span class="visually-hidden">credits</span>
  </p>
</template>

<style scoped>
.credits {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  /* the body face: the title face draws 0 and 8 at different heights */
  font-family: var(--rl-font-body);
  font-size: 1rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.03em;
  font-variant-numeric: tabular-nums;
}

.credits--dark {
  color: var(--rl-primary);
}

/* brass lettering, like the labels on the shelves */
.credits--light {
  color: #f0d998;
}

.credits__coin {
  width: 22px;
  height: 22px;
  flex: none;
  filter: drop-shadow(0 1px 1px rgba(44, 36, 30, 0.4));
}

.credits__sign {
  fill: #7d5c1c;
  font-family: var(--rl-font-title);
  font-size: 11px;
  font-weight: 700;
  text-anchor: middle;
}
</style>
