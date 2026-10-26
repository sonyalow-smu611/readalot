<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The reader's name, email and avatar, an Edit button, and their three shelf counts.
import { SHELF_STATS } from '@/buildings/salon/profileOptions.js'

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
  <div class="reader-card">
    <div class="reader-card__who">
      <span class="avatar" aria-hidden="true">{{ profile.avatar }}</span>
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
          aria-haspopup="dialog"
          :disabled="!ready"
          @click="emit('open-list', stat.status, $event.currentTarget)"
        >
          <span class="stat__count">{{ ready ? counts[stat.status] : '–' }}</span>
          <span class="stat__label">{{ stat.label }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.reader-card {
  padding: 16px;
  border: 2px solid rgba(30, 26, 36, 0.85);
  border-radius: 18px;
  box-shadow: 5px 5px 0 rgba(30, 26, 36, 0.22);
  backdrop-filter: blur(8px);
  background:
    radial-gradient(circle at 92% 0%, rgba(242, 160, 184, 0.35), transparent 40%),
    rgba(255, 253, 249, 0.96);
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
  min-height: 44px;
  padding-inline: 18px;
  border: 2px solid #1e1a24;
  border-radius: 999px;
  background: #fffdf9;
  color: #1e1a24;
  font-weight: 700;
  box-shadow: 3px 3px 0 #1e1a24;
}

.reader-card__edit:hover {
  background: #fbe7f0;
  color: #1e1a24;
}

.avatar {
  flex: none;
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border: 2px solid #1e1a24;
  border-radius: 999px;
  background: #fbe7f0;
  font-size: 2rem;
  line-height: 1;
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
