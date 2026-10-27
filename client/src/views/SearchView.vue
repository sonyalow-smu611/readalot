<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// Book search (/search?q=...). The query lives in the URL, so results survive a reload and the
// Back button steps through earlier searches. Reached from the header icon and the Discover field.
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BookTile from '@/components/BookTile.vue'
import EmptyState from '@/components/EmptyState.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import BookPreviewModal from '@/components/BookPreviewModal.vue'
import { useBookPreview } from '@/composables/useBookPreview'
import { searchBooks } from '@/services/api.js'

const SKELETON_TILES = 6

const route = useRoute()
const router = useRouter()
const { previewBook, openPreview, closePreview, saveStatus } = useBookPreview()

const query = ref('')
const books = ref([])
const loading = ref(false)
const error = ref('')
const searched = ref('')

// Each search gets a number; a slow reply to an older search is ignored.
let latest = 0

async function runSearch(text) {
  const id = ++latest
  searched.value = text
  error.value = ''
  if (!text) {
    books.value = []
    return
  }

  loading.value = true
  try {
    const result = await searchBooks(text)
    if (id === latest) books.value = result.books || []
  } catch {
    if (id === latest) {
      books.value = []
      error.value = "Couldn't reach the book search. Check your connection and try again."
    }
  } finally {
    if (id === latest) loading.value = false
  }
}

watch(
  () => String(route.query.q || '').trim(),
  (text) => {
    query.value = text
    runSearch(text)
  },
  { immediate: true },
)

function onSubmit() {
  const text = query.value.trim()
  if (!text) return
  // the same words again: search again in place (e.g. after an error) instead of adding history
  if (text === searched.value) return runSearch(text)
  router.push({ name: 'search', query: { q: text } })
}
</script>

<template>
  <section class="view search">
    <form class="search__field" role="search" @submit.prevent="onSubmit">
      <span aria-hidden="true">🔍</span>
      <input
        v-model="query"
        class="search__input"
        type="search"
        enterkeyhint="search"
        placeholder="Search books or authors"
        aria-label="Search books or authors"
        :autofocus="!searched"
      />
    </form>

    <div v-if="loading" class="search__grid" aria-busy="true">
      <div v-for="n in SKELETON_TILES" :key="n">
        <SkeletonBlock height="150px" radius="6px" class="mb-2" />
        <SkeletonBlock width="85%" height="10px" class="mb-1" />
        <SkeletonBlock width="55%" height="10px" />
      </div>
    </div>

    <EmptyState v-else-if="error" emoji="📡" title="Search is offline" :message="error" color="butter">
      <button type="button" class="btn btn-outline-dark btn-sm" @click="runSearch(searched)">Try again</button>
    </EmptyState>

    <EmptyState
      v-else-if="!searched"
      emoji="📖"
      title="Find a book"
      message="Search by title or author, like “Pachinko” or “Sally Rooney”."
      color="mint"
    />

    <EmptyState
      v-else-if="!books.length"
      emoji="🤔"
      title="No books found"
      :message="`Nothing matched “${searched}”. Try fewer words or check the spelling.`"
      color="cream"
    />

    <template v-else>
      <p class="search__count">{{ books.length }} results for “{{ searched }}”</p>
      <div class="search__grid">
        <BookTile v-for="book in books" :key="book.id" :book="book" @select="openPreview" />
      </div>
    </template>

    <BookPreviewModal :book="previewBook" @close="closePreview" @status="saveStatus" />
  </section>
</template>

<style scoped>
.search__field {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 18px;
  padding: 10px 14px;
  background: var(--paper);
  border: var(--outline);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-sticker-sm);
}

.search__input {
  flex: 1;
  min-width: 0;
  background: none;
  border: 0;
  outline: none;
  color: var(--ink);
}

.search__count {
  margin: 0 0 12px;
  font-size: 0.85rem;
  color: var(--ink-muted);
}

.search__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px 12px;
}
</style>
