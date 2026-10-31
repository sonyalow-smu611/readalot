<!-- A book card's Reviews section: your rating and review (a form until you have one, or while
     you edit it), then every reader's review, or why there are none to show.
     Written with AI assistance: see AI_USAGE.md. -->
<template>
  <section class="book-reviews" :aria-labelledby="headingId">
    <component :is="headingTag" :id="headingId" class="book-reviews__heading">Reviews</component>
    <p v-if="loading" class="book-reviews__note">
      <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Loading reviews…
    </p>
    <p v-else-if="error" class="book-reviews__note">
      Couldn't load reviews.
      <button type="button" class="btn btn-link book-reviews__retry" @click="$emit('retry')">Retry</button>
    </p>
    <template v-else>
      <ReviewForm
        v-if="!mine || editing"
        :key="mine?.id || 'new'"
        :review="editing ? mine : null"
        :saving="saving"
        :error="saveError"
        @save="$emit('save', $event)"
        @cancel="editing = false"
      />
      <p v-else-if="saveError" class="book-reviews__error" role="alert">{{ saveError }}</p>
      <ReviewList
        :reviews="reviews"
        :my-character="myCharacter"
        :busy="saving"
        @edit="editing = true"
        @delete="$emit('delete')"
      />
    </template>
  </section>
</template>

<script setup>
import { computed, ref, useId, watch } from 'vue'
import ReviewForm from '@/components/book/ReviewForm.vue'
import ReviewList from '@/components/book/ReviewList.vue'

const props = defineProps({
  // every reader's reviews; yours has `mine: true`
  reviews: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  error: { type: Boolean, default: false },
  // your review is being saved or deleted, and why that last failed
  saving: { type: Boolean, default: false },
  saveError: { type: String, default: '' },
  // your town character, next to your own review
  myCharacter: { type: Object, default: null },
  headingTag: { type: String, default: 'h3' },
})
// save({ rating, text }) / delete: your own review
defineEmits(['retry', 'save', 'delete'])

const headingId = useId()
const mine = computed(() => props.reviews.find((review) => review.mine) ?? null)

// editing ends once the edit is saved (or the review deleted)
const editing = ref(false)
watch(
  () => mine.value?.updatedAt,
  () => {
    editing.value = false
  },
)
</script>

<style scoped>
/* as the card's other headings */
.book-reviews__heading {
  margin: 0 0 8px;
  font-family: var(--rl-font-title);
  font-size: 17px;
  line-height: 24px;
  font-weight: 700;
  color: var(--rl-text);
}

.book-reviews__note {
  margin: 0;
  font-size: 13px;
  color: var(--rl-muted);
}

.book-reviews__retry {
  padding: 0 0 0 4px;
  font-size: 13px;
  font-weight: 700;
  color: var(--accent, var(--rl-accent));
  vertical-align: baseline;
}

.book-reviews__error {
  margin: 0 0 8px;
  font-size: 13px;
  color: var(--bs-danger);
}
</style>
