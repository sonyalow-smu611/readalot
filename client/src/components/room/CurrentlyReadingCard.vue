<template>
  <RouterLink v-if="book" class="reading-card" :to="`/books/${book.id}`">
    <BookCover class="reading-card__cover" :cover-url="book.coverUrl" :title="book.title" :seed="book.id" />
    <div class="reading-card__body">
      <p class="reading-card__eyebrow">Currently reading</p>
      <h2 class="reading-card__title">{{ book.title }}</h2>
      <p class="reading-card__author">{{ book.authors?.join(", ") || "Unknown author" }}</p>
      <div class="reading-card__progress">
        <div
          class="reading-card__bar"
          role="progressbar"
          aria-label="Reading progress"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-valuenow="progress"
        >
          <span :style="{ width: `${progress}%` }" />
        </div>
        <span>{{ progress }}%</span>
      </div>
      <p class="reading-card__hint">Tap to open book details</p>
    </div>
  </RouterLink>

  <RouterLink v-else class="reading-card reading-card--empty" to="/discover">
    <div class="reading-card__body">
      <p class="reading-card__eyebrow">Currently reading</p>
      <h2 class="reading-card__title">Nothing on the go</h2>
      <p class="reading-card__author">Pick a book and mark it as Reading to see it here.</p>
    </div>
    <span class="reading-card__go" aria-hidden="true">›</span>
  </RouterLink>
</template>

<script setup>
import { computed } from "vue";
import BookCover from "../BookCover.vue";

const props = defineProps({
  book: { type: Object, default: null }
});

const progress = computed(() => Math.min(100, Math.max(0, Math.round(props.book?.progress || 0))));
</script>

<style scoped>
.reading-card {
  display: flex;
  align-items: center;
  gap: 13px;
  min-height: 108px;
  padding: 13px;
  border: 1px solid var(--rl-line);
  border-radius: var(--rl-radius-card);
  background: var(--rl-surface);
  box-shadow: 0 4px 10px rgba(63, 46, 36, 0.17);
  text-decoration: none;
  color: var(--rl-text);
}

.reading-card__cover {
  width: 54px;
  flex: none;
  font-size: 9px;
}

.reading-card__body {
  flex: 1;
  min-width: 0;
}

.reading-card__eyebrow {
  margin: 0 0 4px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--rl-accent);
}

.reading-card__title {
  margin: 0;
  overflow: hidden;
  font-size: 16px;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reading-card__author {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--rl-muted);
}

.reading-card__progress {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 11px;
  color: var(--rl-muted);
}

.reading-card__bar {
  flex: 1;
  height: 5px;
  overflow: hidden;
  border-radius: 3px;
  background: var(--rl-placeholder);
}

.reading-card__bar span {
  display: block;
  height: 100%;
  border-radius: 3px;
  background: var(--rl-accent);
}

.reading-card__hint {
  margin: 6px 0 0;
  font-size: 11px;
  color: var(--rl-muted);
}

.reading-card__go {
  font-size: 26px;
  line-height: 1;
  color: var(--rl-accent);
}
</style>
