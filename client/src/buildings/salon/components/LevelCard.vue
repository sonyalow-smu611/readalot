<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The reader's level: XP counting up, a bar filling toward the next level, and what the next
// level-up gives. How XP is earned is listed underneath.
import { computed } from 'vue'
import CountUp from '@/components/shared/CountUp.vue'
import ProfileBlock from '@/buildings/salon/components/ProfileBlock.vue'

const props = defineProps({
  // the reader's total XP
  xp: { type: Number, required: true },
  // from lib/levels.js: { level, from, to, toNext, progress }
  level: { type: Object, required: true },
})

const WAYS = [
  ['Finish a book', 100],
  ['Write a review', 40],
  ['Start reading a book', 20],
  ['Visit a reader’s room', 15],
  ['Add a book to a shelf', 10],
  ['Leave a note in a room', 10],
  ['Send a cafe message', 5],
]

const percent = computed(() => Math.round(Math.min(1, Math.max(0, props.level.progress)) * 100))
const reward = computed(() => 25 * (props.level.level + 1))
</script>

<template>
  <ProfileBlock title="Reader level">
    <div class="level">
      <span class="level__number" aria-hidden="true">{{ level.level }}</span>
      <div class="level__detail">
        <p class="level__xp">
          <CountUp :value="xp" /> XP
          <span class="visually-hidden">, level {{ level.level }}</span>
        </p>
        <div
          class="level__bar"
          role="progressbar"
          :aria-valuenow="percent"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-label="`Progress to level ${level.level + 1}`"
        >
          <span class="level__fill" :style="{ width: `${percent}%` }" />
        </div>
        <p class="level__next">{{ level.toNext }} XP to level {{ level.level + 1 }}, which gives {{ reward }} coins</p>
      </div>
    </div>
    <details class="ways">
      <summary>How to earn XP</summary>
      <ul>
        <li v-for="[label, points] in WAYS" :key="label">
          <span>{{ label }}</span>
          <strong>+{{ points }}</strong>
        </li>
      </ul>
    </details>
  </ProfileBlock>
</template>

<style scoped>
.level {
  display: flex;
  align-items: center;
  gap: 14px;
}

/* the level on a gold pixel shield */
.level__number {
  flex: none;
  display: grid;
  place-items: center;
  width: 58px;
  height: 64px;
  border: 3px solid var(--px-ink, #2b1d24);
  background: linear-gradient(#ffe57a, #f2b632);
  clip-path: polygon(0 0, 100% 0, 100% 72%, 50% 100%, 0 72%);
  font-family: var(--rl-font-title);
  font-size: 1.75rem;
  font-weight: 700;
}

.level__detail {
  flex: 1 1 auto;
  min-width: 0;
}

.level__xp {
  margin: 0 0 6px;
  font-family: var(--rl-font-title);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--px-pink-dark, #a84874);
}

.level__bar {
  height: 16px;
  overflow: hidden;
  border: 3px solid var(--px-ink, #2b1d24);
  border-radius: 2px;
  background: var(--px-paper-dark, #f6e6d8);
}

/* the fill is striped in pixel steps and slides as it grows */
.level__fill {
  display: block;
  height: 100%;
  background: repeating-linear-gradient(90deg, #3fae5a 0 8px, #5cc274 8px 16px);
  transition: width 0.9s cubic-bezier(0.2, 0.8, 0.2, 1);
  animation: bar-slide 1.2s linear infinite;
}

.level__next {
  margin: 6px 0 0;
  color: var(--rl-muted);
  font-size: 0.8125rem;
}

.ways {
  margin-top: 12px;
  font-size: 0.875rem;
}

.ways summary {
  min-height: 44px;
  padding: 10px 0;
  font-weight: 700;
  cursor: pointer;
}

.ways ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.ways li {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-top: 2px dashed var(--px-pink-light, #f9d3e2);
}

@keyframes bar-slide {
  to {
    background-position: 16px 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .level__fill {
    transition: none;
    animation: none;
  }
}
</style>
