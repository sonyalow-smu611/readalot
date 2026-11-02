<!-- Your rating (1-5 stars, required) and an optional caption up to 500 characters. Any signed-in
     reader can review any book, shelved or not. Editing starts from the review you have.
     Written with AI assistance: see AI_USAGE.md. -->
<template>
  <form class="review-form" @submit.prevent="submit">
    <fieldset class="review-form__stars">
      <legend class="review-form__legend">{{ review ? 'Edit your rating' : 'Rate this book' }}</legend>
      <label v-for="n in 5" :key="n" class="review-form__star" :class="{ 'is-on': n <= rating }">
        <input v-model="rating" class="review-form__radio" type="radio" :name="`${id}-stars`" :value="n" />
        <span aria-hidden="true">★</span>
        <span class="visually-hidden">{{ n }} {{ n === 1 ? 'star' : 'stars' }}</span>
      </label>
    </fieldset>

    <label class="review-form__label" :for="`${id}-text`">Your review (optional)</label>
    <textarea
      :id="`${id}-text`"
      v-model="text"
      class="form-control review-form__text"
      rows="3"
      :maxlength="REVIEW_MAX"
      :aria-describedby="`${id}-count`"
    />
    <p :id="`${id}-count`" class="review-form__count">{{ text.length }} / {{ REVIEW_MAX }}</p>

    <p v-if="error" class="review-form__error" role="alert">{{ error }}</p>
    <div class="review-form__actions">
      <button class="btn btn-primary" type="submit" :disabled="saving || !rating">Save review</button>
      <button v-if="review" class="btn btn-secondary" type="button" :disabled="saving" @click="$emit('cancel')">
        Cancel
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, useId } from 'vue'

// as the reviews table's limit (database/reviews.sql)
const REVIEW_MAX = 500

const props = defineProps({
  // the review being edited ({ rating, text }), or null for a new one
  review: { type: Object, default: null },
  saving: { type: Boolean, default: false },
  error: { type: String, default: '' },
})
const emit = defineEmits(['save', 'cancel'])

const id = useId()
// the form's own copy, so the review it started from is never changed
const rating = ref(props.review?.rating ?? 0)
const text = ref(props.review?.text ?? '')

function submit() {
  if (!rating.value) return
  emit('save', { rating: rating.value, text: text.value.trim() })
}
</script>

<style scoped>
.review-form {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.review-form__stars {
  display: flex;
  gap: 2px;
  margin: 0;
  padding: 0;
  border: 0;
}

.review-form__legend {
  float: left;
  width: 100%;
  margin: 0 0 2px;
  font-size: 14px;
  font-weight: 700;
}

.review-form__star {
  position: relative;
  display: grid;
  place-items: center;
  min-width: 44px;
  min-height: 44px;
  font-size: 28px;
  line-height: 1;
  color: var(--rl-placeholder);
  cursor: pointer;
}

/* the radio covers its star, so a tap anywhere on the star picks it */
.review-form__radio {
  position: absolute;
  inset: 0;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}

.review-form__star.is-on {
  color: #e0b65e;
}

.review-form__star:focus-within {
  outline: 2px solid var(--px-outline);
  outline-offset: -4px;
}

.review-form__label {
  font-size: 14px;
  font-weight: 700;
}

.review-form__count {
  margin: 0;
  font-size: 12px;
  text-align: right;
  color: var(--rl-muted);
}

.review-form__error {
  margin: 0;
  font-size: 13px;
  color: var(--bs-danger);
}

.review-form__actions {
  display: flex;
  gap: 8px;
}
</style>
