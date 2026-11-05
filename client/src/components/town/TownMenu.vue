<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// On a phone, the town's second row of buttons (Daily, the bell, music, public or private) folds
// into one ☰ menu under the weather chip, so the map isn't crowded. Each row does exactly what its
// button does; TownView does the work. A red dot on ☰ says something is waiting: an unread
// notification or a Daily reward to claim. Wider screens and the walkthrough keep the buttons.
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  // from TownView's dailyChip: { streak, done, total, ready, claimed }
  daily: { type: Object, default: null },
  unread: { type: Number, default: 0 },
  musicOn: { type: Boolean, default: true },
  public: { type: Boolean, default: false },
  publicBusy: { type: Boolean, default: false },
  // under-18s are always private
  publicLocked: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle', 'close', 'daily', 'notifications', 'music', 'public'])

const root = ref(null)
const waiting = computed(() => props.unread > 0 || Boolean(props.daily?.ready))
const label = computed(() => (waiting.value ? 'Menu, something new' : 'Menu'))

// a tap anywhere else shuts it
function outside(event) {
  if (!root.value?.contains(event.target)) emit('close')
}

watch(
  () => props.open,
  (open) => {
    if (open) document.addEventListener('pointerdown', outside, true)
    else document.removeEventListener('pointerdown', outside, true)
  },
)

onBeforeUnmount(() => document.removeEventListener('pointerdown', outside, true))
</script>

<template>
  <div ref="root" class="town-menu">
    <button
      type="button"
      class="btn btn-secondary btn-icon px-sign town-menu__toggle"
      :aria-label="label"
      :aria-expanded="open"
      aria-controls="town-menu"
      @click="emit('toggle')"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
      <span v-if="waiting" class="town-menu__dot" aria-hidden="true"></span>
    </button>

    <Transition name="town-menu">
      <div v-if="open" id="town-menu" class="px-sign-box town-menu__list" role="group" aria-label="Town menu">
        <button v-if="daily" type="button" class="town-menu__row" @click="emit('daily')">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2.5c.6 3.2-1.4 4.7-2.9 6.6-1.3 1.6-2.4 3.2-2.4 5.6a5.3 5.3 0 0 0 10.6 0c0-2.1-.9-3.7-1.9-5-.3 1.4-1 2.4-2 2.8.5-3.6-.3-7.4-1.4-10z" />
          </svg>
          <span class="town-menu__word">Daily tasks</span>
          <span class="town-menu__more">
            <span v-if="daily.ready" class="town-menu__badge">Claim</span>
            <template v-else>{{ daily.done }}/{{ daily.total }}</template>
          </span>
        </button>

        <button type="button" class="town-menu__row" @click="emit('notifications')">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.8 2H4.2z" />
            <path d="M10 21.2a2.2 2.2 0 0 0 4 0" />
          </svg>
          <span class="town-menu__word">Notifications</span>
          <span v-if="unread" class="town-menu__more"><span class="town-menu__badge">{{ unread > 9 ? '9+' : unread }}</span></span>
        </button>

        <button type="button" role="switch" class="town-menu__row" :aria-checked="musicOn" @click="emit('music')">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <ellipse class="town-menu__fill" cx="9" cy="17.5" rx="3.6" ry="2.8" transform="rotate(-20 9 17.5)" />
            <path d="M12.3 16.6V4.2" />
            <path d="M12.3 4.2c1.2 2.4 5.6 3 5.2 7.4" />
            <path v-if="!musicOn" d="M4 4l16 16" />
          </svg>
          <span class="town-menu__word">Music</span>
          <span class="town-menu__more">{{ musicOn ? 'On' : 'Off' }}</span>
        </button>

        <button
          type="button"
          role="switch"
          class="town-menu__row"
          aria-label="Public profile and location"
          :aria-checked="public"
          :disabled="publicBusy || publicLocked"
          :title="publicLocked ? 'Readers under 18 stay private' : ''"
          @click="emit('public')"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" />
            <circle cx="12" cy="9.5" r="2.4" />
          </svg>
          <span class="town-menu__word">{{ public ? 'Public' : 'Private' }}</span>
          <span class="town-menu__more">{{ public ? 'On the map' : 'Hidden' }}</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.town-menu {
  pointer-events: auto;
}

.town-menu__toggle {
  position: relative;
}

.town-menu__toggle svg,
.town-menu__row svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.town-menu__dot {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 14px;
  height: 14px;
  border: 2px solid #2b1d24;
  border-radius: 999px;
  background: #e5484d;
}

.town-menu__list {
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  display: flex;
  flex-direction: column;
  min-width: 220px;
  padding: 6px;
  --sign-fill: var(--px-paper, #fff8ef);
}

.town-menu__row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 44px;
  padding: 6px 10px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: 700;
  text-align: left;
}

.town-menu__row + .town-menu__row {
  border-top: 2px dashed rgba(43, 29, 36, 0.15);
}

.town-menu__row:hover:not(:disabled),
.town-menu__row:focus-visible {
  background: rgba(43, 29, 36, 0.07);
}

.town-menu__row:disabled {
  opacity: 0.55;
}

.town-menu__fill {
  fill: currentColor;
}

.town-menu__word {
  flex: 1 1 auto;
}

.town-menu__more {
  color: var(--rl-muted, #6b5a4e);
  font-size: 0.875rem;
}

.town-menu__badge {
  display: inline-block;
  min-width: 22px;
  padding: 1px 7px;
  border: 2px solid #2b1d24;
  border-radius: 999px;
  background: #e5484d;
  color: #fff;
  font-size: 12px;
  text-align: center;
}

.town-menu-enter-active,
.town-menu-leave-active {
  transition: opacity 0.16s ease, transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.town-menu-enter-from,
.town-menu-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (prefers-reduced-motion: reduce) {
  .town-menu-enter-active,
  .town-menu-leave-active {
    transition: none;
  }
}
</style>
