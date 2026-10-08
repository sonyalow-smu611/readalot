<template>
  <span class="spine" :class="[`spine--${size}`, `spine--band${look.band}`]" :style="style">
    <template v-if="size === 'full'">
      <span class="spine__title">{{ title }}</span>
    </template>
  </span>
</template>

<script setup>
import { computed } from "vue";
import { spineLook } from "../../services/shelves.js";

const props = defineProps({
  book: { type: Object, required: true },
  // "mini" for the room bookcase (no text), "full" for the expanded shelf (title readable)
  size: { type: String, default: "mini" }
});

const look = computed(() => spineLook(props.book));
// two lines fit down a spine; anything longer is cut so a third line never shows half-clipped
const title = computed(() => {
  const text = props.book.title || "Untitled";
  return text.length > 36 ? `${text.slice(0, 34).trimEnd()}…` : text;
});
const style = computed(() => ({
  "--spine": look.value.colour,
  "--ink": look.value.ink,
  "--t": look.value.thickness,
  "--h": look.value.height
}));
</script>

<style scoped>
.spine {
  position: relative;
  display: block;
  flex: none;
  /* soft shading across the spine so it reads as a rounded book back */
  background:
    linear-gradient(
      90deg,
      rgba(0, 0, 0, 0.2),
      rgba(0, 0, 0, 0) 20%,
      rgba(255, 255, 255, 0.14) 46%,
      rgba(0, 0, 0, 0) 72%,
      rgba(0, 0, 0, 0.24)
    ),
    var(--spine);
  color: var(--ink);
  transform-origin: 50% 100%;
}

.spine::before,
.spine::after {
  content: "";
  position: absolute;
  inset-inline: 0;
  background: var(--ink);
  opacity: 0.55;
}

.spine--mini {
  flex: 0 1 auto;
  width: calc((13 + 6 * var(--t)) * var(--u));
  height: calc((52 + 16 * var(--h)) * var(--u));
  border-radius: calc(1.5 * var(--u));
}

.spine--mini::before {
  top: 14%;
  height: max(1px, calc(1.2 * var(--u)));
}

.spine--mini::after {
  bottom: 12%;
  height: max(1px, calc(1.2 * var(--u)));
}

.spine--mini.spine--band1::before {
  height: calc(5 * var(--u));
}

.spine--mini.spine--band2::after {
  bottom: 40%;
  height: calc(7 * var(--u));
  opacity: 0.3;
}

.spine--full {
  display: flex;
  align-items: center;
  justify-content: center;
  width: calc(38px + 14px * var(--t));
  height: calc(158px + 30px * var(--h));
  padding: 16px 0;
  overflow: hidden;
  border-radius: 3px;
  box-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.12);
  writing-mode: vertical-rl;
  user-select: none;
}

.spine--full::before {
  top: 7px;
  height: 2px;
}

.spine--full::after {
  bottom: 7px;
  height: 2px;
}

.spine--full.spine--band1::before {
  height: 5px;
}

/* wraps onto a second line down the spine, so most titles show in full */
.spine__title {
  max-height: 100%;
  font-family: var(--rl-font-title);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.15;
  text-align: center;
}
</style>
