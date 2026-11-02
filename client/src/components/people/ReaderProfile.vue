<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// A reader's profile: who they are, Visit room, Add friend, Message, and their cards. It loads the
// reader itself. The page at /people/:id and the Cafe's popup both show it, and set
// PROFILE_COLOURS on themselves. `compact` fits it inside the popup.
import { computed, ref, watch } from 'vue'
import GenreChip from './GenreChip.vue'
import PixelBookRow from './PixelBookRow.vue'
import PixelCard from './PixelCard.vue'
import ReaderCard from './ReaderCard.vue'
import ReaderChatDialog from './ReaderChatDialog.vue'
import { getCurrentlyReading } from '@/lib/readerMatch.js'
import { sendFriendRequest } from '@/services/api.js'
import { usePeopleStore } from '@/stores/people.js'
import { useNearbyStore } from '@/town/nearbyStore.js'

const props = defineProps({
  // the reader as the app links to them: their username
  readerId: { type: String, required: true },
  compact: { type: Boolean, default: false },
})

const people = usePeopleStore()
// your friends and requests: the same friendships the town's Friends list shows
const nearby = useNearbyStore()
const reader = ref(null)
const loading = ref(true)
const loadError = ref('')
const error = ref('')
const chatOpen = ref(false)
const messageButton = ref(null)
const firstName = computed(() => reader.value?.displayName.split(' ')[0] ?? '')
const currentBook = computed(() => reader.value ? getCurrentlyReading(reader.value) : null)
const sharedBooks = computed(() => reader.value ? people.sharedBooks(reader.value) : [])
const sharedGenres = computed(() => reader.value ? people.sharedGenres(reader.value) : [])
// 'friend', 'asked' (waiting for them to answer) or 'none'
const friendship = computed(() => {
  const id = reader.value?.id
  if (nearby.friends.some((friend) => friend.id === id)) return 'friend'
  if (nearby.outgoing.includes(id)) return 'asked'
  return 'none'
})
const friendLabel = computed(() => ({ friend: 'Added as friend', asked: 'Request sent', none: 'Add friend' })[friendship.value])

async function load(id) {
  loading.value = true
  loadError.value = ''
  error.value = ''
  try {
    reader.value = await people.fetchReader(id)
  } catch (err) {
    reader.value = null
    loadError.value = err.message || "Couldn't load this reader."
  } finally {
    loading.value = false
  }
}

watch(() => props.readerId, load, { immediate: true })
// without them the button says Add friend, and the profile still opens
nearby.loadFriends().catch(() => {})

// the chat closes back to the Message button that opened it
function closeChat() {
  chatOpen.value = false
  messageButton.value?.focus()
}

async function addFriend() {
  error.value = ''
  try {
    await sendFriendRequest(reader.value.id)
    await nearby.loadFriends()
  } catch (err) {
    error.value = err.message || "Couldn't send your friend request."
  }
}
</script>

