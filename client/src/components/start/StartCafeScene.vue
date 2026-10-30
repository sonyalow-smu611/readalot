<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The cafe stop's scene: the cafe with two tables out front, a pair of readers at each with
// books and mugs, chatting about what they read. Speech bubbles take turns, a match score pops
// up between each pair, showing readers meeting over the same books.
const TABLES = [
  {
    x: 18,
    readers: ['ivy', 'leo'],
    lines: ['Have you read Circe?', 'Loved it!'],
    match: '92% match',
    delay: 0,
  },
  {
    x: 248,
    readers: ['theo', 'luna'],
    lines: ['What are you reading?', 'Dune, 62% in!'],
    match: '87% match',
    delay: 2.4,
  },
]
</script>

<template>
  <div class="cafe">
    <img class="cafe__building" src="/town/buildings/cafe.png" alt="" />
    <div v-for="table in TABLES" :key="table.readers[0]" class="cafe__table" :style="{ left: `${table.x}px`, '--delay': `${table.delay}s` }">
      <img class="cafe__reader cafe__reader--left" :src="`/town/avatars/${table.readers[0]}.png`" alt="" />
      <div class="cafe__top">
        <img class="cafe__book" src="/room/strip/open-book.png" alt="" />
        <img class="cafe__mug" src="/room/strip/mug.png" alt="" />
      </div>
      <img class="cafe__reader cafe__reader--right" :src="`/town/avatars/${table.readers[1]}.png`" alt="" />

      <p class="cafe__bubble cafe__bubble--left">{{ table.lines[0] }}</p>
      <p class="cafe__bubble cafe__bubble--right">{{ table.lines[1] }}</p>
      <p class="cafe__match">♥ {{ table.match }}</p>
    </div>
  </div>
</template>

<style scoped>
.cafe {
  position: absolute;
  inset: 0;
  overflow: hidden;
  /* evening sky above the square's paving */
  background:
    linear-gradient(180deg, #f6c79a 0 54%, transparent 54%),
    repeating-conic-gradient(#e2d6c4 0 25%, #d8cbb6 0 50%) 0 0 / 16px 16px;
}

.cafe img {
  image-rendering: pixelated;
}

.cafe__building {
  position: absolute;
  left: 50%;
  bottom: 92px;
  width: 241px;
  height: 194px;
  margin-left: -120px;
}

/* one table with a reader either side, 194px wide */
.cafe__table {
  position: absolute;
  bottom: 12px;
  width: 194px;
  height: 200px;
}

.cafe__reader {
  position: absolute;
  bottom: 0;
  width: 48px;
  height: 93px;
}

.cafe__reader--left { left: 0; }
.cafe__reader--right { right: 0; }

/* a small round cafe table: a wooden top on one leg */
.cafe__top {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 84px;
  height: 54px;
  margin-left: -42px;
  background:
    linear-gradient(#7d5330, #7d5330) 50% 100% / 10px 40px no-repeat,
    linear-gradient(#a8743f, #a8743f) 50% 14px / 84px 10px no-repeat;
}

.cafe__book {
  position: absolute;
  left: 8px;
  top: 4px;
  width: 52px;
  height: 20px;
}

.cafe__mug {
  position: absolute;
  right: 6px;
  top: -2px;
  width: 24px;
  height: 22px;
}

/* the two take turns talking, then the match score pops up between them */
.cafe__bubble,
.cafe__match {
  position: absolute;
  margin: 0;
  padding: 5px 8px;
  border: 3px solid #1e1a24;
  background: #fffdf9;
  color: #1e1a24;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  box-shadow: 3px 3px 0 rgba(30, 26, 36, 0.25);
  opacity: 0;
  animation: cafe-say 4.8s steps(1, end) infinite;
  animation-delay: var(--delay);
}

.cafe__bubble--left {
  left: 0;
  bottom: 104px;
}

.cafe__bubble--right {
  right: 0;
  bottom: 136px;
  animation-delay: calc(var(--delay) + 1.2s);
}

.cafe__match {
  left: 50%;
  bottom: 66px;
  translate: -50% 0;
  border-color: #b8574a;
  background: #b8574a;
  color: #fffdf9;
  animation-delay: calc(var(--delay) + 2.4s);
}

@keyframes cafe-say {
  0% { opacity: 1; }
  40% { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .cafe__bubble,
  .cafe__match {
    animation: none;
    opacity: 1;
  }

  .cafe__bubble--right {
    display: none;
  }
}
</style>
