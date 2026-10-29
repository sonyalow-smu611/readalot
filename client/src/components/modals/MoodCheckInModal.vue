<!--
  Mood check-in (reference screen 02). The reader picks one mood and continues to a book
  recommendation, or skips. Closing it any other way counts as skipping.
-->
<template>
  <div
    ref="dialog"
    class="modal d-block rl-modal"
    tabindex="-1"
    role="dialog"
    aria-modal="true"
    aria-labelledby="mood-title"
    @click.self="$emit('skip')"
    @keydown.esc="$emit('skip')"
  >
    <div class="modal-dialog modal-dialog-centered">
      <form class="modal-content mood" @submit.prevent="submit">
        <MoodSteps :current="0" />
        <h2 id="mood-title" class="mood__title">How are you feeling today?</h2>
        <p class="mood__lead">A quick check-in to shape today's recommendation.</p>

        <div class="mood__options" role="group" aria-labelledby="mood-title">
          <button
            v-for="option in MOODS"
            :key="option.value"
            class="btn btn-chip mood__option"
            :class="{ 'is-on': mood === option.value }"
            type="button"
            :aria-pressed="mood === option.value"
            @click="mood = option.value"
          >
            <span class="mood__name">{{ option.label }}</span>
            <span class="mood__hint">{{ option.hint }}</span>
          </button>
        </div>

        <button class="btn btn-primary mood__continue" type="submit" :disabled="!mood">Continue</button>
        <button class="btn btn-link mood__skip" type="button" @click="$emit('skip')">Skip for today</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import MoodSteps from "./MoodSteps.vue";

const emit = defineEmits(["submit", "skip"]);

// values are the moods the recommendations API accepts
const MOODS = [
  { value: "calm", label: "Calm", hint: "Settled, unhurried" },
  { value: "low", label: "Low", hint: "Could use a lift" },
  { value: "stressed", label: "Stressed", hint: "A lot on my mind" },
  { value: "excited", label: "Excited", hint: "Full of energy" }
];

const dialog = ref(null);
const mood = ref("");

function submit() {
  if (mood.value) emit("submit", mood.value);
}

onMounted(() => dialog.value.focus());
</script>

<style scoped>
.rl-modal:focus {
  outline: none;
}

.mood {
  padding: 22px 18px 14px;
  text-align: center;
}

.mood__title {
  margin: 0 0 6px;
  font-size: 21px;
  line-height: 1.25;
}

.mood__lead {
  margin: 0 0 18px;
  font-size: 13px;
  color: var(--rl-muted);
}

.mood__options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 18px;
}

.mood__option {
  flex-direction: column;
  gap: 2px;
  min-height: 62px;
  padding: 10px 8px;
}

.mood__name {
  font-family: var(--rl-font-title);
  font-size: 16px;
  font-weight: 700;
}

.mood__hint {
  font-size: 11px;
  opacity: 0.8;
}

.mood__continue {
  display: block;
  width: 100%;
  padding-block: 10px;
}

.mood__skip {
  margin-top: 6px;
}

</style>
