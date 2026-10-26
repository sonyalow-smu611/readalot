<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// A reader's character as a smooth chibi illustration (big head, big shiny eyes, soft shading),
// drawn from the same saved parts as the town's pixel sprite (lib/avatar/catalogue.js). Used by
// the salon, the Welcome picker and the loading screen. crop shows one part, for the customiser.
import { computed, useId } from 'vue'
import { shade } from '@/lib/avatar/draw.js'
import { describeCharacter, normaliseCharacter, toDrawParams } from '@/lib/avatar/catalogue.js'

const props = defineProps({
  // the saved character (ids)
  character: { type: Object, required: true },
  // 'full', or one part: 'head', 'top', 'bottom', 'feet'
  crop: { type: String, default: 'full' },
  // what screen readers hear; empty describes the character
  label: { type: String, default: '' },
  // true when something else already names it (a picker tile)
  decorative: { type: Boolean, default: false },
  // raise the right hand and wave
  wave: { type: Boolean, default: false },
})

const INK = '#3b2a35'
const VIEWS = {
  full: '0 0 200 300',
  head: '22 8 156 156',
  top: '28 128 144 120',
  bottom: '40 196 120 96',
  feet: '52 236 96 60',
}

const uid = useId()
const valid = computed(() => normaliseCharacter(props.character, { allowLocked: true }))
const p = computed(() => toDrawParams(valid.value))
const spoken = computed(() => props.label || describeCharacter(valid.value))

const hair = computed(() => p.value.hair)
const hairS = computed(() => p.value.hairS)
const brow = computed(() => p.value.brow ?? shade(p.value.hairC, 0.7))
const puffy = computed(() => p.value.top === 'puffer' || p.value.top === 'fuzzy')
const bare = computed(() => p.value.top === 'tank' || p.value.top === 'tube')
const sleeve = computed(() => (bare.value ? p.value.skin : p.value.sleeve ?? p.value.topC))
const coatLong = computed(() => p.value.top === 'coat')
const trousers = computed(() => ['pants', 'baggy', 'ripped', 'cargo'].includes(p.value.bottom))
const baggy = computed(() => p.value.bottom === 'baggy' || p.value.bottom === 'cargo')

// the body outline, wider for puffy tops, longer for a coat
const torso = computed(() => {
  const w = puffy.value ? 40 : 34
  const bottom = coatLong.value ? 248 : 228
  return `M${100 - w + 4},158 Q${100 - w + 4},150 ${100 - w + 14},150 L${100 + w - 14},150 Q${100 + w - 4},150 ${100 + w - 4},158 L${100 + w + 2},${bottom - 6} Q${100 + w + 2},${bottom} ${100 + w - 4},${bottom} L${100 - w + 4},${bottom} Q${100 - w - 2},${bottom} ${100 - w - 2},${bottom - 6} Z`
})
const armWidth = computed(() => (puffy.value ? 24 : 19))

// speckles for the fuzzy jumper, always in the same places
const FUZZ = [[78, 166], [92, 176], [110, 168], [124, 182], [84, 194], [102, 190], [118, 204], [76, 212], [94, 214], [112, 220], [128, 196], [70, 186]]
// curls around the head, front and back
const CURLS_BACK = [[44, 82], [40, 112], [50, 140], [156, 82], [160, 112], [150, 140], [70, 46], [100, 36], [130, 46]]
const CURLS_FRONT = [[50, 76], [66, 62], [84, 54], [102, 52], [120, 54], [136, 62], [150, 76]]
const PUFF = [[100, 40], [62, 52], [138, 52], [40, 84], [160, 84], [48, 120], [152, 120], [80, 30], [120, 30]]
</script>

