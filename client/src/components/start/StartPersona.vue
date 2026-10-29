<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// Meet Maya: who the app is for, in one line beside her town character, then one evening of hers
// in IKDA as five steps along a path. Each step shows where in town it happens, what she does
// there in a few words, and what she gets for it. Every step is something the app really does,
// with the XP it really gives (database/xp_and_coins.sql).
import StartSection from './StartSection.vue'
import StartPanel from './StartPanel.vue'
import CharacterSprite from '@/components/shared/CharacterSprite.vue'
import { presetCharacter } from '@/lib/avatar/catalogue.js'

const MAYA = presetCharacter('maya')

const EVENING = [
  { time: '9:40pm', where: 'Your house', picture: '/town/buildings/house.png', does: 'Finishes her book', detail: 'Moves it to Finished', gets: '+100 XP' },
  { time: '9:45pm', where: 'Cafe', picture: '/town/buildings/cafe.png', does: 'Meets Ivy', detail: 'They love the same series', gets: '72% match' },
  { time: '9:52pm', where: 'Ivy’s room', picture: '/room/strip/corkboard.png', does: 'Leaves a note', detail: '“Swap books?”', gets: '+10 XP' },
  { time: '10:05pm', where: 'Library', picture: '/town/buildings/library.png', does: 'Scans her next read', detail: 'Straight onto her shelf', gets: '+10 XP' },
  { time: '10:10pm', where: 'Shop', picture: '/room/strip/armchair.png', does: 'Levels up', detail: 'Buys a reading chair', gets: '+50 coins' },
]
</script>

<template>
  <StartSection id="maya" title="Meet Maya" lede="One evening in IKDA, step by step.">
    <StartPanel class="who">
      <span class="who__avatar">
        <CharacterSprite :character="MAYA" :scale="2" label="Maya's town character" />
      </span>
      <p class="who__line">
        <strong>Maya, 19.</strong> Reads two fantasy books a month, but has nobody to talk books
        with.
      </p>
    </StartPanel>

    <ol class="path">
      <StartPanel v-for="(step, i) in EVENING" :key="step.time" tag="li" class="step">
        <p class="step__top">
          <span class="step__number" aria-hidden="true">{{ i + 1 }}</span>
          <time class="step__time">{{ step.time }}</time>
        </p>
        <div class="step__picture" aria-hidden="true">
          <img :src="step.picture" alt="" />
        </div>
        <p class="step__where">{{ step.where }}</p>
        <h3 class="step__does">{{ step.does }}</h3>
        <p class="step__detail">{{ step.detail }}</p>
        <span class="step__gets">{{ step.gets }}</span>
      </StartPanel>
    </ol>
  </StartSection>
</template>

<style scoped>
.who {
  display: flex;
  align-items: center;
  gap: 16px;
  max-width: 620px;
  margin-bottom: 28px;
  padding: 12px 20px 12px 12px;
}

/* her character in a round window, cut off at the chest */
.who__avatar {
  display: grid;
  place-items: start center;
  flex: none;
  width: 72px;
  height: 72px;
  overflow: hidden;
  border: 3px solid var(--s-ink);
  border-radius: 50%;
  background: radial-gradient(circle at 50% 30%, #fffbe6, #bfe3f2 75%);
}

.who__avatar :deep(canvas) {
  margin-top: 6px;
}

.who__line {
  margin: 0;
  line-height: 1.45;
}

/* the evening, left to right, each step joined to the next by a dotted path */
.path {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 22px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.step {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 12px 16px;
  text-align: center;
}

.step:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 50%;
  right: -22px;
  width: 22px;
  border-top: 4px dotted var(--s-gold);
}

.step__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  align-self: stretch;
  margin: 0;
}

.step__number {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 3px solid var(--s-ink);
  border-radius: 6px;
  background: var(--s-gold);
  font-size: 14px;
  font-weight: 800;
}

.step__time {
  color: var(--s-blue);
  font-size: 14px;
  font-weight: 700;
}

.step__picture {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  width: 100%;
  height: 92px;
  margin: 10px 0 6px;
  border-bottom: 6px solid #6fb14b;
}

.step__picture img {
  max-width: 100%;
  max-height: 84px;
  image-rendering: pixelated;
}

.step__where {
  margin: 0;
  color: var(--s-muted);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.step__does {
  margin: 4px 0 2px;
  font-family: var(--rl-font-title);
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
}

.step__detail {
  margin: 0 0 12px;
  font-size: 15px;
  line-height: 1.35;
}

.step__gets {
  margin-top: auto;
  padding: 2px 10px;
  border: 3px solid var(--s-ink);
  border-radius: 999px;
  background: #e3f4dd;
  color: #24683a;
  font-size: 14px;
  font-weight: 800;
}

/* on a phone the path runs down the page, picture beside the words */
@media (max-width: 899px) {
  .path {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .step {
    display: grid;
    grid-template-columns: 96px 1fr;
    column-gap: 14px;
    align-items: center;
    text-align: left;
  }

  .step:not(:last-child)::after {
    top: auto;
    right: auto;
    bottom: -14px;
    left: 58px;
    width: 0;
    height: 14px;
    border-top: 0;
    border-left: 4px dotted var(--s-gold);
  }

  .step__top {
    grid-column: 1 / -1;
    margin-bottom: 4px;
  }

  .step__picture {
    grid-row: 2 / span 4;
    height: 70px;
    margin: 0;
  }

  .step__picture img {
    max-height: 64px;
  }

  .step__gets {
    justify-self: start;
    margin-top: 0;
  }
}
</style>
