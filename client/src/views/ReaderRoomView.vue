<script setup>
// The page for a reader, at /people/:id: their profile on the Library's wall, with the way back.
import { useRoute } from 'vue-router';
import ReaderProfile from '../components/people/ReaderProfile.vue';
import { PROFILE_COLOURS } from '../components/people/profileColours.js';

const route = useRoute();
</script>

<template>
  <main class="reader-room" :style="PROFILE_COLOURS">
    <div class="back-row">
      <RouterLink class="btn btn-secondary px-sign back-link" to="/people">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
        Back to Discover
      </RouterLink>
    </div>

    <ReaderProfile :reader-id="route.params.id" />
  </main>
</template>

<style scoped>
/* one readable column on the Library's parchment wall, which fills the window */
.reader-room {
  height: 100%;
  overflow-y: auto;
  padding: 20px 16px 95px;
  background: var(--profile-wall);
  color: var(--px-outline);
}

.reader-room > * {
  max-width: 420px;
  margin-left: auto;
  margin-right: auto;
}

/* the Daily button's look, in the page's top left corner */
.reader-room > .back-row {
  max-width: none;
  margin-left: 0;
  margin-bottom: 18px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}

.back-link svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

@media (min-width: 768px) {
  .reader-room {
    padding: 20px 32px 95px;
  }

  .reader-room > .reader-profile {
    max-width: 1100px;
  }
}
</style>
