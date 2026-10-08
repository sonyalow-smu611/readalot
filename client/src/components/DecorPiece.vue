<script setup>
import { computed } from 'vue'
import { useBreedPhotos } from '@/composables/useBreedPhotos'

const props = defineProps({
  kind: { type: String, required: true },
})

const { photos } = useBreedPhotos()
const live = computed(() => /^(cat-|dog-|pet-)/.test(props.kind))
const photo = computed(() => (live.value ? '' : photos.value[props.kind] || ''))
</script>

<template>
  <img v-if="photo" class="art art-photo" :src="photo" alt="" />

  <svg v-else-if="kind === 'vase-clay'" class="art" viewBox="0 0 64 84" aria-hidden="true">
    <ellipse cx="32" cy="80" rx="16" ry="3" fill="rgba(28,27,25,0.18)" />
    <path d="M24 18 C18 18 14 28 16 42 C18 58 20 70 26 74 H38 C44 70 46 58 48 42 C50 28 46 18 40 18 Z" fill="#c4785c" />
    <path d="M26 20 C22 28 20 40 22 56 C23 64 25 70 28 73 H32 C30 60 30 40 34 22 Z" fill="#e7b39a" opacity="0.55" />
    <rect x="22" y="12" width="20" height="8" rx="3" fill="#a86448" />
    <rect x="20" y="10" width="24" height="4" rx="2" fill="#8d5340" />
    <rect x="26" y="74" width="12" height="4" rx="1" fill="#8d5340" />
  </svg>

  <svg v-else-if="kind === 'vase-tall'" class="art" viewBox="0 0 48 88" aria-hidden="true">
    <ellipse cx="24" cy="84" rx="12" ry="3" fill="rgba(28,27,25,0.16)" />
    <path d="M20 22 C16 22 14 36 16 52 C18 68 18 76 22 78 H26 C30 76 30 68 32 52 C34 36 32 22 28 22 Z" fill="#f4efe6" />
    <path d="M21 26 C18 36 18 50 20 66 H24 C22 50 22 36 25 26 Z" fill="#fff" opacity="0.7" />
    <rect x="18" y="16" width="12" height="8" rx="2" fill="#efeae0" />
    <rect x="16" y="14" width="16" height="3" rx="1.5" fill="#d9d1c4" />
    <path d="M18 40 H30" stroke="#7f9a86" stroke-width="2" />
    <path d="M24 14 C24 6 30 4 32 0" fill="none" stroke="#3d6b45" stroke-width="1.5" />
    <circle cx="33" cy="2" r="3" fill="#d45d5d" />
    <rect x="20" y="78" width="8" height="3" rx="1" fill="#d9d1c4" />
  </svg>

  <svg v-else-if="kind === 'vase-bud'" class="art" viewBox="0 0 44 72" aria-hidden="true">
    <ellipse cx="22" cy="68" rx="10" ry="2.5" fill="rgba(28,27,25,0.16)" />
    <path d="M16 24 H28 L26 62 H18 Z" fill="#6e8f78" />
    <path d="M17 28 H21 L20 60 H18 Z" fill="#c9e0cf" opacity="0.45" />
    <rect x="14" y="20" width="16" height="5" rx="2" fill="#5d7a68" />
    <path d="M22 20 C22 10 28 8 30 2" fill="none" stroke="#2f6b3a" stroke-width="1.4" />
    <circle cx="31" cy="3" r="3.2" fill="#e7d36b" />
    <circle cx="29" cy="2" r="1" fill="#f7f4ee" />
  </svg>

  <svg v-else-if="kind === 'cat-siamese'" class="art" viewBox="0 0 148 96" aria-hidden="true">
    <ellipse cx="70" cy="90" rx="36" ry="3.2" fill="rgba(28,27,25,0.16)" />
    <path d="M36 62 C14 54 12 34 30 26" fill="none" stroke="#3a2a28" stroke-width="7" stroke-linecap="round" />
    <path d="M36 60 C20 54 20 40 32 34" fill="none" stroke="#f4e6d8" stroke-width="4" stroke-linecap="round" />
    <ellipse cx="62" cy="60" rx="30" ry="16" fill="#f6e7d8" />
    <ellipse cx="40" cy="64" rx="14" ry="11" fill="#edd9c8" />
    <rect x="38" y="70" width="7" height="18" rx="3" fill="#3a2a28" />
    <rect x="50" y="70" width="6" height="18" rx="3" fill="#f6e7d8" />
    <rect x="74" y="68" width="6" height="20" rx="3" fill="#f6e7d8" />
    <rect x="86" y="68" width="7" height="20" rx="3" fill="#3a2a28" />
    <ellipse cx="96" cy="52" rx="10" ry="8" fill="#f6e7d8" />
    <path d="M98 40 L104 16 L114 38 Z" fill="#3a2a28" />
    <path d="M116 36 L126 12 L134 38 Z" fill="#3a2a28" />
    <ellipse cx="118" cy="44" rx="18" ry="14" fill="#f6e7d8" />
    <ellipse cx="126" cy="44" rx="11" ry="10" fill="#3a2a28" />
    <ellipse cx="124" cy="42" rx="3.2" ry="2.2" fill="#8fd0ea" />
    <circle cx="125" cy="42" r="1.1" fill="#1c1b19" />
    <path d="M132 48 L136 52 L128 52 Z" fill="#d7a0aa" />
    <path d="M136 52 Q142 56 134 58" fill="none" stroke="#d7a0aa" stroke-width="1" />
  </svg>

  <svg v-else-if="kind === 'cat-maine'" class="art" viewBox="0 0 156 100" aria-hidden="true">
    <ellipse cx="74" cy="94" rx="40" ry="3.2" fill="rgba(28,27,25,0.16)" />
    <path d="M34 66 C8 58 6 30 28 24 C18 18 22 10 34 20" fill="none" stroke="#6b4328" stroke-width="10" stroke-linecap="round" />
    <ellipse cx="66" cy="64" rx="34" ry="18" fill="#c4a06a" />
    <path d="M48 58 H78 M50 66 H80 M52 74 H76" stroke="#6b4328" stroke-width="2" opacity="0.7" />
    <ellipse cx="96" cy="58" rx="16" ry="14" fill="#d8bc8a" />
    <rect x="40" y="74" width="8" height="16" rx="3" fill="#6b4328" />
    <rect x="54" y="76" width="7" height="14" rx="3" fill="#c4a06a" />
    <rect x="78" y="74" width="7" height="16" rx="3" fill="#c4a06a" />
    <rect x="90" y="74" width="8" height="16" rx="3" fill="#6b4328" />
    <path d="M104 48 L108 18 L120 44 Z" fill="#6b4328" />
    <path d="M108 20 L110 8" stroke="#6b4328" stroke-width="2" stroke-linecap="round" />
    <path d="M122 42 L132 14 L142 44 Z" fill="#6b4328" />
    <path d="M132 16 L136 6" stroke="#6b4328" stroke-width="2" stroke-linecap="round" />
    <ellipse cx="126" cy="50" rx="18" ry="15" fill="#c4a06a" />
    <ellipse cx="132" cy="48" rx="3" ry="2.4" fill="#c4a15a" />
    <circle cx="133" cy="48" r="1.1" fill="#1c1b19" />
    <path d="M118 62 Q126 70 136 60" fill="#efe2c8" />
  </svg>

  <svg v-else-if="kind === 'cat-persian'" class="art" viewBox="0 0 140 96" aria-hidden="true">
    <ellipse cx="68" cy="90" rx="34" ry="3" fill="rgba(28,27,25,0.16)" />
    <ellipse cx="58" cy="62" rx="32" ry="20" fill="#e7b07a" />
    <ellipse cx="40" cy="58" rx="16" ry="14" fill="#f0c48e" />
    <ellipse cx="78" cy="66" rx="18" ry="14" fill="#efc094" />
    <rect x="40" y="76" width="8" height="10" rx="3" fill="#e7b07a" />
    <rect x="70" y="76" width="8" height="10" rx="3" fill="#e7b07a" />
    <ellipse cx="104" cy="52" rx="22" ry="20" fill="#f0c48e" />
    <path d="M88 40 L94 28 L102 40 Z" fill="#e7b07a" />
    <path d="M112 38 L118 26 L124 40 Z" fill="#e7b07a" />
    <ellipse cx="112" cy="54" rx="10" ry="8" fill="#f7e2c4" />
    <ellipse cx="116" cy="50" rx="3.4" ry="3" fill="#c47a3a" />
    <circle cx="117" cy="50" r="1.3" fill="#1c1b19" />
    <ellipse cx="124" cy="58" rx="3" ry="2" fill="#d9899a" />
  </svg>

  <svg v-else-if="kind === 'cat-bengal'" class="art" viewBox="0 0 150 96" aria-hidden="true">
    <ellipse cx="72" cy="90" rx="36" ry="3" fill="rgba(28,27,25,0.16)" />
    <path d="M32 60 C12 50 14 32 32 28" fill="none" stroke="#5c3b28" stroke-width="6" stroke-linecap="round" />
    <ellipse cx="64" cy="60" rx="30" ry="15" fill="#d4a15a" />
    <circle cx="48" cy="56" r="4" fill="none" stroke="#5c3b28" stroke-width="1.6" />
    <circle cx="62" cy="52" r="3.5" fill="none" stroke="#5c3b28" stroke-width="1.6" />
    <circle cx="74" cy="60" r="4" fill="none" stroke="#5c3b28" stroke-width="1.6" />
    <circle cx="58" cy="66" r="3" fill="#5c3b28" />
    <rect x="40" y="70" width="6" height="18" rx="3" fill="#d4a15a" />
    <rect x="52" y="70" width="6" height="18" rx="3" fill="#d4a15a" />
    <rect x="76" y="68" width="6" height="20" rx="3" fill="#d4a15a" />
    <rect x="88" y="68" width="6" height="20" rx="3" fill="#5c3b28" />
    <path d="M100 42 L106 16 L116 40 Z" fill="#d4a15a" />
    <path d="M118 38 L128 12 L136 40 Z" fill="#d4a15a" />
    <ellipse cx="118" cy="46" rx="16" ry="13" fill="#d4a15a" />
    <path d="M112 40 L120 36 L118 46 Z" fill="#5c3b28" />
    <ellipse cx="124" cy="44" rx="3" ry="2.2" fill="#6a8f4e" />
    <circle cx="125" cy="44" r="1" fill="#1c1b19" />
    <path d="M130 50 L134 54 L126 54 Z" fill="#c47a6a" />
  </svg>

  <svg v-else-if="kind === 'cat-british'" class="art" viewBox="0 0 140 96" aria-hidden="true">
    <ellipse cx="68" cy="90" rx="32" ry="3" fill="rgba(28,27,25,0.16)" />
    <ellipse cx="60" cy="64" rx="32" ry="18" fill="#9aa3ad" />
    <rect x="40" y="74" width="9" height="12" rx="4" fill="#9aa3ad" />
    <rect x="72" y="74" width="9" height="12" rx="4" fill="#8b949e" />
    <path d="M34 60 C22 52 24 40 36 44" fill="none" stroke="#8b949e" stroke-width="8" stroke-linecap="round" />
    <path d="M92 46 L98 30 L108 46 Z" fill="#9aa3ad" />
    <path d="M112 44 L120 28 L126 46 Z" fill="#9aa3ad" />
    <ellipse cx="110" cy="52" rx="20" ry="18" fill="#a8b0b8" />
    <ellipse cx="118" cy="54" rx="8" ry="6" fill="#d5dbe0" />
    <ellipse cx="116" cy="50" rx="3.6" ry="3.4" fill="#c47a3a" />
    <circle cx="117" cy="50" r="1.4" fill="#1c1b19" />
    <path d="M124 58 L128 62 L120 62 Z" fill="#d9899a" />
  </svg>

  <svg v-else-if="kind === 'dog-husky'" class="art" viewBox="0 0 150 96" aria-hidden="true">
    <ellipse cx="72" cy="90" rx="36" ry="3" fill="rgba(28,27,25,0.16)" />
    <path d="M36 64 C16 58 18 40 34 42" fill="none" stroke="#4a5560" stroke-width="7" stroke-linecap="round" />
    <ellipse cx="64" cy="62" rx="32" ry="16" fill="#5c6770" />
    <ellipse cx="70" cy="68" rx="16" ry="8" fill="#f4efe6" />
    <rect x="40" y="70" width="7" height="18" rx="3" fill="#f4efe6" />
    <rect x="54" y="72" width="7" height="16" rx="3" fill="#f4efe6" />
    <rect x="78" y="70" width="7" height="18" rx="3" fill="#5c6770" />
    <rect x="90" y="70" width="7" height="18" rx="3" fill="#f4efe6" />
    <path d="M100 40 L106 14 L118 40 Z" fill="#5c6770" />
    <path d="M120 36 L130 10 L138 40 Z" fill="#5c6770" />
    <ellipse cx="118" cy="46" rx="18" ry="15" fill="#f7f4ee" />
    <path d="M112 42 L124 38 L122 50 Z" fill="#3a4248" />
    <ellipse cx="124" cy="44" rx="3" ry="2.2" fill="#8fd0ea" />
    <circle cx="125" cy="44" r="1" fill="#1c1b19" />
    <ellipse cx="132" cy="52" rx="4" ry="3" fill="#1c1b19" />
  </svg>

  <svg v-else-if="kind === 'dog-corgi'" class="art" viewBox="0 0 150 86" aria-hidden="true">
    <ellipse cx="74" cy="80" rx="40" ry="3" fill="rgba(28,27,25,0.16)" />
    <ellipse cx="70" cy="58" rx="40" ry="16" fill="#c47a3a" />
    <ellipse cx="78" cy="64" rx="22" ry="8" fill="#f7f4ee" />
    <rect x="40" y="66" width="8" height="10" rx="3" fill="#f7f4ee" />
    <rect x="58" y="68" width="8" height="8" rx="3" fill="#c47a3a" />
    <rect x="86" y="66" width="8" height="10" rx="3" fill="#f7f4ee" />
    <rect x="100" y="66" width="8" height="10" rx="3" fill="#c47a3a" />
    <path d="M104 40 L108 16 L122 42 Z" fill="#c47a3a" />
    <path d="M120 38 L132 14 L140 44 Z" fill="#c47a3a" />
    <ellipse cx="118" cy="48" rx="16" ry="14" fill="#d9894a" />
    <ellipse cx="112" cy="52" rx="6" ry="5" fill="#f7f4ee" />
    <ellipse cx="124" cy="46" rx="2.6" ry="2.2" fill="#1c1b19" />
    <ellipse cx="132" cy="54" rx="4" ry="2.6" fill="#1c1b19" />
  </svg>

  <svg v-else-if="kind === 'dog-pug'" class="art" viewBox="0 0 132 90" aria-hidden="true">
    <ellipse cx="64" cy="84" rx="30" ry="3" fill="rgba(28,27,25,0.16)" />
    <path d="M30 52 C18 40 24 28 36 36" fill="none" stroke="#c4a574" stroke-width="6" stroke-linecap="round" />
    <ellipse cx="58" cy="60" rx="28" ry="16" fill="#c4a574" />
    <rect x="40" y="70" width="8" height="10" rx="3" fill="#c4a574" />
    <rect x="70" y="70" width="8" height="10" rx="3" fill="#b89564" />
    <ellipse cx="96" cy="50" rx="20" ry="18" fill="#c4a574" />
    <path d="M82 40 L88 28 L96 40 Z" fill="#3a2a28" />
    <path d="M104 38 L112 24 L118 40 Z" fill="#3a2a28" />
    <ellipse cx="104" cy="54" rx="12" ry="9" fill="#2a2420" />
    <path d="M96 50 H112" stroke="#1c1b19" stroke-width="1.2" />
    <path d="M98 46 H110" stroke="#1c1b19" stroke-width="1" />
    <circle cx="98" cy="46" r="3" fill="#1c1b19" />
    <circle cx="99" cy="45" r="1" fill="#f7f4ee" />
    <ellipse cx="112" cy="58" rx="3" ry="2" fill="#1c1b19" />
  </svg>

  <svg v-else-if="kind === 'dog-golden'" class="art" viewBox="0 0 156 96" aria-hidden="true">
    <ellipse cx="74" cy="90" rx="38" ry="3" fill="rgba(28,27,25,0.16)" />
    <path d="M34 62 C12 70 8 46 28 40" fill="none" stroke="#e0b15a" stroke-width="8" stroke-linecap="round" />
    <ellipse cx="66" cy="62" rx="32" ry="16" fill="#e0b15a" />
    <rect x="42" y="70" width="7" height="16" rx="3" fill="#e0b15a" />
    <rect x="56" y="72" width="7" height="14" rx="3" fill="#c9963e" />
    <rect x="80" y="70" width="7" height="16" rx="3" fill="#e0b15a" />
    <rect x="92" y="70" width="7" height="16" rx="3" fill="#c9963e" />
    <path d="M102 48 C96 36 100 28 112 40" fill="#e0b15a" />
    <ellipse cx="118" cy="48" rx="18" ry="15" fill="#e8c27a" />
    <path d="M108 40 C100 28 108 22 116 36" fill="#c9963e" />
    <ellipse cx="124" cy="46" rx="2.8" ry="2.2" fill="#1c1b19" />
    <ellipse cx="132" cy="54" rx="5" ry="3" fill="#1c1b19" />
    <ellipse cx="126" cy="58" rx="6" ry="3" fill="#f3d7a4" />
  </svg>

  <svg v-else-if="kind === 'pet-bird'" class="art" viewBox="0 0 96 84" aria-hidden="true">
    <ellipse cx="48" cy="78" rx="18" ry="2.6" fill="rgba(28,27,25,0.16)" />
    <path d="M28 48 C20 36 34 24 48 34 C40 20 58 16 62 30 C74 22 84 36 70 46 C78 58 60 66 46 56 Z" fill="#f0d56a" />
    <path d="M46 40 C58 36 66 48 54 54 C46 50 44 44 46 40 Z" fill="#8a9098" />
    <path d="M48 30 C46 16 58 8 64 18" fill="none" stroke="#f0d56a" stroke-width="4" stroke-linecap="round" />
    <circle cx="58" cy="36" r="5" fill="#e07a3a" />
    <circle cx="60" cy="34" r="1.5" fill="#1c1b19" />
    <path d="M66 38 L78 36 L66 42 Z" fill="#c47a3a" />
    <path d="M44 64 L42 74 M50 64 L52 74" stroke="#c47a3a" stroke-width="1.6" stroke-linecap="round" />
    <path d="M38 74 H46 M48 74 H56" stroke="#c47a3a" stroke-width="1.4" stroke-linecap="round" />
  </svg>

  <span v-else class="piece" :class="`piece--${kind}`" aria-hidden="true"></span>
