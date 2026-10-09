<template>
  <nav class="bottom-nav" aria-label="Main">
    <RouterLink
      v-for="tab in tabs"
      :key="tab.to"
      class="bottom-nav__tab"
      :class="{ 'is-active': isActive(tab), 'is-tour': guide?.id === tab.tour }"
      :aria-current="isActive(tab) ? 'page' : undefined"
      :to="tab.to"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="tab.icon" /></svg>
      {{ tab.label }}
    </RouterLink>
  </nav>
</template>

<script setup>
import { useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import { useUserStore } from "@/stores/user";

const route = useRoute();
const { guide } = storeToRefs(useUserStore());

const tabs = [
  { to: "/", tour: "home", label: "Home", icon: "M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" },
  { to: "/discover", tour: "discover", label: "Discover", icon: "M5 4h3v16H5zM10.5 4h3v16h-3zM15.6 6.2l2.9-.8 3 13.6-2.9.8z" },
  { to: "/people", tour: "people", label: "People", icon: "M12 21s-6.5-5.6-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21zM12 8.2a2.3 2.3 0 1 0 0 4.6 2.3 2.3 0 0 0 0-4.6z" },
  { to: "/scan", tour: "scan", label: "Scan", icon: "M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16" },
  { to: "/profile", tour: "profile", label: "Profile", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20a7.5 7.5 0 0 1 15 0" }
];

function isActive(tab) {
  return tab.to === "/" ? route.path === "/" : route.path.startsWith(tab.to);
}
</script>

<style scoped>
/* last row of the phone frame, below the scrolling page */
.bottom-nav {
  position: relative;
  z-index: 30;
  display: flex;
  flex: none;
  height: var(--rl-nav-height);
  border-top: 1px solid var(--rl-line);
  background: var(--rl-surface);
}

.bottom-nav__tab {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  text-decoration: none;
  color: var(--rl-muted);
}

.bottom-nav__tab.is-active {
  color: var(--rl-primary);
}

.bottom-nav__tab.is-tour {
  position: relative;
  z-index: 21;
  color: var(--rl-primary);
  background: var(--rl-surface);
  border-radius: 12px 12px 0 0;
  transform: translateY(-6px);
}

.bottom-nav__tab svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

@media (prefers-reduced-motion: reduce) {
  .bottom-nav__tab.is-tour {
    transform: none;
  }
}
</style>
