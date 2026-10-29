<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// A shelf of well-known books for the landing page's hero, so the first thing a visitor sees is
// books. Hover a book and it comes half off the shelf. A stack lying down at the end and a
// plant, on a wooden ledge. Only for show: it stays away from screen readers.
import StartBookRow from './StartBookRow.vue'

const BOOKS = [
  { title: 'Pride & Prejudice', colour: '#8c3b3b', w: 34, h: 128 },
  { title: 'Dune', colour: '#c98a3a', w: 30, h: 112 },
  { title: 'Little Women', colour: '#4f6f8f', w: 32, h: 120 },
  { title: '1984', colour: '#2f2f3a', w: 26, h: 104 },
  { title: 'The Hobbit', colour: '#5f7f4a', w: 36, h: 124 },
  { title: 'Jane Eyre', colour: '#7a4f7a', w: 30, h: 116 },
  { title: 'Circe', colour: '#d0a64a', w: 28, h: 108 },
  { title: 'Matilda', colour: '#c4554d', w: 30, h: 100 },
  { title: 'Beloved', colour: '#3d5a5a', w: 30, h: 122 },
]
</script>

<template>
  <div class="shelf" aria-hidden="true">
    <StartBookRow class="shelf__row" :books="BOOKS">
      <img class="shelf__stack" src="/room/strip/book-stack.png" alt="" />
      <img class="shelf__plant" src="/room/strip/plant-pot-small.png" alt="" />
    </StartBookRow>
    <div class="shelf__ledge" />
  </div>
</template>

<style scoped>
.shelf {
  display: inline-block;
  margin: 0 auto 26px;
  translate: calc(var(--px, 0) * 8px) calc(var(--py, 0) * 5px);
}

.shelf__row {
  padding: 0 14px;
}

.shelf__stack,
.shelf__plant {
  image-rendering: pixelated;
}

.shelf__stack {
  width: 60px;
  height: 48px;
  margin-left: 8px;
}

.shelf__plant {
  width: 54px;
  height: 66px;
  margin-left: 6px;
}

.shelf__ledge {
  height: 12px;
  background: #a8743f;
  box-shadow: inset 0 -4px 0 #7d5330, 0 6px 0 rgba(30, 26, 36, 0.35);
}

/* phones: fewer books so the shelf fits */
@media (max-width: 575px) {
  .shelf :deep(.row__spine:nth-child(n + 7)),
  .shelf__plant {
    display: none;
  }
}
</style>
