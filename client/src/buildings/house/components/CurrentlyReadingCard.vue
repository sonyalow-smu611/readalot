<template>
  <!-- in someone else's room: what they're reading, with no book page to open -->
  <div v-if="book && owner" class="reading-card">
    <BookCover class="reading-card__cover" :cover-url="book.coverUrl" :title="book.title" :seed="book.id" />
    <div class="reading-card__body">
      <p class="reading-card__tab">Currently reading</p>
      <h2 class="reading-card__title">{{ book.title }}</h2>
      <p class="reading-card__author">{{ book.authors?.join(", ") || "Unknown author" }}</p>
      <p class="reading-card__hint">{{ owner }} is reading this</p>
    </div>
  </div>

  <div v-else-if="owner" class="reading-card reading-card--empty">
    <div class="reading-card__body">
      <p class="reading-card__tab">Currently reading</p>
      <h2 class="reading-card__title">Nothing on the go</h2>
      <p class="reading-card__author">{{ owner }} isn't reading anything right now.</p>
    </div>
  </div>

  <RouterLink v-else-if="book" class="reading-card" :to="`/books/${book.id}`">
    <BookCover class="reading-card__cover" :cover-url="book.coverUrl" :title="book.title" :seed="book.id" />
    <div class="reading-card__body">
      <p class="reading-card__tab">Currently reading</p>
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
      <p class="reading-card__tab">Currently reading</p>
      <h2 class="reading-card__title">Nothing on the go</h2>
      <p class="reading-card__author">Pick a book and mark it as Reading to see it here.</p>
    </div>
    <span class="reading-card__go" aria-hidden="true">›</span>
  </RouterLink>
</template>

<script setup>
import { computed } from "vue";
import BookCover from "@/components/BookCover.vue";

const props = defineProps({
  book: { type: Object, default: null },
  // the first name of the reader whose room it is, when visiting; empty in the reader's own room
  owner: { type: String, default: "" }
});

const progress = computed(() => Math.min(100, Math.max(0, Math.round(props.book?.progress || 0))));
</script>

<style scoped>
/* the town's place card (PlaceCard): round corners, a fine line, a deep soft shadow */
.reading-card {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 108px;
  padding: 16px 18px;
  border: 1px solid var(--rl-line);
  border-radius: var(--rl-radius-modal, 22px);
  background: var(--rl-surface);
  box-shadow: 0 14px 36px rgba(63, 46, 36, 0.25);
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

/* a pill in the house's colour, like the place card's tab */
.reading-card__tab {
  display: inline-block;
  margin: 0 0 6px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--house-accent, var(--rl-accent));
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.3px;
  color: var(--rl-surface);
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
  background: var(--house-accent, var(--rl-accent));
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
