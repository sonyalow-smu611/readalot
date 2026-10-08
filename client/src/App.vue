<template>
  <div class="phone" :class="{ 'phone--bleed': route.meta.fullBleed }">
    <AppHeader />
    <main :class="{ 'container py-4': !route.meta.fullBleed }">
      <RouterView />
    </main>
    <BottomNav />
  </div>
</template>

<script setup>
import { useRoute } from "vue-router";
import AppHeader from "./components/AppHeader.vue";
import BottomNav from "./components/BottomNav.vue";

const route = useRoute();
</script>
