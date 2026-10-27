<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The card that slides up when a building is chosen: what it is, who builds it, and a way in.
import { onMounted, ref } from 'vue'

defineProps({
  // one entry of PLACES in town/places.js
  place: { type: Object, required: true },
  // for a friend's house: { online, lastSeen } (see town/friends.js)
  presence: { type: Object, default: null },
})
const emit = defineEmits(['enter', 'close'])

const card = ref(null)

// keyboard and screen reader users land on the card
onMounted(() => card.value?.focus())
</script>

<template>
  <div
    ref="card"
    class="place-card"
    role="dialog"
    :aria-label="place.name"
    tabindex="-1"
    @keydown.esc="emit('close')"
  >
    <div class="place-card__top">
      <span class="place-card__tab" :style="{ background: place.accent }">{{ place.tab }}</span>
      <button type="button" class="place-card__close" aria-label="Close" @click="emit('close')">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
      </button>
    </div>
    <h2 class="place-card__title">{{ place.name }}</h2>
    <p v-if="presence" class="place-card__presence">
      <span class="place-card__dot" :class="{ 'is-online': presence.online }" aria-hidden="true"></span>
      {{ presence.online ? 'Online now' : `Last seen ${presence.lastSeen}` }}
    </p>
    <p class="place-card__blurb">{{ place.blurb }}</p>
    <button type="button" class="place-card__enter" :style="{ background: place.accent }" @click="emit('enter', place)">
      {{ place.enter }}
    </button>
  </div>
</template>

<style scoped>
.place-card {
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 18px;
  z-index: 20;
  padding: 16px 18px 18px;
  border: 1px solid var(--rl-line);
  border-radius: var(--rl-radius-modal, 22px);
  background: var(--rl-surface);
  box-shadow: 0 14px 36px rgba(63, 46, 36, 0.25);
  outline: none;
}

/* on a laptop the card stays card-sized, in the middle at the bottom */
@media (min-width: 768px) {
  .place-card {
    left: 50%;
    right: auto;
    width: 420px;
    margin-left: -210px;
    bottom: 28px;
  }
}

.place-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.place-card__tab {
  padding: 4px 10px;
  border-radius: 999px;
  color: var(--rl-surface);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.place-card__close {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  margin: -8px -10px -8px 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--rl-text);
}

.place-card__close svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
}

.place-card__title {
  margin: 6px 0 4px;
  font-family: var(--rl-font-title);
  font-size: 22px;
  font-weight: 700;
  color: var(--rl-text);
}

.place-card__presence {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 6px;
  font-size: 13px;
  font-weight: 700;
  color: var(--rl-muted);
}

.place-card__dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--rl-line);
}

.place-card__dot.is-online {
  background: #3fae5a;
}

.place-card__blurb {
  margin: 0 0 14px;
  font-size: 14px;
  line-height: 1.45;
  color: var(--rl-muted);
}

.place-card__enter {
  width: 100%;
  min-height: 48px;
  border: none;
  border-radius: 12px;
  color: var(--rl-surface);
  font-weight: 700;
  font-size: 15px;
}
</style>
