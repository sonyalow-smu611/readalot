<!--
  Scaffolded with AI assistance — see AI_USAGE.md
  Where to get a book: one button that opens a list of places to buy, download or borrow it,
  grouped (Singapore bookshops, online bookshops, marketplaces, ebooks, the library). Each opens
  that shop's search for the book in a new tab (services/bookShops.js).
-->
<template>
  <div class="where" data-tour="book-where">
    <button
      type="button"
      class="btn btn-secondary where__toggle"
      :aria-expanded="open"
      :aria-controls="listId"
      @click="open = !open"
    >
      Where to get
      <svg class="where__chevron" :class="{ 'is-open': open }" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
    </button>

    <section v-show="open" :id="listId" class="where__list" aria-label="Where to get this book">
      <div v-for="group in groups" :key="group.group" class="where__group">
        <h3 class="where__heading">{{ group.group }}</h3>
        <ul class="where__shops">
          <li v-for="shop in group.shops" :key="shop.name">
            <a class="btn btn-secondary btn-sm where__shop" :href="shop.url" target="_blank" rel="noopener noreferrer">
              {{ shop.name }}<span class="visually-hidden"> (opens in a new tab)</span>
            </a>
          </li>
        </ul>
      </div>
      <p class="where__note">Each link searches that shop for this book.</p>
    </section>
  </div>
</template>

<script setup>
import { computed, ref, useId, watch } from 'vue'
import { shopsFor } from '@/services/bookShops.js'

const props = defineProps({
  // the book: title, authors, isbn and buyUrl find it in each shop
  book: { type: Object, required: true },
})

const listId = useId()
const open = ref(false)
const groups = computed(() => shopsFor(props.book))

// another book: start closed again
watch(() => props.book.id, () => {
  open.value = false
})
</script>

<style scoped>
.where__toggle {
  width: 100%;
  gap: 8px;
}

.where__chevron {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.4;
  stroke-linecap: square;
  transition: transform 0.2s ease;
}

.where__chevron.is-open {
  transform: rotate(180deg);
}

.where__list {
  margin-top: 12px;
  padding: 12px 13px 13px 12px;
  border: var(--px-border);
  background: var(--px-paper);
}

.where__group + .where__group {
  margin-top: 12px;
}

.where__heading {
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--rl-muted);
}

.where__shops {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.where__note {
  margin: 12px 0 0;
  font-size: 12px;
  color: var(--rl-muted);
}

@media (prefers-reduced-motion: reduce) {
  .where__chevron {
    transition: none;
  }
}
</style>
