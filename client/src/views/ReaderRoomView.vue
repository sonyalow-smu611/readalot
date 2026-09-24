<template>
  <section class="app-shell">
    <RouterLink class="btn btn-sm btn-link px-0 mb-3" to="/people">Back</RouterLink>

    <div v-if="user" class="d-flex align-items-center gap-3 mb-4">
      <UserAvatar :display-name="user.displayName" :avatar-url="user.avatarUrl" />
      <div>
        <h1 class="h3 mb-1">{{ user.displayName }}</h1>
        <CompatibilityBadge :compatibility="user.compatibility" />
      </div>
    </div>

    <BookShelf title="Reader Bookshelf" :books="books" />
  </section>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import BookShelf from "../components/BookShelf.vue";
import CompatibilityBadge from "../components/CompatibilityBadge.vue";
import UserAvatar from "../components/UserAvatar.vue";
import { getUser, getUserBooks } from "../services/api.js";

const route = useRoute();
const user = ref(null);
const books = ref([]);

onMounted(async () => {
  user.value = (await getUser(route.params.id)).user;
  books.value = (await getUserBooks(route.params.id)).books;
});
</script>
