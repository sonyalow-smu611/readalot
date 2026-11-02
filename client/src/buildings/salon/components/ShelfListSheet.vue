<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// A sheet listing one shelf's books. Each can be opened, or removed after a second tap.
// Escape backs out of a removal first, then closes the sheet.
import { nextTick, onMounted, ref, watch } from 'vue'
import BookCover from '@/components/BookCover.vue'

const props = defineProps({
  // the shelf: { status, label, empty }
  stat: { type: Object, required: true },
  books: { type: Array, required: true },
  // the book waiting for "Remove" to be confirmed, or ''
  removingId: { type: String, default: '' },
  removeBusy: { type: Boolean, default: false },
  removeError: { type: String, default: '' },
})

const emit = defineEmits(['close', 'ask-remove', 'cancel-remove', 'confirm-remove'])
const closeButton = ref(null)

onMounted(() => closeButton.value?.focus())

// Focus follows the removal: onto Keep when asked, back to the bin (or Close once the book is gone).
watch(
  () => props.removingId,
  async (id, before) => {
    await nextTick()
    if (id) document.getElementById(`keep-${id}`)?.focus()
    else if (before) (document.getElementById(`remove-${before}`) ?? closeButton.value)?.focus()
  },
)

function escape() {
  if (props.removingId) emit('cancel-remove')
  else emit('close')
}
</script>

<template>
  <Teleport to=".phone-frame">
    <div class="list" @keydown.esc="escape">
      <button type="button" class="list__backdrop" tabindex="-1" aria-hidden="true" @click="emit('close')" />
      <div class="list__sheet" role="dialog" aria-modal="true" aria-labelledby="list-title">
        <div class="list__head">
          <h2 id="list-title" class="list__title">
            {{ stat.label }} <span class="list__count">{{ books.length }}</span>
          </h2>
          <button ref="closeButton" type="button" class="btn btn-secondary btn-icon list__close" aria-label="Close" @click="emit('close')">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <ul v-if="books.length" class="list__books">
          <li v-for="book in books" :key="book.id" class="list__row">
            <RouterLink class="list__book" :to="`/books/${book.id}`">
              <BookCover class="list__cover" :cover-url="book.coverUrl" :title="book.title" :seed="book.id" />
              <span class="list__text">
                <span class="list__name">{{ book.title }}</span>
                <span class="list__author">{{ book.authors.join(', ') }}</span>
                <span v-if="book.status === 'reading'" class="list__progress">
                  <span class="list__bar"><span :style="{ width: `${book.progress}%` }" /></span>
                  {{ book.progress }}%
                </span>
              </span>
            </RouterLink>
            <button
              v-if="removingId !== book.id"
              :id="`remove-${book.id}`"
              type="button"
              class="btn btn-danger btn-icon list__remove"
              :aria-label="`Remove ${book.title} from ${stat.label}`"
              @click="emit('ask-remove', book.id)"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12M10 11v5M14 11v5" /></svg>
            </button>
            <div v-else class="list__confirm">
              <p class="mb-0">Remove from {{ stat.label }}?</p>
              <button :id="`keep-${book.id}`" type="button" class="btn btn-sm btn-outline-primary" @click="emit('cancel-remove')">
                Keep
              </button>
              <button type="button" class="btn btn-sm list__drop" :disabled="removeBusy" @click="emit('confirm-remove', book.id)">
                {{ removeBusy ? 'Removing…' : 'Remove' }}
              </button>
              <p v-if="removeError" class="field-error list__error" role="alert">{{ removeError }}</p>
            </div>
          </li>
        </ul>
        <p v-else class="list__empty">{{ stat.empty }}</p>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.list {
  position: absolute;
  inset: 0;
  z-index: 40;
}

.list__backdrop {
  position: absolute;
  inset: 0;
  padding: 0;
  border: 0;
  background: rgba(44, 36, 30, 0.46);
}

.list__sheet {
  position: absolute;
  inset: auto 0 0;
  display: flex;
  flex-direction: column;
  max-height: 72%;
  padding: 12px 16px 20px;
  border: 1px solid var(--rl-line);
  border-bottom: 0;
  border-radius: var(--rl-radius-modal) var(--rl-radius-modal) 0 0;
  background: var(--rl-surface);
  box-shadow: 0 -12px 40px rgba(44, 36, 30, 0.22);
  animation: list-up 0.32s cubic-bezier(0.2, 0.9, 0.3, 1);
}

.list__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.list__title {
  margin: 0;
  font-size: 1.25rem;
}

.list__count {
  color: var(--rl-muted);
  font-family: var(--rl-font-body);
  font-size: 1rem;
  font-weight: 400;
}


.list__close svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
}

.list__books {
  margin: 0 -16px;
  padding: 0;
  overflow-y: auto;
  list-style: none;
}

.list__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  padding-right: 8px;
}

.list__book {
  display: flex;
  flex: 1 1 0;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 10px 16px;
  color: var(--rl-text);
  text-decoration: none;
}

.list__book:hover {
  background: var(--rl-canvas);
  color: var(--rl-text);
}

.list__remove {
  flex: none;
  /* clear of the scrolling list's edge, so its pixel shadow shows */
  margin-right: 3px;
}

.list__remove svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.list__confirm {
  display: flex;
  /* its own line under the book, indented to line up with the cover */
  flex: 0 0 calc(100% - 16px);
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 0 0 10px 16px;
  padding: 8px 10px;
  border-radius: 12px;
  background: #fbe9e7;
  font-size: 0.875rem;
  animation: confirm-in 0.2s ease;
}

.list__confirm p:first-child {
  flex: 1 1 auto;
}

.list__confirm .btn {
  min-height: 36px;
}

.list__drop {
  background: #b42318;
  border-color: #b42318;
  color: #fffdf9;
}

.list__drop:hover {
  background: #8d2218;
  border-color: #8d2218;
  color: #fffdf9;
}

.field-error {
  color: #8d2218;
  font-size: 0.875rem;
}

.list__error {
  flex: 1 0 100%;
  margin: 0;
}

.list__cover {
  flex: none;
  width: 44px;
  border-radius: 4px;
  font-size: 0.5rem;
}

.list__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.list__name {
  font-family: var(--rl-font-title);
  font-weight: 700;
}

.list__author {
  color: var(--rl-muted);
  font-size: 0.875rem;
}

.list__progress {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--rl-muted);
  font-size: 0.875rem;
}

.list__bar {
  width: 96px;
  height: 6px;
  border-radius: 999px;
  background: var(--rl-secondary);
  overflow: hidden;
}

.list__bar span {
  display: block;
  height: 100%;
  background: var(--rl-accent);
}

.list__empty {
  margin: 8px 0 12px;
  color: var(--rl-muted);
  font-size: 0.875rem;
}

@keyframes confirm-in {
  from { opacity: 0; transform: translateY(-4px); }
}

@keyframes list-up {
  from { transform: translateY(100%); }
}

@media (prefers-reduced-motion: reduce) {
  .list__sheet,
  .list__confirm {
    animation: none;
  }
}
</style>
