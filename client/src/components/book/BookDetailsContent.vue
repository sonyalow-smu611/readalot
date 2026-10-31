<!--
  What a reader sees about a book once it is open, top to bottom: the cover (a made-up cloth
  book with the title on it when there is no picture), the title, author, stars and genres,
  which shelf it is on (Reading shows a progress slider), then Synopsis, Rating and Reviews.
  Shown in the Book details card (in My Room, on My Shelf and on the book's own page) and in the
  book overlay's open spread, in the town's design system.
  Written with AI assistance: see AI_USAGE.md.
-->
<template>
  <article class="details">
    <!-- hero -->
    <header class="details__hero">
      <!-- which of the reader's shelves it's on, like the tab on the town's place cards -->
      <span v-if="shelfLabel" class="details__tab">{{ shelfLabel }}</span>
      <div v-if="showCover" class="details__cover">
        <img
          v-if="coverUrl && !coverFailed"
          class="details__cover-img"
          :src="coverUrl"
          :alt="`Cover of ${book?.title}`"
          @error="coverFailed = true"
        />
        <div
          v-else
          class="fake-book"
          :style="{ '--cloth': look.colour, '--cloth-ink': look.ink }"
          role="img"
          :aria-label="`${book?.title}, no cover picture`"
        >
          <span class="fake-book__spine" aria-hidden="true"></span>
          <span class="fake-book__face" aria-hidden="true">
            <span class="fake-book__title">{{ book?.title }}</span>
            <span class="fake-book__rule"></span>
            <span class="fake-book__author">{{ author }}</span>
          </span>
        </div>
      </div>

      <component :is="titleTag" class="details__title">{{ book?.title }}</component>
      <p class="details__author">by {{ author }}</p>
      <p v-if="facts" class="details__facts">{{ facts }}</p>
      <p class="details__stars" :aria-label="rating ? `Rated ${ratingText} out of 5` : 'No ratings yet'">
        <StarMeter :value="rating" />
        <span class="details__stars-value">{{ rating ? ratingText : "No ratings yet" }}</span>
      </p>
      <ul v-if="book?.genres?.length" class="details__genres list-unstyled" aria-label="Genres">
        <li v-for="g in book.genres" :key="g" class="badge rounded-pill details__genre">{{ g }}</li>
      </ul>
    </header>

    <!-- shelf status -->
    <div class="d-flex w-100 details__status" role="group" aria-label="Reading status">
      <button
        v-for="option in STATUS_OPTIONS"
        :key="option.value"
        type="button"
        class="btn btn-chip details__status-btn"
        :class="{ 'is-active': status === option.value }"
        :aria-pressed="status === option.value"
        :disabled="saving"
        @click="choose(option.value)"
      >
        {{ option.label }}
      </button>
    </div>
    <p v-if="statusError" class="details__error" role="alert">{{ statusError }}</p>

    <Transition name="pop">
      <ReadingProgress
        v-if="status === 'reading'"
        key="reading"
        class="details__panel"
        :progress="shelved.progress"
        @change="bookshelf.setProgress(shelved.id, $event)"
      />
      <div v-else-if="status === 'read' && linksToPage" key="read" class="details__panel details__finished">
        <RouterLink
          v-if="shelved.reviewed && shelved.myRating"
          class="btn btn-primary details__link-btn"
          :to="page"
          @click="$emit('leave')"
        >
          View review and rating
        </RouterLink>
        <template v-else>
          <RouterLink class="btn btn-primary details__link-btn" :to="page" @click="$emit('leave')">
            {{ shelved.reviewed ? "View review" : "Review" }}
          </RouterLink>
          <RouterLink class="btn btn-secondary details__link-btn" :to="page" @click="$emit('leave')">
            {{ shelved.myRating ? "View rating" : "Rate" }}
          </RouterLink>
        </template>
      </div>
    </Transition>

    <section class="details__section" aria-labelledby="details-synopsis">
      <h3 id="details-synopsis" class="details__heading">Synopsis</h3>
      <BookSynopsis class="details__synopsis" :text="book?.description" />
    </section>

    <section class="details__section" aria-labelledby="details-rating">
      <h3 id="details-rating" class="details__heading">Rating</h3>
      <div class="details__rating">
        <StarMeter :value="rating" big />
        <p class="details__rating-score">
          <template v-if="rating">
            <strong>{{ ratingText }}</strong> / 5
          </template>
          <template v-else>Not rated yet</template>
        </p>
        <p v-if="ratingSource" class="details__rating-count">{{ ratingSource }}</p>
      </div>
    </section>

    <BookReviews
      class="details__section"
      :reviews="reviews"
      :loading="reviewsLoading"
      :error="reviewsError"
      :saving="reviewSaving"
      :save-error="reviewSaveError"
      :my-character="user.profile.character"
      @retry="loadReviews"
      @save="saveReview"
      @delete="removeReview"
    />
  </article>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { primaryAuthor } from '@/lib/book'
import BookSynopsis from '@/components/book/BookSynopsis.vue'
import ReadingProgress from '@/components/book/ReadingProgress.vue'
import BookReviews from '@/components/book/BookReviews.vue'
import StarMeter from '@/components/book/StarMeter.vue'
import { shelfName, spineLook } from '@/services/shelves.js'
import { useBookReviews } from '@/composables/useBookReviews'
import { useBookshelfStore } from '@/stores/bookshelf'
import { useUserStore } from '@/stores/user'

const props = defineProps({
  book: { type: Object, default: null },
  // the overlay's spread already shows the cover on its left page
  showCover: { type: Boolean, default: true },
  // h1 on the book's own page
  titleTag: { type: String, default: 'h2' },
  // a Finished book offers to review and rate it on the book's page; not on that page itself
  linksToPage: { type: Boolean, default: true },
})
// "leave": a link to the book's page was followed, so whatever is showing this can close
defineEmits(['leave'])

const STATUS_OPTIONS = [
  { value: 'want_to_read', label: 'Want to read' },
  { value: 'reading', label: 'Reading' },
  { value: 'read', label: 'Finished reading' },
]

const bookshelf = useBookshelfStore()

const author = computed(() => (props.book ? primaryAuthor(props.book) : ''))
const coverUrl = computed(() => props.book?.cover || props.book?.coverUrl || '')
const look = computed(() => spineLook({ id: props.book?.id || props.book?.title || '' }))
// publisher, year and length, leaving out whatever is not known
const facts = computed(() => {
  const book = props.book
  if (!book) return ''
  const year = book.publishedDate?.slice(0, 4) || book.publishedYear
  return [book.publisher, year, book.pageCount ? `${book.pageCount} pages` : ''].filter(Boolean).join(' · ')
})

const coverFailed = ref(false)
watch(coverUrl, () => {
  coverFailed.value = false
})

// --- Shelf status -------------------------------------------------------------------------
// the shelf's own copy of the book, so a move shows here straight away
const shelved = computed(() => (props.book ? bookshelf.findBook(props.book.id) : null))
const status = computed(() => shelved.value?.status ?? '')
const shelfLabel = computed(() => shelfName(status.value))
const page = computed(() => `/books/${props.book?.id}`)
const saving = ref(false)
const statusError = ref('')

async function choose(next) {
  statusError.value = ''
  if (shelved.value) {
    await bookshelf.setStatus(shelved.value.id, next)
    statusError.value = bookshelf.moveError
    return
  }
  // a book that is not on the shelf yet goes onto the one picked
  saving.value = true
  try {
    await bookshelf.addBook(props.book.id, next)
  } catch {
    statusError.value = `Couldn't add "${props.book.title}" to your shelf. Try again.`
  } finally {
    saving.value = false
  }
}

// --- Reviews ------------------------------------------------------------------------------
const {
  reviews,
  loading: reviewsLoading,
  error: reviewsError,
  load: loadReviews,
  rating,
  ratingText,
  ratingSource,
  saving: reviewSaving,
  saveError: reviewSaveError,
  save: saveReview,
  remove: removeReview,
} = useBookReviews(() => props.book)
const user = useUserStore()
</script>

<style scoped>
/* The town's design system (src/assets/theme.css), as on the town's place cards and the cafe:
   warm dark text, muted captions, Arial bold titles, a fine line between sections, cream pill
   tags. --book-accent is the colour of the building the card was opened in. */
.details {
  --accent: var(--book-accent, var(--rl-primary));
  --tag: #f3e8da;
  --soft: #f4ede4;
  --soft-line: #e0d2c2;

  /* its own width decides the layout: two columns only on a wide card (the book page on a
     laptop), whatever the window */
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-family: var(--rl-font-body);
  font-size: 14px;
  line-height: 21px;
  color: var(--rl-text);
}

/* --- Hero ------------------------------------------------------------------------------- */
.details__hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.details__tab {
  margin-bottom: 14px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--accent);
  font-size: 12px;
  font-weight: 700;
  line-height: 16px;
  letter-spacing: 0.3px;
  color: var(--rl-surface);
}

