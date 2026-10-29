<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The landing page's first screen: the real town map drifting slowly behind a wash of warm paper,
// the IKDA sign (blue with a gold shadow) with 읽다, the Korean word it comes from, the slogan, what the app does, and the way in. At the
// bottom the map fades away into the evening sky behind the rest of the page (StartBackdrop).
import StartTownScene from './StartTownScene.vue'
import StartActions from './StartActions.vue'

const emit = defineEmits(['choose', 'how'])
</script>

<template>
  <section id="start-home" class="hero" aria-labelledby="start-title">
    <div class="hero__town" aria-hidden="true">
      <StartTownScene />
      <div class="hero__wash" />
    </div>
    <div class="hero__inner" data-fade>
      <h1 id="start-title" class="hero__wordmark">IKDA</h1>
      <p class="hero__korean"><span lang="ko">읽다</span> · to read</p>
      <p class="hero__slogan">Social media, but for book lovers.</p>
      <p class="hero__lede">
        Shelve what you're reading, find your next favourite book, and meet readers who love the
        same books.
      </p>
      <StartActions how @choose="emit('choose')" @how="emit('how')" />
      <p class="hero__note">Free, in your browser, and made for your phone.</p>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 100%;
  padding: 100px 20px 120px;
  overflow: hidden;
}

/* the map, fading out at the bottom into the sky behind */
.hero__town {
  position: absolute;
  inset: 0;
  -webkit-mask-image: linear-gradient(180deg, #000 calc(100% - 160px), transparent 100%);
  mask-image: linear-gradient(180deg, #000 calc(100% - 160px), transparent 100%);
}

/* warm paper over the left of the map so the words read clearly */
.hero__wash {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(255, 248, 239, 0.78) 0%, rgba(255, 248, 239, 0.55) 40%, rgba(255, 248, 239, 0) 68%);
}

.hero__inner {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
  color: #4a3530;
}

.hero__slogan,
.hero__lede,
.hero__note,
.hero__inner :deep(.actions__login) {
  text-shadow: 0 0 6px rgba(255, 248, 239, 0.95), 0 0 14px rgba(255, 248, 239, 0.8);
}

.hero__wordmark {
  margin: 0;
  font-family: var(--rl-font-title);
  font-size: clamp(80px, 16vw, 176px);
  font-weight: 700;
  line-height: 0.95;
  letter-spacing: 0.02em;
  color: var(--s-blue);
  text-shadow: 0 0.06em 0 var(--s-gold), 0.02em 0.09em 0 var(--s-ink);
}

/* the Korean word the name comes from, and what it means, as on the loading screen */
.hero__korean {
  margin: 14px 0 0;
  font-family: var(--s-ui);
  font-size: clamp(20px, 2.4vw, 26px);
  font-weight: 800;
  text-shadow: 0 0 6px rgba(255, 248, 239, 0.95), 0 0 14px rgba(255, 248, 239, 0.8);
}

.hero__korean span {
  color: var(--s-blue);
}

.hero__slogan {
  margin: 18px 0 8px;
  font-family: var(--rl-font-title);
  font-size: clamp(26px, 3.4vw, 38px);
  font-weight: 700;
  line-height: 1.2;
}

.hero__lede {
  max-width: 42ch;
  margin: 0 0 28px;
  font-size: clamp(18px, 2vw, 21px);
  line-height: 1.6;
}

.hero__note {
  margin: 8px 0 0;
  color: #5e4a44;
  font-size: 14px;
}

@media (max-width: 575px) {
  .hero {
    padding-top: 124px;
  }
}

@media (max-width: 767px) {
  .hero__wash {
    background:
      linear-gradient(180deg, rgba(255, 248, 239, 0.75) 0%, rgba(255, 248, 239, 0.62) 60%, rgba(255, 248, 239, 0.3) 100%);
  }
}
</style>