</template>

<style scoped>
.art {
  display: block;
  width: auto;
  height: 64px;
}

.art-photo {
  height: 78px;
  max-width: 104px;
  object-fit: contain;
  object-position: center bottom;
}

.piece {
  position: relative;
  display: block;
  width: 46px;
  height: 52px;
}

.piece--statue-bust {
  width: 28px;
  height: 22px;
  margin-top: 18px;
  border-radius: 14px 14px 4px 4px;
  background: #e6e0d4;
}

.piece--statue-bust::before {
  content: '';
  position: absolute;
  left: 6px;
  top: -14px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #efeae0;
}

.piece--statue-owl {
  width: 28px;
  height: 32px;
  margin-top: 10px;
  border-radius: 14px 14px 10px 10px;
  background: #8d7358;
}

.piece--statue-owl::before,
.piece--statue-owl::after {
  content: '';
  position: absolute;
  top: 8px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #f4efe6;
}

.piece--statue-owl::before { left: 6px; }
.piece--statue-owl::after { right: 6px; }

.piece--statue-horse {
  width: 46px;
  height: 28px;
  margin-top: 16px;
  border-radius: 10px 16px 6px 6px;
  background: #6e5a48;
}

.piece--statue-horse::before {
  content: '';
  position: absolute;
  left: -4px;
  top: -10px;
  width: 14px;
  height: 16px;
  border-radius: 8px 8px 2px 2px;
  background: #6e5a48;
}

