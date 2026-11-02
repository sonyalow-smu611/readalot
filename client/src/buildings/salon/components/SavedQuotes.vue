<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// Saved quotes: the lines the reader kept from their mood check-in, newest first, each with a
// Remove. Removing shows straight away and comes back if the server says no.
import { onMounted, ref } from 'vue'
import ProfileBlock from '@/buildings/salon/components/ProfileBlock.vue'
import SavedQuoteItem from '@/buildings/salon/components/SavedQuoteItem.vue'
import StateView from '@/components/StateView.vue'
import { getSavedQuotes, unsaveQuote } from '@/services/api.js'

const quotes = ref([])
const loading = ref(true)
const error = ref('')
const removeError = ref('')
const removing = ref(null)

async function load() {
  loading.value = true
  error.value = ''
  try {
    quotes.value = (await getSavedQuotes()).quotes
  } catch {
    error.value = "Couldn't load your saved quotes."
  } finally {
    loading.value = false
  }
}

async function remove(id) {
  const before = quotes.value
  removing.value = id
  removeError.value = ''
  quotes.value = before.filter((q) => q.id !== id)
  try {
    await unsaveQuote(id)
  } catch {
    quotes.value = before
    removeError.value = "Couldn't remove that quote. Try again."
  } finally {
    removing.value = null
  }
}

onMounted(load)
</script>

<template>
  <div id="saved-quotes">
    <ProfileBlock title="Saved quotes">
      <StateView :loading="loading" :error="error" :empty="!quotes.length" @retry="load">
        <template #empty>
          <div class="empty">
            <span class="empty__mark" aria-hidden="true">“</span>
            <p class="mb-1">No saved quotes yet</p>
            <p class="block__empty mb-2">Tap Save quote on a line from your mood check-in in My Room to keep it here.</p>
            <RouterLink class="empty__link" to="/house">Go to My Room</RouterLink>
            ·
            <RouterLink class="empty__link" to="/discover">Find a book</RouterLink>
          </div>
        </template>
        <p v-if="removeError" class="quotes__error" role="alert">{{ removeError }}</p>
        <ul class="quotes" aria-label="Your saved quotes">
          <SavedQuoteItem
            v-for="quote in quotes"
            :key="quote.id"
            :quote="quote"
            :busy="removing === quote.id"
            @remove="remove"
          />
        </ul>
      </StateView>
    </ProfileBlock>
  </div>
</template>

<style scoped>
.quotes {
  margin: 0;
  padding: 0;
  list-style: none;
}

.quotes__error {
  margin: 0 0 8px;
  color: #8d2218;
  font-size: 0.85rem;
}

.empty {
  padding: 18px 16px;
  border: 2px dashed #ead2de;
  border-radius: 14px;
  background: #fff7fb;
  color: var(--px-ink, #2b1d24);
  text-align: center;
}

.empty__mark {
  display: block;
  height: 28px;
  color: #e98aa8;
  font-family: var(--rl-font-title);
  font-size: 3rem;
  line-height: 1;
}

.empty__link {
  color: #a84874;
  font-size: 0.875rem;
  font-weight: 700;
}
</style>
