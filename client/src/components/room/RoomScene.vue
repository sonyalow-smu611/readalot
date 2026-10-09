<!--
  The illustrated room: wall, floor, bookcase, window, clock and reading chair.
  Shared by My Room and (read-only) another reader's room. Everything on the stage is sized in
  --u, one unit of the 366-wide reference screen, so the furniture scales with the phone.

  Slots:
    ledge  ({ zone })  decorations standing on a bookcase shelf
    floor              furniture and pets on the strip of floor in front of the chair
-->
<template>
  <div class="room" :class="[`room--${weather.scene}`, { 'room--dark': weather.night }]">
    <div class="room__wall" />
    <div class="room__floor" />

    <div class="room__stage">
      <RoomWindow
        data-tour="window"
        class="room__window"
        :scene="weather.scene"
        :night="weather.night"
        :temperature="weather.temperature"
        :rows="WINDOW_ROWS"
      />
      <div class="room__light" />
      <WallClock data-tour="clock" class="room__clock" />
      <RoomBookshelf
        class="room__bookcase"
        :books="books"
        :loading="loading"
        :error="error"
        :readonly="readonly"
        @open="$emit('open-shelf', $event)"
        @retry="$emit('retry')"
      >
        <template #ledge="{ zone }">
          <slot name="ledge" :zone="zone" />
        </template>
        <template v-if="!readonly" #note>
          <QuoteNote @click="$emit('quote')" />
        </template>
      </RoomBookshelf>
      <div class="room__rug" />
      <ReadingChair
        class="room__chair"
        :book="currentBook"
        :expanded="readingOpen"
        @open-book="$emit('open-book')"
      />
    </div>

    <div class="room__ground" data-drop="floor">
      <slot name="floor" />
    </div>

    <div class="room__ambience" />
  </div>
</template>

<script setup>
import QuoteNote from "./QuoteNote.vue";
import ReadingChair from "./ReadingChair.vue";
import RoomBookshelf from "./RoomBookshelf.vue";
import RoomWindow from "./RoomWindow.vue";
import WallClock from "./WallClock.vue";

// Tall enough that the crown of the window's arch is level with the top of the clock.
const WINDOW_ROWS = 403;

defineProps({
  books: { type: Array, default: () => [] },
  currentBook: { type: Object, default: null },
  // { scene: "sunny" | "cloudy" | "rain", night, temperature }
  weather: { type: Object, required: true },
  loading: Boolean,
  error: { type: String, default: "" },
  readonly: Boolean,
  // the Currently Reading card opened from the chair is showing
  readingOpen: Boolean
});
defineEmits(["open-shelf", "open-book", "quote", "retry"]);
</script>

<style scoped>
.room {
  /* strip of wall kept clear above the furniture, for the clock and the credits */
  --room-top: 96px;
  /* floor in front of the skirting line, deep enough for furniture to stand on */
  --floor-units: 110;
  /* how far the bookcase, the tallest piece of furniture, stands above the skirting line */
  --case-units: 345;
  --u: max(
    0.5px,
    min(100cqw / 366, (100cqh - var(--room-top)) / (var(--case-units) + var(--floor-units)))
  );
  /* a tall phone has height to spare: give it to the floor, not to bare wall */
  --floor-depth: clamp(
    calc(var(--floor-units) * var(--u)),
    calc(100cqh - var(--case-units) * var(--u) - 170px),
    calc(190 * var(--u))
  );

  position: relative;
  height: 100%;
  overflow: hidden;
  container-type: size;
}

.room__wall {
  position: absolute;
  inset: 0 0 var(--floor-depth);
  border-bottom: 7px solid var(--rl-wood);
  background:
    repeating-linear-gradient(90deg, rgba(255, 253, 249, 0.3) 0 2px, transparent 2px 30px),
    linear-gradient(180deg, #ece2d6, #e6d9ca);
}

.room__floor {
  position: absolute;
  inset: auto 0 0;
  height: var(--floor-depth);
  background:
    linear-gradient(180deg, rgba(63, 46, 36, 0.16), transparent 18px),
    repeating-linear-gradient(180deg, transparent 0 71px, rgba(107, 74, 52, 0.3) 71px 72px),
    repeating-linear-gradient(90deg, rgba(154, 122, 85, 0.14) 0 1px, transparent 1px 58px),
    #b49272;
}

/* zero-height box sitting on the skirting line; furniture is placed up (or down) from it */
.room__stage {
  position: absolute;
  bottom: var(--floor-depth);
  left: calc(50% - 183 * var(--u));
  width: calc(366 * var(--u));
  height: 0;
}

.room__stage > * {
  position: absolute;
}

/* The bookcase is the focal point: the largest and darkest piece, near the middle of the wall,
   standing in front of the window's edge. The chair and window are kept quieter. */
.room__bookcase {
  z-index: 2;
  bottom: calc(-5 * var(--u));
  left: calc(46 * var(--u));
  width: calc(200 * var(--u));
  height: calc(350 * var(--u));
}

.room__window {
  bottom: calc(84 * var(--u));
  left: calc(222 * var(--u));
  width: calc(138 * var(--u));
}

/* hangs above the bookcase */
.room__clock {
  bottom: calc(352 * var(--u));
  left: calc(120 * var(--u));
  width: calc(52 * var(--u));
}

/* in front of the corner of the bookcase and the foot of the window, as a chair in a room is */
.room__chair {
  z-index: 3;
  bottom: calc(-58 * var(--u));
  left: calc(212 * var(--u));
  width: calc(152 * var(--u));
}

.room__rug {
  bottom: calc(-66 * var(--u));
  left: calc(196 * var(--u));
  width: calc(168 * var(--u));
  height: calc(36 * var(--u));
  border-radius: 50%;
  border: calc(2 * var(--u)) solid #cfa596;
  background: #cdb89c;
  box-shadow: 0 0 0 calc(4 * var(--u)) #cdb89c;
  opacity: 0.6;
}

/* daylight falling through the window onto the floor */
.room__light {
  bottom: calc(-62 * var(--u));
  left: calc(120 * var(--u));
  width: calc(220 * var(--u));
  height: calc(62 * var(--u));
  background: linear-gradient(180deg, rgba(255, 246, 220, 0.55), rgba(255, 246, 220, 0));
  clip-path: polygon(52% 0, 100% 0, 58% 100%, 0 100%);
  opacity: 0;
  transition: opacity 1.200s ease;
}

.room--sunny:not(.room--dark) .room__light {
  opacity: 1;
}

/* the floor as a drop target; whatever stands here is in front of the chair and rug */
.room__ground {
  position: absolute;
  inset: auto 0 0;
  height: var(--floor-depth);
  pointer-events: none;
}

/* tints the whole room to match the weather outside */
.room__ambience {
  position: absolute;
  inset: 0;
  pointer-events: none;
  mix-blend-mode: multiply;
  transition: background-color 1.200s ease;
}

.room--cloudy .room__ambience {
  background-color: rgba(150, 160, 170, 0.12);
}

.room--rain .room__ambience {
  background-color: rgba(110, 130, 150, 0.22);
}

.room--dark .room__ambience {
  background-color: rgba(70, 76, 120, 0.4);
}
</style>
