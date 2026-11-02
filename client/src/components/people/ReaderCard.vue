<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The top of a reader's profile: their town character on a patch of sky and grass, their name as
// the page heading, @username · neighbourhood, and how well your reading matches theirs.
import { computed } from 'vue'
import PixelCharacter from '@/components/shared/PixelCharacter.vue'
import { normaliseCharacter } from '@/lib/avatar/catalogue.js'

const props = defineProps({
  // { displayName, username, neighborhood, character }, as the people store gives it
  reader: { type: Object, required: true },
  // 0 to 100
  match: { type: Number, required: true },
})

// the same look the town gives them
const character = computed(() => normaliseCharacter(props.reader.character))
// the sample readers' neighbourhoods end in "(demo)"; the note at the foot of the page says so
const handle = computed(() => {
  const place = String(props.reader.neighborhood ?? '').replace(/\s*\(demo\)\s*$/i, '').trim()
  return place ? `@${props.reader.username} · ${place}` : `@${props.reader.username}`
})
</script>

<template>
  <section class="reader-card" :aria-label="`About ${reader.displayName}`">
    <div class="reader-card__picture">
      <PixelCharacter :character="character" :scale="2" :label="`${reader.displayName}'s town character`" />
    </div>
    <div class="reader-card__details">
      <h1 class="reader-card__name">{{ reader.displayName }}</h1>
      <p class="reader-card__handle">{{ handle }}</p>
      <div class="reader-card__match">
        <span class="reader-card__match-label" aria-hidden="true">Match</span>
        <div
          class="reader-card__bar"
          role="progressbar"
          aria-label="Reading match"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-valuenow="match"
        >
          <div class="reader-card__fill" :style="{ width: `${match}%` }"></div>
        </div>
        <span class="reader-card__percent">{{ match }}%</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.reader-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px;
  background: var(--profile-paper);
  border: var(--px-border);
  box-shadow: var(--px-shadow);
  outline: 2px solid var(--profile-teal);
  outline-offset: -6px;
}

/* sky over a strip of grass, in a dark frame */
.reader-card__picture {
  flex-shrink: 0;
  display: grid;
  place-items: end center;
  width: 84px;
  height: 108px;
  padding-bottom: 6px;
  border: var(--px-border);
  background: linear-gradient(var(--profile-sky) 0 78%, var(--profile-grass) 78% 100%);
}

.reader-card__details {
  flex: 1;
  min-width: 0;
}

.reader-card__name {
  margin: 0 0 4px;
  font-family: var(--font-heading);
  font-size: 22px;
  line-height: 1.15;
  color: var(--px-outline);
  overflow-wrap: anywhere;
}

.reader-card__handle {
  margin: 0 0 10px;
  font-size: 13px;
  color: var(--profile-ink-soft);
  overflow-wrap: anywhere;
}

.reader-card__match {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* a brass tag, dark label */
.reader-card__match-label {
  padding: 1px 5px;
  border: var(--px-border);
  background: var(--profile-brass);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--px-outline);
}

.reader-card__bar {
  flex: 1;
  height: 12px;
  border: var(--px-border);
  background: var(--profile-paper-shade);
}

.reader-card__fill {
  height: 100%;
  background: var(--profile-green);
}

.reader-card__percent {
  font-size: 13px;
  font-weight: 700;
  color: var(--px-outline);
}
</style>
