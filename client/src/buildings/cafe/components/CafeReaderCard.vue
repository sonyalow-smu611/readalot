<script setup>
// AI-assisted visual styling; review and document in AI_USAGE.md.
// This card is display-only: the parent continues to own reader selection and navigation.
import { computed } from 'vue'

const props = defineProps({
  reader: { type: Object, required: true },
})
const emit = defineEmits(['close', 'visit'])

const name = computed(() => props.reader.displayName || props.reader.username || 'Reader')
const username = computed(() => props.reader.username || props.reader.id || '')
const score = computed(() => {
  const value = Number(props.reader.compatibility)
  return props.reader.compatibility == null || !Number.isFinite(value)
    ? null
    : Math.max(0, Math.min(100, Math.round(value)))
})
const genres = computed(() => Array.isArray(props.reader.favoriteGenres) ? props.reader.favoriteGenres : [])
const currentBook = computed(() => props.reader.currentlyReading || props.reader.books?.find(book => book.status === 'reading'))
const initials = computed(() => props.reader.initials || name.value.split(/\s+/).slice(0, 2).map(s => s[0]).join('').toUpperCase())
</script>

<template>
  <aside class="reader-popup" role="dialog" :aria-label="`Meet ${name}`" aria-modal="false">
    <button class="reader-popup__close" type="button" aria-label="Close reader profile" @click="emit('close')">×</button>

    <div class="reader-popup__top">
      <div class="reader-popup__portrait" aria-hidden="true">
        <img v-if="reader.sprite || reader.avatarUrl" :src="reader.sprite || reader.avatarUrl" alt="" />
        <span v-else>{{ initials }}</span>
      </div>
      <div class="reader-popup__identity">
        <h2>{{ name }}</h2>
        <p class="reader-popup__handle">@{{ username }}<span v-if="reader.neighborhood"> · {{ reader.neighborhood }}</span></p>
        <div class="reader-popup__match-row">
          <span class="reader-popup__match-label">MATCH</span>
          <div class="reader-popup__track" role="meter" :aria-valuenow="score ?? 0" aria-valuemin="0" aria-valuemax="100" :aria-label="`Reading compatibility with ${name}`">
            <div class="reader-popup__fill" :style="{ width: `${score ?? 0}%` }"></div>
          </div>
          <strong class="reader-popup__score">{{ score === null ? '—' : `${score}%` }}</strong>
        </div>
      </div>
    </div>

    <div class="reader-popup__info">
      <h3>✿ READING PREFS</h3>
      <div v-if="genres.length" class="reader-popup__genres">
        <span v-for="(genre, index) in genres.slice(0, 4)" :key="`${genre}-${index}`" class="reader-popup__genre">{{ genre }}</span>
      </div>
      <p v-else class="reader-popup__empty">No favourite genres shared yet.</p>
      <p v-if="currentBook" class="reader-popup__reading">📖 Reading: <strong>{{ currentBook.title }}</strong></p>
    </div>

    <button type="button" class="reader-popup__visit" @click="emit('visit')">Visit {{ name.split(' ')[0] }}'s room →</button>
  </aside>
</template>

<style scoped>
.reader-popup {
  box-sizing: border-box;
  position: absolute;
  z-index: 20;
  width: min(435px, calc(100% - 24px));
  max-height: min(470px, calc(100% - 24px));
  overflow-y: auto;
  padding: 13px;
  border: 4px solid #25202a;
  border-radius: 0;
  background: #fff1d0;
  box-shadow: 5px 5px 0 #25202a, 0 12px 30px #241b2070;
  color: #241e21;
  font-family: Arial, system-ui, sans-serif;
}
.reader-popup__close {
  position: absolute;
  top: 5px;
  right: 5px;
  z-index: 1;
  width: 29px;
  height: 29px;
  border: 2px solid #25202a;
  background: #fff9ec;
  color: #25202a;
  font: 700 22px/1 Arial, sans-serif;
  cursor: pointer;
}
.reader-popup__top {
  display: flex;
  gap: 12px;
  align-items: center;
  border: 3px solid #25202a;
  outline: 2px solid #5a777e;
  outline-offset: -7px;
  background: #fffbf1;
  padding: 12px 34px 12px 12px;
  min-width: 0;
}
.reader-popup__portrait {
  flex: 0 0 76px;
  height: 86px;
  border: 3px solid #25202a;
  background: linear-gradient(#c6e3ec 65%, #94ab79 65%);
  display: grid;
  place-items: center;
  overflow: hidden;
  font: 700 20px/1 monospace;
}
.reader-popup__portrait img {
  max-width: 100%;
  width: auto;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
}
.reader-popup__identity { flex: 1; min-width: 0; }
.reader-popup__identity h2 { font: 700 clamp(17px, 2vw, 24px)/1.15 Arial, sans-serif; margin: 0 0 5px; padding-right: 2px; overflow-wrap: anywhere; }
.reader-popup__handle { font-size: 11px; line-height: 1.4; color: #4f4442; margin: 0 0 10px; overflow-wrap: anywhere; }
.reader-popup__match-row { display: flex; align-items: center; gap: 6px; min-width: 0; }
.reader-popup__match-label { flex: none; border: 3px solid #25202a; background: #e9ca7a; color: #25202a; padding: 4px 5px; font: 800 10px/1 monospace; letter-spacing: .4px; }
.reader-popup__track { flex: 1; min-width: 22px; height: 12px; border: 3px solid #25202a; background: #e2dcd5; }
.reader-popup__fill { height: 100%; background: #527253; }
.reader-popup__score { flex: none; font: 800 15px/1 Arial, sans-serif; }
.reader-popup__info { margin: 12px 0; border: 3px solid #25202a; background: #fffbf1; padding: 10px; }
.reader-popup__info h3 { display: inline-block; margin: -3px 0 10px; padding: 4px 8px; border: 3px solid #25202a; background: #e9ca7a; font: 800 11px/1.2 Arial, sans-serif; letter-spacing: 1px; }
.reader-popup__genres { display: flex; flex-wrap: wrap; gap: 6px; }
.reader-popup__genre { display: inline-block; border: 2px solid #25202a; background: #915b3d; color: #fff9ed; padding: 5px 7px; font: 700 11px/1.2 Arial, sans-serif; }
.reader-popup__genre:nth-child(even) { background: #4f6541; }
.reader-popup__empty, .reader-popup__reading { margin: 8px 0 0; font-size: 11px; line-height: 1.4; }
.reader-popup__visit { width: 100%; min-height: 43px; border: 4px solid #25202a; border-radius: 0; background: #526c40; color: #fff8e5; font: 800 14px/1.3 Arial, sans-serif; cursor: pointer; box-shadow: 3px 3px 0 #25202a; }
.reader-popup__visit:hover { background: #405833; }
.reader-popup :focus-visible { outline: 3px solid #de9951; outline-offset: 2px; }
@media (max-width: 640px) {
  .reader-popup { padding: 9px; max-height: min(78dvh, 405px); }
  .reader-popup__top { gap: 8px; padding: 9px 30px 9px 9px; }
  .reader-popup__portrait { flex-basis: 56px; height: 70px; }
  .reader-popup__identity h2 { font-size: 16px; }
  .reader-popup__handle { font-size: 10px; margin-bottom: 8px; }
  .reader-popup__match-label { font-size: 9px; padding: 3px; }
  .reader-popup__score { font-size: 12px; }
  .reader-popup__info { margin: 8px 0; padding: 8px; }
  .reader-popup__genre { font-size: 10px; }
}
@media (prefers-reduced-motion: reduce) { .reader-popup { scroll-behavior: auto; } }
</style>
