<template>
  <AppHeader />
  <main class="container py-4">
    <RouterView />
  </main>
  <BottomNav />
</template>

<script setup>
import AppHeader from "./components/AppHeader.vue";
import BottomNav from "./components/BottomNav.vue";
</script>
