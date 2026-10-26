<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// Restyle a character part by part: tabs for Hair, Skin, Outfit and Extras, a radio group per
// part. Each part's tile shows the character wearing it; colours are named swatches. Priced
// parts are locked for now, and parts that clash with the rest say why. Saving is the page's job.
import { computed, nextTick, ref, useId } from 'vue'
import CharacterFigure from '@/components/shared/CharacterFigure.vue'
import { CATALOGUE, SLOTS, applyChoice, blockedReason, isUnlocked } from '@/lib/avatar/catalogue.js'

const props = defineProps({
  // the character being edited (ids, see lib/avatar/catalogue.js)
  modelValue: { type: Object, required: true },
})

const emit = defineEmits(['update:modelValue'])

const TABS = [
  { id: 'hair', label: 'Hair' },
  { id: 'skin', label: 'Skin' },
  { id: 'outfit', label: 'Outfit' },
  { id: 'extras', label: 'Extras' },
]

// which part of the character a part's tile shows
const CROPS = {
  hair: 'head', eyes: 'head', head: 'head', hairAccessory: 'head', ears: 'head',
  top: 'top', neck: 'top', bag: 'top', bottom: 'bottom', shoes: 'feet',
}

const uid = useId()
const tab = ref('hair')
const tablist = ref(null)

const groups = computed(() =>
  SLOTS.filter((slot) => slot.tab === tab.value).map((slot) => ({
    ...slot,
    options: [
      ...(slot.optional ? [{ id: null, label: 'None', price: 0 }] : []),
      ...CATALOGUE[slot.id],
    ].map((item) => optionFor(slot, item)),
  })),
)

function optionFor(slot, item) {
  const locked = item.id !== null && !isUnlocked(item)
  const reason = item.id === null ? null : blockedReason(props.modelValue, slot.id, item.id)
  return {
    ...item,
    key: item.id ?? 'none',
    locked,
    reason,
    note: locked ? `${item.price} coins · Coming soon` : reason ?? '',
    swatch: slot.colour ? item.c : slot.id === 'skin' ? item.skin : null,
    preview: CROPS[slot.id] ? applyChoice(props.modelValue, slot.id, item.id) : null,
  }
}

function choose(slot, id) {
  emit('update:modelValue', applyChoice(props.modelValue, slot, id))
}

// Arrow keys move between tabs; the chosen tab is the only tab stop.
function moveTab(event) {
  const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key]
  if (!step) return
  event.preventDefault()
  const index = TABS.findIndex((t) => t.id === tab.value)
  tab.value = TABS[(index + step + TABS.length) % TABS.length].id
  nextTick(() => tablist.value?.querySelector('[aria-selected="true"]')?.focus())
}
</script>

<template>
  <div class="customiser">
    <div ref="tablist" class="customiser__tabs" role="tablist" aria-label="Restyle" @keydown="moveTab">
      <button
        v-for="t in TABS"
        :id="`${uid}-tab-${t.id}`"
        :key="t.id"
        type="button"
        role="tab"
        class="customiser__tab"
        :aria-selected="tab === t.id"
        :aria-controls="`${uid}-panel`"
        :tabindex="tab === t.id ? 0 : -1"
        @click="tab = t.id"
      >
        {{ t.label }}
      </button>
    </div>

    <div :id="`${uid}-panel`" class="customiser__panel" role="tabpanel" :aria-labelledby="`${uid}-tab-${tab}`">
      <fieldset v-for="group in groups" :key="group.id" class="part">
        <legend class="part__legend">{{ group.label }}</legend>
        <div class="part__options" :class="{ 'part__options--swatches': group.options[0].swatch }">
          <label
            v-for="option in group.options"
            :key="option.key"
            class="option"
            :class="{ 'is-off': option.locked || option.reason }"
          >
            <input
              class="option__input"
              type="radio"
              :name="`${uid}-${group.id}`"
              :checked="modelValue[group.id] === option.id"
              :disabled="option.locked || Boolean(option.reason)"
              :aria-describedby="option.note ? `${uid}-${group.id}-${option.key}-note` : undefined"
              @change="choose(group.id, option.id)"
            />
            <span v-if="option.swatch" class="option__swatch" :style="{ background: option.swatch }" />
            <span v-else-if="option.preview" class="option__crop">
              <CharacterFigure :character="option.preview" :crop="CROPS[group.id]" decorative />
            </span>
            <span class="option__label" :class="{ 'visually-hidden': option.swatch }">{{ option.label }}</span>
            <!-- kept out of the radio's name, read as its description instead -->
            <span
              v-if="option.note"
              :id="`${uid}-${group.id}-${option.key}-note`"
              class="option__note"
              aria-hidden="true"
            >
              <svg v-if="option.locked" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M4 7V5a4 4 0 0 1 8 0v2M3 7h10v7H3z" />
              </svg>
              {{ option.note }}
            </span>
          </label>
        </div>
      </fieldset>
    </div>
  </div>
</template>

<style scoped>
.customiser__tabs {
  display: flex;
  gap: 6px;
  padding: 4px;
  border-radius: 999px;
  background: var(--rl-secondary);
}

.customiser__tab {
  flex: 1 1 0;
  min-height: 40px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--rl-text);
  font-weight: 700;
}

.customiser__tab[aria-selected='true'] {
  background: var(--rl-primary);
  color: var(--rl-surface);
}

.customiser__panel {
  padding-top: 8px;
}

.part {
  min-width: 0;
  margin: 12px 0 0;
  padding: 0;
  border: 0;
}

.part__legend {
  margin-bottom: 8px;
  font-size: 0.9375rem;
  font-weight: 700;
}

.part__options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(78px, 1fr));
  gap: 8px;
}

.part__options--swatches {
  display: flex;
  flex-wrap: wrap;
}

.option {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 0;
  padding: 6px 4px;
  border: 2px solid var(--rl-line);
  border-radius: var(--rl-radius-card);
  background: var(--rl-surface);
  text-align: center;
}

.part__options--swatches .option {
  padding: 4px;
  border-radius: 999px;
}

/* the real radio, invisible, covering its tile so taps land on it */
.option__input {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}

.option__input:disabled {
  cursor: not-allowed;
}

.option:has(.option__input:checked) {
  border-color: var(--rl-primary);
  background: var(--rl-secondary);
}

.option:has(.option__input:focus-visible) {
  outline: 3px solid var(--rl-accent);
  outline-offset: 2px;
}

.option.is-off {
  border-style: dashed;
}

.option.is-off .option__crop,
.option.is-off .option__swatch {
  opacity: 0.45;
}

.option__swatch {
  display: block;
  width: 30px;
  height: 30px;
  border: 2px solid #1e1a24;
  border-radius: 999px;
}

.option__crop {
  display: block;
  width: 64px;
  height: 56px;
}

.option__label {
  font-size: 0.8125rem;
  font-weight: 700;
  line-height: 1.2;
}

.option__note {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--rl-muted);
  font-size: 0.6875rem;
  line-height: 1.2;
}

.option__note svg {
  flex: none;
  width: 11px;
  height: 11px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
}

.part__options--swatches .option__note {
  display: none;
}
</style>
