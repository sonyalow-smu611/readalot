<!-- T14: basic version so the My Room pill works. Still to match reference screen 04. -->
<template>
  <div
    ref="dialog"
    class="modal d-block rl-modal"
    tabindex="-1"
    role="dialog"
    aria-modal="true"
    aria-label="Quote of the Day"
    @click.self="$emit('close')"
    @keydown.esc="$emit('close')"
  >
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content p-4 text-center">
        <p class="quote__eyebrow">Quote of the Day</p>
        <StateView :loading="loading" :error="error" @retry="load">
          <blockquote class="quote__text">“{{ data?.quoteText }}”</blockquote>
          <p v-if="data?.author" class="text-muted small mb-0">{{ data.author }}</p>
          <!-- the quote list has no authors, so the topic stands in for the attribution -->
          <p v-else-if="data?.topic" class="text-muted small mb-0">On {{ data.topic }}</p>
        </StateView>
        <button class="btn btn-primary mt-4" type="button" @click="$emit('close')">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useAsync } from "../../composables/useAsync.js";
import { getTodayQuote } from "../../services/api.js";
import StateView from "../StateView.vue";

defineEmits(["close"]);

const dialog = ref(null);
const { data, error, loading, run } = useAsync(getTodayQuote);

function load() {
  return run().catch(() => {});
}

onMounted(() => {
  dialog.value.focus();
  load();
});
</script>

<style scoped>
.quote__eyebrow {
  margin-bottom: 12px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--rl-accent);
}

.quote__text {
  margin: 0 0 12px;
  font-family: var(--rl-font-title);
  font-size: 19px;
  line-height: 1.4;
}
</style>
