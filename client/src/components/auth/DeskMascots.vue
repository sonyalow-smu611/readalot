<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// Cats and books clustered like a crowd, drawn in the same smooth style as the readers'
// characters (dark outlines, soft shading, big shiny eyes). Their eyes follow the pointer, or
// the field being typed in. They cover their eyes when the password shows, duck on an error and
// hop when a code is accepted.
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

const INK = '#3b2a35'
// genre covers along the bottom, in town colours
const SPINE_COLORS = ['#c0392f', '#2f5fb3', '#e3b04b', '#5aa045', '#a84874', '#6b4a34']
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

// Eyes slide a little towards a point on the screen.
function lookAt(clientX, clientY) {
  if (!root.value) return
  root.value.querySelectorAll('.eye').forEach((eye) => {
    const pupil = eye.querySelector('.pupil')
    const box = eye.getBoundingClientRect()
    const dx = clientX - (box.left + box.width / 2)
    const dy = clientY - (box.top + box.height / 2)
    const angle = Math.atan2(dy, dx)
    const dist = Math.min(4, Math.hypot(dx, dy) / 30)
    const to = { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist * 0.8 }
    if (prefersReducedMotion()) gsap.set(pupil, to)
    else gsap.to(pupil, { ...to, duration: 0.2, overwrite: 'auto' })
  })
}

function onPointer(event) {
  lookAt(event.clientX, event.clientY)
}

// While a field is being filled in, everyone watches it.
function lookAtField() {
  if (props.gaze !== 'field') return
  const field = document.activeElement
  if (!field || field === document.body) return
  const box = field.getBoundingClientRect()
  lookAt(box.left + box.width / 2, box.top + box.height / 2)
}

onMounted(() => {
  window.addEventListener('pointermove', onPointer)
  document.addEventListener('focusin', lookAtField)
})

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onPointer)
  document.removeEventListener('focusin', lookAtField)
})

watch(() => props.gaze, lookAtField)

watch(() => props.pageNudge, (nudge) => {
  const pages = root.value?.querySelector('.pages')
  if (!pages) return
  gsap.to(pages, {
    x: Math.min(8, Math.max(0, nudge)),
    duration: prefersReducedMotion() ? 0 : 0.2,
    overwrite: 'auto',
  })
})

watch(() => props.hop, (tick) => {
  if (!tick || prefersReducedMotion() || !root.value) return
  const all = root.value.querySelectorAll('.actor')
  gsap.fromTo(
    all,
    { y: 0 },
    { y: -14, duration: 0.18, yoyo: true, repeat: 1, onComplete: () => gsap.set(all, { clearProps: 'transform' }) },
  )
})
</script>

