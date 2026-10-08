<template>
  <header class="app-header">
    <div class="app-header__card">
      <button
        v-if="route.meta.back"
        class="app-header__icon"
        type="button"
        aria-label="Back"
        @click="router.back()"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
      </button>

      <div class="app-header__text">
        <!-- pages that set a title get it as their h1; older views still bring their own -->
        <component :is="route.meta.title ? 'h1' : 'p'" class="app-header__title">
          {{ route.meta.title || "Readalot" }}
        </component>
        <p v-if="route.meta.subtitle" class="app-header__subtitle">{{ route.meta.subtitle }}</p>
      </div>

      <RouterLink
        v-if="!route.meta.hideSearch"
        class="app-header__icon"
        to="/search"
        aria-label="Search books"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16l4.5 4.5" />
        </svg>
      </RouterLink>
    </div>
  </header>
</template>

<script setup>
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
</script>

<style scoped>
.app-header {
  padding: 15px 15px 0;
}

.phone--bleed .app-header {
  position: absolute;
  inset: 0 0 auto;
  z-index: 5;
}

.app-header__card {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 62px;
  padding: 10px 14px 10px 16px;
  border: 1px solid var(--rl-line);
  border-radius: var(--rl-radius-card);
  background: var(--rl-surface);
}

.app-header__text {
  flex: 1;
  min-width: 0;
}

.app-header__title {
  margin: 0;
  font-family: var(--rl-font-title);
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--rl-text);
}

.app-header__subtitle {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--rl-muted);
}

.app-header__icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  flex: none;
  padding: 0;
  border: 1px solid var(--rl-line);
  border-radius: 50%;
  background: var(--rl-secondary);
  color: var(--rl-primary);
}

.app-header__icon svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
