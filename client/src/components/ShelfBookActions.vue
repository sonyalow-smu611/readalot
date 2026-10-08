<!--
  What the reader can do with a book from their shelf, depending on which shelf it is on:
    Reading   how far through they are (a slider), and "Finished"
    To read   "Started reading"
    Finished  "Review" and "Rate" until both are done, then "View review and rating";
              these open the book's own page
  A book that is not on the shelf gets nothing.
-->
<template>
  <div v-if="shelved" class="actions">
    <template v-if="shelved.status === 'reading'">
      <label class="actions__progress">
        <span class="actions__label">
          <span>Progress</span>
          <output>{{ percent }}% read</output>
        </span>
        <input
          v-model.number="percent"
          class="actions__slider"
          type="range"
          min="0"
          max="100"
          step="1"
          :aria-valuetext="`${percent} percent read`"
          @change="bookshelf.setProgress(shelved.id, percent)"
        />
      </label>
      <button class="btn btn-primary actions__button" type="button" @click="bookshelf.setStatus(shelved.id, 'read')">
        Finished
      </button>
    </template>

    <button
      v-else-if="shelved.status === 'want_to_read'"
      class="btn btn-primary actions__button"
      type="button"
      @click="bookshelf.setStatus(shelved.id, 'reading')"
    >
      Started reading
    </button>

    <template v-else>
      <RouterLink
        v-if="shelved.reviewed && shelved.myRating"
        class="btn btn-primary actions__button"
        :to="page"
        @click="$emit('leave')"
      >
        View review and rating
      </RouterLink>
      <div v-else class="actions__pair">
        <RouterLink class="btn btn-primary actions__button" :to="page" @click="$emit('leave')">
          {{ shelved.reviewed ? "View review" : "Review" }}
        </RouterLink>
        <RouterLink class="btn btn-outline-primary actions__button" :to="page" @click="$emit('leave')">
          {{ shelved.myRating ? "View rating" : "Rate" }}
        </RouterLink>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useBookshelfStore } from "../stores/bookshelf.js";

const props = defineProps({
  book: { type: Object, default: null }
});
// "leave": a link to the book's page was followed, so whatever is showing these can close
defineEmits(["leave"]);

const bookshelf = useBookshelfStore();

// the shelf's own copy of the book, so a move shows here straight away
const shelved = computed(() => (props.book ? bookshelf.findBook(props.book.id) : null));
const page = computed(() => `/books/${shelved.value.id}`);

// follows the slider while it is dragged; saved when it is let go
const percent = ref(0);
watch(
  () => shelved.value?.progress,
  (progress) => {
    percent.value = progress || 0;
  },
  { immediate: true }
);
</script>

<style scoped>
.actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  padding: 12px;
  border: 1px solid var(--rl-line);
  border-radius: var(--rl-radius-card);
  background: var(--rl-surface);
  color: var(--rl-text);
}

.actions__progress {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
}

.actions__label {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 700;
}

.actions__label output {
  color: var(--rl-muted);
}

.actions__slider {
  width: 100%;
  accent-color: var(--rl-accent);
}

.actions__button {
  flex: 1;
  width: 100%;
  padding-block: 8px;
  font-size: 14px;
}

.actions__pair {
  display: flex;
  gap: 8px;
}
</style>
