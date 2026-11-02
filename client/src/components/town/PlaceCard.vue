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
    class="place-card px-sign-box"
    :style="{ '--accent': place.accent }"
    role="dialog"
    :aria-label="place.name"
    tabindex="-1"
    @keydown.esc="emit('close')"
  >
    <!-- the plate: the building's sign, in its colour -->
    <div class="place-card__plate">
      <div class="place-card__words">
        <h2 class="place-card__title">{{ place.name }}</h2>
        <span class="place-card__tab">{{ place.tab }}</span>
      </div>
      <button type="button" class="btn btn-secondary btn-icon px-sign place-card__close" aria-label="Close" @click="emit('close')">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
      </button>
    </div>
    <div class="place-card__body">
      <p v-if="presence" class="place-card__presence">
        <span class="place-card__dot" :class="{ 'is-online': presence.online }" aria-hidden="true"></span>
        {{ presence.online ? 'Online now' : `Last seen ${presence.lastSeen}` }}
      </p>
      <p class="place-card__blurb">{{ place.blurb }}</p>
      <button type="button" class="btn w-100 px-sign place-card__enter" @click="emit('enter', place)">
        {{ place.enter }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.place-card {
  position: absolute;
  left: 17px;
  right: 17px;
  bottom: 24px;
  z-index: 20;
  outline: none;
}

/* on a laptop the card stays card-sized, in the middle at the bottom */
@media (min-width: 768px) {
  .place-card {
    left: 50%;
    right: auto;
    width: 420px;
    margin-left: -210px;
    bottom: 32px;
  }
}

/* the sign's plate: its colour, a light line on top, a dark band along the bottom */
.place-card__plate {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 14px 18px 16px;
  background: var(--accent);
  box-shadow:
    inset 0 3px 0 color-mix(in srgb, var(--accent) 65%, white),
    inset 0 -6px 0 color-mix(in srgb, var(--accent) 62%, black);
}

.place-card__words {
  min-width: 0;
}

.place-card__title {
  margin: 0;
  font-family: var(--sign-font);
  font-size: 24px;
  font-weight: 700;
  line-height: 1.1;
  color: #ffffff;
  text-shadow: 2px 2px 0 var(--sign-outline);
}

.place-card__tab {
  display: inline-block;
  margin-top: 6px;
  padding: 2px 8px;
  background: color-mix(in srgb, var(--accent) 55%, black);
  font-family: var(--sign-font);
  font-size: 12px;
  color: #fff6dc;
  letter-spacing: 0.5px;
}

.place-card__close {
  flex: none;
  margin: 3px;
}

.place-card__close svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 3;
  stroke-linecap: square;
}

.place-card__body {
  padding: 14px 16px 18px;
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
  background: var(--rl-line);
}

.place-card__dot.is-online {
  background: #3fae5a;
}

.place-card__blurb {
  margin: 0 0 16px;
  font-size: 14px;
  line-height: 1.45;
  color: var(--rl-text);
}

/* Enter, in the building's colour */
.place-card__enter {
  --px-fill: var(--accent);
  --px-light: color-mix(in srgb, var(--accent) 65%, white);
  --px-dark: color-mix(in srgb, var(--accent) 62%, black);
  --px-label: #ffffff;
  --px-hover: color-mix(in srgb, var(--accent) 82%, black);
  font-size: 15px;
}
</style>
