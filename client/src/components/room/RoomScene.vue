<!--
  The illustrated room: wall, floor, bookcase, bay window and reading chair.
  Shared by My Room and (read-only) another reader's room. Everything on the stage is sized in
  --u, one unit of the 366-wide reference screen, so the furniture scales with the phone.
-->
<template>
  <div class="room" :class="[`room--${weather.scene}`, { 'room--dark': weather.dark }]">
    <div class="room__wall" />
    <div class="room__floor" />

    <div class="room__stage">
      <BayWindow class="room__window" :weather="weather" />
      <div class="room__light" />
      <RoomBookshelf
        class="room__bookcase"
        :books="books"
        :loading="loading"
        :readonly="readonly"
        @open="$emit('open-shelf', $event)"
      />
      <div class="room__rug" />
      <ReadingChair class="room__chair" :book="currentBook" />
    </div>

    <div class="room__ambience" />
  </div>
</template>

<script setup>
import BayWindow from "./BayWindow.vue";
import ReadingChair from "./ReadingChair.vue";
import RoomBookshelf from "./RoomBookshelf.vue";

defineProps({
  books: { type: Array, default: () => [] },
  currentBook: { type: Object, default: null },
  // { scene, dark, label } from services/roomWeather.js
  weather: { type: Object, required: true },
  loading: Boolean,
  readonly: Boolean
});
defineEmits(["open-shelf"]);
</script>

<style scoped>
.room {
  /* floating UI that sits over the room: header + quote pill above, reading card + nav below */
  --room-top: 134px;
  --room-dock: 134px;
  --u: max(
    0.5px,
    min(100cqw / 366, (100cqh - var(--room-top) - var(--room-dock) - var(--rl-nav-height)) / 400)
  );
  --floor: calc(var(--rl-nav-height) + var(--room-dock) + 62 * var(--u));

  position: relative;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  container-type: size;
}

.room__wall {
  position: absolute;
  inset: 0 0 var(--floor);
  border-bottom: 7px solid var(--rl-wood);
  background:
    repeating-linear-gradient(90deg, rgba(255, 253, 249, 0.3) 0 2px, transparent 2px 30px),
    linear-gradient(180deg, #ece2d6, #e6d9ca);
}

.room__floor {
  position: absolute;
  inset: auto 0 0;
  height: var(--floor);
  background:
    linear-gradient(180deg, rgba(63, 46, 36, 0.16), transparent 18px),
    repeating-linear-gradient(180deg, transparent 0 71px, rgba(107, 74, 52, 0.3) 71px 72px),
    repeating-linear-gradient(90deg, rgba(154, 122, 85, 0.14) 0 1px, transparent 1px 58px),
    #b49272;
}

/* zero-height box sitting on the skirting line; furniture is placed up (or down) from it */
.room__stage {
  position: absolute;
  bottom: var(--floor);
  left: calc(50% - 183 * var(--u));
  width: calc(366 * var(--u));
  height: 0;
}

.room__stage > * {
  position: absolute;
}

.room__bookcase {
  bottom: calc(-5 * var(--u));
  left: calc(15 * var(--u));
  width: calc(186 * var(--u));
  height: calc(338 * var(--u));
}

.room__window {
  bottom: calc(76 * var(--u));
  left: calc(204 * var(--u));
  width: calc(160 * var(--u));
}

.room__chair {
  bottom: calc(-58 * var(--u));
  left: calc(198 * var(--u));
  width: calc(152 * var(--u));
}

.room__rug {
  bottom: calc(-66 * var(--u));
  left: calc(178 * var(--u));
  width: calc(192 * var(--u));
  height: calc(40 * var(--u));
  border-radius: 50%;
  border: calc(3 * var(--u)) solid #b7705a;
  background: #cdb193;
  box-shadow: 0 0 0 calc(4 * var(--u)) #cdb193;
  opacity: 0.8;
}

/* daylight falling through the window onto the floor */
.room__light {
  bottom: calc(-62 * var(--u));
  left: calc(96 * var(--u));
  width: calc(230 * var(--u));
  height: calc(62 * var(--u));
  background: linear-gradient(180deg, rgba(255, 246, 220, 0.55), rgba(255, 246, 220, 0));
  clip-path: polygon(52% 0, 100% 0, 58% 100%, 0 100%);
  opacity: 0;
  transition: opacity 1.200s ease;
}

.room--sun .room__light {
  opacity: 1;
}

.room--golden .room__light {
  background: linear-gradient(180deg, rgba(255, 196, 120, 0.6), rgba(255, 196, 120, 0));
  opacity: 1;
}

/* tints the whole room to match the weather outside */
.room__ambience {
  position: absolute;
  inset: 0;
  pointer-events: none;
  mix-blend-mode: multiply;
  transition: background-color 1.200s ease;
}

.room--cloud .room__ambience {
  background-color: rgba(150, 160, 170, 0.12);
}

.room--rain .room__ambience {
  background-color: rgba(110, 130, 150, 0.22);
}

.room--golden .room__ambience {
  background-color: rgba(255, 190, 130, 0.22);
}

.room--night .room__ambience,
.room--dark .room__ambience {
  background-color: rgba(70, 76, 120, 0.4);
}
</style>
