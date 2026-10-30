<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import ReaderChat from '../components/people/ReaderChat.vue';
import { getCurrentlyReading, STATUS_LABELS } from '@/lib/readerMatch.js';
import { usePeopleStore } from '@/stores/people.js';

const route = useRoute();
const people = usePeopleStore();
const reader = ref(null);
const loading = ref(true);
const loadError = ref('');
const following = ref(false);
const error = ref('');
const filter = ref('All');
const statuses = ['All', ...Object.values(STATUS_LABELS)];
const currentBook = computed(() => reader.value ? getCurrentlyReading(reader.value) : null);
const sharedBooks = computed(() => reader.value ? people.sharedBooks(reader.value) : []);
const sharedGenres = computed(() => reader.value ? people.sharedGenres(reader.value) : []);
const filteredBooks = computed(() => (reader.value?.books ?? []).filter((book) => filter.value === 'All' || STATUS_LABELS[book.status] === filter.value));

async function load(id) {
  loading.value = true;
  loadError.value = '';
  filter.value = 'All';
  error.value = '';
  try {
    reader.value = await people.fetchReader(id);
    following.value = people.isFollowing(id);
  } catch (err) {
    reader.value = null;
    loadError.value = err.message || "Couldn't load this reader.";
  } finally {
    loading.value = false;
  }
}

watch(() => route.params.id, load, { immediate: true });

async function follow() {
  error.value = '';
  try { following.value = await people.toggleFollow(reader.value.id); }
  catch (err) { error.value = err.message || 'Could not save your follow.'; }
}
</script>

<template>
  <main class="reader-room">
    <RouterLink class="back-link" to="/people">← Back to Discover People</RouterLink>

    <template v-if="reader">
      <header class="profile-hero">
        <div class="avatar">{{ reader.initials }}</div>
        <div class="profile-details">
          <h1>{{ reader.displayName }}</h1>
          <p>@{{ reader.username }} · {{ reader.neighborhood }}</p>
          <span class="match">{{ people.compatibility(reader) }}% Reading Match</span>
        </div>
      </header>
      <p class="tagline">“{{ reader.tagline }}”</p>
      <RouterLink class="visit-room" :to="{ name: 'reader-house', params: { id: reader.id } }">
        <span aria-hidden="true">🏠</span> Visit {{ reader.displayName.split(' ')[0] }}'s room
      </RouterLink>
      <div class="actions">
        <button class="follow-button" @click="follow">{{ following ? '✓ Following' : '+ Follow Reader' }}</button>
        <a href="#reader-chat" class="message-button">💌 Leave a message</a>
      </div>
      <p v-if="error" class="error" role="alert">{{ error }}</p>

      <section class="info-panel">
        <h2>📖 Currently Reading</h2>
        <div v-if="currentBook" class="book-line"><div class="mini-cover">📗</div><div><strong>{{ currentBook.title }}</strong><span>by {{ currentBook.author }}</span><small>{{ currentBook.genre }}</small></div></div>
        <p v-else class="muted">Not currently reading a book.</p>
      </section>

      <section class="info-panel">
        <h2>💭 Reading Preferences</h2>
        <p class="muted">Favourite genres</p>
        <div class="tags"><span v-for="genre in reader.favoriteGenres" :key="genre" class="tag">{{ genre }}</span></div>
        <p class="muted" style="margin-top:12px">{{ sharedGenres.length }} genre(s) in common: {{ sharedGenres.join(', ') || 'None yet' }}</p>
      </section>

      <section class="info-panel">
        <h2>🤝 Books You Both Have</h2>
        <p class="muted">{{ sharedBooks.length }} shared book(s) with you</p>
        <div v-if="sharedBooks.length" class="book-list">
          <div v-for="book in sharedBooks" :key="book.id" class="book-line"><div class="mini-cover">📚</div><div><strong>{{ book.title }}</strong><span>by {{ book.author }}</span></div></div>
        </div>
        <p v-else class="muted">No shared books yet. Explore their shelf below!</p>
      </section>

      <section class="info-panel">
        <h2>📚 {{ reader.displayName }}'s Bookshelf</h2>
        <div class="filters" aria-label="Filter bookshelf by reading status">
          <button v-for="status in statuses" :key="status" type="button" :class="{ active: filter === status }" @click="filter = status">{{ status }}</button>
        </div>
        <div v-if="filteredBooks.length" class="book-list">
          <div v-for="book in filteredBooks" :key="book.id" class="book-line"><div class="mini-cover">📕</div><div><strong>{{ book.title }}</strong><span>by {{ book.author }}</span><small>{{ STATUS_LABELS[book.status] }}{{ book.genre ? ` · ${book.genre}` : '' }}</small></div></div>
        </div>
        <p v-else class="muted">No books in this category yet.</p>
      </section>

      <div id="reader-chat"><ReaderChat :key="reader.id" :reader-id="reader.id" :reader-name="reader.displayName" /></div>
      <p class="demo-note">Chat history is saved only in this browser.</p>
    </template>
    <p v-else-if="loading" class="muted" role="status">Loading reader…</p>
    <section v-else-if="loadError" class="info-panel" role="alert"><h1>Couldn't load this reader</h1><p>{{ loadError }}</p><button type="button" class="follow-button" @click="load(route.params.id)">Try again</button></section>
    <section v-else class="info-panel"><h1>Reader not found</h1><p>There's no reader at this address. Find readers in the Cafe.</p><RouterLink to="/people">Find readers →</RouterLink></section>
  </main>
