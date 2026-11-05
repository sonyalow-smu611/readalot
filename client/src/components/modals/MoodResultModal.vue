<!--
  Mood recommendation (reference screen 03): a book for the mood, with a quote from it.
  The reader can save the quote, add the book to To Be Read, open its page, or ask for another.
-->
<template>
  <div
    ref="dialog"
    class="modal d-block rl-modal"
    tabindex="-1"
    role="dialog"
    aria-modal="true"
    aria-labelledby="result-title"
    @click.self="$emit('close')"
    @keydown.esc="$emit('close')"
  >
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content result">
        <MoodSteps :current="added ? 2 : 1" />
        <h2 id="result-title" class="result__title">A book for your mood</h2>

        <StateView :loading="loading" :error="error" @retry="load">
          <template v-if="data">
            <div class="result__book">
              <BookCover
                class="result__cover"
                :cover-url="data.book.coverUrl"
                :title="data.book.title"
                :seed="data.book.id"
              />
              <div class="result__meta">
                <h3 class="result__name">{{ data.book.title }}</h3>
                <p class="result__author">{{ data.book.authors?.join(", ") || "Unknown author" }}</p>
                <p class="result__reason">
                  Picked because you're feeling <strong>{{ data.mood }}</strong
                  ><template v-if="data.category">, with a line on {{ data.category }}</template>.
                </p>
              </div>
            </div>

            <figure class="result__quote">
              <blockquote>“{{ data.quote.quoteText }}”</blockquote>
              <figcaption>
                {{ data.quote.author }}, <cite>{{ data.quote.work }}</cite>
                <!-- Wikiquote text is CC BY-SA: the quote links back to its page -->
                <template v-if="data.quote.sourceUrl">
                  · <a :href="data.quote.sourceUrl" target="_blank" rel="noopener">via Wikiquote</a>
                </template>
              </figcaption>
            </figure>

            <div class="result__keep">
              <SaveQuoteButton :quote="quoteToSave" />
            </div>

            <p v-if="addError" class="result__error" role="alert">{{ addError }}</p>
            <div v-if="added" class="result__added">
              <span class="result__added-text" role="status"><span aria-hidden="true">✓</span> Added to To Be Read</span>
              <LoadButton class="btn btn-secondary btn-sm" :busy="adding" :failed="Boolean(addError)" busy-text="Undoing…" @click="undo">
                Undo
              </LoadButton>
            </div>
            <LoadButton v-else class="btn btn-success result__action" :busy="adding" :failed="Boolean(addError)" busy-text="Adding…" @click="add">
              Add to To Be Read
            </LoadButton>
            <RouterLink class="btn btn-outline-primary result__action" :to="`/books/${data.book.id}`" @click="$emit('leave', { mood, data })">
              Open book page
            </RouterLink>
            <button class="btn btn-outline-primary result__action" type="button" @click="load">
              Show another recommendation
            </button>
          </template>
        </StateView>

        <button class="btn btn-secondary result__close" type="button" @click="$emit('close')">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import LoadButton from "@/components/shared/LoadButton.vue";
import { computed, onMounted, ref } from "vue";
import { useAsync } from "../../composables/useAsync.js";
import { getRecommendations } from "../../services/api.js";
import { useBookshelfStore } from "../../stores/bookshelf.js";
import BookCover from "../BookCover.vue";
import SaveQuoteButton from "../SaveQuoteButton.vue";
import StateView from "../StateView.vue";
import MoodSteps from "./MoodSteps.vue";

const props = defineProps({
  // calm | low | stressed | excited
  mood: { type: String, required: true },
  // the recommendation this card showed when the reader left for its book page: coming back shows
  // the same one rather than asking again
  restored: { type: Object, default: null }
});
defineEmits(["close", "leave"]);

const bookshelf = useBookshelfStore();
const dialog = ref(null);
const adding = ref(false);
const added = ref(false);
const addError = ref("");
// asking again leaves out the work on screen, so "another" is always a different book
const { data, error, loading, run } = useAsync(() => getRecommendations(props.mood, data.value?.workId));

// The quote on screen, in the shape the saved quotes keep it.
const quoteToSave = computed(() => {
  if (!data.value) return null;
  const { quote, book, mood } = data.value;
  return {
    quoteText: quote.quoteText,
    author: quote.author,
    work: quote.work || book.title,
    bookId: book.id,
    sourceUrl: quote.sourceUrl || null,
    mood
  };
});

async function load() {
  added.value = false;
  addError.value = "";
  await run().catch(() => {});
}

// Takes the book off To Be Read again.
async function undo() {
  adding.value = true;
  addError.value = "";
  try {
    await bookshelf.removeBook(data.value.book.id);
    added.value = false;
  } catch {
    addError.value = "Couldn't undo this. Try again.";
  } finally {
    adding.value = false;
  }
}

async function add() {
  adding.value = true;
  addError.value = "";
  try {
    await bookshelf.addBook(data.value.book.id, "want_to_read");
    added.value = true;
  } catch {
    addError.value = "Couldn't add this book. Try again.";
  } finally {
    adding.value = false;
  }
}

onMounted(() => {
  dialog.value.focus();
  if (props.restored) {
    data.value = props.restored.data;
    // the book may be on To Be Read already: Undo is only for one added from this card
  } else load();
});
</script>

<style scoped>
.rl-modal:focus {
  outline: none;
}

.result {
  padding: 22px 18px 12px;
}

.result__title {
  margin: 0 0 16px;
  font-size: 21px;
  line-height: 1.25;
  text-align: center;
}

.result__book {
  display: flex;
  gap: 14px;
  margin-bottom: 14px;
}

.result__cover {
  width: 84px;
  flex: none;
  font-size: 11px;
}

.result__meta {
  min-width: 0;
}

.result__name {
  margin: 2px 0 2px;
  font-size: 17px;
  line-height: 1.25;
}

.result__author {
  margin: 0 0 8px;
  font-size: 13px;
  color: var(--rl-muted);
}

.result__reason {
  margin: 0;
  padding: 8px 10px;
  border: 1px solid var(--rl-line);
  border-radius: var(--rl-radius-card);
  background: var(--rl-secondary);
  font-size: 12px;
  line-height: 1.4;
}

.result__quote {
  margin: 0 0 16px;
  padding: 12px 14px;
  border-left: 3px solid var(--rl-accent);
  border-radius: 0 var(--rl-radius-card) var(--rl-radius-card) 0;
  background: var(--rl-canvas);
}

.result__quote blockquote {
  margin: 0 0 6px;
  font-family: var(--rl-font-title);
  font-size: 15px;
  line-height: 1.45;
}

.result__quote figcaption {
  font-size: 12px;
  color: var(--rl-muted);
}

.result__keep {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: -6px 0 16px;
}

.result__added {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 44px;
  margin-bottom: 8px;
  padding: 6px 12px;
  border: var(--px-border);
  background: var(--px-paper-shade);
  font-weight: 800;
}

.result__action {
  display: block;
  width: 100%;
  margin-bottom: 8px;
}

.result__error {
  margin: 0 0 8px;
  font-size: 13px;
  color: #8d2218;
}

.result__close {
  display: flex;
  margin: 2px auto 0;
}
</style>
