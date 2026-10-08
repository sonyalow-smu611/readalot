<!--
  Mood recommendation (reference screen 03): a book for the mood, with a quote from it.
  The reader can add it to To Be Read, open its page, or ask for another.
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
              <figcaption>{{ data.quote.author }}, <cite>{{ data.quote.work }}</cite></figcaption>
            </figure>

            <p v-if="addError" class="result__error" role="alert">{{ addError }}</p>
            <button
              class="btn btn-primary result__action"
              type="button"
              :disabled="adding || added"
              @click="add"
            >
              {{ added ? "Added to To Be Read" : adding ? "Adding…" : "Add to To Be Read" }}
            </button>
            <RouterLink class="btn btn-outline-primary result__action" :to="`/books/${data.book.id}`">
              Open book page
            </RouterLink>
            <button class="btn btn-outline-primary result__action" type="button" @click="load">
              Show another recommendation
            </button>
          </template>
        </StateView>

        <button class="result__close" type="button" @click="$emit('close')">
          Close <span aria-hidden="true">×</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useAsync } from "../../composables/useAsync.js";
import { getRecommendations } from "../../services/api.js";
import { useBookshelfStore } from "../../stores/bookshelf.js";
import BookCover from "../BookCover.vue";
import StateView from "../StateView.vue";
import MoodSteps from "./MoodSteps.vue";

const props = defineProps({
  // calm | low | stressed | excited
  mood: { type: String, required: true }
});
defineEmits(["close"]);

const bookshelf = useBookshelfStore();
const dialog = ref(null);
const adding = ref(false);
const added = ref(false);
const addError = ref("");

// asking again leaves out the work on screen, so "another" is always a different book
const { data, error, loading, run } = useAsync(() => getRecommendations(props.mood, data.value?.workId));

function load() {
  added.value = false;
  addError.value = "";
  return run().catch(() => {});
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
  load();
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
  display: block;
  margin: 2px auto 0;
  padding: 8px 12px;
  border: 0;
  background: none;
  font-size: 13px;
  font-weight: 700;
  color: var(--rl-muted);
}
</style>
