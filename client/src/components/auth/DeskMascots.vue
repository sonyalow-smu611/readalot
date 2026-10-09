<script setup>
// Cats and books clustered like a crowd. Eyes follow the pointer.
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { gsap, prefersReducedMotion } from '@/lib/motion'
import { bookSpots } from '@/lib/floatBooks'
import FloatingBooks from '@/components/auth/FloatingBooks.vue'

const props = defineProps({
  gaze: { type: String, default: 'idle' },
  pageNudge: { type: Number, default: 0 },
  spines: { type: Array, default: () => [] },
  hop: { type: Number, default: 0 },
})

const SPINE_COLORS = ['#6b4a34', '#9a7a55', '#3f2e24', '#c49264', '#2c241e']
const leftBooks = bookSpots([
  [10, 7], [38, 11], [66, 6], [88, 14],
  [18, 22], [50, 20], [78, 28],
  [90, 44], [86, 60],
  [12, 84], [38, 90], [64, 86], [90, 91],
])
const root = ref(null)

function spineColor(index) {
  return SPINE_COLORS[index % SPINE_COLORS.length]
}

function moveEyes(event) {
  if (prefersReducedMotion() || !root.value) return
  const spot = root.value.querySelector('.spot')
  if (spot) {
    const panel = root.value.getBoundingClientRect()
    const inside = event.clientX >= panel.left && event.clientX <= panel.right
      && event.clientY >= panel.top && event.clientY <= panel.bottom
    gsap.to(spot, {
      x: Math.min(Math.max(event.clientX - panel.left, 0), panel.width),
      y: Math.min(Math.max(event.clientY - panel.top, 0), panel.height),
      opacity: inside ? 1 : 0,
      duration: 0.35,
      overwrite: 'auto',
      force3D: false,
    })
  }
  root.value.querySelectorAll('.eye').forEach((eye) => {
    const pupil = eye.querySelector('.pupil')
    if (!pupil) return
    const box = eye.getBoundingClientRect()
    const dx = event.clientX - (box.left + box.width / 2)
    const dy = event.clientY - (box.top + box.height / 2)
    const angle = Math.atan2(dy, dx)
    const dist = Math.min(3.4, Math.hypot(dx, dy) / 14)
    gsap.to(pupil, {
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      duration: 0.2,
      overwrite: 'auto',
      force3D: false,
    })
  })
}

onMounted(() => {
  window.addEventListener('pointermove', moveEyes)
})

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', moveEyes)
})

watch(() => props.pageNudge, (nudge) => {
  const pages = root.value?.querySelector('.pages')
  if (!pages) return
  gsap.to(pages, {
    x: Math.min(7, Math.max(0, nudge)),
    duration: prefersReducedMotion() ? 0 : 0.2,
    overwrite: 'auto',
    force3D: false,
  })
})

watch(() => props.hop, (tick) => {
  if (!tick || prefersReducedMotion() || !root.value) return
  const actors = root.value.querySelectorAll('.actor')
  gsap.fromTo(
    actors,
    { y: 0 },
    {
      y: -12,
      duration: 0.18,
      yoyo: true,
      repeat: 1,
      force3D: false,
      onComplete: () => gsap.set(actors, { clearProps: 'transform' }),
    },
  )
})
</script>

