<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The day's tasks, opened from the Daily button: the streak and its freezes, the three tasks with
// Go, Claim once all three are done, and this week's rewards. Says once if a freeze saved the
// streak, or if it was lost. While developing, Preview buttons move the day on.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { untilReset } from '@/town/daily.js'
import DailyTaskRow from './DailyTaskRow.vue'
import StreakStrip from './StreakStrip.vue'

const props = defineProps({
  tasks: { type: Array, required: true },
  streak: { type: Number, default: 0 },
  freezes: { type: Number, default: 0 },
  maxFreezes: { type: Number, default: 2 },
  // this week of the streak, see StreakStrip
  week: { type: Array, required: true },
  // { coins, xp, chest }: what Claim gives today
  reward: { type: Object, required: true },
  canClaim: { type: Boolean, default: false },
  claimed: { type: Boolean, default: false },
  // { kind: 'frozen', used, streak } | { kind: 'lost', streak }
  notice: { type: Object, default: null },
  // show the buttons that move the day on (development only)
  preview: { type: Boolean, default: false },
})
const emit = defineEmits(['go', 'claim', 'dismiss-notice', 'preview-days', 'preview-reset'])

const now = ref(Date.now())
let clock = 0

const left = computed(() => props.tasks.filter((task) => !task.done).length)
const resetsIn = computed(() => {
  const minutes = Math.ceil(untilReset(now.value) / 60000)
  const hours = Math.floor(minutes / 60)
  return hours ? `${hours}h ${minutes % 60}m` : `${minutes}m`
})
const noticeText = computed(() => {
  const n = props.notice
  if (!n) return ''
  if (n.kind === 'frozen') {
    const days = n.used === 1 ? 'a day' : `${n.used} days`
    return `You missed ${days}, so ${n.used === 1 ? 'a streak freeze' : `${n.used} streak freezes`} kept your ${n.streak}-day streak safe.`
  }
  return `Your ${n.streak}-day streak ended. Finish today’s tasks to start a new one.`
})
const claimLabel = computed(() => {
  if (props.claimed) return 'Claimed. New tasks tomorrow'
  if (props.canClaim) return `Claim ${props.reward.coins} coins`
  return `Finish ${left.value} more to claim`
})

onMounted(() => {
  clock = window.setInterval(() => (now.value = Date.now()), 30000)
})
onBeforeUnmount(() => window.clearInterval(clock))
</script>

<template>
  <section id="town-daily" class="daily-panel" aria-labelledby="town-daily-title">
    <header class="daily-panel__head">
      <h2 id="town-daily-title" class="daily-panel__title">Daily tasks</h2>
      <span class="daily-panel__reset">New in {{ resetsIn }}</span>
    </header>

    <p v-if="notice" class="daily-panel__notice" :class="`is-${notice.kind}`" role="status">
      <span>{{ noticeText }}</span>
      <button type="button" class="btn btn-secondary btn-icon daily-panel__x" aria-label="Dismiss" @click="emit('dismiss-notice')">×</button>
    </p>

    <div class="daily-panel__streak">
      <span class="daily-panel__fire" :class="{ 'is-lit': streak > 0 }">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2.5c.6 3.2-1.4 4.7-2.9 6.6-1.3 1.6-2.4 3.2-2.4 5.6a5.3 5.3 0 0 0 10.6 0c0-2.1-.9-3.7-1.9-5-.3 1.4-1 2.4-2 2.8.5-3.6-.3-7.4-1.4-10z" />
        </svg>
        <strong>{{ streak }}-day streak</strong>
      </span>
      <span class="daily-panel__freezes" role="img" :aria-label="`${freezes} of ${maxFreezes} streak freezes`" :title="'A freeze saves your streak if you miss a day. Earn one back every 7th day.'">
        <svg v-for="i in maxFreezes" :key="i" viewBox="0 0 24 24" :class="{ 'is-used': i > freezes }" aria-hidden="true">
          <path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 3.5l3 2.5 3-2.5M9 20.5l3-2.5 3 2.5" />
        </svg>
      </span>
    </div>

    <ul class="daily-panel__tasks" aria-label="Today’s tasks">
      <DailyTaskRow v-for="task in tasks" :key="task.id" :task="task" @go="emit('go', $event)" />
    </ul>

    <button type="button" class="btn btn-accent daily-panel__claim" :class="{ 'is-ready': canClaim }" :disabled="!canClaim" @click="emit('claim')">
      {{ claimLabel }}
    </button>

    <StreakStrip :days="week" />
    <p class="daily-panel__note">Missed a day? A freeze keeps your streak. Day 7 refills one.</p>

    <div v-if="preview" class="daily-panel__preview" role="group" aria-label="Preview">
      <span>Preview</span>
      <button type="button" class="btn btn-secondary btn-sm" @click="emit('preview-days', 1)">Next day</button>
      <button type="button" class="btn btn-secondary btn-sm" @click="emit('preview-days', 2)">Skip a day</button>
      <button type="button" class="btn btn-secondary btn-sm" @click="emit('preview-reset')">Reset</button>
    </div>
  </section>
</template>

<style scoped>
.daily-panel {
  position: absolute;
  top: 126px;
  left: 14px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: min(360px, calc(100% - 28px));
  /* under the Daily button, stopping above your badge; Claim sits high so it stays in view */
  max-height: calc(100% - 126px - 116px);
  overflow-y: auto;
  padding: 14px;
  border: 1px solid var(--rl-line);
  border-radius: var(--rl-radius-card, 16px);
  background: var(--rl-surface);
  box-shadow: 0 10px 28px rgba(63, 46, 36, 0.2);
}

.daily-panel__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.daily-panel__title {
  margin: 0;
  font-size: 20px;
}

.daily-panel__reset {
  font-size: 13px;
  color: var(--rl-muted);
}

.daily-panel__notice {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 14px;
}

.daily-panel__notice.is-frozen {
  background: #e3f2fb;
  color: #1d4e6b;
}

.daily-panel__notice.is-lost {
  background: #fdecea;
  color: #7a2620;
}

.daily-panel__x {
  flex: none;
  margin: -4px 0 0 auto;
}

.daily-panel__streak {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.daily-panel__fire {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
}

.daily-panel__fire svg {
  width: 26px;
  height: 26px;
  fill: var(--rl-line);
}

.daily-panel__fire.is-lit svg {
  fill: #f08a24;
}

.daily-panel__freezes {
  display: inline-flex;
  gap: 4px;
}

.daily-panel__freezes svg {
  width: 26px;
  height: 26px;
  padding: 3px;
  border-radius: 8px;
  background: #d8eefa;
  fill: none;
  stroke: #3a8fc4;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.daily-panel__freezes svg.is-used {
  background: var(--rl-canvas);
  stroke: var(--rl-line);
}

.daily-panel__tasks {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.daily-panel__claim {
  flex: none;
}

.daily-panel__note {
  margin: -4px 0 0;
  font-size: 12px;
  color: var(--rl-muted);
  text-align: center;
}

.daily-panel__preview {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding-top: 10px;
  border-top: 1px dashed var(--rl-line);
  font-size: 12px;
  color: var(--rl-muted);
}

/* a glow, not a grow: the button stays still to tap */
@keyframes daily-claim {
  50% {
    box-shadow: 0 4px 0 #2b1d24, 0 0 0 6px rgba(246, 201, 74, 0.45);
  }
}

@media (prefers-reduced-motion: reduce) {
  .daily-panel__claim.is-ready {
    animation: none;
  }
}
</style>
