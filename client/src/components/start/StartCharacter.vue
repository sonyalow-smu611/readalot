<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// Now make yourself: a small version of the salon's studio. The visitor's character stands on a
// stage under their name; tabs pick a ready-made look, hair, skin or outfit, and "Surprise me"
// picks a random look. Only free parts are offered, drawn with the app's own sprite code.
// The page keeps the character and the name (it shows them again further down).
import { computed, ref } from 'vue'
import { CATALOGUE, PRESETS, applyChoice, blockedReason, isUnlocked, presetCharacter, randomCharacter } from '@/lib/avatar/catalogue.js'
import StartSection from './StartSection.vue'
import StartPanel from './StartPanel.vue'
import CharacterSprite from '@/components/shared/CharacterSprite.vue'
import PixelCharacter from '@/components/shared/PixelCharacter.vue'

const props = defineProps({
  character: { type: Object, required: true },
  name: { type: String, default: '' },
})
const emit = defineEmits(['update:character', 'update:name'])

// each tab's rows: a slot, and how its choices are drawn (a crop of the character, or a swatch)
const TABS = [
  { id: 'looks', label: 'Looks', rows: [{ slot: 'base', label: 'Start from' }] },
  { id: 'hair', label: 'Hair', rows: [{ slot: 'hair', label: 'Style', crop: 'head' }, { slot: 'hairColour', label: 'Colour' }] },
  { id: 'skin', label: 'Skin', rows: [{ slot: 'skin', label: 'Skin tone' }] },
  { id: 'outfit', label: 'Outfit', rows: [{ slot: 'top', label: 'Top', crop: 'top' }, { slot: 'topColour', label: 'Top colour' }, { slot: 'bottom', label: 'Bottoms', crop: 'bottom' }] },
]

const tab = ref('looks')
const tabs = ref([])
const hop = ref(0)
const rows = computed(() => TABS.find((t) => t.id === tab.value).rows)

function choices(slot) {
  if (slot === 'base') return PRESETS.map((p) => ({ id: p.id, label: p.label }))
  return CATALOGUE[slot].filter((item) => isUnlocked(item) && !blockedReason(props.character, slot, item.id))
}

function chosen(slot, id) {
  return props.character[slot] === id
}

function change(next) {
  emit('update:character', next)
  hop.value += 1
}

function choose(slot, id) {
  change(slot === 'base' ? presetCharacter(id) : applyChoice(props.character, slot, id))
}

// what a style choice looks like on this character
function preview(slot, id) {
  return slot === 'base' ? presetCharacter(id) : applyChoice(props.character, slot, id)
}

function surprise() {
  change(randomCharacter(props.character.base))
}

function step(event, index) {
  const keys = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: TABS.length - 1 }
  if (!(event.key in keys)) return
  event.preventDefault()
  const next = (keys[event.key] + TABS.length) % TABS.length
  tab.value = TABS[next].id
  tabs.value[next]?.focus()
}
</script>

<template>
  <StartSection
    id="you"
    title="Now make yourself"
    lede="In IKDA, this is you walking around town. Pick a look, change your hair, or let us surprise you."
  >
    <div class="studio">
      <StartPanel class="stage">
        <label class="stage__name">
          <span class="visually-hidden">Your name in town</span>
          <input :value="name" maxlength="16" placeholder="Your name" autocomplete="given-name" @input="emit('update:name', $event.target.value)" />
        </label>
        <PixelCharacter class="stage__sprite" :character="character" :scale="5" :hop="hop" />
        <span class="stage__floor" aria-hidden="true" />
      </StartPanel>
      <StartPanel class="controls">
        <div class="controls__tabs" role="tablist" aria-label="Style your character">
          <button
            v-for="(t, i) in TABS"
            :id="`start-you-${t.id}`"
            :key="t.id"
            ref="tabs"
            type="button"
            role="tab"
            :aria-selected="tab === t.id ? 'true' : 'false'"
            aria-controls="start-you-options"
            :tabindex="tab === t.id ? 0 : -1"
            @click="tab = t.id"
            @keydown="step($event, i)"
          >
            {{ t.label }}
          </button>
        </div>
        <div id="start-you-options" class="controls__options" role="tabpanel" :aria-labelledby="`start-you-${tab}`">
          <div v-for="row in rows" :key="row.slot" class="controls__group">
            <p class="controls__label">{{ row.label }}</p>
            <div class="controls__row">
              <template v-for="item in choices(row.slot)" :key="item.id">
                <button
                  v-if="row.slot === 'base' || row.crop"
                  type="button"
                  class="pick"
                  :aria-pressed="chosen(row.slot, item.id) ? 'true' : 'false'"
                  @click="choose(row.slot, item.id)"
                >
                  <CharacterSprite :character="preview(row.slot, item.id)" :scale="row.crop ? 2 : 1" :crop="row.crop ?? 'full'" decorative />
                  <span>{{ item.label }}</span>
                </button>
                <button
                  v-else
                  type="button"
                  class="swatch"
                  :style="{ '--c': item.c ?? item.skin }"
                  :aria-label="item.label"
                  :aria-pressed="chosen(row.slot, item.id) ? 'true' : 'false'"
                  @click="choose(row.slot, item.id)"
                />
              </template>
            </div>
          </div>
        </div>
        <button type="button" class="controls__surprise" @click="surprise">Surprise me</button>
      </StartPanel>
    </div>
  </StartSection>
