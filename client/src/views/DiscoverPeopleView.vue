<template>
  <section class="app-shell">
    <h1 class="h3 mb-3">Discover People</h1>
    <div class="list-group">
      <RouterLink
        v-for="person in people"
        :key="person.id"
        class="list-group-item list-group-item-action d-flex align-items-center justify-content-between"
        :to="`/people/${person.id}`"
      >
        <span class="d-flex align-items-center gap-2">
          <UserAvatar :display-name="person.displayName" :avatar-url="person.avatarUrl" />
          {{ person.displayName }}
        </span>
        <CompatibilityBadge :compatibility="person.compatibility" />
      </RouterLink>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from "vue";
import CompatibilityBadge from "../components/CompatibilityBadge.vue";
import UserAvatar from "../components/UserAvatar.vue";
import { getNearbyReaders } from "../services/api.js";

const people = ref([]);

onMounted(async () => {
  people.value = (await getNearbyReaders(1.3521, 103.8198)).users;
});
</script>