<template>
  <div ref="root" class="mascots" :data-gaze="gaze" aria-hidden="true">
    <div class="sky">
      <span class="glow" />
      <span class="spot" />
      <FloatingBooks class="bits" :books="leftBooks" />
    </div>
    <svg viewBox="0 0 240 450" preserveAspectRatio="xMidYMid meet">
      <!-- Cream cat, sitting behind on the left -->
      <g class="actor actor--bob">
        <path d="M16 250 C 2 210, 8 160, 30 150" fill="none" stroke="#f4efe6" stroke-width="12" stroke-linecap="round" />
        <ellipse cx="58" cy="268" rx="50" ry="118" fill="#f4efe6" />
        <ellipse cx="58" cy="128" rx="46" ry="42" fill="#f4efe6" />
        <path d="M20 112 L 32 36 L 58 100 Z" fill="#f4efe6" />
        <path d="M28 104 L 36 52 L 50 96 Z" fill="#f3c3b4" />
        <path d="M96 112 L 84 36 L 58 100 Z" fill="#f4efe6" />
        <path d="M88 104 L 80 52 L 66 96 Z" fill="#f3c3b4" />
        <ellipse cx="58" cy="300" rx="22" ry="42" fill="#fffdf9" />
        <ellipse cx="58" cy="148" rx="18" ry="13" fill="#fffdf9" />
        <ellipse cx="40" cy="378" rx="14" ry="22" fill="#fffdf9" />
        <ellipse cx="78" cy="378" rx="14" ry="22" fill="#fffdf9" />
        <g class="eye" transform="translate(40 118)">
          <ellipse rx="10" ry="9" fill="#fffdf9" />
          <ellipse class="pupil" rx="2.2" ry="5.6" fill="#2c241e" />
        </g>
        <g class="eye" transform="translate(76 118)">
          <ellipse rx="10" ry="9" fill="#fffdf9" />
          <ellipse class="pupil" rx="2.2" ry="5.6" fill="#2c241e" />
        </g>
        <path d="M54 140 L 58 147 L 62 140 Z" fill="#e7a090" />
        <path d="M58 147 V154 M58 154 Q 50 160 42 152 M58 154 Q 66 160 74 152" fill="none" stroke="#3f2e24" stroke-width="1.5" stroke-linecap="round" />
        <path d="M36 142 H 10 M38 152 H 8 M80 142 H 106 M78 152 H 108" fill="none" stroke="#3f2e24" stroke-width="1.3" stroke-linecap="round" />
        <g class="paw">
          <ellipse cx="58" cy="118" rx="40" ry="16" fill="#fffdf9" />
          <circle cx="32" cy="108" r="4.5" fill="#f3c3b4" />
          <circle cx="45" cy="104" r="4.5" fill="#f3c3b4" />
          <circle cx="58" cy="103" r="4.5" fill="#f3c3b4" />
          <circle cx="71" cy="104" r="4.5" fill="#f3c3b4" />
          <circle cx="84" cy="108" r="4.5" fill="#f3c3b4" />
        </g>
      </g>

      <!-- Grey cat, sitting in the middle -->
      <g class="actor actor--bob actor--slow">
        <path d="M150 300 C 168 270, 166 220, 142 208" fill="none" stroke="#6a5e56" stroke-width="11" stroke-linecap="round" />
        <ellipse cx="96" cy="300" rx="40" ry="100" fill="#7e7065" />
        <ellipse cx="96" cy="188" rx="36" ry="32" fill="#7e7065" />
        <path d="M66 172 L 76 118 L 96 164 Z" fill="#6a5e56" />
        <path d="M72 164 L 78 130 L 90 160 Z" fill="#f3c3b4" />
        <path d="M126 172 L 116 118 L 96 164 Z" fill="#6a5e56" />
        <path d="M120 164 L 114 130 L 102 160 Z" fill="#f3c3b4" />
        <ellipse cx="96" cy="208" rx="14" ry="10" fill="#efe8e2" />
        <ellipse cx="80" cy="390" rx="12" ry="18" fill="#6a5e56" />
        <ellipse cx="112" cy="390" rx="12" ry="18" fill="#6a5e56" />
        <g class="eye" transform="translate(82 180)">
          <ellipse rx="8" ry="7.5" fill="#fffdf9" />
          <ellipse class="pupil" rx="1.8" ry="4.8" fill="#2c241e" />
        </g>
        <g class="eye" transform="translate(110 180)">
          <ellipse rx="8" ry="7.5" fill="#fffdf9" />
          <ellipse class="pupil" rx="1.8" ry="4.8" fill="#2c241e" />
        </g>
        <path d="M92 198 L 96 204 L 100 198 Z" fill="#e7a090" />
        <path d="M96 204 V209 M96 209 Q 90 215 84 208 M96 209 Q 102 215 108 208" fill="none" stroke="#2c241e" stroke-width="1.3" stroke-linecap="round" />
        <path d="M78 200 H 58 M80 208 H 56 M114 200 H 134 M112 208 H 136" fill="none" stroke="#fffdf9" stroke-width="1.2" stroke-linecap="round" />
        <g class="paw">
          <ellipse cx="96" cy="180" rx="32" ry="14" fill="#8a7d72" />
          <circle cx="74" cy="170" r="4" fill="#f3c3b4" />
          <circle cx="85" cy="166" r="4" fill="#f3c3b4" />
          <circle cx="96" cy="165" r="4" fill="#f3c3b4" />
          <circle cx="107" cy="166" r="4" fill="#f3c3b4" />
          <circle cx="118" cy="170" r="4" fill="#f3c3b4" />
        </g>
      </g>

      <!-- Dark book, front cover -->
      <g class="actor actor--bob actor--late">
        <rect x="112" y="148" width="116" height="262" rx="7" fill="#3f2e24" />
        <rect x="120" y="158" width="100" height="242" rx="4" fill="#4a382c" />
        <rect x="132" y="170" width="76" height="18" rx="2" fill="#c49264" />
        <rect x="144" y="196" width="52" height="3" rx="1" fill="#efe4d4" />
        <rect x="154" y="204" width="32" height="3" rx="1" fill="#efe4d4" />
        <rect x="132" y="208" width="76" height="28" rx="3" fill="#6b4a34" />
        <circle cx="170" cy="222" r="8" fill="#e7d3bc" />
        <g class="eye" transform="translate(152 248)">
          <ellipse rx="8" ry="7" fill="#fffdf9" />
          <ellipse class="pupil" rx="1.8" ry="4.4" fill="#2c241e" />
        </g>
        <g class="eye" transform="translate(188 248)">
          <ellipse rx="8" ry="7" fill="#fffdf9" />
          <ellipse class="pupil" rx="1.8" ry="4.4" fill="#2c241e" />
        </g>
        <path d="M162 266 H 178" stroke="#f3efe6" stroke-width="2" stroke-linecap="round" />
        <g class="lid">
          <rect x="126" y="230" width="88" height="34" rx="6" fill="#3f2e24" />
        </g>
      </g>

      <!-- Orange and white cat, sitting in front -->
      <g class="actor actor--orange actor--bob actor--fast">
        <path d="M12 340 C -2 310, 2 270, 22 262" fill="none" stroke="#e38b3a" stroke-width="11" stroke-linecap="round" />
        <ellipse cx="52" cy="340" rx="44" ry="72" fill="#e38b3a" />
        <ellipse cx="52" cy="268" rx="36" ry="32" fill="#e38b3a" />
        <path d="M22 252 L 32 198 L 50 244 Z" fill="#e07a2f" />
        <path d="M28 244 L 36 212 L 44 240 Z" fill="#f6c7b8" />
        <path d="M82 252 L 72 198 L 54 244 Z" fill="#e07a2f" />
        <path d="M76 244 L 68 212 L 60 240 Z" fill="#f6c7b8" />
        <path d="M40 246 H 64" stroke="#c45a1a" stroke-width="3" stroke-linecap="round" />
        <ellipse cx="52" cy="355" rx="20" ry="32" fill="#fffdf9" />
        <ellipse cx="52" cy="286" rx="16" ry="12" fill="#fffdf9" />
        <ellipse cx="36" cy="400" rx="13" ry="16" fill="#fffdf9" />
        <ellipse cx="70" cy="400" rx="13" ry="16" fill="#fffdf9" />
        <g class="eye" transform="translate(38 260)">
          <ellipse rx="8" ry="7.5" fill="#fffdf9" />
          <ellipse class="pupil" rx="1.8" ry="4.6" fill="#1f4d28" />
        </g>
        <g class="eye" transform="translate(66 260)">
          <ellipse rx="8" ry="7.5" fill="#fffdf9" />
          <ellipse class="pupil" rx="1.8" ry="4.6" fill="#1f4d28" />
        </g>
        <path d="M48 278 L 52 284 L 56 278 Z" fill="#e7a090" />
        <path d="M52 284 V290 M52 290 Q 46 296 40 288 M52 290 Q 58 296 64 288" fill="none" stroke="#c45a1a" stroke-width="1.4" stroke-linecap="round" />
        <path d="M34 280 H 12 M36 288 H 10 M70 280 H 92 M68 288 H 94" fill="none" stroke="#3f2e24" stroke-width="1.2" stroke-linecap="round" />
        <g class="paw">
          <ellipse cx="52" cy="260" rx="34" ry="14" fill="#fffdf9" />
          <circle cx="30" cy="250" r="4" fill="#f3c3b4" />
          <circle cx="41" cy="246" r="4" fill="#f3c3b4" />
          <circle cx="52" cy="245" r="4" fill="#f3c3b4" />
          <circle cx="63" cy="246" r="4" fill="#f3c3b4" />
          <circle cx="74" cy="250" r="4" fill="#f3c3b4" />
        </g>
      </g>

      <!-- Pale book, front cover in front -->
      <g class="actor actor--book actor--bob">
        <rect x="118" y="292" width="108" height="128" rx="7" fill="#f7f1e8" stroke="#cdbfaf" stroke-width="2" />
        <rect x="128" y="302" width="88" height="108" rx="3" fill="#fffdf9" />
        <rect x="138" y="310" width="68" height="14" rx="2" fill="#9a7a55" />
        <rect x="148" y="330" width="48" height="3" rx="1" fill="#cdbfaf" />
        <rect x="138" y="340" width="68" height="28" rx="3" fill="#e7d3bc" />
        <g class="eye" transform="translate(158 382)">
          <ellipse rx="7" ry="6.5" fill="#fffdf9" />
          <ellipse class="pupil" rx="1.6" ry="4" fill="#2c241e" />
        </g>
        <g class="eye" transform="translate(188 382)">
          <ellipse rx="7" ry="6.5" fill="#fffdf9" />
          <ellipse class="pupil" rx="1.6" ry="4" fill="#2c241e" />
        </g>
        <path d="M166 396 H 180" stroke="#6b4a34" stroke-width="2" stroke-linecap="round" />
        <polygon class="pages" points="200,400 218,400 218,416" fill="#efe4d4" />
        <path d="M200 400 L 218 416" fill="none" stroke="#cdbfaf" stroke-width="1.4" />
        <g class="lid">
          <rect x="132" y="364" width="80" height="32" rx="6" fill="#efe4d4" />
        </g>
      </g>

      <g>
        <g v-for="(genre, index) in spines" :key="genre" class="mini-cover" :transform="`translate(${8 + (index % 6) * 20} ${index < 6 ? 418 : 400})`">
          <rect width="18" height="24" rx="1.5" :fill="spineColor(index)" />
          <rect x="2" y="2" width="14" height="5" rx="0.6" fill="#fffdf9" />
          <rect x="3" y="9" width="12" height="7" rx="0.6" fill="#fffdf9" opacity="0.45" />
          <circle cx="6" cy="19" r="1.1" fill="#fffdf9" />
          <circle cx="12" cy="19" r="1.1" fill="#fffdf9" />
        </g>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.mascots {
  position: relative;
  z-index: 2;
  flex: 0 0 50%;
  max-width: none;
  min-width: 0;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: linear-gradient(180deg, #e7dccb 0%, #d5c4ae 100%);
}

.sky {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.bits {
  z-index: 0;
}

.glow {
  position: absolute;
  left: 8%;
  top: 12%;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 253, 249, 0.75), transparent 68%);
  animation: pulse 6s ease-in-out infinite;
}

