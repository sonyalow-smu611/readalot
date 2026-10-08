<template>
  <div class="bay-window">
    <svg viewBox="0 0 164 262" role="img" :aria-label="`Window view: ${weather.label}`">
      <defs>
        <clipPath :id="`${uid}-glass`">
          <path d="M25 56Q82 16 139 56V231H25Z" />
        </clipPath>
      </defs>

      <!-- frame -->
      <path d="M16 50Q82 2 148 50V240H16Z" fill="#FFFDF9" stroke="#6B4A34" stroke-width="5" />

      <!-- the view outside -->
      <g :clip-path="`url(#${uid}-glass)`">
        <WindowScene :scene="weather.scene" :dark="weather.dark" transform="translate(22 14)" />
        <!-- sheen on the glass -->
        <path d="M25 150L92 16H112L25 190Z" fill="#FFFFFF" opacity="0.1" />
        <path d="M70 231L139 92V124L86 231Z" fill="#FFFFFF" opacity="0.07" />
      </g>
      <path d="M25 56Q82 16 139 56V231H25Z" fill="none" stroke="#3F2E24" stroke-opacity="0.25" stroke-width="2" />

      <!-- glazing bars -->
      <path d="M82 27V233M21 140H143" fill="none" stroke="#6B4A34" stroke-width="5" />

      <!-- sill -->
      <path d="M6 238H158L164 254H0Z" fill="#6B4A34" stroke="#3F2E24" stroke-width="1" />
      <path d="M8 240H156" stroke="#8A6548" stroke-width="2" />
    </svg>

    <p class="bay-window__chip" aria-hidden="true">{{ weather.label }}</p>
  </div>
</template>

<script setup>
import { useId } from "vue";
import WindowScene from "./WindowScene.vue";

defineProps({
  // { scene, dark, label } from services/roomWeather.js
  weather: { type: Object, required: true }
});

const uid = useId();
</script>

<style scoped>
.bay-window {
  position: relative;
}

.bay-window svg {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}

.bay-window__chip {
  position: absolute;
  top: 49%;
  left: 50%;
  margin: 0;
  padding: 3px 9px;
  transform: translateX(-50%);
  border: 1px solid var(--rl-line);
  border-radius: 999px;
  background: var(--rl-surface);
  font-size: max(10px, calc(9 * var(--u)));
  font-weight: 700;
  white-space: nowrap;
  color: var(--rl-primary);
}
</style>