<template>
  <div ref="root" class="mascots" :data-gaze="gaze" aria-hidden="true">
    <FloatingBooks class="bits" :books="leftBooks" />
    <svg viewBox="0 0 300 420" preserveAspectRatio="xMidYMax meet">
      <defs>
        <!-- the shiny eye every character has -->
        <g id="mascot-eye">
          <ellipse rx="8" ry="11" fill="#2b2230" />
          <circle cx="2.8" cy="-4.5" r="3.2" fill="#ffffff" />
          <circle cx="-2.6" cy="4.5" r="1.5" fill="#ffffff" />
        </g>
      </defs>
      <ellipse cx="150" cy="410" rx="140" ry="10" fill="rgba(30,26,36,0.22)" />

      <g :stroke="INK" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">
        <!-- Cream cat, sitting behind on the left -->
        <g class="actor actor--bob">
          <path d="M34,330 C4,300 10,250 40,236" fill="none" stroke-width="16" />
          <path d="M34,330 C4,300 10,250 40,236" fill="none" stroke="#f6efe4" stroke-width="9" />
          <ellipse cx="88" cy="290" rx="58" ry="92" fill="#f6efe4" />
          <ellipse cx="96" cy="300" rx="30" ry="62" fill="#fffdf9" stroke="none" />
          <path d="M40,126 L46,72 L80,108 Z M136,126 L130,72 L96,108 Z" fill="#f6efe4" />
          <path d="M48,116 L51,86 L70,106 Z M128,116 L125,86 L106,106 Z" fill="#f3c3b4" stroke="none" />
          <ellipse cx="88" cy="150" rx="60" ry="52" fill="#f6efe4" />
          <ellipse cx="108" cy="168" rx="40" ry="30" fill="#e9dfd1" opacity="0.6" stroke="none" />
          <ellipse cx="66" cy="182" rx="10" ry="6" fill="#f2a0b8" opacity="0.7" stroke="none" />
          <ellipse cx="110" cy="182" rx="10" ry="6" fill="#f2a0b8" opacity="0.7" stroke="none" />
          <g class="eye" transform="translate(68 158)"><g class="pupil"><use href="#mascot-eye" stroke="none" /></g></g>
          <g class="eye" transform="translate(108 158)"><g class="pupil"><use href="#mascot-eye" stroke="none" /></g></g>
          <path d="M84,174 Q88,179 92,174 Z" fill="#e7a090" stroke-width="2.5" />
          <path d="M80,184 Q84,190 88,184 Q92,190 96,184" fill="none" stroke-width="3" />
          <path d="M40,176 L16,170 M42,186 L16,190 M136,176 L160,170 M134,186 L160,190" stroke-width="2.5" />
          <ellipse cx="66" cy="378" rx="18" ry="12" fill="#fffdf9" />
          <ellipse cx="110" cy="378" rx="18" ry="12" fill="#fffdf9" />
          <g class="paw">
            <ellipse cx="66" cy="160" rx="24" ry="20" fill="#fffdf9" />
            <ellipse cx="110" cy="160" rx="24" ry="20" fill="#fffdf9" />
            <g fill="#f3c3b4" stroke="none">
              <circle cx="56" cy="150" r="4.5" /><circle cx="66" cy="146" r="4.5" /><circle cx="76" cy="150" r="4.5" />
              <circle cx="100" cy="150" r="4.5" /><circle cx="110" cy="146" r="4.5" /><circle cx="120" cy="150" r="4.5" />
            </g>
          </g>
        </g>

        <!-- Grey cat, sitting in the middle -->
        <g class="actor actor--bob actor--slow">
          <path d="M196,360 C226,340 226,290 200,276" fill="none" stroke-width="14" />
          <path d="M196,360 C226,340 226,290 200,276" fill="none" stroke="#8a7d72" stroke-width="7" />
          <ellipse cx="150" cy="326" rx="48" ry="76" fill="#9a8f88" />
          <ellipse cx="156" cy="336" rx="24" ry="50" fill="#b8aea6" stroke="none" />
          <path d="M108,190 L112,146 L140,174 Z M192,190 L188,146 L160,174 Z" fill="#8a7d72" />
          <path d="M115,182 L117,158 L132,174 Z M185,182 L183,158 L168,174 Z" fill="#f3c3b4" stroke="none" />
          <ellipse cx="150" cy="214" rx="50" ry="44" fill="#9a8f88" />
          <path d="M140,176 L142,190 M150,174 L150,190 M160,176 L158,190" stroke="#7a6e66" stroke-width="3.5" />
          <ellipse cx="164" cy="230" rx="32" ry="24" fill="#8a7d72" opacity="0.45" stroke="none" />
          <ellipse cx="130" cy="240" rx="8" ry="5" fill="#f2a0b8" opacity="0.7" stroke="none" />
          <ellipse cx="170" cy="240" rx="8" ry="5" fill="#f2a0b8" opacity="0.7" stroke="none" />
          <g class="eye" transform="translate(133 220)"><g class="pupil"><use href="#mascot-eye" stroke="none" transform="scale(0.85)" /></g></g>
          <g class="eye" transform="translate(167 220)"><g class="pupil"><use href="#mascot-eye" stroke="none" transform="scale(0.85)" /></g></g>
          <path d="M146,234 Q150,239 154,234 Z" fill="#e7a090" stroke-width="2.5" />
          <path d="M143,243 Q147,248 150,243 Q153,248 157,243" fill="none" stroke-width="2.5" />
          <ellipse cx="132" cy="398" rx="14" ry="9" fill="#8a7d72" />
          <ellipse cx="168" cy="398" rx="14" ry="9" fill="#8a7d72" />
          <g class="paw">
            <ellipse cx="133" cy="222" rx="19" ry="16" fill="#b8aea6" />
            <ellipse cx="167" cy="222" rx="19" ry="16" fill="#b8aea6" />
            <g fill="#f3c3b4" stroke="none">
              <circle cx="125" cy="214" r="3.5" /><circle cx="133" cy="211" r="3.5" /><circle cx="141" cy="214" r="3.5" />
              <circle cx="159" cy="214" r="3.5" /><circle cx="167" cy="211" r="3.5" /><circle cx="175" cy="214" r="3.5" />
            </g>
          </g>
        </g>

        <!-- Blue book, standing behind -->
        <g class="actor actor--bob actor--late">
          <rect x="196" y="120" width="92" height="270" rx="14" fill="#2f5fb3" />
          <rect x="196" y="120" width="16" height="270" rx="8" fill="#244a8c" stroke="none" />
          <rect x="222" y="140" width="52" height="18" rx="6" fill="#f6e27a" />
          <path d="M228,172 L268,172 M234,182 L262,182" stroke="#cfe3ec" stroke-width="3" />
          <ellipse cx="236" cy="248" rx="7" ry="4.5" fill="#f2a0b8" opacity="0.7" stroke="none" />
          <ellipse cx="272" cy="248" rx="7" ry="4.5" fill="#f2a0b8" opacity="0.7" stroke="none" />
          <g class="eye" transform="translate(238 230)"><g class="pupil"><use href="#mascot-eye" stroke="none" transform="scale(0.8)" /></g></g>
          <g class="eye" transform="translate(270 230)"><g class="pupil"><use href="#mascot-eye" stroke="none" transform="scale(0.8)" /></g></g>
          <path d="M248,252 Q254,258 260,252" fill="none" stroke="#fdf7ec" stroke-width="3" />
          <g class="lid">
            <rect x="220" y="214" width="66" height="30" rx="10" fill="#2f5fb3" />
            <path d="M228,228 L278,228" stroke="#f6e27a" stroke-width="3" />
          </g>
        </g>

        <!-- Orange cat, sitting in front -->
        <g class="actor actor--bob actor--fast">
          <path d="M40,380 C8,368 8,326 30,312" fill="none" stroke-width="14" />
          <path d="M40,380 C8,368 8,326 30,312" fill="none" stroke="#f0a04b" stroke-width="7" />
          <ellipse cx="82" cy="350" rx="52" ry="58" fill="#f0a04b" />
          <ellipse cx="86" cy="362" rx="28" ry="42" fill="#fffdf9" stroke="none" />
          <path d="M40,250 L44,206 L72,234 Z M124,250 L120,206 L92,234 Z" fill="#e58a32" />
          <path d="M47,242 L49,218 L64,234 Z M117,242 L115,218 L100,234 Z" fill="#f6c7b8" stroke="none" />
          <ellipse cx="82" cy="268" rx="50" ry="44" fill="#f0a04b" />
          <path d="M70,228 L72,242 M82,226 L82,242 M94,228 L92,242" stroke="#c96a1e" stroke-width="3.5" />
          <ellipse cx="82" cy="290" rx="24" ry="16" fill="#fffdf9" stroke="none" />
          <ellipse cx="60" cy="292" rx="8" ry="5" fill="#f2a0b8" opacity="0.8" stroke="none" />
          <ellipse cx="104" cy="292" rx="8" ry="5" fill="#f2a0b8" opacity="0.8" stroke="none" />
          <g class="eye" transform="translate(64 272)"><g class="pupil"><use href="#mascot-eye" stroke="none" transform="scale(0.85)" /></g></g>
          <g class="eye" transform="translate(100 272)"><g class="pupil"><use href="#mascot-eye" stroke="none" transform="scale(0.85)" /></g></g>
          <path d="M78,286 Q82,291 86,286 Z" fill="#e7a090" stroke-width="2.5" />
          <path d="M74,295 Q78,300 82,295 Q86,300 90,295" fill="none" stroke-width="2.5" />
          <path d="M36,288 L14,284 M38,298 L14,302 M128,288 L150,284 M126,298 L150,302" stroke-width="2.5" />
          <ellipse cx="62" cy="404" rx="16" ry="10" fill="#fffdf9" />
          <ellipse cx="104" cy="404" rx="16" ry="10" fill="#fffdf9" />
          <g class="paw">
            <ellipse cx="64" cy="274" rx="20" ry="17" fill="#fffdf9" />
            <ellipse cx="100" cy="274" rx="20" ry="17" fill="#fffdf9" />
            <g fill="#f3c3b4" stroke="none">
              <circle cx="56" cy="266" r="3.5" /><circle cx="64" cy="263" r="3.5" /><circle cx="72" cy="266" r="3.5" />
              <circle cx="92" cy="266" r="3.5" /><circle cx="100" cy="263" r="3.5" /><circle cx="108" cy="266" r="3.5" />
            </g>
          </g>
        </g>

        <!-- Cream book, in front. Its pages lift as the reader types an email. -->
        <g class="actor actor--book actor--bob">
          <rect x="176" y="270" width="104" height="138" rx="12" fill="#fdf7ec" />
          <rect x="176" y="270" width="14" height="138" rx="7" fill="#f0e2d0" stroke="none" />
          <rect x="198" y="286" width="66" height="16" rx="6" fill="#e98aa8" />
          <path d="M206,312 L256,312" stroke="#e3cfe0" stroke-width="3" />
          <ellipse cx="208" cy="372" rx="7" ry="4.5" fill="#f2a0b8" opacity="0.8" stroke="none" />
          <ellipse cx="256" cy="372" rx="7" ry="4.5" fill="#f2a0b8" opacity="0.8" stroke="none" />
          <g class="eye" transform="translate(214 354)"><g class="pupil"><use href="#mascot-eye" stroke="none" transform="scale(0.8)" /></g></g>
          <g class="eye" transform="translate(250 354)"><g class="pupil"><use href="#mascot-eye" stroke="none" transform="scale(0.8)" /></g></g>
          <path d="M226,376 Q232,382 238,376" fill="none" stroke-width="3" />
          <g class="pages"><path d="M252,408 L280,380 L280,408 Z" fill="#fffdf9" /></g>
          <g class="lid">
            <rect x="196" y="338" width="74" height="30" rx="10" fill="#fdf7ec" />
            <path d="M204,352 L262,352" stroke="#e98aa8" stroke-width="3" />
          </g>
        </g>

        <!-- genre covers at their feet -->
        <g v-for="(genre, index) in spines" :key="genre" :transform="`translate(${8 + (index % 6) * 24} ${index < 6 ? 384 : 360})`">
          <g class="mini-cover">
            <rect width="20" height="26" rx="3" :fill="spineColor(index)" stroke-width="2.5" />
            <rect x="4" y="4" width="12" height="5" rx="1.5" fill="#fffdf9" stroke="none" />
            <rect x="4" y="12" width="12" height="7" rx="1.5" fill="#fffdf9" opacity="0.45" stroke="none" />
          </g>
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
  min-width: 0;
  min-height: 0;
  margin: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overflow: hidden;
}