.spot {
  position: absolute;
  top: 0;
  left: 0;
  width: 110px;
  height: 110px;
  margin: -55px 0 0 -55px;
  border-radius: 50%;
  opacity: 0;
  pointer-events: none;
  background: radial-gradient(circle, rgba(255, 253, 249, 0.95), rgba(243, 195, 180, 0.28) 42%, transparent 70%);
}

.mascots svg {
  position: relative;
  z-index: 2;
  display: block;
  width: 92%;
  height: 76%;
  pointer-events: none;
}

@media (max-width: 767px) {
  .mascots {
    flex: 0 0 38%;
    max-height: 300px;
    align-items: flex-end;
  }

  .mascots svg {
    width: 100%;
    height: 100%;
    max-width: none;
  }
}

@media (min-width: 768px) {
  .mascots svg {
    width: min(520px, 86%);
    height: min(680px, 84%);
  }
}

.actor {
  pointer-events: auto;
  transform-box: fill-box;
  transform-origin: center bottom;
  cursor: pointer;
}

.actor--bob { animation: bob 4.8s ease-in-out infinite; }
.actor--late { animation-duration: 5.6s; animation-delay: -1.4s; }
.actor--slow { animation-duration: 6.2s; animation-delay: -2.2s; }
.actor--fast { animation-duration: 4.2s; animation-delay: -0.6s; }

