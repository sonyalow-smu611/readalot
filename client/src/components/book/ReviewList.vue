<!-- Every reader's review of a book, newest first: who wrote it, their stars, the caption if
     there is one, and when it was posted (the exact date on hover).
     Written with AI assistance: see AI_USAGE.md. -->
<template>
  <p v-if="!reviews.length" class="reviews__empty">No one has reviewed it yet.</p>
  <ul v-else class="list-unstyled reviews">
    <li v-for="review in reviews" :key="review.id" class="reviews__item">
      <div class="reviews__top">
        <span class="reviews__who">
          <CharacterSprite
            v-if="avatarOf(review)"
            class="reviews__avatar"
            :character="avatarOf(review)"
            crop="head"
            :scale="2"
            decorative
          />
          <span v-else class="reviews__avatar reviews__avatar--emoji" aria-hidden="true">
            {{ review.reviewer.avatar || '📖' }}
          </span>
          <!-- your own goes to the salon; a private profile has no page to go to -->
          <RouterLink v-if="review.mine" class="reviews__name" to="/salon">You</RouterLink>
          <RouterLink
            v-else-if="review.reviewer.handle"
            class="reviews__name"
            :to="`/people/${encodeURIComponent(review.reviewer.handle)}`"
          >
            {{ review.reviewer.name }}
          </RouterLink>
          <span v-else class="reviews__name">{{ review.reviewer.name }}</span>
        </span>
        <time :datetime="review.createdAt" :title="exactDate(review.createdAt)">{{ timeAgo(review.createdAt) }}</time>
      </div>
      <p class="reviews__stars">
        <StarMeter :value="review.rating" />
        <span class="visually-hidden">Rated {{ review.rating }} out of 5</span>
      </p>
      <p v-if="review.text" class="reviews__text">{{ review.text }}</p>
      <div v-if="review.mine" class="reviews__mine">
        <button class="btn btn-secondary btn-sm" type="button" :disabled="busy" @click="$emit('edit')">
          Edit your review
        </button>
        <button class="btn btn-danger btn-sm" type="button" :disabled="busy" @click="$emit('delete')">
          Delete your review
        </button>
      </div>
    </li>
  </ul>
</template>

<script setup>
import CharacterSprite from '@/components/shared/CharacterSprite.vue'
import StarMeter from '@/components/book/StarMeter.vue'
import { exactDate, timeAgo } from '@/lib/time.js'

const props = defineProps({
  // [{ id, rating, text, createdAt, mine, reviewer: { name, handle, character, avatar } }]
  reviews: { type: Array, required: true },
  // your town character, next to your own review
  myCharacter: { type: Object, default: null },
  // your review is being saved or deleted
  busy: { type: Boolean, default: false },
})
// edit / delete: your own review
defineEmits(['edit', 'delete'])

const avatarOf = (review) => (review.mine ? props.myCharacter : null) || review.reviewer.character
</script>

<style scoped>
.reviews {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
}

.reviews__empty {
  margin: 0;
  color: var(--rl-muted);
}

.reviews__item {
  padding: 12px 14px;
  border: var(--px-border);
  background: var(--rl-surface);
}

.reviews__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--rl-muted);
}

.reviews__who {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.reviews__avatar {
  flex: none;
}

.reviews__avatar--emoji {
  font-size: 20px;
  line-height: 1;
}

.reviews__name {
  font-weight: 700;
  font-size: 14px;
  color: var(--rl-text);
}

a.reviews__name {
  color: var(--accent, var(--rl-accent));
}

.reviews__stars {
  margin: 4px 0;
}

.reviews__mine {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.reviews__text {
  margin: 0;
  white-space: pre-line;
}
</style>
