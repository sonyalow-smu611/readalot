<!-- Where the reader is in the mood check-in: Check-in, Result, Saved. -->
<template>
  <ol class="steps" aria-label="Mood check-in progress">
    <li
      v-for="(label, index) in STEPS"
      :key="label"
      class="steps__step"
      :class="{ 'is-done': index < current, 'is-current': index === current }"
      :aria-current="index === current ? 'step' : undefined"
    >
      <span class="steps__dot" aria-hidden="true">{{ index < current ? "✓" : index + 1 }}</span>
      {{ label }}
    </li>
  </ol>
</template>

<script setup>
defineProps({
  // 0 = Check-in, 1 = Result, 2 = Saved
  current: { type: Number, default: 0 }
});

const STEPS = ["Check-in", "Result", "Saved"];
</script>

<style scoped>
.steps {
  display: flex;
  justify-content: center;
  gap: 14px;
  margin: 0 0 16px;
  padding: 0;
  list-style: none;
  font-size: 11px;
  font-weight: 700;
  color: var(--rl-muted);
}

.steps__step {
  display: flex;
  align-items: center;
  gap: 5px;
}

.steps__dot {
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border: 1px solid var(--rl-line);
  border-radius: 50%;
  background: var(--rl-secondary);
  font-size: 10px;
  line-height: 1;
}

.steps__step.is-current,
.steps__step.is-done {
  color: var(--rl-primary);
}

.steps__step.is-current .steps__dot,
.steps__step.is-done .steps__dot {
  border-color: var(--rl-primary);
  background: var(--rl-primary);
  color: var(--rl-surface);
}
</style>
