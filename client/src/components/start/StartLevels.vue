<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// Read more, level up: tap things a reader does to see the XP add up, using the app's own rules
// (lib/levels.js, and the XP each action gives in database/xp_and_coins.sql). The badge shows
// the visitor's character, their level, XP, how far to the next level and their coins. Nothing
// is saved; it is only a try-out.
import { computed, ref } from 'vue'
import { START_COINS, levelFor } from '@/lib/levels.js'
import StartSection from './StartSection.vue'
import StartPanel from './StartPanel.vue'
import CharacterSprite from '@/components/shared/CharacterSprite.vue'

defineProps({
  character: { type: Object, required: true },
})

const ACTIONS = [
  { label: 'Add a book', xp: 10 },
  { label: 'Start reading', xp: 20 },
  { label: 'Visit a room', xp: 15 },
  { label: 'Leave a note', xp: 10 },
  { label: 'Send a message', xp: 5 },
  { label: 'Finish a book', xp: 100, big: true },
]

// the ring's length (2πr, r = 52)
const RING = 326.73

const xp = ref(0)
const coins = ref(START_COINS)
const news = ref('')
const level = computed(() => levelFor(xp.value))
const offset = computed(() => RING * (1 - level.value.progress))

function earn(points) {
  const before = level.value.level
  xp.value += points
  const after = level.value.level
  if (after > before) {
    // each new level gives 25 coins times the level reached
    let gained = 0
    for (let l = before + 1; l <= after; l += 1) gained += 25 * l
    coins.value += gained
    news.value = `Level ${after}! +${gained} coins`
  } else {
    news.value = `+${points} XP`
  }
}

function startOver() {
  xp.value = 0
  coins.value = START_COINS
  news.value = ''
}
</script>

<template>
  <StartSection id="levels" title="Read more. Level up. Make it yours.">
    <div class="levels">
      <div>
        <p class="levels__lede">
          Everything you do as a reader earns XP. Each new level gives you coins to spend on
          furniture, plants and pets for your room, or new looks in the salon. Try it:
        </p>
        <div class="levels__actions" role="group" aria-label="Earn XP">
          <button
            v-for="action in ACTIONS"
            :key="action.label"
            type="button"
            class="chip"
            :class="{ 'chip--big': action.big }"
            @click="earn(action.xp)"
          >
            {{ action.label }} <b>+{{ action.xp }}</b>
          </button>
        </div>
        <button type="button" class="levels__reset" @click="startOver">Start over</button>
      </div>
      <StartPanel class="badge">
        <div class="badge__ring">
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle class="badge__track" cx="60" cy="60" r="52" />
            <circle class="badge__fill" cx="60" cy="60" r="52" :style="{ strokeDashoffset: offset }" />
          </svg>
          <CharacterSprite class="badge__face" :character="character" :scale="4" crop="head" decorative />
          <span class="badge__level">{{ level.level }}<span class="visually-hidden">, your level</span></span>
        </div>
        <p class="badge__xp">{{ xp }} XP</p>
        <p class="badge__next">{{ level.toNext }} XP to level {{ level.level + 1 }}</p>
        <p class="badge__coins"><span class="badge__coin" aria-hidden="true" />{{ coins }} coins</p>
        <p class="badge__news" role="status">{{ news }}</p>
      </StartPanel>
    </div>
  </StartSection>
</template>

<style scoped>
.levels {
  display: grid;
  grid-template-columns: minmax(0, 6fr) minmax(0, 4fr);
  gap: 48px;
  align-items: start;
}

.levels__lede {
  max-width: 60ch;
  margin: 0 0 24px;
  color: rgba(255, 253, 249, 0.88);
  font-size: clamp(16px, 1.8vw, 19px);
  line-height: 1.55;
}

.levels__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.chip {
  min-height: 46px;
  padding: 8px 16px;
  border: 3px solid var(--s-ink);
  border-radius: 6px;
  background: var(--s-paper);
  color: var(--s-ink);
  font-size: 16px;
  box-shadow: 0 4px 0 var(--s-ink);
}

.chip b {
  color: #2f8a46;
}

.chip:active {
  transform: translateY(3px);
  box-shadow: 0 1px 0 var(--s-ink);
}

.chip--big {
  background: var(--s-gold);
}

.levels__reset {
  margin-top: 16px;
  padding: 4px 0;
  border: 0;
  background: none;
  color: rgba(255, 253, 249, 0.8);
  font-weight: 700;
  text-decoration: underline;
}

.badge {
  padding: 28px;
  text-align: center;
}

.badge__ring {
  position: relative;
  width: 200px;
  height: 200px;
  margin: 0 auto;
}

.badge__ring svg {
  position: absolute;
  inset: 0;
  transform: rotate(-90deg);
}

.badge__track,
.badge__fill {
  fill: none;
  stroke-width: 12;
}

.badge__track {
  stroke: var(--s-paper-dark);
}

.badge__fill {
  stroke: var(--s-green);
  stroke-linecap: round;
  stroke-dasharray: 326.73;
  transition: stroke-dashoffset 0.6s ease;
}

.badge__face {
  position: absolute;
  left: 50%;
  top: 50px;
  transform: translateX(-50%);
}

.badge__level {
  position: absolute;
  right: 18px;
  bottom: 14px;
  display: grid;
  place-items: center;
  min-width: 48px;
  height: 42px;
  padding: 0 8px;
  border: 3px solid var(--s-ink);
  border-radius: 8px;
  background: linear-gradient(#ffe57a, #f2b632);
  font-size: 22px;
  font-weight: 700;
}

.badge__xp {
  margin: 14px 0 0;
  font-size: 26px;
  font-weight: 700;
}

.badge__next {
  margin: 2px 0 0;
  font-size: 16px;
}

.badge__coins {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0 0;
  font-size: 17px;
  font-weight: 700;
}

.badge__coin {
  width: 18px;
  height: 18px;
  border: 3px solid #8a5a12;
  border-radius: 4px;
  background: #f6c94a;
}

.badge__news {
  min-height: 1.5em;
  margin: 8px 0 0;
  color: #2f8a46;
  font-weight: 700;
}

@media (max-width: 899px) {
  .levels {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .badge__fill {
    transition: none;
  }
}
</style>
