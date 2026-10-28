<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The pop-up after the People map switch flips: the reader's character cheers (found) or puts
// on a mask (hidden). Screen readers hear the same news from PrivacySetting's status line.
import { computed } from 'vue'
import CharacterSprite from '@/components/shared/CharacterSprite.vue'
import { PRIVACY_ALERTS } from '@/buildings/salon/profileOptions.js'

const props = defineProps({
  // 'public', 'private', or '' when closed
  mode: { type: String, default: '' },
  // the reader's saved character; its face is shown
  character: { type: Object, required: true },
})

const emit = defineEmits(['close'])

const copy = computed(() => PRIVACY_ALERTS[props.mode] ?? null)
</script>

<template>
  <Teleport to=".phone-frame">
    <Transition name="spot">
      <div v-if="copy" :key="mode" class="spot" :class="`spot--${mode}`" aria-hidden="true" @click="emit('close')">
        <div class="spot__card">
          <div class="spot__mascot">
            <span class="spot__face">
              <CharacterSprite :character="character" crop="head" :scale="3" decorative />
            </span>
            <template v-if="mode === 'public'">
              <span v-for="n in 6" :key="n" class="spot__spark" :style="{ '--i': n }">✦</span>
              <span class="spot__heart">♥</span>
            </template>
            <svg v-else class="spot__mask" viewBox="0 0 100 40">
              <path
                fill-rule="evenodd"
                d="M2 14 Q2 4 14 5 Q32 7 50 13 Q68 7 86 5 Q98 4 98 14 Q98 30 80 33 Q62 35 50 24 Q38 35 20 33 Q2 30 2 14Z
                   M17 19 a10 6 0 1 0 20 0 a10 6 0 1 0 -20 0Z
                   M63 19 a10 6 0 1 0 20 0 a10 6 0 1 0 -20 0Z"
              />
              <path class="spot__shine" d="M10 11 Q20 8 30 10" />
            </svg>
          </div>
          <p class="spot__title">{{ copy.title }}</p>
          <p class="spot__note">{{ copy.note }}</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.spot {
  position: absolute;
  inset: 0;
  z-index: 45;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(44, 36, 30, 0.32);
}

.spot__card {
  width: min(100%, 280px);
  padding: 22px 18px 18px;
  border: 1px solid var(--rl-line);
  border-radius: var(--rl-radius-modal);
  background: var(--rl-surface);
  box-shadow: 0 14px 36px rgba(63, 46, 36, 0.25);
  text-align: center;
}

.spot--private .spot__card {
  background: #2c241e;
  border-color: #2c241e;
  color: #fffdf9;
}

.spot__mascot {
  position: relative;
  display: grid;
  place-items: center;
  width: 96px;
  height: 96px;
  margin: 0 auto 14px;
  border-radius: 999px;
  background: var(--rl-secondary);
}

.spot--private .spot__mascot {
  background: #4a3d33;
}

.spot__face {
  display: block;
  line-height: 0;
}

.spot--public .spot__face {
  animation: mascot-hop 0.9s cubic-bezier(0.3, 1.4, 0.5, 1) 0.15s 2;
}

.spot--private .spot__face {
  animation: mascot-sneak 1.4s ease-in-out 0.5s;
}

.spot__spark {
  position: absolute;
  top: 50%;
  left: 50%;
  color: var(--rl-accent);
  font-size: 1rem;
  line-height: 1;
  opacity: 0;
  transform: rotate(calc(var(--i) * 60deg)) translateY(-56px) rotate(calc(var(--i) * -60deg));
  animation: spark 1.1s ease-out calc(0.2s + var(--i) * 0.05s) both;
}

.spot__heart {
  position: absolute;
  top: 4px;
  right: 2px;
  color: #d9534f;
  font-size: 1.25rem;
  line-height: 1;
  animation: heart-float 1.6s ease-out 0.4s both;
}

.spot__mask {
  position: absolute;
  /* over the sprite's eyes */
  top: 38px;
  left: 50%;
  width: 54px;
  margin-left: -27px;
  overflow: visible;
  fill: #1b1512;
  filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.35));
  animation: mask-on 0.55s cubic-bezier(0.3, 1.4, 0.5, 1) 0.15s both;
}

.spot__shine {
  fill: none;
  stroke: rgba(255, 253, 249, 0.45);
  stroke-width: 2.5;
  stroke-linecap: round;
}

.spot__title {
  margin: 0 0 4px;
  font-family: var(--rl-font-title);
  font-size: 1.125rem;
  font-weight: 700;
}

.spot__note {
  margin: 0;
  color: var(--rl-muted);
  font-size: 0.875rem;
}

.spot--private .spot__note {
  color: #d9cfc4;
}

.spot-enter-active {
  transition: opacity 0.2s ease;
}

.spot-enter-active .spot__card {
  animation: spot-pop 0.4s cubic-bezier(0.3, 1.4, 0.5, 1);
}

.spot-leave-active {
  transition: opacity 0.25s ease;
}

.spot-enter-from,
.spot-leave-to {
  opacity: 0;
}

@keyframes spot-pop {
  from { transform: scale(0.8); opacity: 0; }
}

@keyframes mascot-hop {
  0%, 100% { transform: translateY(0) rotate(0); }
  35% { transform: translateY(-14px) rotate(-8deg); }
  65% { transform: translateY(0) rotate(6deg); }
}

@keyframes mascot-sneak {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  60% { transform: translateX(6px); }
}

@keyframes spark {
  0% { opacity: 0; transform: rotate(calc(var(--i) * 60deg)) translateY(-30px) rotate(calc(var(--i) * -60deg)) scale(0.4); }
  40% { opacity: 1; }
  100% { opacity: 0; transform: rotate(calc(var(--i) * 60deg)) translateY(-62px) rotate(calc(var(--i) * -60deg)) scale(1.1); }
}

@keyframes heart-float {
  0% { opacity: 0; transform: translateY(8px) scale(0.5); }
  30% { opacity: 1; transform: translateY(0) scale(1.1); }
  100% { opacity: 0; transform: translateY(-22px) scale(1); }
}

@keyframes mask-on {
  from { opacity: 0; transform: translateY(-40px) rotate(-12deg); }
}

@media (prefers-reduced-motion: reduce) {
  .spot__face,
  .spot__mask,
  .spot-enter-active .spot__card {
    animation: none;
    transition: none;
  }

  .spot__spark,
  .spot__heart {
    display: none;
  }
}
</style>
