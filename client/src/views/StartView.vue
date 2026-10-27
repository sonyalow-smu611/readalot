<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The landing page a first-time visitor sees before signing in: the town, a tagline, a way to
// sign up, and a quick tour of the buildings. Leaving through Sign up or Log in remembers it has
// been seen (lib/landing.js), so after that the router sends visitors straight to sign in.
import { PLACES } from '@/town/places.js'
import { markLandingSeen } from '@/lib/landing.js'
import StartTownScene from '@/components/start/StartTownScene.vue'
import FeatureCard from '@/components/start/FeatureCard.vue'

const LINES = {
  house: 'Your own room, and a shelf for every book you read.',
  library: 'Find your next book by genre, or search for any title.',
  cafe: 'Meet readers nearby who share your taste.',
  salon: 'Make your character and dress them your way.',
}

const features = PLACES.map((place) => ({
  id: place.id,
  title: place.name,
  line: LINES[place.id],
  accent: place.accent,
  image: `/town/buildings/${place.id}.png`,
}))
</script>

<template>
  <div class="start">
    <section class="start__hero" aria-labelledby="start-title">
      <StartTownScene />
      <div class="start__pitch">
        <p class="start__brand">Readalot</p>
        <h1 id="start-title" class="start__tagline">Move in. Read more. Meet readers.</h1>
        <RouterLink :to="{ name: 'register' }" class="btn btn-primary btn-lg w-100" @click="markLandingSeen">
          Sign up
        </RouterLink>
        <p class="start__login">
          Already have an account?
          <RouterLink :to="{ name: 'login' }" @click="markLandingSeen">Log in</RouterLink>
        </p>
      </div>
    </section>

    <section class="start__tour" aria-labelledby="start-tour-title">
      <h2 id="start-tour-title" class="start__tour-title">What's in town</h2>
      <ul class="start__features">
        <FeatureCard
          v-for="feature in features"
          :key="feature.id"
          :title="feature.title"
          :line="feature.line"
          :accent="feature.accent"
          :image="feature.image"
        />
        <FeatureCard title="Scan a book" line="Snap a cover to find the book and add it." accent="#5f7f4a">
          <svg class="start__scan" viewBox="0 0 24 24">
            <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16" />
          </svg>
        </FeatureCard>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.start {
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  background: var(--rl-canvas);
}

.start__hero {
  position: relative;
  flex: 1 0 auto;
  /* on a phone, enough town shows above the card before the tour */
  min-height: max(440px, 70svh);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 16px;
}

.start__pitch {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 400px;
  padding: 18px 18px 14px;
  border: 1px solid var(--rl-line);
  border-radius: var(--rl-radius-modal);
  background: var(--rl-surface);
  box-shadow: 0 14px 36px rgba(63, 46, 36, 0.25);
  text-align: center;
}

.start__brand {
  margin: 0 0 2px;
  color: var(--rl-accent);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

.start__tagline {
  margin: 0 0 14px;
  font-family: var(--rl-font-title);
  font-size: 26px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--rl-text);
}

.start__login {
  margin: 10px 0 0;
  font-size: 14px;
  color: var(--rl-muted);
}

.start__tour {
  padding: 20px 16px 24px;
}

.start__tour-title {
  margin: 0 0 12px;
  font-family: var(--rl-font-title);
  font-size: 20px;
  font-weight: 700;
  color: var(--rl-text);
}

.start__features {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.start__scan {
  width: 64px;
  height: 64px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* On a laptop the whole page fits one screen: the town above, the five stops in one row. */
@media (min-width: 992px) {
  .start__hero {
    flex: 1 1 auto;
    min-height: 360px;
    align-items: center;
  }

  .start__tour {
    width: 100%;
    max-width: 1120px;
    margin: 0 auto;
    padding: 16px 24px 20px;
  }

  .start__features {
    grid-template-columns: repeat(5, 1fr);
  }
}
</style>
