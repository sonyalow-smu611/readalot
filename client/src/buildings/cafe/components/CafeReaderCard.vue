<script setup>
// AI-assisted view scaffold; receives data via props and reports actions via events.
defineProps({
  reader: { type: Object, required: true },
  score: { type: Number, required: true },
  sharedBooks: { type: Array, default: () => [] },
  currentlyReading: { type: Object, default: null },
  following: { type: Boolean, default: false },
  error: { type: String, default: '' },
})
const emit = defineEmits(['close', 'visit', 'follow'])
</script>

<template>
  <aside class="cafe-card" role="dialog" aria-modal="false" :aria-label="`Meet ${reader.displayName}`">
    <button type="button" class="cafe-card__close" aria-label="Close reader card" @click="emit('close')">×</button>
    <p class="cafe-card__overline">☕ A FELLOW BOOKWORM</p>
    <div class="cafe-card__identity">
      <span class="cafe-card__avatar" aria-hidden="true">{{ reader.initials }}</span>
      <div>
        <h2>{{ reader.displayName }}</h2>
        <span class="cafe-card__match">{{ score }}% reading match</span>
      </div>
    </div>
    <p class="cafe-card__tagline">“{{ reader.tagline }}”</p>
    <p class="cafe-card__small"><strong>Favourite genres:</strong> {{ reader.favoriteGenres.join(' · ') }}</p>
    <p class="cafe-card__small"><strong>Currently reading:</strong> {{ currentlyReading?.title || 'Picking the next book!' }}</p>
    <p class="cafe-card__small"><strong>Shared books:</strong> {{ sharedBooks.length ? sharedBooks.map((book) => book.title).join(', ') : 'None yet' }}</p>
    <p v-if="error" class="cafe-card__error" role="alert">{{ error }}</p>
    <div class="cafe-card__actions">
      <button type="button" class="cafe-card__visit" @click="emit('visit')">Visit Room →</button>
      <button type="button" class="cafe-card__follow" @click="emit('follow')">
        {{ following ? '✓ Following' : '+ Follow' }}
      </button>
    </div>
    <p class="cafe-card__note">Demo readers only · Following is saved in this browser</p>
  </aside>
</template>

<style scoped>
.cafe-card { position:absolute; z-index:20; top:clamp(8px, 12%, 90px); left:50%; transform:translateX(-50%); width:min(305px, calc(100% - 30px)); max-height:calc(100% - 28px); overflow:auto; padding:14px; background:#fffaf0; border:3px solid #513a2c; border-radius:12px; box-shadow:5px 5px 0 #513a2c, 0 15px 35px #23150e52; color:#35291f; }
.cafe-card__overline { margin:0 26px 10px 0; font:bold 10px monospace; letter-spacing:1px; color:#9a6a45; }
.cafe-card__close { position:absolute; top:8px; right:9px; display:grid; place-items:center; width:32px; height:32px; border:1px solid #b79b80; border-radius:7px; background:#f8e9d4; font-size:23px; line-height:1; }
.cafe-card__identity { display:flex; align-items:center; gap:12px; }
.cafe-card__avatar { flex:none; display:grid; place-items:center; width:46px; height:46px; border:2px solid #35694d; border-radius:9px; background:#c9dfc4; color:#26573e; font:bold 17px monospace; }
.cafe-card__identity h2 { margin:0 0 5px; font-family:var(--rl-font-title, Georgia, serif); font-size:19px; line-height:1.1; }
.cafe-card__match { display:inline-block; padding:4px 7px; background:#2b7855; color:white; border-radius:4px; font-size:11px; font-weight:800; }
.cafe-card__tagline { margin:13px 0; font-size:12px; color:#765d4a; font-style:italic; }
.cafe-card__small { margin:7px 0; font-size:11px; line-height:1.5; }
.cafe-card__actions { display:flex; gap:8px; margin-top:14px; }
.cafe-card__actions button { flex:1; min-height:40px; border-radius:7px; border:2px solid #315e44; font-size:12px; font-weight:700; }
.cafe-card__visit { background:#315e44; color:white; }
.cafe-card__follow { background:#f7eddb; color:#315e44; }
.cafe-card__note { margin:10px 0 0; font-size:9px; color:#8c7968; }
.cafe-card__error { color:#ad3f38; font-size:11px; }
</style>