<template>
  <svg
    class="figure"
    :class="{ 'figure--crop': crop !== 'full' }"
    :viewBox="VIEWS[crop] ?? VIEWS.full"
    preserveAspectRatio="xMidYMax meet"
    :role="decorative ? undefined : 'img'"
    :aria-label="decorative ? undefined : spoken"
    :aria-hidden="decorative ? 'true' : undefined"
  >
    <defs>
      <clipPath :id="`${uid}-head`"><ellipse cx="100" cy="96" rx="58" ry="54" /></clipPath>
      <clipPath :id="`${uid}-torso`"><path :d="torso" /></clipPath>
    </defs>

    <g :stroke="INK" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">
      <!-- a soft shadow on the floor -->
      <ellipse cx="100" cy="290" rx="44" ry="7" fill="rgba(30,26,36,0.18)" stroke="none" />

      <!-- hood and hair behind the head -->
      <ellipse v-if="p.hood" cx="100" cy="98" rx="74" ry="70" :fill="p.hood" />
      <path v-if="hair === 'long'" d="M40,92 C34,150 40,190 50,208 L150,208 C160,190 166,150 160,92 Z" :fill="p.hairC" />
      <path v-if="hair === 'wavy'" d="M38,92 C30,130 44,150 34,176 C42,196 36,210 50,220 L150,220 C164,210 158,196 166,176 C156,150 170,130 162,92 Z" :fill="p.hairC" />
      <path v-if="hair === 'bob'" d="M36,90 C34,124 36,146 44,156 L156,156 C164,146 166,124 164,90 Z" :fill="p.hairC" />
      <path v-if="hair === 'messy'" d="M38,92 C34,120 36,140 44,150 L52,138 L60,152 L140,152 L148,138 L156,150 C164,140 166,120 162,92 Z" :fill="p.hairC" />
      <path v-if="hair === 'mop'" d="M36,90 C30,118 34,140 46,146 L154,146 C166,140 170,118 164,90 Z" :fill="p.hairC" />
      <template v-if="hair === 'curly'">
        <circle v-for="([cx, cy], i) in CURLS_BACK" :key="`cb${i}`" :cx="cx" :cy="cy" r="20" :fill="p.hairC" />
      </template>
      <template v-if="hair === 'puff'">
        <circle v-for="([cx, cy], i) in PUFF" :key="`pf${i}`" :cx="cx" :cy="cy" r="30" :fill="p.hairC" />
      </template>

      <!-- legs, socks, bottoms and shoes -->
      <rect x="80" y="222" width="17" height="54" rx="7" :fill="p.skin" />
      <rect x="103" y="222" width="17" height="54" rx="7" :fill="p.skinS" />
      <template v-if="p.bottom === 'skirt'">
        <rect x="80" y="250" width="17" height="26" rx="6" :fill="p.sock ?? p.skin" />
        <rect x="103" y="250" width="17" height="26" rx="6" :fill="p.sock ?? p.skin" />
      </template>
      <template v-if="trousers">
        <path :d="baggy ? 'M66,216 L134,216 L136,276 L102,276 L100,240 L98,276 L64,276 Z' : 'M72,216 L128,216 L126,276 L103,276 L100,238 L97,276 L74,276 Z'" :fill="p.botC" />
        <path :d="baggy ? 'M100,240 L102,276 L136,276 L134,236 Z' : 'M100,238 L103,276 L126,276 L127,234 Z'" :fill="p.botS" stroke="none" />
        <template v-if="p.bottom === 'ripped'">
          <ellipse cx="84" cy="250" rx="6" ry="4" :fill="p.skin" />
          <ellipse cx="116" cy="262" rx="5" ry="3" :fill="p.skin" />
          <path d="M78,236 L90,236 M110,246 L122,246" stroke="#e6eef5" />
        </template>
        <template v-if="p.bottom === 'cargo'">
          <rect x="68" y="242" width="14" height="14" rx="3" :fill="p.botS" />
          <rect x="118" y="242" width="14" height="14" rx="3" :fill="p.botS" />
        </template>
      </template>
      <path v-if="p.bottom === 'skirt'" d="M70,216 L130,216 L142,252 Q100,262 58,252 Z" :fill="p.botC" />
      <path v-if="p.bottom === 'skirt'" d="M84,222 L80,254 M100,222 L100,258 M116,222 L120,254" :stroke="p.botS" fill="none" />
      <path v-if="p.bottom === 'long'" d="M70,216 L130,216 L146,278 Q100,286 54,278 Z" :fill="p.botC" />
      <path v-if="p.bottom === 'long'" d="M100,222 L100,280 M86,224 L80,278" :stroke="p.botS" fill="none" />

      <template v-if="p.boots">
        <rect x="72" y="248" width="29" height="36" rx="8" :fill="p.shoe" />
        <rect x="99" y="248" width="29" height="36" rx="8" :fill="shade(p.shoe, 0.85)" />
      </template>
      <rect x="70" y="268" width="31" height="17" rx="8" :fill="p.shoe" />
      <rect x="99" y="268" width="31" height="17" rx="8" :fill="p.shoe" />
      <rect x="70" y="280" width="31" height="7" rx="3.5" :fill="p.sole" />
      <rect x="99" y="280" width="31" height="7" rx="3.5" :fill="p.sole" />
      <ellipse cx="80" cy="273" rx="4" ry="2" fill="rgba(255,255,255,0.5)" stroke="none" />
      <ellipse cx="109" cy="273" rx="4" ry="2" fill="rgba(255,255,255,0.5)" stroke="none" />

      <!-- arms (the right one can wave) -->
      <g>
        <rect :x="54 - armWidth / 2" y="154" :width="armWidth" height="60" rx="10" :fill="sleeve" transform="rotate(10 54 156)" />
        <rect v-if="p.shortSleeves" :x="54 - armWidth / 2" y="180" :width="armWidth" height="34" rx="9" :fill="p.skin" transform="rotate(10 54 156)" />
        <circle cx="44" cy="214" r="9" :fill="p.skin" />
      </g>
      <g :class="{ 'figure__wave': wave }">
        <rect :x="146 - armWidth / 2" y="154" :width="armWidth" height="60" rx="10" :fill="sleeve" transform="rotate(-10 146 156)" />
        <rect v-if="p.shortSleeves" :x="146 - armWidth / 2" y="180" :width="armWidth" height="34" rx="9" :fill="p.skinS" transform="rotate(-10 146 156)" />
        <circle cx="156" cy="214" r="9" :fill="p.skin" />
      </g>

      <!-- neck and the top -->
      <rect x="89" y="136" width="22" height="24" rx="6" :fill="p.skinS" />
      <path :d="torso" :fill="p.top === 'pinafore' ? p.inner : p.topC" />
      <g :clip-path="`url(#${uid}-torso)`" stroke="none">
        <!-- shade down the right side -->
        <rect x="120" y="140" width="40" height="120" :fill="p.top === 'pinafore' ? shade(p.inner, 0.9) : p.topS" opacity="0.55" />
        <template v-if="p.top === 'pinafore'">
          <path d="M72,172 L128,172 L136,232 L64,232 Z" :fill="p.topC" />
          <rect x="80" y="150" width="9" height="24" :fill="p.topC" />
          <rect x="111" y="150" width="9" height="24" :fill="p.topC" />
          <circle cx="90" cy="196" r="3" fill="#fdf7ec" />
          <circle cx="110" cy="196" r="3" fill="#fdf7ec" />
        </template>
        <template v-if="p.top === 'puffer'">
          <path v-for="y in [170, 188, 206, 222]" :key="y" :d="`M50,${y} Q100,${y + 6} 150,${y}`" :stroke="p.topS" stroke-width="3" fill="none" />
          <rect x="97" y="150" width="6" height="80" :fill="p.inner" />
        </template>
        <template v-if="p.top === 'coat'">
          <rect x="88" y="150" width="24" height="80" :fill="p.inner" />
          <path d="M88,150 L100,178 L80,170 Z M112,150 L100,178 L120,170 Z" :fill="p.topS" />
          <circle cx="94" cy="196" r="3" :fill="INK" />
          <circle cx="94" cy="214" r="3" :fill="INK" />
        </template>
        <template v-if="p.top === 'fuzzy'">
          <circle v-for="([cx, cy], i) in FUZZ" :key="`fz${i}`" :cx="cx" :cy="cy" r="3.5" :fill="i % 2 ? p.topS : shade(p.topC, 1.12)" />
        </template>
        <rect v-if="p.print" x="85" y="170" width="30" height="26" rx="6" :fill="p.print" />
        <template v-if="p.top === 'tank'">
          <path d="M70,150 L84,150 L92,168 Q100,174 108,168 L116,150 L130,150 L130,160 L70,160 Z" :fill="p.skin" />
        </template>
        <rect v-if="p.top === 'tube'" x="60" y="146" width="80" height="20" :fill="p.skin" />
        <template v-if="p.top === 'hoodie'">
          <rect x="78" y="196" width="44" height="22" rx="8" :fill="p.topS" />
          <path d="M92,154 L90,176 M108,154 L110,176" stroke="#efe6da" stroke-width="2.5" />
        </template>
        <template v-if="p.top === 'vest'">
          <path d="M84,150 L100,182 L116,150 Z" :fill="p.inner" />
          <path d="M80,196 l6,-8 l6,8 l-6,8 Z M108,196 l6,-8 l6,8 l-6,8 Z M94,214 l6,-8 l6,8 l-6,8 Z" :fill="p.topS" />
        </template>
        <path v-if="p.pattern" d="M50,214 L60,196 L68,208 L78,186 L88,206 L98,190 L108,208 L118,186 L128,206 L136,194 L150,214 L150,240 L50,240 Z" :fill="p.pattern" />
        <template v-if="p.top === 'cardigan'">
          <rect x="90" y="150" width="20" height="80" :fill="p.inner" />
          <circle cx="86" cy="176" r="2.5" fill="#f2a0b8" />
          <circle cx="114" cy="196" r="2.5" fill="#f2a0b8" />
          <circle cx="84" cy="212" r="2.5" fill="#f2a0b8" />
        </template>
        <template v-if="p.top === 'blazer'">
          <rect x="88" y="150" width="24" height="70" :fill="p.inner" />
          <path d="M88,150 L100,190 L78,176 Z M112,150 L100,190 L122,176 Z" :fill="p.topS" />
          <path d="M100,160 L96,170 L100,190 L104,170 Z" fill="#8a8a8a" />
        </template>
      </g>
      <path :d="torso" fill="none" />

      <!-- scarf and bag -->
      <template v-if="p.scarf">
        <rect x="76" y="140" width="48" height="18" rx="9" :fill="p.scarf" />
        <rect x="106" y="150" width="14" height="40" rx="6" :fill="p.scarf" />
        <path d="M108,190 L108,196 M113,190 L113,196 M118,190 L118,196" />
      </template>
      <template v-if="p.bag">
        <path d="M86,152 L140,206" :stroke="shade(p.bag, 0.7)" stroke-width="5" />
        <rect x="126" y="194" width="34" height="34" rx="6" :fill="p.bag" />
        <path d="M130,206 L156,206 M130,214 L156,214" :stroke="shade(p.bag, 0.85)" />
      </template>

      <!-- head: ears, face shape with a soft shadow, the face -->
      <circle cx="44" cy="106" r="11" :fill="p.skin" />
      <circle cx="156" cy="106" r="11" :fill="p.skinS" />
      <ellipse cx="100" cy="96" rx="58" ry="54" :fill="p.skin" />
      <g :clip-path="`url(#${uid}-head)`" stroke="none">
        <ellipse cx="128" cy="124" rx="56" ry="50" :fill="p.skinS" opacity="0.45" />
        <ellipse cx="92" cy="90" rx="52" ry="48" :fill="p.skin" />
      </g>
      <ellipse cx="100" cy="96" rx="58" ry="54" fill="none" />

      <ellipse cx="66" cy="120" rx="10" ry="6" :fill="p.blush" opacity="0.6" stroke="none" />
      <ellipse cx="134" cy="120" rx="10" ry="6" :fill="p.blush" opacity="0.6" stroke="none" />
      <path d="M66,88 Q76,81 86,86 M114,86 Q124,81 134,88" :stroke="brow" stroke-width="4" fill="none" />
      <ellipse cx="76" cy="106" rx="8.5" ry="11.5" fill="#2b2230" stroke="none" />
      <ellipse cx="124" cy="106" rx="8.5" ry="11.5" fill="#2b2230" stroke="none" />
      <circle cx="79" cy="101" r="3.4" fill="#ffffff" stroke="none" />
      <circle cx="127" cy="101" r="3.4" fill="#ffffff" stroke="none" />
      <circle cx="73" cy="111" r="1.6" fill="#ffffff" stroke="none" />
      <circle cx="121" cy="111" r="1.6" fill="#ffffff" stroke="none" />
      <ellipse cx="100" cy="118" rx="2.6" ry="1.8" :fill="p.skinS" stroke="none" />
      <path d="M92,126 Q100,134 108,126" :stroke="p.lips" fill="none" />

      <!-- glasses -->
      <template v-if="p.shades">
        <rect x="58" y="94" width="34" height="22" rx="9" fill="#1e1a24" />
        <rect x="108" y="94" width="34" height="22" rx="9" fill="#1e1a24" />
        <path d="M92,102 L108,102" />
        <path d="M64,99 L72,99 M114,99 L122,99" stroke="rgba(255,255,255,0.6)" />
      </template>
      <template v-if="p.goggles">
        <rect x="40" y="96" width="120" height="12" rx="6" fill="#5a6070" />
        <circle cx="76" cy="104" r="16" fill="#9fc4d9" fill-opacity="0.85" stroke="#5a5a68" stroke-width="5" />
        <circle cx="124" cy="104" r="16" fill="#9fc4d9" fill-opacity="0.85" stroke="#5a5a68" stroke-width="5" />
        <path d="M68,98 L74,94 M116,98 L122,94" stroke="#ffffff" />
      </template>

      <!-- hair in front -->
      <template v-if="hair === 'long' || hair === 'wavy'">
        <path d="M42,104 C38,58 70,36 100,36 C130,36 162,58 158,104 C152,86 140,74 126,70 C114,80 90,82 74,72 C60,78 48,90 42,104 Z" :fill="p.hairC" />
        <path d="M42,100 C40,130 44,152 50,166 L60,164 C55,140 55,120 58,98 Z" :fill="p.hairC" />
        <path d="M158,100 C160,130 156,152 150,166 L140,164 C145,140 145,120 142,98 Z" :fill="hairS" />
      </template>
      <template v-if="hair === 'bun'">
        <circle cx="100" cy="30" r="20" :fill="p.hairC" />
        <path d="M42,104 C38,56 70,38 100,38 C130,38 162,56 158,104 C150,82 138,70 120,66 C108,74 84,76 70,68 C56,76 48,90 42,104 Z" :fill="p.hairC" />
      </template>
      <template v-if="hair === 'curly'">
        <path d="M44,100 C40,60 70,40 100,40 C130,40 160,60 156,100 Z" :fill="p.hairC" />
        <circle v-for="([cx, cy], i) in CURLS_FRONT" :key="`cf${i}`" :cx="cx" :cy="cy" r="14" :fill="i % 2 ? hairS : p.hairC" />
        <circle v-if="p.flower" cx="62" cy="54" r="11" :fill="p.flower" />
        <circle v-if="p.flower" cx="62" cy="54" r="4" fill="#f6e27a" />
      </template>
      <template v-if="hair === 'twists'">
        <path d="M44,98 C40,58 70,38 100,38 C130,38 160,58 156,98 C150,86 140,80 128,80 L72,80 C60,80 50,86 44,98 Z" :fill="p.hairC" />
        <path d="M66,46 L66,80 M80,40 L80,80 M94,38 L94,80 M108,38 L108,80 M122,40 L122,80 M136,46 L136,80" :stroke="hairS" stroke-width="3.5" />
        <path d="M58,82 L142,82" :stroke="p.roots" stroke-width="5" />
      </template>
      <template v-if="hair === 'puff'">
        <path d="M44,100 C40,62 70,44 100,44 C130,44 160,62 156,100 C146,84 128,76 100,76 C72,76 54,84 44,100 Z" :fill="p.hairC" />
        <circle cx="70" cy="52" r="6" :fill="hairS" stroke="none" />
        <circle cx="128" cy="48" r="5" :fill="hairS" stroke="none" />
      </template>
      <path v-if="hair === 'bob'" d="M40,104 C38,56 70,36 100,36 C130,36 162,56 160,104 L160,84 C150,80 50,80 40,84 Z" :fill="p.hairC" />
      <template v-if="hair === 'messy'">
        <path d="M42,102 C38,56 70,36 100,36 C130,36 162,56 158,102 L150,86 L140,96 L132,78 L118,90 L108,74 L96,88 L84,74 L76,90 L64,80 L56,94 Z" :fill="p.hairC" />
        <path d="M84,36 L80,24 L92,34 M112,36 L120,24 L118,38" :fill="p.hairC" />
      </template>
      <path v-if="hair === 'short'" d="M46,96 C42,58 70,40 100,40 C130,40 158,58 154,96 C150,80 136,70 120,70 L80,70 C64,70 50,80 46,96 Z" :fill="p.hairC" />
      <template v-if="hair === 'spiky'">
        <path d="M46,96 C42,62 66,48 100,48 C134,48 158,62 154,96 C148,82 132,74 100,74 C68,74 52,82 46,96 Z" :fill="p.hairC" />
        <path d="M52,66 L50,30 L70,52 L76,18 L92,46 L100,12 L110,46 L124,18 L130,52 L150,30 L148,66 Z" :fill="p.hairC" />
      </template>
      <template v-if="hair === 'mop'">
        <path d="M40,100 C36,56 68,34 100,34 C132,34 164,56 160,100 C154,92 150,88 144,92 C138,84 130,84 124,92 C118,84 108,84 100,92 C92,84 82,84 76,92 C70,84 62,84 56,92 C50,88 46,92 40,100 Z" :fill="p.hairC" />
      </template>
      <template v-if="hair === 'tucked'">
        <path d="M42,96 C40,112 44,126 48,132 L56,130 C52,118 52,106 54,96 Z" :fill="p.hairC" />
        <path d="M158,96 C160,112 156,126 152,132 L144,130 C148,118 148,106 146,96 Z" :fill="hairS" />
      </template>
      <!-- a shine on the hair -->
      <path v-if="!['tucked', 'none'].includes(hair) && !p.hat" d="M70,54 Q84,44 100,44" stroke="rgba(255,255,255,0.55)" stroke-width="4" fill="none" />

      <!-- on the head and in the hair -->
      <template v-if="p.hat === 'beanie'">
        <path d="M38,98 C38,44 70,28 100,28 C130,28 162,44 162,98 Z" :fill="p.hatC" />
        <rect x="36" y="82" width="128" height="20" rx="9" :fill="shade(p.hatC, 0.85)" />
        <path d="M56,84 L56,100 M76,84 L76,100 M96,84 L96,100 M116,84 L116,100 M136,84 L136,100" :stroke="shade(p.hatC, 0.7)" />
        <circle cx="100" cy="24" r="11" :fill="shade(p.hatC, 1.15)" />
      </template>
      <template v-if="p.hat === 'fedora'">
        <ellipse cx="100" cy="74" rx="76" ry="13" :fill="p.hatC" />
        <path d="M62,74 C60,40 80,32 100,32 C120,32 140,40 138,74 Z" :fill="p.hatC" />
        <path d="M86,34 Q100,44 114,34" :stroke="shade(p.hatC, 0.8)" fill="none" />
        <rect x="62" y="60" width="76" height="11" :fill="p.band" />
      </template>
      <path v-if="p.hood" d="M38,124 C30,60 66,30 100,30 C134,30 170,60 162,124" :stroke="shade(p.hood, 0.8)" stroke-width="12" fill="none" />
      <template v-if="p.crown">
        <path d="M64,50 L70,18 L86,36 L100,10 L114,36 L130,18 L136,50 Z" :fill="p.crown" />
        <circle cx="100" cy="38" r="4.5" fill="#e27aa0" />
        <circle cx="78" cy="42" r="3" fill="#8fb8d9" />
        <circle cx="122" cy="42" r="3" fill="#8fb8d9" />
      </template>
      <template v-if="p.clip">
        <rect x="46" y="58" width="24" height="12" rx="6" :fill="p.clip" transform="rotate(-24 58 64)" />
      </template>
      <template v-if="p.sprout">
        <path d="M100,40 C100,30 100,24 102,16" stroke="#4f8f3a" fill="none" />
        <ellipse cx="90" cy="18" rx="11" ry="6" fill="#5aa045" transform="rotate(-24 90 18)" />
        <ellipse cx="114" cy="14" rx="11" ry="6" fill="#6fb24f" transform="rotate(24 114 14)" />
      </template>
      <template v-if="p.earring">
        <circle cx="44" cy="122" r="4" :fill="p.earring" />
        <circle cx="156" cy="122" r="4" :fill="p.earring" />
      </template>
    </g>
  </svg>
</template>

<style scoped>
.figure {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

/* a single part, clipped to its frame */
.figure--crop {
  overflow: hidden;
}

.figure__wave {
  transform-box: view-box;
  transform-origin: 146px 156px;
  animation: wave 1.4s ease-in-out infinite;
}

@keyframes wave {
  0%, 100% { transform: rotate(-150deg); }
  50% { transform: rotate(-120deg); }
}

@media (prefers-reduced-motion: reduce) {
  .figure__wave {
    animation: none;
    transform: rotate(-140deg);
  }
}
</style>
