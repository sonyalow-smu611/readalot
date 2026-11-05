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
            :class="[`mood__option--${option.value}`, { 'is-on': mood === option.value }]"
            type="button"
            :aria-pressed="mood === option.value"
            @click="mood = option.value"
          >
            <span class="mood__name">{{ option.label }}</span>
            <span class="mood__hint">{{ option.hint }}</span>
          </button>
        </div>

        <button class="btn btn-success mood__continue" type="submit" :disabled="!mood">Continue</button>
        <button class="btn btn-secondary mood__skip" type="button" @click="$emit('skip')">Skip for today</button>
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

/* each mood has its own colour: a soft tint at rest, the full colour once picked */
.mood__option--calm {
  --mood-tint: #cfe8dc;
  --mood-fill: #3f8f73;
  --mood-light: #62b094;
  --mood-dark: #2a6b55;
}

.mood__option--low {
  --mood-tint: #d4dcf2;
  --mood-fill: #5b6fb8;
  --mood-light: #7f92d4;
  --mood-dark: #405091;
}

.mood__option--stressed {
  --mood-tint: #f4d2cc;
  --mood-fill: #c0563f;
  --mood-light: #de7a63;
  --mood-dark: #8f3a2a;
}

.mood__option--excited {
  --mood-tint: #fbe6a8;
  --mood-fill: #d99a1c;
  --mood-light: #f0bb48;
  --mood-dark: #a8750f;
}

.mood__option:not(.is-on) {
  --px-fill: var(--mood-tint);
  --px-hover: var(--mood-light);
}

.mood__option.is-on {
  --px-fill: var(--mood-fill);
  --px-light: var(--mood-light);
  --px-dark: var(--mood-dark);
  --px-hover: var(--mood-dark);
  --px-label: #fff;
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
