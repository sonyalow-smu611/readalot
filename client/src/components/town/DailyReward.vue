<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// What Claim gives, over the town: a chest that bounces in and pops open with coins flying out,
// the streak day, and what's in it. "Nice!" closes it and the badge counts the coins up.
import { onMounted, ref } from 'vue'

defineProps({
  // { n, coins, xp, chest }: the streak day claimed and its reward
  reward: { type: Object, required: true },
})
const emit = defineEmits(['close'])

const button = ref(null)
onMounted(() => button.value?.focus())
</script>

<template>
  <div class="daily-reward" @click.self="emit('close')">
    <section class="daily-reward__card" role="dialog" aria-modal="true" aria-labelledby="daily-reward-title">
      <div class="daily-reward__chest" aria-hidden="true">
        <span v-for="i in 6" :key="i" class="daily-reward__coin" :style="{ '--i': i }"></span>
        <svg viewBox="0 0 32 28">
          <g class="daily-reward__lid">
            <path d="M2 11V7c0-3 2-5 5-5h18c3 0 5 2 5 5v4z" fill="#d38a3c" stroke="#5a3214" stroke-width="1.5" />
            <rect x="2" y="9" width="28" height="3" fill="#f6c94a" />
          </g>
          <rect x="2" y="12" width="28" height="14" fill="#b06a2c" stroke="#5a3214" stroke-width="1.5" />
          <rect x="2" y="12" width="28" height="3" fill="#f6c94a" />
          <rect x="13" y="12" width="6" height="7" fill="#f6c94a" stroke="#8a5a12" />
        </svg>
      </div>
      <p class="daily-reward__day">Day {{ reward.n }} streak!</p>
      <h2 id="daily-reward-title" class="daily-reward__title">Daily reward</h2>
      <ul class="daily-reward__gifts">
        <li><span class="daily-reward__icon is-coin" aria-hidden="true"></span>+{{ reward.coins }} coins</li>
        <li><span class="daily-reward__icon is-xp" aria-hidden="true">XP</span>+{{ reward.xp }} XP</li>
        <li v-if="reward.chest"><span class="daily-reward__icon is-freeze" aria-hidden="true">❄</span>+1 streak freeze</li>
      </ul>
      <p class="daily-reward__next">Come back tomorrow to keep your streak going.</p>
      <button ref="button" type="button" class="btn btn-accent daily-reward__ok" @click="emit('close')">Nice!</button>
    </section>
  </div>
</template>

<style scoped>
.daily-reward {
  position: absolute;
  inset: 0;
  z-index: 30;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgba(43, 29, 36, 0.45);
  animation: reward-fade 0.2s ease both;
}

.daily-reward__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: min(320px, 100%);
  padding: 20px 20px 18px;
  border: 3px solid #2b1d24;
  border-radius: var(--rl-radius-modal, 22px);
  background: #fff8ef;
  box-shadow: 0 6px 0 #2b1d24, 0 18px 40px rgba(43, 29, 36, 0.35);
  text-align: center;
  animation: reward-in 0.45s cubic-bezier(0.2, 0.8, 0.2, 1.3) both;
}

.daily-reward__chest {
  position: relative;
  width: 96px;
  height: 84px;
  margin-bottom: 6px;
  animation: reward-bounce 0.5s 0.3s cubic-bezier(0.3, 1.6, 0.5, 1) both;
}

.daily-reward__chest svg {
  position: relative;
  width: 100%;
  height: 100%;
  shape-rendering: crispEdges;
}

.daily-reward__lid {
  transform-origin: 2px 11px;
  animation: reward-lid 0.35s 0.65s ease-out both;
}

/* coins fan out of the chest as it opens */
.daily-reward__coin {
  position: absolute;
  left: 40px;
  top: 30px;
  width: 16px;
  height: 16px;
  border: 2px solid #8a5a12;
  border-radius: 3px;
  background: #f6c94a;
  box-shadow: inset -2px -2px 0 #e0a02a;
  opacity: 0;
  animation: reward-coin 0.8s calc(0.7s + var(--i) * 0.05s) cubic-bezier(0.2, 0.8, 0.4, 1) both;
  --dx: calc((var(--i) - 3.5) * 22px);
}

.daily-reward__day {
  margin: 0;
  font-weight: 800;
  font-size: 13px;
  color: #f08a24;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.daily-reward__title {
  margin: 2px 0 10px;
  font-size: 24px;
}

.daily-reward__gifts {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0 0 10px;
  padding: 0;
  list-style: none;
  font-weight: 800;
  font-size: 17px;
}

.daily-reward__gifts li {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.daily-reward__icon {
  display: inline-grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 5px;
  font-size: 10px;
}

.daily-reward__icon.is-coin {
  border: 2px solid #8a5a12;
  background: #f6c94a;
  box-shadow: inset -2px -2px 0 #e0a02a;
}

.daily-reward__icon.is-xp {
  background: #3fae5a;
  color: #fff;
}

.daily-reward__icon.is-freeze {
  background: #d8eefa;
  color: #3a8fc4;
  font-size: 14px;
}

.daily-reward__next {
  margin: 0 0 14px;
  font-size: 13px;
  color: var(--rl-muted);
}

.daily-reward__ok {
  min-width: 140px;
}

@keyframes reward-fade {
  from {
    opacity: 0;
  }
}

@keyframes reward-in {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(20px);
  }
}

@keyframes reward-bounce {
  from {
    transform: scale(0.3);
  }
}

@keyframes reward-lid {
  to {
    transform: rotate(-28deg) translateY(-3px);
  }
}

@keyframes reward-coin {
  0% {
    opacity: 1;
    transform: translate(0, 0) scale(0.6);
  }
  60% {
    opacity: 1;
    transform: translate(var(--dx), -46px) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(var(--dx), -20px) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .daily-reward,
  .daily-reward__card,
  .daily-reward__chest,
  .daily-reward__coin {
    animation: none;
  }

  .daily-reward__lid {
    animation: none;
    transform: rotate(-28deg) translateY(-3px);
  }
}
</style>
