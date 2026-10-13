<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import ReaderChat from '../components/people/ReaderChat.vue';
import {
  myDemoProfile, getDemoReader, getCompatibility, getCurrentlyReading,
  getSharedBooks, getSharedGenres, isFollowing, toggleFollow,
} from '../services/peopleDemo.js';

const route = useRoute();
const reader = computed(() => getDemoReader(route.params.id));
const following = ref(false);
const error = ref('');
const filter = ref('All');
const statuses = ['All', 'Reading', 'To Read', 'Finished'];
const currentBook = computed(() => reader.value ? getCurrentlyReading(reader.value) : null);
const sharedBooks = computed(() => reader.value ? getSharedBooks(reader.value) : []);
const sharedGenres = computed(() => reader.value ? getSharedGenres(reader.value) : []);
const filteredBooks = computed(() => (reader.value?.books ?? []).filter((book) => filter.value === 'All' || book.status === filter.value));
watch(() => route.params.id, (id) => {
  following.value = isFollowing(id);
  filter.value = 'All';
  error.value = '';
}, { immediate: true });
function follow() {
  error.value = '';
  try { following.value = toggleFollow(reader.value.id); }
  catch (err) { error.value = err.message; }
}
</script>

<template>
  <main class="reader-room">
    <RouterLink class="back-link" to="/people">← Back to Discover People</RouterLink>

    <template v-if="reader">
      <header class="profile-hero">
        <div class="avatar">{{ reader.initials }}</div>
        <div class="profile-details">
          <h1>{{ reader.displayName }}'s Room</h1>
          <p>@{{ reader.username }} · {{ reader.neighborhood }}</p>
          <span class="match">{{ getCompatibility(reader) }}% Reading Match</span>
        </div>
      </header>
      <p class="tagline">“{{ reader.tagline }}”</p>
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
        <p class="muted">{{ sharedBooks.length }} shared book(s) with {{ myDemoProfile.displayName }}</p>
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
          <div v-for="book in filteredBooks" :key="book.id" class="book-line"><div class="mini-cover">📕</div><div><strong>{{ book.title }}</strong><span>by {{ book.author }}</span><small>{{ book.status }} · {{ book.genre }}</small></div></div>
        </div>
        <p v-else class="muted">No books in this category yet.</p>
      </section>

      <div id="reader-chat"><ReaderChat :key="reader.id" :reader-id="reader.id" :reader-name="reader.displayName" /></div>
      <p class="demo-note">Demo mode: fictional profiles; follows and chat history are saved only in this browser.</p>
    </template>
    <section v-else class="info-panel"><h1>Reader not in demo</h1><p>This local prototype contains four sample readers. Return to Discover People to visit one.</p><RouterLink to="/people">Browse sample readers →</RouterLink></section>
  </main>
</template>

<style scoped>
.reader-room{padding:20px 16px 95px;color:#40372f;font-family:inherit}.back-link{font-size:12px;color:#765f4d}.profile-hero{display:flex;align-items:center;gap:12px;margin:22px 0 10px}.avatar{width:60px;height:60px;border-radius:50%;background:#d6e7d5;color:#39714e;display:grid;place-items:center;font-size:19px;font-weight:700;flex-shrink:0}.profile-details{min-width:0}.profile-details h1{font-size:21px;line-height:1.2;margin:0 0 5px}.profile-details p{font-size:11px;color:#917f72;margin:0 0 7px}.match{display:inline-block;background:#2b925c;color:#fff;font-size:11px;font-weight:700;border-radius:15px;padding:4px 9px}.tagline{font-size:13px;font-style:italic;color:#806e62}.actions{display:flex;gap:9px;margin:18px 0}.actions>*{flex:1;text-align:center;padding:12px 9px;border-radius:12px;font-size:12px;text-decoration:none;font-weight:700;cursor:pointer}.follow-button{border:0;color:white;background:#745d4e}.message-button{border:1px solid #d8c4d7;background:#f0e6ee;color:#705574}.info-panel{padding:15px;background:#fffdf8;border:1px solid #e6dccf;border-radius:17px;margin-top:18px}.info-panel h2{font-size:16px;margin:0 0 13px}.muted{font-size:12px;color:#8b7b6d}.tags,.filters{display:flex;gap:6px;flex-wrap:wrap}.tag{background:#f2e6d9;border-radius:20px;padding:6px 10px;font-size:11px}.book-list{display:flex;flex-direction:column;gap:11px}.book-line{display:flex;align-items:center;gap:12px;margin:8px 0}.mini-cover{height:59px;width:42px;border-radius:5px;background:#d9e5dd;display:grid;place-items:center;font-size:20px;flex-shrink:0}.book-line strong,.book-line span,.book-line small{display:block}.book-line strong{font-size:13px}.book-line span{font-size:11px;color:#837467;margin:4px 0}.book-line small{font-size:10px;color:#68826c}.filters{margin-bottom:15px}.filters button{padding:7px 9px;font-size:11px;background:#f5ede4;border:1px solid #e5d8c8;border-radius:10px;cursor:pointer}.filters button.active{background:#745d4e;color:#fff}.demo-note{font-size:10px;color:#938173}.error{font-size:12px;color:#ac3434}
</style>