.actor:hover {
  animation: none;
  transform: translateY(-12px) scale(1.05);
}

.paw,
.lid {
  opacity: 0;
  transition: opacity 0.25s ease;
}

.mascots[data-gaze='cover'] .paw,
.mascots[data-gaze='cover'] .lid,
.mascots[data-gaze='peek'] .paw,
.mascots[data-gaze='peek'] .lid {
  opacity: 1;
}

.mascots[data-gaze='peek'] .actor--orange .paw,
.mascots[data-gaze='peek'] .actor--book .lid {
  opacity: 0;
}

.mascots[data-gaze='duck'] .actor {
  animation: none;
  transform: translateY(10px);
}

.mini-cover {
  transform-box: fill-box;
  transform-origin: center bottom;
  animation: spine-in 0.35s ease;
}

@media (prefers-reduced-motion: reduce) {
  .glow,
  .actor,
  .paw,
  .lid,
  .mini-cover {
    animation: none;
    transition: none;
  }

  .actor:hover,
  .mascots[data-gaze='duck'] .actor {
    transform: none;
  }
}

@keyframes bob {
  50% { transform: translateY(-8px); }
}

@keyframes pulse {
  50% { transform: scale(1.18); opacity: 0.72; }
}

@keyframes spine-in {
  from { opacity: 0; transform: translateY(8px); }
}
</style>
