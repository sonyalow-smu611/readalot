<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The landing page's bar, which stays at the top while the page scrolls: the name, a link to
// each stop (the one in view is marked) and Sign up. Picking a stop asks the page to go there.
defineProps({
  // [{ id, label }]
  items: { type: Array, required: true },
  // the stop in view, if any
  active: { type: String, default: '' },
})
const emit = defineEmits(['go', 'choose'])
</script>

<template>
  <nav class="start-nav" aria-label="Landing page">
    <span class="start-nav__brand">Readalot</span>
    <div class="start-nav__links">
      <button
        v-for="item in items"
        :key="item.id"
        type="button"
        class="start-nav__link"
        :class="{ 'is-active': active === item.id }"
        :aria-current="active === item.id ? 'true' : undefined"
        @click="emit('go', item.id)"
      >
        {{ item.label }}
      </button>
    </div>
    <RouterLink :to="{ name: 'register' }" class="start-nav__signup" @click="emit('choose')">Sign up</RouterLink>
  </nav>
</template>

<style scoped>
.start-nav {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 12px;
  height: 52px;
  margin-bottom: -52px;
  padding: 0 16px;
  background: rgba(30, 26, 36, 0.72);
  backdrop-filter: saturate(180%) blur(16px);
  -webkit-backdrop-filter: saturate(180%) blur(16px);
  border-bottom: 1px solid rgba(255, 253, 249, 0.12);
}

.start-nav__brand {
  flex-shrink: 0;
  font-family: var(--rl-font-title);
  font-size: 18px;
  font-weight: 700;
  color: var(--rl-surface);
}

.start-nav__links {
  display: flex;
  gap: 4px;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
}

.start-nav__links::-webkit-scrollbar {
  display: none;
}

.start-nav__link {
  flex-shrink: 0;
  padding: 6px 10px;
  border: 0;
  border-radius: 999px;
  background: none;
  color: rgba(255, 253, 249, 0.72);
  font-size: 13px;
}

.start-nav__link:hover {
  color: var(--rl-surface);
}

.start-nav__link.is-active {
  background: rgba(255, 253, 249, 0.16);
  color: var(--rl-surface);
}

.start-nav__signup {
  flex-shrink: 0;
  padding: 6px 14px;
  border-radius: 999px;
  background: var(--rl-surface);
  color: var(--rl-primary);
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
}

@media (min-width: 992px) {
  .start-nav__links {
    justify-content: center;
  }
}
</style>
