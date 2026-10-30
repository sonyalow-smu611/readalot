<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// One of the day's tasks: a tick box, what to do, and Go, which takes the reader to the building
// where it's done. A done task gets its tick and loses Go.
defineProps({
  // { id, title, hint, place, done }, from town/daily.js
  task: { type: Object, required: true },
})
const emit = defineEmits(['go'])
</script>

<template>
  <li class="daily-task" :class="{ 'is-done': task.done }">
    <span class="daily-task__box" aria-hidden="true">
      <svg v-if="task.done" viewBox="0 0 24 24"><path d="m6 12.5 4 4L18 8" /></svg>
    </span>
    <span class="daily-task__text">
      <span class="daily-task__title">{{ task.title }}</span>
      <span class="daily-task__hint">{{ task.done ? 'Done' : task.hint }}</span>
    </span>
    <button
      v-if="!task.done && task.place"
      type="button"
      class="btn btn-primary btn-sm daily-task__go"
      :aria-label="`Go: ${task.title}`"
      @click="emit('go', task.place)"
    >
      Go
    </button>
  </li>
</template>

<style scoped>
.daily-task {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 56px;
  padding: 8px 10px;
  border-radius: 12px;
  background: var(--rl-canvas);
}

.daily-task__box {
  flex: none;
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border: 2px solid var(--rl-line);
  border-radius: 8px;
  background: var(--rl-surface);
}

.is-done .daily-task__box {
  border-color: #3fae5a;
  background: #3fae5a;
  animation: daily-tick 0.35s cubic-bezier(0.2, 0.8, 0.2, 1.4);
}

.daily-task__box svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: #fff;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.daily-task__text {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.daily-task__title {
  font-weight: 700;
  font-size: 15px;
}

.is-done .daily-task__title {
  color: var(--rl-muted);
  text-decoration: line-through;
}

.daily-task__hint {
  font-size: 13px;
  color: var(--rl-muted);
}

.daily-task__go {
  flex: none;
}

@keyframes daily-tick {
  from {
    transform: scale(0.4);
  }
}

@media (prefers-reduced-motion: reduce) {
  .is-done .daily-task__box {
    animation: none;
  }
}
</style>
