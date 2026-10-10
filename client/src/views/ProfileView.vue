<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import BookCover from '@/components/BookCover.vue'
import CreditChip from '@/components/CreditChip.vue'
import { useDecor } from '@/composables/useDecor'
import { saveProfile, signOut } from '@/services/auth.js'
import { useBookshelfStore } from '@/stores/bookshelf'
import { useUserStore } from '@/stores/user'

const GENRES = [
  'Fantasy',
  'Literary Fiction',
  'Magical Realism',
  'Science Fiction',
  'Mystery',
  'Thriller',
  'Classic',
  'Historical Fiction',
  'Memoir',
  'Non-fiction',
  'Self-Help',
]

const GENDERS = ['Woman', 'Man', 'Non-binary', 'Prefer not to say']
const FAITHS = ['Christianity', 'Islam', 'Buddhism', 'Hinduism', 'Sikhism', 'Judaism', 'None', 'Prefer not to say']

// Emoji avatars, saved with the profile until avatar uploads exist.
const AVATARS = [
  { emoji: '🐨', name: 'Koala' },
  { emoji: '🦊', name: 'Fox' },
  { emoji: '🐱', name: 'Cat' },
  { emoji: '🦉', name: 'Owl' },
  { emoji: '🐻', name: 'Bear' },
  { emoji: '🐼', name: 'Panda' },
]

const SHELF_STATS = [
  { status: 'reading', label: 'Reading', empty: 'Nothing on the go. Start a book from your To read list.' },
  { status: 'want_to_read', label: 'To read', empty: 'Your To read list is empty. Add books from Discover.' },
  { status: 'read', label: 'Finished', empty: 'No finished books yet.' },
]

const router = useRouter()
const user = useUserStore()
const bookshelf = useBookshelfStore()
const { credits, inventory, placed, shopOpen } = useDecor()
const form = ref(null)
const listStatus = ref('')
const listClose = ref(null)
let listOpener = null
const editing = ref(false)
const confirming = ref(false)
const errors = ref({})
const formError = ref('')
const busy = ref(false)
const privacyBusy = ref(false)
const privacyError = ref('')
const avatar = ref('')
const name = ref('')
const location = ref('')
const gender = ref('')
const age = ref('')
const religion = ref('')
const genres = ref([])

const shelfReady = computed(() => !bookshelf.loading && !bookshelf.error)
const listStat = computed(() => SHELF_STATS.find((stat) => stat.status === listStatus.value) ?? null)
const listBooks = computed(() => (listStatus.value ? bookshelf.booksByStatus[listStatus.value] : []))
const decorCount = computed(() => inventory.value.length + placed.value.length)

const about = computed(() => [
  { label: 'Gender', value: user.profile.gender },
  { label: 'Age', value: user.profile.age },
  { label: 'Religion', value: user.profile.religion },
  { label: 'Location', value: user.profile.location },
])

onMounted(() => {
  user.openGuideIfNew()
  if (!bookshelf.books.length && !bookshelf.loading) bookshelf.load()
})

async function openList(status, event) {
  listOpener = event.currentTarget
  listStatus.value = status
  await nextTick()
  listClose.value?.focus()
}

function closeList() {
  listStatus.value = ''
  listOpener?.focus()
  listOpener = null
}

// The shop lives in the room, so open it there.
function visitShop() {
  shopOpen.value = true
  router.push({ name: 'room' })
}

function startEdit() {
  const saved = user.profile
  avatar.value = saved.avatar || AVATARS[0].emoji
  name.value = saved.name || ''
  location.value = saved.location || ''
  gender.value = saved.gender || ''
  age.value = saved.age === '' || saved.age == null ? '' : String(saved.age)
  religion.value = saved.religion || ''
  genres.value = [...saved.favouriteGenres]
  errors.value = {}
  formError.value = ''
  editing.value = true
}

