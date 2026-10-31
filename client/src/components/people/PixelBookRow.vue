<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// A book on a reader's profile: a small closed pixel book in its genre's colour, then its title and
// "by" its author. The picture is decorative; the title says what it is. The slot goes under the
// author (Currently Reading puts the genre chip there).
import { computed } from 'vue'
import { R, mk, outline } from '@/lib/avatar/draw.js'
import { genreColour } from './genreColour.js'
import { shade } from '@/buildings/library/hall/pixel.js'
import { PAL } from '@/buildings/library/hall/palette.js'

const props = defineProps({
  title: { type: String, required: true },
  author: { type: String, default: '' },
  genre: { type: String, default: '' },
})

// 14 x 20: the cover, a darker spine down the left, a band across it and a paper label
function drawBook(colour) {
  const [c, x] = mk(14, 20)
  R(x, 0, 0, 14, 20, colour)
  R(x, 0, 0, 3, 20, shade(colour, 0.75))
  R(x, 3, 4, 11, 2, shade(colour, 0.75))
  R(x, 5, 9, 7, 5, PAL.paper)
  R(x, 6, 10, 5, 1, PAL.paperShade)
  R(x, 6, 12, 4, 1, PAL.paperShade)
  return outline(c).toDataURL('image/png')
}

const picture = computed(() => drawBook(genreColour(props.genre)))
</script>

<template>
  <div class="book-row">
    <img class="book-row__book" :src="picture" alt="" aria-hidden="true" width="48" height="66" />
    <div class="book-row__text">
      <p class="book-row__title">{{ title }}</p>
      <p v-if="author" class="book-row__author">by {{ author }}</p>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.book-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 16 x 22 drawn at three times its size, with hard edges */
.book-row__book {
  flex-shrink: 0;
  image-rendering: pixelated;
}

.book-row__text {
  min-width: 0;
}

.book-row__title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 16px;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.book-row__author {
  margin: 2px 0 6px;
  font-size: 13px;
  color: var(--profile-ink-soft);
}
</style>