.bits {
  z-index: 0;
}

.mascots svg {
  position: relative;
  z-index: 2;
  display: block;
  width: min(480px, 86%);
  height: min(680px, 84%);
  margin-bottom: 3%;
  overflow: visible;
  pointer-events: none;
  filter: drop-shadow(0 10px 18px rgba(30, 26, 36, 0.25));
}

.actor {
  pointer-events: auto;
  cursor: pointer;
  transform-box: fill-box;
  transform-origin: center bottom;
}

.actor--bob { animation: bob 4.8s ease-in-out infinite; }
.actor--late { animation-duration: 5.6s; animation-delay: -1.4s; }
.actor--slow { animation-duration: 6.2s; animation-delay: -2.2s; }
.actor--fast { animation-duration: 4.2s; animation-delay: -0.6s; }

.actor:hover {
  animation: none;
  transform: translateY(-10px) scale(1.04);
  transition: transform 0.2s ease;
}

.paw,
.lid {
  opacity: 0;
  transform: translateY(14px);
  transform-box: fill-box;
  transition: opacity 0.2s ease, transform 0.25s cubic-bezier(0.3, 1.5, 0.5, 1);
}

.mascots[data-gaze='cover'] .paw,
.mascots[data-gaze='cover'] .lid {
  opacity: 1;
  transform: translateY(0);
}

.mascots[data-gaze='duck'] .actor {
  animation: none;
  transform: translateY(12px) scale(1, 0.96);
}

.mini-cover {
  transform-box: fill-box;
  transform-origin: center bottom;
  animation: spine-in 0.35s cubic-bezier(0.3, 1.5, 0.5, 1);
}

@media (max-width: 767px) {
  .mascots {
    flex: 0 0 42%;
    max-height: 380px;
  }

  .mascots svg {
    width: 100%;
    height: 100%;
    margin-bottom: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
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
  50% { transform: translateY(-6px); }
}

@keyframes spine-in {
  from { opacity: 0; transform: translateY(10px) scale(0.6); }
}
</style>