.details__cover {
  width: min(46%, 150px);
  aspect-ratio: 2 / 3;
  margin-bottom: 16px;
  filter: drop-shadow(0 8px 14px rgba(63, 46, 36, 0.22));
}

.details__cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
}

/* A cloth-bound book: a darker spine on the left and a framed title plate on the front. */
.fake-book {
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  border-radius: 6px;
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.08), transparent 40%, rgba(0, 0, 0, 0.1)),
    var(--cloth);
  color: var(--cloth-ink);
}

.fake-book__spine {
  flex: 0 0 11%;
  border-radius: 6px 0 0 6px;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.28), rgba(0, 0, 0, 0.1) 70%, rgba(255, 255, 255, 0.16));
}

.fake-book__face {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 10px 10px 10px 8px;
  padding: 10px 6px;
  border: 1px solid currentColor;
  opacity: 0.92;
  overflow: hidden;
  container-type: inline-size;
}

.fake-book__title {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
  overflow: hidden;
  /* sized to the plate, so a long word fits whole on a small cover */
  font-family: var(--rl-font-title);
  font-size: clamp(11px, 16cqi, 16px);
  line-height: 1.25;
  font-weight: 700;
  overflow-wrap: break-word;
}

.fake-book__rule {
  width: 30%;
  border-top: 1px solid currentColor;
}

