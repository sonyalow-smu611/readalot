<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// Questions people ask before they sign up, each one opening on its own card.
import StartSection from './StartSection.vue'
import StartPanel from './StartPanel.vue'

const QUESTIONS = [
  { q: 'Is IKDA free?', a: 'Yes. Sign up with your email and start reading. Coins are earned in the app, never bought.' },
  { q: 'Do I need to download anything?', a: 'No. IKDA runs in your browser and is made for your phone, so it works on any device.' },
  { q: 'Who can see my profile?', a: 'No other reader can find you until you switch on “Show me on the People map” in the Hair Salon. You can switch it off any time.' },
  { q: 'What does IKDA mean?', a: 'It comes from 읽다 (ikda), the Korean word for “to read”.' },
  { q: 'Where do the books come from?', a: 'Search and scanning use Google Books, so almost any book you can think of is there.' },
  { q: 'I only read a few books a year. Is it for me?', a: 'Yes. Adding a book, starting it and visiting a friend all earn XP, so every bit of reading counts.' },
]
</script>

<template>
  <StartSection id="faq" title="Questions before you move in" centred>
    <div class="faq">
      <StartPanel v-for="(item, i) in QUESTIONS" :key="item.q" tag="details" class="qa" :open="i === 0">
        <summary class="qa__q">{{ item.q }}</summary>
        <p class="qa__a">{{ item.a }}</p>
      </StartPanel>
    </div>
  </StartSection>
</template>

<style scoped>
.faq {
  text-align: left;
}

.qa {
  margin-bottom: 14px;
}

.qa__q {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 56px;
  padding: 12px 20px;
  font-family: var(--rl-font-title);
  font-size: 19px;
  font-weight: 700;
  list-style: none;
  cursor: pointer;
}

.qa__q::-webkit-details-marker {
  display: none;
}

.qa__q::after {
  content: '+';
  flex: none;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border: 3px solid var(--s-ink);
  border-radius: 4px;
  font-family: var(--rl-font-body);
}

.qa[open] .qa__q::after {
  content: '–';
  background: var(--s-ink);
  color: var(--s-paper);
}

.qa__a {
  margin: 0;
  padding: 0 20px 18px;
  line-height: 1.55;
}
</style>
