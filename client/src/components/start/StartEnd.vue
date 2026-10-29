<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The last screen: night has fallen over the town (the moon and stars are in the sky behind,
// StartBackdrop). Your house, with the character you made standing at the door under your name,
// the street of neighbours along the bottom, and the way in once more.
import StartStreet from './StartStreet.vue'
import StartActions from './StartActions.vue'
import PixelCharacter from '@/components/shared/PixelCharacter.vue'

defineProps({
  character: { type: Object, required: true },
  name: { type: String, default: '' },
})
const emit = defineEmits(['choose'])
</script>

<template>
  <section id="start-join" class="end" aria-labelledby="start-join-title">
    <StartStreet :houses="['cottage-green', 'library', 'cottage-white', 'cafe', 'cottage-lilac', 'salon']" :walkers="['rosie', 'rex', 'nova']" />
    <div class="end__inner" data-fade>
      <div class="end__home" aria-hidden="true">
        <span class="end__tag">{{ name.trim() || 'You' }}</span>
        <img class="end__house" src="/town/buildings/house.png" alt="" />
        <PixelCharacter class="end__me" :character="character" :scale="2" decorative />
      </div>
      <h2 id="start-join-title" class="end__title">Your next book is waiting.</h2>
      <p class="end__lede">Make your character, fill your shelf, and say hi tonight.</p>
      <StartActions on-dark centred @choose="emit('choose')" />
    </div>
  </section>
</template>

<style scoped>
.end {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 96px 20px 260px;
  overflow: hidden;
  text-align: center;
}

.end__inner {
  position: relative;
  z-index: 1;
}

/* your house from the town at half size, lights on, you at the door */
.end__home {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 266px;
  margin: 0 auto 20px;
}

.end__tag {
  margin-bottom: 8px;
  padding: 2px 12px;
  border: 3px solid var(--s-ink);
  border-radius: 999px;
  background: var(--s-gold);
  color: var(--s-ink);
  font-size: 15px;
  font-weight: 700;
}

.end__house {
  width: 266px;
  height: 210px;
  image-rendering: pixelated;
  filter: drop-shadow(0 0 22px rgba(255, 205, 110, 0.35));
}

.end__me {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
}

.end__title {
  max-width: 760px;
  margin: 0 auto 12px;
  font-family: var(--rl-font-title);
  font-size: clamp(32px, 6vw, 54px);
  font-weight: 700;
  line-height: 1.12;
  color: var(--rl-surface);
  text-shadow: 0 2px 16px rgba(30, 26, 36, 0.55);
}

.end__lede {
  margin: 0 auto 28px;
  color: rgba(255, 253, 249, 0.85);
  font-size: clamp(16px, 1.8vw, 19px);
}

@media (max-width: 575px) {
  .end {
    padding-top: 128px;
  }
}

@media (max-width: 767px) {
  .end {
    padding-bottom: 190px;
  }
}
</style>