</template>

<style scoped>
.reader-room{padding:20px 16px 95px;color:#40372f;font-family:inherit}.back-link{font-size:12px;color:#765f4d}.profile-hero{display:flex;align-items:center;gap:12px;margin:22px 0 10px}.avatar{width:60px;height:60px;border-radius:50%;background:#d6e7d5;color:#39714e;display:grid;place-items:center;font-size:19px;font-weight:700;flex-shrink:0}.profile-details{min-width:0}.profile-details h1{font-size:21px;line-height:1.2;margin:0 0 5px}.profile-details p{font-size:11px;color:#917f72;margin:0 0 7px}.match{display:inline-block;background:#2b925c;color:#fff;font-size:11px;font-weight:700;border-radius:15px;padding:4px 9px}.tagline{font-size:13px;font-style:italic;color:#806e62}.actions{display:flex;gap:9px;margin:18px 0}.actions>*{flex:1;text-align:center;padding:12px 9px;border-radius:12px;font-size:12px;text-decoration:none;font-weight:700;cursor:pointer}.follow-button{border:0;color:white;background:#745d4e}.message-button{border:1px solid #d8c4d7;background:#f0e6ee;color:#705574}.info-panel{padding:15px;background:#fffdf8;border:1px solid #e6dccf;border-radius:17px;margin-top:18px}.info-panel h2{font-size:16px;margin:0 0 13px}.muted{font-size:12px;color:#8b7b6d}.tags,.filters{display:flex;gap:6px;flex-wrap:wrap}.tag{background:#f2e6d9;border-radius:20px;padding:6px 10px;font-size:11px}.book-list{display:flex;flex-direction:column;gap:11px}.book-line{display:flex;align-items:center;gap:12px;margin:8px 0}.mini-cover{height:59px;width:42px;border-radius:5px;background:#d9e5dd;display:grid;place-items:center;font-size:20px;flex-shrink:0}.book-line strong,.book-line span,.book-line small{display:block}.book-line strong{font-size:13px}.book-line span{font-size:11px;color:#837467;margin:4px 0}.book-line small{font-size:10px;color:#68826c}.filters{margin-bottom:15px}.filters button{padding:7px 9px;font-size:11px;background:#f5ede4;border:1px solid #e5d8c8;border-radius:10px;cursor:pointer}.filters button.active{background:#745d4e;color:#fff}.demo-note{font-size:10px;color:#938173}.error{font-size:12px;color:#ac3434}.visit-room{display:block;margin-top:16px;padding:13px;border-radius:12px;background:#4f6f52;color:#fff;font-size:13px;font-weight:700;text-align:center;text-decoration:none}
</style>
