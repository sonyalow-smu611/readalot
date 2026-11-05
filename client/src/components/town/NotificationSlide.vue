<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// A new notification, sliding in from the right under the top bar, staying a few seconds and then
// fading away. Tapping it goes to what it is about (the town opens it like a tap in the bell's
// list). It is only a heads-up: the notification stays in the bell until it has been looked at.
defineProps({
  // the notification showing, { id, text }, or null when nothing is
  item: { type: Object, default: null },
  // how many more came in with it
  more: { type: Number, default: 0 },
})
const emit = defineEmits(['open'])
</script>

<template>
  <Transition name="notification-slide">
    <button
      v-if="item"
      :key="item.id"
      type="button"
      class="btn btn-secondary notification-slide"
      role="status"
      @click="emit('open', item)"
    >
      <span class="notification-slide__dot" aria-hidden="true"></span>
      <span class="notification-slide__text">{{ item.text }}</span>
      <span v-if="more" class="notification-slide__more">+{{ more }} more</span>
    </button>
  </Transition>
</template>

<style scoped>
.notification-slide {
  position: absolute;
  top: 68px;
  right: 14px;
  /* over the lists and the chat boxes */
  z-index: 25;
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: min(320px, calc(100% - 28px));
  min-height: 52px;
  padding: 8px 14px;
  text-align: left;
  pointer-events: auto;
}

/* on a phone the bell sits lower, so this does too (the same as the notifications list) */
@media (max-width: 600px) {
  .notification-slide {
    top: 130px;
  }
}

.notification-slide__dot {
  flex: none;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #e5484d;
}

.notification-slide__text {
  font-size: 14px;
  font-weight: 700;
}

.notification-slide__more {
  flex: none;
  font-size: 12px;
  color: var(--rl-muted);
}

/* in: a slide from the right edge; out: a slow fade */
.notification-slide-enter-active {
  transition: transform 0.4s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.25s ease;
}

.notification-slide-leave-active {
  transition: opacity 0.9s ease;
}

.notification-slide-enter-from {
  opacity: 0;
  transform: translateX(120%);
}

.notification-slide-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .notification-slide-enter-active {
    transition: opacity 0.25s ease;
  }

  .notification-slide-enter-from {
    transform: none;
  }
}
</style>
