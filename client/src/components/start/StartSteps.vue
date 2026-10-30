<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// How it works: three numbered steps to get going, each with a little picture standing on grass
// (the five ready-made characters, the Library, the Cafe).
import { PRESETS, presetCharacter } from '@/lib/avatar/catalogue.js'
import StartSection from './StartSection.vue'
import StartPanel from './StartPanel.vue'
import CharacterSprite from '@/components/shared/CharacterSprite.vue'

const CHARACTERS = PRESETS.map((p) => ({ id: p.id, character: presetCharacter(p.id) }))

const STEPS = [
  { title: 'Make your character', body: 'Sign up with your email, pick a look, and tell us the genres you love.' },
  { title: 'Fill your shelf', body: 'Search the Library or scan a cover. Sort books into Want to read, Reading and Finished.', building: 'library' },
  { title: 'Find your people', body: 'Head to the Cafe, see your reading match with each reader, and visit their rooms.', building: 'cafe' },
]
</script>

<template>
  <StartSection id="how" title="Start in under two minutes">
    <ol class="steps">
      <StartPanel v-for="(step, i) in STEPS" :key="step.title" tag="li" class="step">
        <span class="step__number" aria-hidden="true">{{ i + 1 }}</span>
        <h3 class="step__title">{{ step.title }}</h3>
        <p class="step__body">{{ step.body }}</p>
        <div class="step__art" aria-hidden="true">
          <img v-if="step.building" class="step__building" :src="`/town/buildings/${step.building}.png`" alt="" />
          <template v-else>
            <CharacterSprite v-for="c in CHARACTERS" :key="c.id" :character="c.character" :scale="1" decorative />
          </template>
        </div>
      </StartPanel>
    </ol>
  </StartSection>
</template>

<style scoped>
.steps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin: 24px 0 0;
  padding: 0;
  list-style: none;
}

.step {
  display: flex;
  flex-direction: column;
  padding: 28px 24px 0;
  overflow: hidden;
}

.step__number {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 3px solid var(--s-ink);
  border-radius: 6px;
  background: var(--s-gold);
  font-size: 20px;
  font-weight: 700;
}

.step__title {
  margin: 14px 0 6px;
  font-family: var(--rl-font-title);
  font-size: 22px;
  font-weight: 700;
}

.step__body {
  margin: 0 0 16px;
  line-height: 1.55;
}

/* a little picture standing on a strip of grass */
.step__art {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 8px;
  min-height: 130px;
  margin: auto -24px 0;
  padding-top: 8px;
  background: linear-gradient(transparent 72%, #6fb14b 72%);
}

.step__art :deep(canvas) {
  width: 40px;
  height: 77px;
}

.step__building {
  width: 170px;
  height: auto;
  image-rendering: pixelated;
}

@media (max-width: 899px) {
  .steps {
    grid-template-columns: 1fr;
  }
}
</style>