<template>
  <div class="reader-profile" :class="{ 'reader-profile--compact': compact }">
  <template v-if="reader">
    <!-- on a laptop: the reader on the left, the cards beside them -->
    <div class="reader-layout">
      <div class="reader-side">
        <ReaderCard :reader="reader" :match="people.compatibility(reader)" />
        <RouterLink class="btn btn-primary visit-room" :to="{ name: 'reader-house', params: { id: reader.id } }">
          Visit {{ firstName }}'s room
        </RouterLink>
        <div class="actions">
          <button type="button" class="btn btn-primary follow-button" :disabled="friendship !== 'none'" @click="addFriend">{{ friendLabel }}</button>
          <button ref="messageButton" type="button" class="btn btn-primary message-button" @click="chatOpen = true">Message</button>
        </div>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
      </div>

      <div class="reader-cards">
        <PixelCard title="Currently Reading" icon="📖">
          <PixelBookRow v-if="currentBook" :title="currentBook.title" :author="currentBook.author" :genre="currentBook.genre">
            <GenreChip v-if="currentBook.genre" :genre="currentBook.genre" />
          </PixelBookRow>
          <p v-else class="card-empty">Not reading anything right now</p>
        </PixelCard>

        <PixelCard title="Reading Prefs" icon="💭">
          <ul class="genre-list" aria-label="Favourite genres">
            <li v-for="genre in reader.favoriteGenres" :key="genre"><GenreChip :genre="genre" :shared="sharedGenres.includes(genre)" /></li>
          </ul>
          <p class="in-common">{{ sharedGenres.length ? `★ ${sharedGenres.length} in common: ${sharedGenres.join(', ')}` : 'No genres in common yet' }}</p>
        </PixelCard>

        <PixelCard title="Books You Both Have" icon="🤝">
          <template v-if="sharedBooks.length">
            <p class="shared-count">{{ sharedBooks.length }} shared {{ sharedBooks.length === 1 ? 'book' : 'books' }} with You</p>
            <ul class="book-list">
              <li v-for="book in sharedBooks" :key="book.id"><PixelBookRow :title="book.title" :author="book.author" :genre="book.genre" /></li>
            </ul>
          </template>
          <template v-else>
            <p class="card-empty">No books in common yet. Their room's shelf has everything they're reading.</p>
            <RouterLink class="btn btn-secondary btn-sm shelf-link" :to="{ name: 'reader-house-shelf', params: { id: reader.id } }">See {{ firstName }}'s shelf</RouterLink>
          </template>
        </PixelCard>
      </div>
    </div>

    <ReaderChatDialog :key="reader.id" :open="chatOpen" :reader-id="reader.id" :reader-name="reader.displayName" @close="closeChat" />
  </template>
  <p v-else-if="loading" class="card-empty" role="status">Loading reader…</p>
  <section v-else-if="loadError" class="notice" role="alert">
    <h1>Couldn't load this reader</h1>
    <p>{{ loadError }}</p>
    <button type="button" class="btn btn-primary" @click="load(readerId)">Try again</button>
  </section>
  <section v-else class="notice">
    <h1>Reader not found</h1>
    <p>There's no reader at this address.</p>
    <RouterLink class="btn btn-primary" to="/cafe">Find readers in the Cafe</RouterLink>
  </section>
  </div>
</template>

<style scoped>
.reader-profile .reader-card {
  margin-bottom: 18px;
}

/* a laptop: the reader stays in view on the left while the cards run down the right */
@media (min-width: 768px) {
  .reader-layout {
    display: grid;
    grid-template-columns: minmax(300px, 380px) minmax(0, 1fr);
    gap: 40px;
    align-items: start;
  }

  .reader-side {
    position: sticky;
    top: 20px;
  }

  /* the first card's tab lines up with the top of the reader card */
  .reader-cards > :first-child {
    margin-top: 0;
  }

  .reader-profile--compact .reader-layout {
    grid-template-columns: 290px minmax(0, 1fr);
    gap: 20px;
  }

  .reader-profile--compact .reader-side {
    position: static;
  }
}

/* Visit, the main action: wide and green */
.visit-room {
  --px-fill: var(--profile-green-dark);
  --px-light: var(--profile-green);
  --px-hover: var(--profile-green);
  --px-label: var(--px-paper);
  display: flex;
  width: 100%;
}

.actions {
  display: flex;
  gap: 10px;
  margin: 12px auto 18px;
}

.actions > * {
  flex: 1;
}

/* Follow, wood brown */
.follow-button {
  --px-fill: var(--profile-wood);
  --px-light: var(--profile-wood-light);
  --px-hover: var(--profile-wood-dark);
  --px-label: var(--px-paper);
}

/* not found, or couldn't load: a paper card */
.notice {
  padding: 16px;
  background: var(--profile-paper);
  border: var(--px-border);
  box-shadow: var(--px-shadow);
}

.notice h1 {
  margin: 0 0 8px;
  font-family: var(--font-heading);
  font-size: 20px;
}

/* Message, the Library's rug red */
.message-button {
  --px-fill: var(--profile-rug);
  --px-light: var(--profile-rug);
  --px-dark: var(--profile-rug-shade);
  --px-hover: var(--profile-rug-shade);
  --px-label: var(--px-paper);
}

.card-empty {
  margin: 0;
  font-size: 14px;
  color: var(--profile-ink-soft);
}

.genre-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.in-common {
  margin: 12px 0 0;
  font-size: 14px;
  font-weight: 700;
}

.shared-count {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 700;
}

.book-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.shelf-link {
  margin-top: 12px;
}

.demo-note {
  margin-top: 22px;
  font-size: 12px;
  color: var(--profile-ink-soft);
}

.error {
  font-size: 13px;
  font-weight: 700;
  color: var(--profile-rug-shade);
}
</style>
