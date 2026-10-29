<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The landing page's way in: a chunky Sign up button (and, in the hero, "See how it works"), with
// a small Log in link under it. Signing up or logging in tells the page the visitor has chosen,
// so it can remember the landing page has been seen.
defineProps({
  // also offer "See how it works", which asks the page to scroll to the steps
  how: { type: Boolean, default: false },
  // light words for a dark background (the night sky at the end)
  onDark: { type: Boolean, default: false },
  // centre the buttons (the last screen)
  centred: { type: Boolean, default: false },
})
const emit = defineEmits(['choose', 'how'])
</script>

<template>
  <div class="actions" :class="{ 'actions--dark': onDark, 'actions--centred': centred }">
    <div class="actions__row">
      <RouterLink :to="{ name: 'register' }" class="actions__btn" @click="emit('choose')">Sign up</RouterLink>
      <button v-if="how" type="button" class="actions__btn actions__btn--ghost" @click="emit('how')">See how it works</button>
    </div>
    <p class="actions__login">
      Already have an account?
      <RouterLink :to="{ name: 'login' }" @click="emit('choose')">Log in</RouterLink>
    </p>
  </div>
</template>

<style scoped>
.actions__row {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

.actions--centred .actions__row {
  justify-content: center;
}

.actions__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 52px;
  padding: 10px 28px;
  border: 3px solid var(--s-ink);
  border-radius: 6px;
  background: var(--s-green);
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  text-decoration: none;
  box-shadow: 0 5px 0 var(--s-ink);
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}

.actions__btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 7px 0 var(--s-ink);
}

.actions__btn:active {
  transform: translateY(4px);
  box-shadow: 0 1px 0 var(--s-ink);
}

.actions__btn--ghost {
  background: var(--s-paper);
  color: var(--s-ink);
}

.actions__login {
  margin: 16px 0 0;
  color: var(--s-muted);
  font-size: 15px;
}

.actions__login a {
  color: var(--s-ink);
  font-weight: 700;
}

.actions--dark .actions__login {
  color: rgba(255, 253, 249, 0.8);
}

.actions--dark .actions__login a {
  color: var(--rl-surface);
}

@media (prefers-reduced-motion: reduce) {
  .actions__btn {
    transition: none;
  }
}
</style>