function clearError(field) {
  if (errors.value[field]) errors.value = { ...errors.value, [field]: '' }
}

function choose(field, value) {
  if (field === 'avatar') avatar.value = value
  if (field === 'gender') gender.value = value
  if (field === 'religion') religion.value = value
  clearError(field)
}

function toggleGenre(genre) {
  clearError('genres')
  if (genres.value.includes(genre)) {
    genres.value = genres.value.filter((item) => item !== genre)
    return
  }
  genres.value = [...genres.value, genre]
}

// Roving focus for the single-choice groups: one tab stop, arrow keys move and select.
function tabStop(options, current, option) {
  if (current) return option === current ? 0 : -1
  return option === options[0] ? 0 : -1
}

function moveChoice(event, field, options, current) {
  const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key]
  if (!step) return
  event.preventDefault()
  const group = event.currentTarget
  const index = options.indexOf(current)
  const start = index < 0 ? (step > 0 ? -1 : 0) : index
  choose(field, options[(start + step + options.length) % options.length])
  nextTick(() => group.querySelector('[aria-checked="true"]')?.focus())
}

function validate() {
  const found = {}
  if (!name.value.trim()) found.name = 'Add your name.'
  if (!gender.value) found.gender = 'Choose one, including prefer not to say.'
  const years = Number(age.value)
  if (!Number.isInteger(years) || years < 13 || years > 120) found.age = 'Enter an age from 13 to 120.'
  if (!religion.value) found.religion = 'Choose one, including prefer not to say.'
  if (!genres.value.length) found.genres = 'Pick at least one genre.'
  return found
}