.piece--sofa-low,
.piece--sofa-love {
  height: 26px;
  margin-top: 16px;
  border-radius: 8px 8px 4px 4px;
  background: #6e3a3a;
}

.piece--sofa-low { width: 64px; }
.piece--sofa-love { width: 48px; background: #4d5640; }

.piece--sofa-low::before,
.piece--sofa-love::before {
  content: '';
  position: absolute;
  left: 4px;
  right: 4px;
  top: -8px;
  height: 10px;
  border-radius: 6px 6px 0 0;
  background: inherit;
  filter: brightness(0.92);
}

.piece--bean-round,
.piece--bean-slouch { border-radius: 50%; background: #c4b49a; }

.piece--bean-round { width: 36px; height: 32px; margin-top: 12px; }

.piece--bean-slouch {
  width: 40px;
  height: 24px;
  margin-top: 18px;
  border-radius: 40% 40% 46% 46%;
  background: #5d7a72;
}

.piece--mattress-floor,
.piece--mattress-day {
  height: 16px;
  margin-top: 24px;
  border-radius: 4px;
  background: #efeae0;
  box-shadow: 0 4px 0 #d9d1c4;
}

.piece--mattress-floor { width: 62px; }
.piece--mattress-day { width: 54px; background: #d7c4b0; }

.piece--mattress-day::before {
  content: '';
  position: absolute;
  left: 4px;
  top: -8px;
  width: 16px;
  height: 10px;
  border-radius: 4px;
  background: #f7f4ee;
}

.piece--food-bowl {
  width: 28px;
  height: 12px;
  margin-top: 28px;
  border-radius: 0 0 12px 12px;
  background: #c47a5a;
}

.piece--food-bowl::before {
  content: '';
  position: absolute;
  left: 4px;
  top: -4px;
  width: 20px;
  height: 6px;
  border-radius: 6px;
  background: #8a6244;
}

.piece--drink-fountain {
  width: 22px;
  height: 22px;
  margin: 18px auto 0;
  border-radius: 50%;
  background: #7eb0c8;
  box-shadow: inset 0 -6px 0 #5d8ea6;
}

.piece--drink-fountain::before {
  content: '';
  position: absolute;
  left: 9px;
  top: -8px;
  width: 4px;
  height: 10px;
  border-radius: 4px;
  background: #d7eef6;
}
</style>
