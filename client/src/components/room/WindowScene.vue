<!--
  Catalogue of what can be seen outside the room's window. One <g> per scene:
  sun, cloud, rain, night, golden. Drawn in a 120 x 220 box; the parent SVG clips it to the glass.
  Preview any of them with /?scene=rain (see MyRoomView).
-->
<template>
  <g class="ws">
    <defs>
      <linearGradient :id="`${uid}-sky`" x1="0" y1="0" x2="0" y2="1">
        <stop v-for="[offset, colour] in look.sky" :key="offset" :offset="offset" :stop-color="colour" />
      </linearGradient>
      <path
        :id="`${uid}-cloud`"
        d="M8 18a8 8 0 0 1 1-16 11 11 0 0 1 20-3 9 9 0 0 1 12 9 5.5 5.5 0 0 1-2 10z"
      />
    </defs>

    <rect width="120" height="220" :fill="`url(#${uid}-sky)`" />

    <!-- SUN: clear day -->
    <g v-if="scene === 'sun'">
      <circle cx="84" cy="52" r="27" fill="#FFF3C4" opacity="0.45" />
      <g class="ws-spin" style="transform-origin: 84px 52px">
        <line
          v-for="(ray, i) in rays"
          :key="i"
          v-bind="ray"
          stroke="#FFD866"
          stroke-width="2.2"
          stroke-linecap="round"
        />
      </g>
      <circle cx="84" cy="52" r="14" fill="#FFD866" />
      <g class="ws-drift">
        <use :href="`#${uid}-cloud`" x="8" y="92" fill="#FFFFFF" opacity="0.95" />
      </g>
      <g class="ws-drift ws-drift--slow">
        <use :href="`#${uid}-cloud`" transform="translate(66 118) scale(0.7)" fill="#FFFFFF" opacity="0.8" />
      </g>
    </g>

    <!-- CLOUD: overcast day -->
    <g v-else-if="scene === 'cloud'">
      <circle cx="82" cy="48" r="13" fill="#FFF6D8" opacity="0.7" />
      <g class="ws-drift ws-drift--slow">
        <use :href="`#${uid}-cloud`" transform="translate(48 28) scale(1.5)" fill="#F4F5F3" />
      </g>
      <g class="ws-drift">
        <use :href="`#${uid}-cloud`" transform="translate(-6 62) scale(1.3)" fill="#D9DEDF" />
        <use :href="`#${uid}-cloud`" x="70" y="98" fill="#F4F5F3" opacity="0.9" />
      </g>
      <g class="ws-drift ws-drift--slow">
        <use :href="`#${uid}-cloud`" transform="translate(14 118) scale(1.1)" fill="#C9D0D3" opacity="0.9" />
      </g>
    </g>

    <!-- GOLDEN: sunrise / sunset, sun sits behind the hills -->
    <g v-else-if="scene === 'golden'">
      <circle class="ws-pulse" cx="58" cy="164" r="50" fill="#FFD08A" opacity="0.35" />
      <circle cx="58" cy="164" r="25" fill="#FFE7AE" />
      <g class="ws-drift ws-drift--slow">
        <rect x="6" y="64" width="62" height="7" rx="3.5" fill="#C96F6A" opacity="0.75" />
        <rect x="26" y="74" width="40" height="5" rx="2.5" fill="#F7C59F" opacity="0.9" />
        <rect x="64" y="104" width="50" height="6" rx="3" fill="#B7607A" opacity="0.6" />
      </g>
      <g class="ws-drift" fill="none" stroke="#5E3F4F" stroke-width="1.5" stroke-linecap="round">
        <path d="M70 40q3-4 6 0q3-4 6 0" />
        <path d="M88 52q2.5-3 5 0q2.5-3 5 0" />
      </g>
    </g>

    <!-- NIGHT: moon and stars -->
    <g v-else-if="scene === 'night'">
      <circle
        v-for="(star, i) in stars"
        :key="i"
        class="ws-twinkle"
        :cx="star.cx"
        :cy="star.cy"
        :r="star.r"
        :style="{ animationDelay: star.delay }"
        fill="#FDF6DC"
      />
      <circle cx="84" cy="50" r="24" fill="#F4EBD0" opacity="0.1" />
      <circle cx="84" cy="50" r="13" fill="#F4EBD0" />
      <circle cx="90" cy="45" r="11.5" :fill="look.sky[0][1]" />
    </g>

    <!-- hills and houses, recoloured per scene -->
    <path d="M0 172Q30 150 62 166T120 158V220H0Z" :fill="look.hillFar" />
    <g :fill="look.tree">
      <ellipse cx="18" cy="158" rx="6" ry="11" />
      <ellipse cx="30" cy="162" rx="5" ry="8" />
      <ellipse cx="108" cy="152" rx="6" ry="10" />
    </g>
    <path d="M66 170v-13h18v13zM90 164v-10h14v10z" :fill="look.wall" />
    <path d="M63 158l12-9 12 9zM87.5 155l9.5-7 9.5 7z" :fill="look.roof" />
    <path d="M70 160h4v5h-4zM78 160h3v10h-3zM94 157h3.5v4h-3.5z" :fill="look.window" />
    <path d="M0 190Q40 172 78 186T120 180V220H0Z" :fill="look.hillNear" />

    <!-- RAIN: drawn last so it falls in front of the view -->
    <g v-if="scene === 'rain'">
      <g class="ws-drift ws-drift--slow">
        <use :href="`#${uid}-cloud`" transform="translate(-10 14) scale(1.7)" :fill="look.cloud[0]" />
        <use :href="`#${uid}-cloud`" transform="translate(52 34) scale(1.5)" :fill="look.cloud[1]" />
      </g>
      <line
        v-for="(drop, i) in drops"
        :key="i"
        class="ws-drop"
        :x1="drop.x1"
        y1="-18"
        :x2="drop.x1 - 3"
        y2="-6"
        :style="{ animationDelay: drop.delay, animationDuration: drop.duration }"
        stroke="#EEF4F7"
        stroke-width="1.4"
        stroke-linecap="round"
        opacity="0.8"
      />
      <!-- beads of water on the glass -->
      <g fill="#FFFFFF" opacity="0.4">
        <ellipse cx="22" cy="96" rx="1.8" ry="2.6" />
        <ellipse cx="96" cy="76" rx="1.5" ry="2.2" />
        <ellipse cx="42" cy="148" rx="1.6" ry="2.4" />
        <ellipse cx="78" cy="128" rx="1.3" ry="2" />
      </g>
    </g>
  </g>
