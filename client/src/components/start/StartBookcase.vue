<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The "Your bookshelf" stop's scene: a big wooden bookcase with the three shelves a reader has
// (Want to read, Reading, Finished), each full of books that come half off when hovered. The
// books being read have a ribbon and how far through they are; finished ones have a star.
// Dressed up to feel lived in: bunting along the top, fairy lights on a ledge, a black cat asleep
// on the Reading shelf, a little cactus in flower, a candle, a photo and plants.
import StartBookRow from './StartBookRow.vue'

// one of the room's sprites at 3x (public/room/strip/<name>.png, w x h in art pixels)
const sprite = (name, w, h) => ({ src: `/room/strip/${name}.png`, w: w * 3, h: h * 3 })

const SHELVES = [
  {
    label: 'Want to read',
    books: [
      { title: 'Circe', colour: '#d0a64a', w: 30, h: 112 },
      { title: 'Educated', colour: '#4f6f8f', w: 34, h: 124 },
      { title: 'Normal People', colour: '#c4554d', w: 30, h: 118 },
      { title: 'The Midnight Library', colour: '#2f3a5a', w: 38, h: 128 },
      { title: 'Piranesi', colour: '#5f7f4a', w: 28, h: 106 },
      { title: 'Babel', colour: '#8c3b3b', w: 36, h: 126 },
      { title: 'Klara and the Sun', colour: '#d9a86a', w: 32, h: 116 },
      { title: 'Tomorrow, and Tomorrow', colour: '#6d5a7a', w: 38, h: 130 },
    ],
    decor: [sprite('photo-small', 15, 17), sprite('plant-pot-small', 18, 22)],
  },
  {
    label: 'Reading',
    books: [
      { title: 'Dune', colour: '#c98a3a', w: 40, h: 128, mark: 'reading' },
      { title: 'The Hobbit', colour: '#3d6a4a', w: 36, h: 120, mark: 'reading' },
    ],
    progress: [
      { title: 'Dune', percent: 62 },
      { title: 'The Hobbit', percent: 28 },
    ],
    decor: [{ cat: true }, sprite('mug', 12, 11)],
  },
  {
    label: 'Finished',
    books: [
      { title: 'Pride & Prejudice', colour: '#8c3b3b', w: 34, h: 126, mark: 'finished' },
      { title: 'Little Women', colour: '#4f6f8f', w: 32, h: 120, mark: 'finished' },
      { title: '1984', colour: '#2f2f3a', w: 26, h: 104, mark: 'finished' },
      { title: 'Jane Eyre', colour: '#7a4f7a', w: 30, h: 116, mark: 'finished' },
      { title: 'Matilda', colour: '#c4554d', w: 30, h: 100, mark: 'finished' },
      { title: 'Beloved', colour: '#3d5a5a', w: 30, h: 122, mark: 'finished' },
      { title: 'The Alchemist', colour: '#d9c48a', w: 28, h: 110, mark: 'finished' },
    ],
    decor: [{ cactus: true }, sprite('candle', 8, 14), sprite('book-stack', 20, 16)],
  },
]
</script>

<template>
  <div class="case" aria-hidden="true">
    <span class="case__bunting" />
    <div v-for="(shelf, i) in SHELVES" :key="shelf.label" class="case__shelf">
      <span class="case__label">{{ shelf.label }}</span>
      <div class="case__books">
        <StartBookRow :books="shelf.books" />
        <!-- how far through each book being read -->
        <div v-if="shelf.progress" class="case__progress">
          <div v-for="item in shelf.progress" :key="item.title" class="case__bar">
            <span class="case__bar-title">{{ item.title }}</span>
            <span class="case__bar-track"><span class="case__bar-fill" :style="{ width: `${item.percent}%` }" /></span>
            <span class="case__bar-percent">{{ item.percent }}%</span>
          </div>
        </div>
        <div class="case__decor">
          <template v-for="(item, j) in shelf.decor" :key="j">
            <!-- a black cat curled up asleep, breathing slowly, with z's drifting up -->
            <span v-if="item.cat" class="case__cat">
              <span class="case__zzz">z</span>
              <span class="case__zzz case__zzz--2">z</span>
            </span>
            <!-- a little potted cactus with a pink flower, drawn a pixel at a time -->
            <svg v-else-if="item.cactus" class="case__cactus" viewBox="0 0 16 22" shape-rendering="crispEdges">
              <rect x="6" y="5" width="5" height="11" fill="#5f9a4a" />
              <rect x="7" y="4" width="3" height="1" fill="#5f9a4a" />
              <rect x="7" y="6" width="1" height="9" fill="#86c26a" />
              <rect x="10" y="5" width="1" height="11" fill="#4a7a3a" />
              <rect x="2" y="7" width="3" height="5" fill="#5f9a4a" />
              <rect x="2" y="11" width="4" height="2" fill="#5f9a4a" />
              <rect x="3" y="8" width="1" height="3" fill="#86c26a" />
              <rect x="12" y="6" width="3" height="4" fill="#5f9a4a" />
              <rect x="11" y="9" width="4" height="2" fill="#5f9a4a" />
              <rect x="14" y="6" width="1" height="5" fill="#4a7a3a" />
              <rect x="8" y="8" width="1" height="1" fill="#fffdf9" />
              <rect x="9" y="11" width="1" height="1" fill="#fffdf9" />
              <rect x="8" y="14" width="1" height="1" fill="#fffdf9" />
              <rect x="7" y="1" width="3" height="3" fill="#f28fb0" />
              <rect x="6" y="2" width="5" height="1" fill="#f28fb0" />
              <rect x="8" y="2" width="1" height="1" fill="#f6d36a" />
              <rect x="3" y="15" width="11" height="2" fill="#a8483a" />
              <rect x="4" y="17" width="9" height="5" fill="#c9674a" />
              <rect x="4" y="17" width="9" height="1" fill="#a8483a" />
            </svg>
            <img v-else :src="item.src" :style="{ width: `${item.w}px`, height: `${item.h}px` }" alt="" />
          </template>
        </div>
      </div>
      <!-- fairy lights draped along the Reading shelf -->
      <div class="case__ledge" :class="{ 'case__ledge--lights': i === 1 }" />
    </div>
  </div>
