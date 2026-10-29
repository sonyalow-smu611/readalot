<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// This week of the streak as seven reward tiles: the days already claimed ticked, today's
// outlined in gold, and the ones still to come showing what they give, the 7th a chest.
defineProps({
  // [{ n, status: 'claimed' | 'today' | 'later', coins, chest }]
  days: { type: Array, required: true },
})
</script>

<template>
  <ol class="streak-strip" aria-label="Streak rewards this week">
    <li
      v-for="day in days"
      :key="day.n"
      class="streak-strip__day"
      :class="[`is-${day.status}`, { 'is-chest': day.chest }]"
      :aria-label="`Day ${day.n}: ${day.coins} coins${day.chest ? ' and a streak freeze' : ''}${day.status === 'claimed' ? ', claimed' : day.status === 'today' ? ', today' : ''}`"
    >
      <span class="streak-strip__n" aria-hidden="true">Day {{ day.n }}</span>
      <svg v-if="day.chest" class="streak-strip__chest" viewBox="0 0 16 14" aria-hidden="true">
        <rect x="1" y="5" width="14" height="8" fill="#b06a2c" stroke="#5a3214" />
        <path d="M1 5V3.5C1 2 2 1 3.5 1h9C14 1 15 2 15 3.5V5z" fill="#d38a3c" stroke="#5a3214" />
        <rect x="1" y="5" width="14" height="2" fill="#f6c94a" />
        <rect x="6.5" y="5" width="3" height="4" fill="#f6c94a" stroke="#8a5a12" />
      </svg>
      <span v-else class="streak-strip__coin" aria-hidden="true"></span>
      <span class="streak-strip__coins" aria-hidden="true">{{ day.coins }}</span>
      <svg v-if="day.status === 'claimed'" class="streak-strip__tick" viewBox="0 0 24 24" aria-hidden="true">
        <path d="m6 12.5 4 4L18 8" />
      </svg>
    </li>
  </ol>
</template>

<style scoped>
.streak-strip {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.streak-strip__day {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 6px 0 5px;
  border: 2px solid transparent;
  border-radius: 10px;
  background: var(--rl-canvas);
  font-size: 11px;
  font-weight: 700;
  color: var(--rl-muted);
}

.streak-strip__n {
  font-size: 10px;
  white-space: nowrap;
}

.streak-strip__coins {
  color: var(--rl-text);
}

.is-today {
  border-color: #e0a02a;
  background: #fff4d6;
}

.is-chest {
  background: #fdebd3;
}

.is-claimed {
  opacity: 0.55;
}

.streak-strip__coin {
  width: 14px;
  height: 14px;
  border: 2px solid #8a5a12;
  border-radius: 3px;
  background: #f6c94a;
  box-shadow: inset -2px -2px 0 #e0a02a;
}

.streak-strip__chest {
  width: 20px;
  height: 18px;
  shape-rendering: crispEdges;
}

.streak-strip__tick {
  position: absolute;
  top: -5px;
  right: -4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3fae5a;
  fill: none;
  stroke: #fff;
  stroke-width: 3.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
