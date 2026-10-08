<template>
  <section class="room-view">
    <RoomScene
      :books="books"
      :current-book="currentBook"
      :weather="sky"
      :loading="loading"
      @open-shelf="openShelf"
    />

    <button class="room-view__quote" type="button" @click="quoteOpen = true">
      Quote of the Day <span aria-hidden="true">↗</span>
    </button>

    <div class="room-view__dock">
      <div v-if="loading || error" class="room-view__state">
        <StateView :loading="loading" :error="error" @retry="load" />
      </div>
      <CurrentlyReadingCard v-else :book="currentBook" />
    </div>

    <Transition name="shelf-zoom">
      <BookshelfExpanded
        v-if="shelfOpen"
        :books="books"
        :style="zoomFrom"
        @close="closeShelf"
        @preview="previewId = $event.id"
        @move="move($event.id, $event.status, $event.beforeId)"
      />
    </Transition>

    <BookPreviewModal
      :book="previewBook"
      @close="closePreview"
      @status="move(previewBook.id, $event)"
    />
    <QuoteOfDayModal v-if="quoteOpen" @close="quoteOpen = false" />

    <p v-if="moveError" class="room-view__toast" role="alert">{{ moveError }}</p>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import BookPreviewModal from "../components/BookPreviewModal.vue";
import StateView from "../components/StateView.vue";
import QuoteOfDayModal from "../components/modals/QuoteOfDayModal.vue";
import BookshelfExpanded from "../components/room/BookshelfExpanded.vue";
import CurrentlyReadingCard from "../components/room/CurrentlyReadingCard.vue";
import RoomScene from "../components/room/RoomScene.vue";
import { useMyShelf } from "../composables/useMyShelf.js";
import { getWeather } from "../services/api.js";
import { SCENES, describeScene, pickScene } from "../services/roomWeather.js";

// T04 replaces this with the shared location helper.
const SINGAPORE = { lat: 1.3521, lng: 103.8198 };
const WEATHER_REFRESH_MS = 10 * 60 * 1000;

const route = useRoute();
const { books, currentBook, loading, error, moveError, load, move } = useMyShelf();

const weather = ref(null);
const now = ref(new Date());
let weatherTimer = 0;

// /?scene=sun|cloud|rain|night|golden previews an illustration without waiting for the weather
const sky = computed(() =>
  SCENES.includes(route.query.scene) ? describeScene(route.query.scene) : pickScene(weather.value, now.value)
);

async function loadWeather() {
  now.value = new Date();
  try {
    weather.value = await getWeather(SINGAPORE.lat, SINGAPORE.lng);
  } catch {
    // no weather: the window falls back to the time of day on this device
    weather.value = null;
  }
}

const shelfOpen = ref(false);
const zoomFrom = ref({});
const previewId = ref(null);
const quoteOpen = ref(false);
let shelfTrigger = null;

const previewBook = computed(() => books.value.find((book) => book.id === previewId.value) || null);

// The full shelf grows out of the bookcase that was tapped.
function openShelf(rect) {
  const column = document.querySelector(".phone").getBoundingClientRect();
  zoomFrom.value = {
    "--zoom-x": `${rect.left - column.left + rect.width / 2}px`,
    "--zoom-y": `${rect.top + rect.height / 2}px`,
    "--zoom-scale": rect.width / column.width
  };
  shelfTrigger = document.activeElement;
  shelfOpen.value = true;
}

// Hand focus back to the book that was previewed, so the keyboard carries on from there.
async function closePreview() {
  const id = previewId.value;
  previewId.value = null;
  await nextTick();
  document.querySelector(`[data-book="${CSS.escape(id)}"]`)?.focus();
}

async function closeShelf() {
  shelfOpen.value = false;
  previewId.value = null;
  await nextTick();
  shelfTrigger?.focus?.();
}

onMounted(() => {
  load();
  loadWeather();
  weatherTimer = setInterval(loadWeather, WEATHER_REFRESH_MS);
});

onBeforeUnmount(() => clearInterval(weatherTimer));
</script>

<style scoped>
.room-view {
  position: relative;
}

.room-view__quote {
  position: absolute;
  top: 87px;
  right: 15px;
  z-index: 4;
  height: 35px;
  padding: 0 18px;
  border: 0;
  border-radius: 999px;
  background: var(--rl-primary);
  font-size: 12px;
  font-weight: 700;
  color: var(--rl-surface);
  box-shadow: 0 3px 8px rgba(63, 46, 36, 0.25);
}

.room-view__dock {
  position: absolute;
  inset: auto 15px calc(var(--rl-nav-height) + 12px);
  z-index: 4;
}

.room-view__state {
  display: grid;
  place-items: center;
  min-height: 108px;
  border: 1px solid var(--rl-line);
  border-radius: var(--rl-radius-card);
  background: var(--rl-surface);
  box-shadow: 0 4px 10px rgba(63, 46, 36, 0.17);
}

.room-view__toast {
  position: fixed;
  bottom: calc(var(--rl-nav-height) + 16px);
  left: 50%;
  z-index: 1100;
  width: min(calc(100% - 30px), 400px);
  margin: 0;
  padding: 10px 14px;
  transform: translateX(-50%);
  border-radius: var(--rl-radius-card);
  background: var(--rl-primary);
  font-size: 13px;
  text-align: center;
  color: var(--rl-surface);
}

.shelf-zoom-enter-active,
.shelf-zoom-leave-active {
  transform-origin: var(--zoom-x) var(--zoom-y);
  transition: transform 0.34s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.22s ease;
}

.shelf-zoom-enter-from,
.shelf-zoom-leave-to {
  transform: scale(var(--zoom-scale));
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .shelf-zoom-enter-active,
  .shelf-zoom-leave-active {
    transition: opacity 0.15s ease;
  }

  .shelf-zoom-enter-from,
  .shelf-zoom-leave-to {
    transform: none;
  }
}
</style>