async function save() {
  formError.value = ''
  errors.value = validate()
  if (Object.values(errors.value).some(Boolean)) {
    await nextTick()
    form.value?.querySelector('[aria-invalid="true"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    return
  }
  busy.value = true
  const details = {
    avatar: avatar.value,
    name: name.value.trim(),
    location: location.value.trim(),
    gender: gender.value,
    age: Number(age.value),
    religion: religion.value,
    favouriteGenres: genres.value,
  }
  const result = await saveProfile(details)
  busy.value = false
  if (result.error) {
    formError.value = result.error.message
    return
  }
  if (result.data?.user) user.applySession({ user: result.data.user })
  if (!user.profile.name) user.mergeProfile(details)
  editing.value = false
}

async function toggleDiscoverable() {
  const next = !user.profile.discoverable
  privacyError.value = ''
  privacyBusy.value = true
  user.mergeProfile({ discoverable: next })
  const result = await saveProfile({ discoverable: next })
  privacyBusy.value = false
  if (result.error) {
    user.mergeProfile({ discoverable: !next })
    privacyError.value = result.error.message
  }
}

async function logout() {
  user.dismissGuide()
  await signOut()
  user.applySession(null)
  router.push({ name: 'login' })
}
</script>

<template>
  <section class="profile">
    <template v-if="!editing">
      <div class="reader-card">
        <div class="reader-card__who">
          <span class="avatar" aria-hidden="true">{{ user.profile.avatar }}</span>
          <div class="reader-card__name">
            <h1 class="h3 mb-0 text-truncate">{{ user.profile.name }}</h1>
            <p class="text-muted mb-0 text-truncate">{{ user.profile.email }}</p>
          </div>
          <button type="button" class="btn btn-outline-primary reader-card__edit" aria-label="Edit profile" @click="startEdit">Edit</button>
        </div>
        <ul class="stats" :aria-busy="bookshelf.loading">
          <li v-for="stat in SHELF_STATS" :key="stat.status">
            <button
              type="button"
              class="stat"
              aria-haspopup="dialog"
              :disabled="!shelfReady"
              @click="openList(stat.status, $event)"
            >
              <span class="stat__count">{{ shelfReady ? bookshelf.statusCounts[stat.status] : '–' }}</span>
              <span class="stat__label">{{ stat.label }}</span>
            </button>
          </li>
        </ul>
      </div>

      <section class="block" aria-labelledby="genres-title">
        <h2 id="genres-title" class="block__title">Favourite genres</h2>
        <ul v-if="user.profile.favouriteGenres.length" class="tags">
          <li v-for="genre in user.profile.favouriteGenres" :key="genre">
            <RouterLink class="tag" :to="{ name: 'genre-shelf', params: { genre } }">
              {{ genre }}
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
            </RouterLink>
          </li>
        </ul>
        <p v-else class="block__empty">None picked yet. Edit your profile to add some.</p>
      </section>

      <section class="block" aria-labelledby="coins-title">
        <h2 id="coins-title" class="block__title">Coins</h2>
        <div class="coins">
          <div>
            <CreditChip class="coins__balance" />
            <p class="coins__note">
              {{ decorCount ? `${decorCount} decoration${decorCount === 1 ? '' : 's'} owned` : 'Spend them on decorations and pets for your room.' }}
            </p>
          </div>
          <button type="button" class="btn btn-primary coins__shop" @click="visitShop">Visit the shop</button>
        </div>
      </section>

      <section class="block" aria-labelledby="about-title">
        <h2 id="about-title" class="block__title">About you</h2>
        <dl class="details">
          <div v-for="item in about" :key="item.label">
            <dt>{{ item.label }}</dt>
            <dd :class="{ 'is-empty': !item.value }">{{ item.value || 'Not set' }}</dd>
          </div>
        </dl>
      </section>

      <section class="block" aria-labelledby="privacy-title">
        <h2 id="privacy-title" class="block__title">Privacy</h2>
        <div class="setting">
          <div>
            <p id="discoverable-label" class="setting__label">Show me on the People map</p>
            <p id="discoverable-note" class="setting__note">Nearby readers can find your room and see your reading match.</p>
          </div>
          <button
            type="button"
            role="switch"
            class="switch"
            :aria-checked="user.profile.discoverable"
            aria-labelledby="discoverable-label"
            aria-describedby="discoverable-note"
            :disabled="privacyBusy"
            @click="toggleDiscoverable"
          >
            <span class="switch__thumb" />
          </button>
        </div>
        <p v-if="privacyError" class="field-error" role="alert">{{ privacyError }}</p>
      </section>

      <section class="block" aria-labelledby="quotes-title">
        <h2 id="quotes-title" class="block__title">Saved quotes</h2>
        <div class="empty">
          <span class="empty__mark" aria-hidden="true">“</span>
          <p class="mb-1">No saved quotes yet</p>
          <p class="block__empty mb-2">Tap the heart on a quote in a book's Quotes tab to keep it here.</p>
          <RouterLink class="empty__link" to="/discover">Find a book</RouterLink>
        </div>
      </section>

      <button type="button" class="logout" @click="confirming = true">Log out</button>
    </template>

    <form v-else ref="form" novalidate @submit.prevent="save">
      <h1 class="h3 mb-3">Edit profile</h1>

      <div class="field">
        <span id="avatar-label" class="form-label">Avatar</span>
        <div
          class="avatars"
          role="radiogroup"
          aria-labelledby="avatar-label"
          @keydown="moveChoice($event, 'avatar', AVATARS.map((item) => item.emoji), avatar)"
        >
          <button
            v-for="option in AVATARS"
            :key="option.emoji"
            type="button"
            role="radio"
            class="avatar-choice"
            :class="{ 'is-on': avatar === option.emoji }"
            :aria-checked="avatar === option.emoji"
            :aria-label="option.name"
            :tabindex="tabStop(AVATARS.map((item) => item.emoji), avatar, option.emoji)"
            @click="choose('avatar', option.emoji)"
          >
            {{ option.emoji }}
          </button>
        </div>
      </div>

      <div class="field">
        <label class="form-label" for="profile-name">Name</label>
        <input
          id="profile-name"
          v-model="name"
          class="form-control"
          maxlength="40"
          autocomplete="name"
          placeholder="e.g. Alex"
          :aria-invalid="Boolean(errors.name)"
          :aria-describedby="errors.name ? 'name-error' : undefined"
          @input="clearError('name')"
        />
        <p v-if="errors.name" id="name-error" class="field-error">{{ errors.name }}</p>
      </div>

      <div class="field">
        <label class="form-label" for="profile-location">Location <span class="optional">(optional)</span></label>
        <input
          id="profile-location"
          v-model="location"
          class="form-control"
          maxlength="60"
          autocomplete="address-level2"
          placeholder="e.g. Tampines, Singapore"
        />
      </div>

      <div class="field">
        <span id="gender-label" class="form-label">Gender</span>
        <div
          class="choices"
          role="radiogroup"
          aria-labelledby="gender-label"
          :aria-invalid="Boolean(errors.gender)"
          :aria-describedby="errors.gender ? 'gender-error' : undefined"
          @keydown="moveChoice($event, 'gender', GENDERS, gender)"
        >
          <button
            v-for="option in GENDERS"
            :key="option"
            type="button"
            role="radio"
            class="choice"
            :class="{ 'is-on': gender === option }"
            :aria-checked="gender === option"
            :tabindex="tabStop(GENDERS, gender, option)"
            @click="choose('gender', option)"
          >
            {{ option }}
          </button>
        </div>
        <p v-if="errors.gender" id="gender-error" class="field-error">{{ errors.gender }}</p>
      </div>

      <div class="field">
        <label class="form-label" for="profile-age">Age</label>
        <input
          id="profile-age"
          v-model="age"
          class="form-control"
          type="number"
          min="13"
          max="120"
          inputmode="numeric"
          placeholder="e.g. 21"
          :aria-invalid="Boolean(errors.age)"
          :aria-describedby="errors.age ? 'age-error' : undefined"
          @input="clearError('age')"
        />
        <p v-if="errors.age" id="age-error" class="field-error">{{ errors.age }}</p>
      </div>

      <div class="field">
        <span id="religion-label" class="form-label">Religion</span>
        <div
          class="choices"
          role="radiogroup"
          aria-labelledby="religion-label"
          :aria-invalid="Boolean(errors.religion)"
          :aria-describedby="errors.religion ? 'religion-error' : undefined"
          @keydown="moveChoice($event, 'religion', FAITHS, religion)"
        >
          <button
            v-for="option in FAITHS"
            :key="option"
            type="button"
            role="radio"
            class="choice"
            :class="{ 'is-on': religion === option }"
            :aria-checked="religion === option"
            :tabindex="tabStop(FAITHS, religion, option)"
            @click="choose('religion', option)"
          >
            {{ option }}
          </button>
        </div>
        <p v-if="errors.religion" id="religion-error" class="field-error">{{ errors.religion }}</p>
      </div>

      <div class="field">
        <span id="genres-label" class="form-label">Favourite genres</span>
        <div
          class="choices"
          role="group"
          aria-labelledby="genres-label"
          :aria-invalid="Boolean(errors.genres)"
          :aria-describedby="errors.genres ? 'genres-error' : undefined"
        >
          <button
            v-for="genre in GENRES"
            :key="genre"
            type="button"
            class="choice"
            :class="{ 'is-on': genres.includes(genre) }"
            :aria-pressed="genres.includes(genre)"
            @click="toggleGenre(genre)"
          >
            {{ genre }}
          </button>
        </div>
        <p v-if="errors.genres" id="genres-error" class="field-error">{{ errors.genres }}</p>
      </div>

      <div class="actions">
        <p v-if="formError" class="field-error mb-2" role="alert">{{ formError }}</p>
        <div class="d-flex gap-2">
          <button type="button" class="btn btn-outline-primary" @click="editing = false">Cancel</button>
          <button class="btn btn-primary flex-grow-1" type="submit" :disabled="busy">
            {{ busy ? 'Saving…' : 'Save' }}
          </button>
        </div>
      </div>
    </form>
    <Teleport to=".phone-frame">
      <div v-if="listStat" class="list" @keydown.esc="closeList">
        <button type="button" class="list__backdrop" tabindex="-1" aria-hidden="true" @click="closeList" />
        <div class="list__sheet" role="dialog" aria-modal="true" aria-labelledby="list-title">
          <div class="list__head">
            <h2 id="list-title" class="list__title">
              {{ listStat.label }} <span class="list__count">{{ listBooks.length }}</span>
            </h2>
            <button ref="listClose" type="button" class="list__close" aria-label="Close" @click="closeList">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
          <ul v-if="listBooks.length" class="list__books">
            <li v-for="book in listBooks" :key="book.id">
              <RouterLink class="list__book" :to="`/books/${book.id}`">
                <BookCover class="list__cover" :cover-url="book.coverUrl" :title="book.title" :seed="book.id" />
                <span class="list__text">
                  <span class="list__name">{{ book.title }}</span>
                  <span class="list__author">{{ book.authors.join(', ') }}</span>
                  <span v-if="book.status === 'reading'" class="list__progress">
                    <span class="list__bar"><span :style="{ width: `${book.progress}%` }" /></span>
                    {{ book.progress }}%
                  </span>
                </span>
              </RouterLink>
            </li>
          </ul>
          <p v-else class="block__empty list__empty">{{ listStat.empty }}</p>
        </div>
      </div>
      <div v-if="confirming" class="leave" role="dialog" aria-modal="true" aria-labelledby="leave-title">
        <div class="leave__card">
          <div class="leave__book" aria-hidden="true">
            <span class="leave__cover" />
            <span class="leave__page" />
          </div>
          <h2 id="leave-title" class="h4 mb-1">Close this book?</h2>
          <p class="text-muted mb-3">You will leave the shelf. Sign in again when you want to come back.</p>
          <div class="d-flex gap-2">
            <button type="button" class="btn btn-outline-primary flex-grow-1" @click="confirming = false">Stay</button>
            <button type="button" class="btn leave__go flex-grow-1" @click="logout">Log out</button>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.reader-card {
  padding: 16px;
  border: 1px solid var(--rl-line);
  border-radius: var(--rl-radius-card);
  background: var(--rl-surface);
}

.reader-card__who {
  display: flex;
  align-items: center;
  gap: 14px;
}

.reader-card__name {
  flex: 1 1 auto;
  min-width: 0;
}

.reader-card__edit {
  flex: none;
  align-self: flex-start;
  min-height: 44px;
  padding-inline: 16px;
  border-radius: 999px;
}

.avatar {
  flex: none;
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: 999px;
  background: var(--rl-secondary);
  font-size: 2rem;
  line-height: 1;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin: 16px 0 0;
  border-top: 1px solid var(--rl-line);
}

.stats {
  padding: 0;
  list-style: none;
}

.stats li {
  padding-top: 8px;
}

.stats li + li {
  border-left: 1px solid var(--rl-line);
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  min-height: 56px;
  padding: 4px 0;
  border: 0;
  border-radius: 10px;
  background: none;
  color: var(--rl-text);
}

.stat:hover:not(:disabled) {
  background: var(--rl-secondary);
}

.stat__count {
  font-size: 1.375rem;
  font-weight: 700;
  line-height: 1.2;
}

.stat__label {
  color: var(--rl-muted);
  font-size: 0.875rem;
}

.block {
  margin-top: 24px;
}

.block__title {
  margin-bottom: 10px;
  font-size: 1.125rem;
}

.block__empty {
  color: var(--rl-muted);
  font-size: 0.875rem;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  min-height: 44px;
  padding: 6px 10px 6px 14px;
  border-radius: 999px;
  background: var(--rl-secondary);
  color: var(--rl-text);
  font-size: 0.875rem;
  text-decoration: none;
}

.tag:hover {
  background: var(--rl-line);
  color: var(--rl-text);
}

.tag svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.coins {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid var(--rl-line);
  border-radius: var(--rl-radius-card);
  background: var(--rl-surface);
}

.coins__balance {
  font-size: 1.25rem;
}

.coins__note {
  margin: 6px 0 0;
  color: var(--rl-muted);
  font-size: 0.875rem;
}

.coins__shop {
  flex: none;
  min-height: 44px;
}

.details {
  margin: 0;
}

.details div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0;
  border-top: 1px solid var(--rl-line);
}