.fake-book__author {
  font-family: var(--rl-font-title);
  font-size: 11px;
  line-height: 14px;
  font-style: italic;
}

.details__title {
  margin: 0 0 2px;
  font-family: var(--rl-font-title);
  font-size: 22px;
  line-height: 28px;
  font-weight: 700;
  color: var(--rl-text);
}

.details__author {
  margin: 0 0 6px;
  color: var(--rl-muted);
}

.details__facts {
  margin: -4px 0 6px;
  font-size: 12px;
  line-height: 18px;
  color: var(--rl-muted);
}

.details__stars {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 10px;
}

.details__stars-value {
  font-size: 13px;
  font-weight: 700;
  color: var(--rl-muted);
}

/* the cafe's tags */
.details__genres {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
  margin: 0;
}

/* A wide card (the book page on a laptop): the cover on the left, the title and the rest of the
   hero beside it; status, synopsis and reviews carry on under both */
@container (min-width: 720px) {
  .details__hero {
    display: grid;
    grid-template-columns: 200px minmax(0, 1fr);
    grid-auto-flow: dense;
    column-gap: 32px;
    align-content: start;
    justify-items: start;
    text-align: left;
  }

  .details__hero > * {
    grid-column: 2;
  }

  .details__cover {
    grid-column: 1;
    grid-row: 1 / span 8;
    width: 100%;
    margin-bottom: 0;
  }

  .details__genres {
    justify-content: flex-start;
  }
}

.details__genre {
  padding: 5px 10px;
  border: var(--px-border);
  border-radius: 0;
  background: var(--tag);
  font-family: var(--rl-font-body);
  font-size: 11px;
  line-height: 14px;
  font-weight: 700;
  color: var(--rl-text);
}

/* --- Status: the town's chips, the chosen one filled in the building's colour ------------ */
.details__status {
  gap: 6px;
}

.details__status > .details__status-btn {
  flex: 1;
}

.details__error {
  margin: -8px 0 0;
  font-size: 13px;
  font-weight: 700;
  color: #a23d3d;
}

/* The panel under the status chips (progress, or review and rate): the cafe's card */
.details__panel {
  margin: -6px 0 0;
  padding: 12px 14px;
  border: 1px solid var(--soft-line);
  border-radius: 16px;
  background: var(--rl-surface);
}

.details__finished {
  display: flex;
  gap: 8px;
}

.details__finished .details__link-btn {
  flex: 1;
}

/* only the way in is animated; the old panel goes at once */
.pop-enter-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.pop-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.97);
}

/* --- Sections --------------------------------------------------------------------------- */
.details__section {
  padding-top: 14px;
  border-top: 1px solid var(--rl-line);
}

.details__heading {
  margin: 0 0 8px;
  font-family: var(--rl-font-title);
  font-size: 17px;
  line-height: 24px;
  font-weight: 700;
  color: var(--rl-text);
}

.details__synopsis {
  color: var(--rl-text);
}

.details__rating {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px 0;
  text-align: center;
}

.details__rating-score {
  margin: 8px 0 0;
  font-size: 16px;
  color: var(--rl-muted);
}

.details__rating-score strong {
  font-family: var(--rl-font-title);
  font-size: 26px;
  line-height: 32px;
  color: var(--rl-text);
}

.details__rating-count {
  margin: 0;
  font-size: 12px;
  color: var(--rl-muted);
}
</style>