</template>

<style scoped>
/* a wooden bookcase: a dark back, a frame, and a ledge under each shelf */
.case {
  position: relative;
  width: min(100%, 760px);
  padding: 34px 22px 0;
  background: #5c4030;
  border: 8px solid #7d5330;
  box-shadow: inset 0 0 0 4px #4a3226, 10px 10px 0 rgba(30, 26, 36, 0.35);
  transform: perspective(1200px) rotateY(calc(var(--px, 0) * 3deg)) rotateX(calc(var(--py, 0) * -3deg));
}

.case__shelf {
  position: relative;
  padding-top: 30px;
}

/* the shelf under the fairy lights sits a little lower so they don't cover its plate */
.case__shelf:last-child {
  padding-top: 50px;
}

.case__shelf:last-child .case__label {
  top: 26px;
}

/* a brass name plate on each shelf */
.case__label {
  position: absolute;
  top: 6px;
  left: 0;
  padding: 2px 10px;
  background: #d9b56a;
  color: #4a3226;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
  box-shadow: inset 0 -2px 0 #b8924a, 2px 2px 0 rgba(0, 0, 0, 0.3);
}

.case__books {
  display: flex;
  align-items: flex-end;
  gap: 14px;
  min-height: 130px;
  overflow: visible;
}

.case__decor {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  margin-left: auto;
}

.case__decor img,
.case__cat {
  image-rendering: pixelated;
}

/* bunting strung across the top of the bookcase */
.case__bunting {
  position: absolute;
  top: -4px;
  left: 0;
  right: 0;
  height: 36px;
  background: url('/room/strip/bunting.png') repeat-x 0 0 / 244px 36px;
  image-rendering: pixelated;
  pointer-events: none;
}

/* the cat's sleeping frame (the fourth on its sheet), at 3x, breathing slowly */
.case__cat {
  position: relative;
  width: 96px;
  height: 60px;
  background: url('/room/strip/cat-black.png') no-repeat -288px 0 / 390px 60px;
  transform-origin: 50% 100%;
  animation: case-breathe 2.8s steps(2, end) infinite;
}

@keyframes case-breathe {
  50% { transform: scaleY(1.06); }
}

.case__zzz {
  position: absolute;
  top: -6px;
  right: 18px;
  color: #fffdf9;
  font-family: var(--rl-font-title);
  font-size: 16px;
  font-weight: 700;
  opacity: 0;
  animation: case-zzz 2.8s steps(6, end) infinite;
}

.case__zzz--2 {
  right: 6px;
  font-size: 12px;
  animation-delay: 1.4s;
}

@keyframes case-zzz {
  0% { opacity: 0; transform: translate(0, 0); }
  20% { opacity: 1; }
  100% { opacity: 0; transform: translate(10px, -26px); }
}

.case__cactus {
  width: 48px;
  height: 66px;
}

/* fairy lights hanging from the front of a ledge, twinkling */
.case__ledge--lights {
  position: relative;
}

.case__ledge--lights::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 6px;
  height: 28px;
  background: url('/room/strip/fairy-lights.png') repeat-x 0 0 / 412px 28px;
  image-rendering: pixelated;
  animation: case-twinkle 1.6s steps(2, end) infinite;
  pointer-events: none;
}

@keyframes case-twinkle {
  50% { filter: brightness(1.35); }
}

.case__ledge {
  height: 14px;
  margin: 0 -22px 10px;
  background: #a8743f;
  box-shadow: inset 0 -5px 0 #7d5330;
}

.case__shelf:last-child .case__ledge {
  margin-bottom: 0;
}

/* progress cards next to the books being read */
.case__progress {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 14px;
}

.case__bar {
  display: grid;
  grid-template-columns: 96px 150px 40px;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: #fffdf9;
  color: #1e1a24;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.3);
}

.case__bar-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.case__bar-track {
  height: 8px;
  background: #e6dccb;
}

.case__bar-fill {
  display: block;
  height: 100%;
  background: #5f7f4a;
}

.case__bar-percent {
  text-align: right;
}

/* phones: fewer books, and the progress cards drop their bars */
@media (prefers-reduced-motion: reduce) {
  .case__cat,
  .case__zzz,
  .case__ledge--lights::after {
    animation: none;
  }
}

@media (max-width: 575px) {
  .case {
    padding: 10px 12px 0;
  }

  .case__ledge {
    margin: 0 -12px 10px;
  }

  .case :deep(.row__spine:nth-child(n + 6)),
  .case__decor img {
    display: none;
  }

  .case__bar {
    grid-template-columns: 70px 30px;
  }

  .case__bar-track {
    display: none;
  }
}
</style>
