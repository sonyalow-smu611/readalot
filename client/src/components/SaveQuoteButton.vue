<!--
  Scaffolded with AI assistance — see AI_USAGE.md
  Save quote / Unsave for one quote, wherever it is shown: the mood check-in, the Quote of the Day.
  It looks the quote up in the reader's saved quotes, so a quote saved before shows Unsave, and
  keeps them in step with the Saved quotes card in the salon. Emits `saved` with the saved quote
  (or null once it is unsaved) so the page can offer See saved quotes.
-->
<template>
  <span class="save-quote">
    <button
      class="btn btn-sm"
      :class="savedId ? 'btn-secondary' : 'btn-success'"
      type="button"
      :aria-pressed="Boolean(savedId)"
      :disabled="busy || !quote"
      @click="toggle"
    >
      {{ busy ? "Saving…" : savedId ? "Unsave" : "Save quote" }}
    </button>
    <RouterLink v-if="savedId" class="btn btn-secondary btn-sm" to="/salon#saved-quotes">See saved quotes</RouterLink>
    <span v-if="error" class="save-quote__error" role="alert">{{ error }}</span>
  </span>
</template>

<script setup>
import { ref, watch } from "vue";
import { getSavedQuotes, saveQuote, unsaveQuote } from "../services/api.js";

const props = defineProps({
  // { quoteText, author, work, bookId, sourceUrl, mood }; null while it is still loading
  quote: { type: Object, default: null }
});
const emit = defineEmits(["saved"]);

// the saved quote's id while the quote on screen is saved
const savedId = ref(null);
const busy = ref(false);
const error = ref("");

// a quote saved before shows as Unsave; if the list can't load, the button just offers to save
async function findSaved(shown) {
  savedId.value = null;
  error.value = "";
  if (!shown) return;
  try {
    const { quotes } = await getSavedQuotes();
    if (props.quote !== shown) return;
    const match = quotes.find((q) => q.quoteText === shown.quoteText && (q.bookId || "") === (shown.bookId || ""));
    savedId.value = match?.id ?? null;
  } catch {
    // leave the button as Save quote
  }
}

async function toggle() {
  busy.value = true;
  error.value = "";
  const wasSaved = Boolean(savedId.value);
  try {
    if (wasSaved) {
      await unsaveQuote(savedId.value);
      savedId.value = null;
      emit("saved", null);
    } else {
      const saved = await saveQuote({ ...props.quote });
      savedId.value = saved.id;
      emit("saved", saved);
    }
  } catch {
    error.value = wasSaved ? "Couldn't remove this quote. Try again." : "Couldn't save this quote. Try again.";
  } finally {
    busy.value = false;
  }
}

watch(() => props.quote, findSaved, { immediate: true });
</script>

<style scoped>
.save-quote {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.save-quote__error {
  flex-basis: 100%;
  font-size: 13px;
  color: #8d2218;
}
</style>