</template>

<style scoped>
.studio {
  display: grid;
  grid-template-columns: minmax(0, 4fr) minmax(0, 6fr);
  gap: 24px;
}

/* the stage: a soft spotlight, a checked floor, the character standing on it, the name above */
.stage {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  min-height: 400px;
  padding: 20px 16px 0;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 50% 72%, rgba(255, 233, 160, 0.85), rgba(255, 233, 160, 0) 60%),
    linear-gradient(#f9d3e2, #fbe7f0);
}

.stage__name {
  position: absolute;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
}

.stage__name input {
  width: 180px;
  padding: 6px 12px;
  border: 3px solid var(--s-ink);
  border-radius: 999px;
  background: var(--s-paper);
  color: var(--s-ink);
  font-size: 17px;
  font-weight: 700;
  text-align: center;
}

.stage__sprite {
  position: relative;
  z-index: 1;
  margin-bottom: 22px;
}

.stage__floor {
  position: absolute;
  inset: auto 0 0;
  height: 40px;
  border-top: 3px solid var(--s-ink);
  background: repeating-conic-gradient(#3b3440 0 25%, #f3ede4 0 50%) 0 0 / 24px 24px;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
}

.controls__tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  border: 3px solid var(--s-ink);
  border-radius: 8px;
  background: var(--s-paper-dark);
}

.controls__tabs button {
  flex: 1 1 0;
  min-height: 40px;
  border: 0;
  border-radius: 4px;
  background: none;
  color: var(--s-ink);
  font-weight: 700;
}

.controls__tabs button[aria-selected='true'] {
  background: var(--s-ink);
  color: var(--s-paper);
}

.controls__options {
  min-height: 230px;
}

.controls__group + .controls__group {
  margin-top: 14px;
}

.controls__label {
  margin: 0 0 6px;
  color: var(--s-muted);
  font-size: 14px;
  font-weight: 700;
}

.controls__row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* a look or a style: a little picture and its name */
.pick {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 64px;
  padding: 6px 6px 4px;
  border: 3px solid var(--s-paper-dark);
  border-radius: 8px;
  background: var(--s-paper);
  color: var(--s-ink);
  font-size: 13px;
  font-weight: 700;
}

.pick[aria-pressed='true'] {
  border-color: var(--s-ink);
  background: #fff1b8;
}

.swatch {
  width: 36px;
  height: 36px;
  border: 3px solid var(--s-ink);
  border-radius: 50%;
  background: var(--c);
}

.swatch[aria-pressed='true'] {
  box-shadow: 0 0 0 3px var(--s-paper), 0 0 0 6px var(--s-ink);
}

.controls__surprise {
  align-self: flex-start;
  min-height: 44px;
  padding: 6px 20px;
  border: 3px solid var(--s-ink);
  border-radius: 6px;
  background: var(--s-paper);
  color: var(--s-ink);
  font-weight: 700;
  box-shadow: 0 4px 0 var(--s-ink);
}

.controls__surprise:active {
  transform: translateY(3px);
  box-shadow: 0 1px 0 var(--s-ink);
}

@media (max-width: 899px) {
  .studio {
    grid-template-columns: 1fr;
  }

  .stage {
    min-height: 420px;
  }
}
</style>
