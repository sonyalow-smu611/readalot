<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The reader's name, email and character, an Edit button, and their three shelf counts, which
// count up as the card opens. A pixel panel that leans toward the mouse and pops when pressed.
import CharacterSprite from '@/components/shared/CharacterSprite.vue'
import CountUp from '@/components/shared/CountUp.vue'
import { SHELF_STATS } from '@/buildings/salon/profileOptions.js'
import { vTilt } from '@/buildings/salon/tilt.js'

defineProps({
  profile: { type: Object, required: true },
  // books on each shelf, by status
  counts: { type: Object, required: true },
  // false while the shelf loads or after it failed
  ready: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['edit', 'open-list'])
</script>

<template>
  <div v-tilt class="reader-card" data-tilt>
    <div class="reader-card__who">
      <span class="avatar" aria-hidden="true">
        <CharacterSprite :character="profile.character" crop="head" :scale="2" decorative />
      </span>
      <div class="reader-card__name">
        <h2 class="h3 mb-0 text-truncate">{{ profile.name }}</h2>
        <p class="text-muted mb-0 text-truncate">{{ profile.email }}</p>
      </div>
      <button
        type="button"
        class="btn btn-outline-primary reader-card__edit"
        data-tour="profile-edit"
        aria-label="Edit profile"
        @click="emit('edit')"
      >
        Edit
      </button>
    </div>
    <ul class="stats" data-tour="profile-shelves" :aria-busy="loading">
      <li v-for="stat in SHELF_STATS" :key="stat.status">
        <button
          type="button"
          class="stat"
          data-card
          aria-haspopup="dialog"
          :disabled="!ready"
          @click="emit('open-list', stat.status, $event.currentTarget)"
        >
          <span class="stat__count">
            <CountUp v-if="ready" :value="counts[stat.status]" />
            <template v-else>–</template>
          </span>
          <span class="stat__label">{{ stat.label }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.reader-card {
  padding: 16px;
  border: 3px solid var(--px-ink, #2b1d24);
  border-radius: 4px;
  box-shadow: inset 0 -4px 0 rgba(43, 29, 36, 0.08), var(--px-shadow, 5px 5px 0 #2b1d24);
  /* a pink pixel stripe across the top, like an awning */
  background:
    repeating-linear-gradient(90deg, var(--px-pink, #d0608e) 0 16px, var(--px-pink-light, #f9d3e2) 16px 32px) top / 100% 10px no-repeat,
    var(--px-paper, #fff8ef);
  padding-top: 22px;
}

.reader-card__who {
  display: flex;
  align-items: center;
  gap: 14px;
}

.reader-card__name {
  flex: 1 1 auto;
  min-width: 0;
}

.reader-card__edit {
  flex: none;
  align-self: flex-start;
}

.avatar {
  flex: none;
  display: grid;
  place-items: end center;
  width: 68px;
  height: 68px;
  overflow: hidden;
  border: 3px solid var(--px-ink, #2b1d24);
  border-radius: 999px;
  background: radial-gradient(circle at 50% 35%, #fff2c9, var(--px-pink-light, #f9d3e2) 70%);
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin: 16px 0 0;
  padding: 0;
  border-top: 2px dashed #ead2de;
  list-style: none;
}

.stats li {
  padding-top: 8px;
}

.stats li + li {
  border-left: 2px dashed #ead2de;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  min-height: 56px;
  padding: 4px 0;
  border: 0;
  border-radius: 10px;
  background: none;
  color: var(--rl-text);
}

.stat:hover:not(:disabled) {
  background: #fbe7f0;
}

.stat__count {
  color: #a84874;
  font-family: var(--rl-font-title);
  font-size: 1.625rem;
  font-weight: 700;
  line-height: 1.2;
}

.stat__label {
  color: var(--rl-muted);
  font-size: 0.875rem;
}
</style>