.details div:last-child {
  border-bottom: 1px solid var(--rl-line);
}

.details dt {
  color: var(--rl-muted);
  font-size: 0.875rem;
  font-weight: 400;
}

.details dd {
  margin: 0;
  text-align: right;
}

.details dd.is-empty {
  color: var(--rl-muted);
}

.setting {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.setting__label {
  margin: 0;
}

.setting__note {
  margin: 2px 0 0;
  color: var(--rl-muted);
  font-size: 0.875rem;
}

.switch {
  position: relative;
  flex: none;
  width: 52px;
  height: 32px;
  padding: 0;
  border: 1px solid var(--rl-line);
  border-radius: 999px;
  background: var(--rl-secondary);
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.switch__thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: var(--rl-surface);
  box-shadow: 0 1px 3px rgba(44, 36, 30, 0.3);
  transition: transform 0.2s ease;
}

.switch[aria-checked='true'] {
  background: var(--rl-primary);
  border-color: var(--rl-primary);
}

.switch[aria-checked='true'] .switch__thumb {
  transform: translateX(20px);
}

.switch:disabled {
  opacity: 0.6;
}

.empty {
  padding: 18px 16px;
  border: 1px dashed var(--rl-line);
  border-radius: var(--rl-radius-card);
  text-align: center;
}

.empty__mark {
  display: block;
  height: 28px;
  color: var(--rl-accent);
  font-family: var(--rl-font-title);
  font-size: 3rem;
  line-height: 1;
}

.empty__link {
  font-size: 0.875rem;
  font-weight: 700;
}

.logout {
  display: block;
  width: 100%;
  min-height: 44px;
  margin-top: 20px;
  border: 0;
  background: none;
  color: #8d2218;
  font-size: 0.9375rem;
}

.logout:hover {
  text-decoration: underline;
}

.field {
  margin-bottom: 20px;
}

.optional {
  color: var(--rl-muted);
  font-size: 0.875rem;
}

.avatars {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.avatar-choice {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border: 1px solid var(--rl-line);
  border-radius: 999px;
  background: var(--rl-canvas);
  font-size: 1.5rem;
  line-height: 1;
}

.avatar-choice.is-on {
  border: 2px solid var(--rl-primary);
  background: var(--rl-secondary);
}

.choices {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.choice {
  min-height: 44px;
  border: 1px solid var(--rl-line);
  border-radius: 999px;
  background: var(--rl-canvas);
  color: var(--rl-text);
  font-size: 0.875rem;
  padding: 6px 14px;
}

.choice.is-on {
  background: var(--rl-primary);
  border-color: var(--rl-primary);
  color: var(--rl-surface);
}

.field-error {
  margin: 6px 0 0;
  color: #8d2218;
  font-size: 0.875rem;
}

.actions {
  position: sticky;
  /* sit on the nav: cancels the page's 1.5rem bottom padding (py-4 on .app-main) */
  bottom: -1.5rem;
  margin: 0 -12px;
  padding: 12px;
  border-top: 1px solid var(--rl-line);
  background: var(--rl-surface);
}

.actions .btn {
  min-height: 44px;
}

.list {
  position: absolute;
  inset: 0;
  z-index: 40;
}

.list__backdrop {
  position: absolute;
  inset: 0;
  padding: 0;
  border: 0;
  background: rgba(44, 36, 30, 0.46);
}

.list__sheet {
  position: absolute;
  inset: auto 0 0;
  display: flex;
  flex-direction: column;
  max-height: 72%;
  padding: 12px 16px 20px;
  border: 1px solid var(--rl-line);
  border-bottom: 0;
  border-radius: var(--rl-radius-modal) var(--rl-radius-modal) 0 0;
  background: var(--rl-surface);
  box-shadow: 0 -12px 40px rgba(44, 36, 30, 0.22);
  animation: list-up 0.32s cubic-bezier(0.2, 0.9, 0.3, 1);
}

.list__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.list__title {
  margin: 0;
  font-size: 1.25rem;
}

.list__count {
  color: var(--rl-muted);
  font-family: var(--rl-font-body);
  font-size: 1rem;
  font-weight: 400;
}

.list__close {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  margin-right: -8px;
  border: 0;
  border-radius: 999px;
  background: none;
  color: var(--rl-text);
}

.list__close:hover {
  background: var(--rl-secondary);
}

.list__close svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
}

.list__books {
  margin: 0 -16px;
  padding: 0;
  overflow-y: auto;
  list-style: none;
}

.list__book {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  color: var(--rl-text);
  text-decoration: none;
}

.list__book:hover {
  background: var(--rl-canvas);
  color: var(--rl-text);
}

.list__cover {
  flex: none;
  width: 44px;
  border-radius: 4px;
  font-size: 0.5rem;
}

.list__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.list__name {
  font-family: var(--rl-font-title);
  font-weight: 700;
}

.list__author {
  color: var(--rl-muted);
  font-size: 0.875rem;
}

.list__progress {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--rl-muted);
  font-size: 0.875rem;
}

.list__bar {
  width: 96px;
  height: 6px;
  border-radius: 999px;
  background: var(--rl-secondary);
  overflow: hidden;
}

.list__bar span {
  display: block;
  height: 100%;
  background: var(--rl-accent);
}

.list__empty {
  margin: 8px 0 12px;
}

.leave {
  position: absolute;
  inset: 0;
  z-index: 40;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(44, 36, 30, 0.46);
}

.leave__card {
  width: min(100%, 300px);
  padding: 22px 18px 18px;
  border-radius: 22px;
  background: var(--rl-surface);
  border: 1px solid var(--rl-line);
  box-shadow: 0 18px 40px rgba(44, 36, 30, 0.28);
  text-align: center;
  animation: leave-in 0.35s ease;
}

.leave__book {
  position: relative;
  width: 74px;
  height: 52px;
  margin: 0 auto 14px;
}

.leave__cover,
.leave__page {
  position: absolute;
  top: 0;
  height: 52px;
  border-radius: 3px 8px 8px 3px;
}

.leave__cover {
  left: 8px;
  width: 34px;
  background: #6b4a34;
  transform-origin: right center;
  animation: cover-shut 0.7s ease;
}

.leave__page {
  left: 34px;
  width: 30px;
  background: #fffdf9;
  border: 1px solid var(--rl-line);
}

.leave__go {
  background: #b42318;
  border-color: #b42318;
  color: #fffdf9;
}

.leave__go:hover {
  background: #8d2218;
  border-color: #8d2218;
  color: #fffdf9;
}

@keyframes leave-in {
  from { transform: translateY(16px) scale(0.96); opacity: 0; }
}

@keyframes list-up {
  from { transform: translateY(100%); }
}

@keyframes cover-shut {
  from { transform: scaleX(0.2); }
}

@media (prefers-reduced-motion: reduce) {
  .leave__card,
  .leave__cover,
  .list__sheet,
  .switch,
  .switch__thumb {
    animation: none;
    transition: none;
  }
}
</style>