</template>

<script setup>
import { computed, useId } from "vue";

const props = defineProps({
  scene: { type: String, default: "sun" },
  // night-time variant of the rain scene
  dark: Boolean
});

// several scenes can share a page (e.g. a catalogue), so gradient ids must be unique
const uid = useId();

const LOOKS = {
  sun: {
    sky: [[0, "#8CC4E8"], [1, "#E3F3F1"]],
    hillFar: "#A9CC98",
    hillNear: "#7FAE74",
    tree: "#5E8F5A",
    wall: "#F7EDE0",
    roof: "#B7705A",
    window: "#8FB4C9"
  },
  cloud: {
    sky: [[0, "#AEBBC6"], [1, "#E2E6E4"]],
    hillFar: "#9FB59B",
    hillNear: "#7F9A7D",
    tree: "#6A8A69",
    wall: "#E6E1D8",
    roof: "#9C6B5C",
    window: "#9AA9B3"
  },
  rain: {
    sky: [[0, "#7B8A98"], [1, "#B9C3C8"]],
    hillFar: "#7E968A",
    hillNear: "#62796E",
    tree: "#55705F",
    wall: "#C9CCC7",
    roof: "#7C5C55",
    window: "#F1D58A",
    cloud: ["#8794A0", "#A3AEB6"]
  },
  rainDark: {
    sky: [[0, "#2B3445"], [1, "#4B5768"]],
    hillFar: "#2A3A3F",
    hillNear: "#1F2C31",
    tree: "#20302F",
    wall: "#3A4654",
    roof: "#2A323E",
    window: "#F6D27A",
    cloud: ["#3B4658", "#566273"]
  },
  night: {
    sky: [[0, "#10172E"], [1, "#2B3862"]],
    hillFar: "#1C2747",
    hillNear: "#131B34",
    tree: "#152038",
    wall: "#26335A",
    roof: "#1A2444",
    window: "#F6D27A"
  },
  golden: {
    sky: [[0, "#6F6396"], [0.55, "#EE8E62"], [1, "#FAD08A"]],
    hillFar: "#9A5F5C",
    hillNear: "#6A4352",
    tree: "#55334A",
    wall: "#7A4A55",
    roof: "#5A3646",
    window: "#FFE2A0"
  }
};

const look = computed(() => {
  if (props.scene === "rain" && props.dark) return LOOKS.rainDark;
  return LOOKS[props.scene] || LOOKS.sun;
});

const rays = Array.from({ length: 12 }, (_, i) => {
  const angle = (i * Math.PI) / 6;
  return {
    x1: 84 + Math.cos(angle) * 19,
    y1: 52 + Math.sin(angle) * 19,
    x2: 84 + Math.cos(angle) * 25,
    y2: 52 + Math.sin(angle) * 25
  };
});

const stars = Array.from({ length: 18 }, (_, i) => ({
  cx: 6 + ((i * 47) % 108),
  cy: 8 + ((i * 29) % 130),
  r: 0.6 + (i % 3) * 0.35,
  delay: `${-(i % 7) * 0.6}s`
}));

const drops = Array.from({ length: 46 }, (_, i) => ({
  x1: 4 + ((i * 37) % 176),
  delay: `${-((i * 0.137) % 1)}s`,
  duration: `${0.7 + (i % 5) * 0.08}s`
}));
</script>

<style scoped>
.ws-spin {
  animation: ws-spin 40s linear infinite;
}

.ws-drift {
  animation: ws-drift 16s ease-in-out infinite alternate;
}

.ws-drift--slow {
  animation-duration: 26s;
  animation-direction: alternate-reverse;
}

.ws-pulse {
  animation: ws-pulse 6s ease-in-out infinite alternate;
}

.ws-twinkle {
  animation: ws-twinkle 4.2s ease-in-out infinite;
}

.ws-drop {
  animation: ws-fall 0.8s linear infinite;
}

@keyframes ws-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes ws-drift {
  from {
    transform: translateX(-9px);
  }
  to {
    transform: translateX(9px);
  }
}

@keyframes ws-pulse {
  to {
    opacity: 0.55;
  }
}

@keyframes ws-twinkle {
  50% {
    opacity: 0.25;
  }
}

@keyframes ws-fall {
  to {
    transform: translate(-60px, 250px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ws-spin,
  .ws-drift,
  .ws-pulse,
  .ws-twinkle {
    animation: none;
  }

  /* keep rain readable as rain: frozen streaks spread down the pane */
  .ws-drop {
    animation-play-state: paused;
  }
}
</style>
