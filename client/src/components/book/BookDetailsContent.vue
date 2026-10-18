<!--
  What a reader sees about a book once it is open, top to bottom: the cover (a made-up cloth
  book with the title on it when there is no picture), the title, author, stars and genres,
  which shelf it is on (Reading shows a progress slider), then Synopsis, Rating and Reviews.
  Shown in the room's Book details card and in the book overlay's open spread.
  Written with AI assistance: see AI_USAGE.md.
-->
<template>
  <article class="details">
    <!-- hero -->
    <header class="details__hero">
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
    <div class="btn-group w-100 details__status" role="group" aria-label="Reading status">
      <button
        v-for="option in STATUS_OPTIONS"
        :key="option.value"
        type="button"
        class="btn details__status-btn"
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
      <label v-if="status === 'reading'" key="reading" class="details__panel details__progress">
        <span class="details__progress-label">
          <span>Progress</span>
          <output>{{ percent }}% read</output>
        </span>
        <input
          v-model.number="percent"
          class="form-range details__slider"
          type="range"
          min="0"
          max="100"
          step="1"
          :style="{ '--fill': `${percent}%` }"
          :aria-valuetext="`${percent} percent read`"
          @change="bookshelf.setProgress(shelved.id, percent)"
        />
      </label>
      <div v-else-if="status === 'read' && linksToPage" key="read" class="details__panel details__finished">
        <RouterLink
          v-if="shelved.reviewed && shelved.myRating"
          class="btn details__link-btn is-active"
          :to="page"
          @click="$emit('leave')"
        >
          View review and rating
        </RouterLink>
        <template v-else>
          <RouterLink class="btn details__link-btn is-active" :to="page" @click="$emit('leave')">
            {{ shelved.reviewed ? "View review" : "Review" }}
          </RouterLink>
          <RouterLink class="btn details__link-btn" :to="page" @click="$emit('leave')">
            {{ shelved.myRating ? "View rating" : "Rate" }}
          </RouterLink>
        </template>
      </div>
    </Transition>

    <section class="details__section" aria-labelledby="details-synopsis">
      <h3 id="details-synopsis" class="details__heading">Synopsis</h3>
      <p class="details__synopsis">{{ book?.description || "No synopsis for this book yet." }}</p>
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
        <p v-if="ratingsCount" class="details__rating-count">
          from {{ ratingsCount }} {{ ratingsCount === 1 ? "rating" : "ratings" }}
        </p>
      </div>
    </section>

    <section class="details__section" aria-labelledby="details-reviews">
      <h3 id="details-reviews" class="details__heading">Reviews</h3>
      <p v-if="reviewsLoading" class="details__note">
        <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Loading reviews…
      </p>
      <p v-else-if="reviewsError" class="details__note">
        Couldn't load reviews.
        <button type="button" class="btn btn-link details__retry" @click="loadReviews">Retry</button>
      </p>
      <p v-else-if="!reviews.length" class="details__note">No reviews yet. Finish the book to write the first one.</p>
      <ul v-else class="list-unstyled details__reviews">
        <li v-for="review in reviews" :key="review.id" class="details__review">
          <div class="details__review-top">
            <StarMeter v-if="review.rating" :value="review.rating" />
            <time v-if="review.created_at" :datetime="review.created_at">{{ formatDate(review.created_at) }}</time>
          </div>
          <p class="details__review-text">{{ review.review_text || "Rated without a review." }}</p>
        </li>
      </ul>
    </section>
  </article>
</template>

<script setup>
import { computed, defineComponent, h, ref, watch } from 'vue'
import { primaryAuthor } from '@/lib/book'
import { spineLook } from '@/services/shelves.js'
import { getReviews } from '@/services/api.js'
import { useBookshelfStore } from '@/stores/bookshelf'

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

// Five stars filled to a fraction (3.6 fills three and most of the fourth).
const StarMeter = defineComponent({
  props: { value: { type: Number, default: 0 }, big: Boolean },
  setup(p) {
    return () =>
      h('span', { class: ['stars', { 'stars--big': p.big }], 'aria-hidden': 'true' }, [
        h('span', { class: 'stars__back' }, '★★★★★'),
        h('span', { class: 'stars__fill', style: { width: `${(Math.min(5, p.value) / 5) * 100}%` } }, '★★★★★'),
      ])
  },
})

const bookshelf = useBookshelfStore()

const author = computed(() => (props.book ? primaryAuthor(props.book) : ''))
const coverUrl = computed(() => props.book?.cover || props.book?.coverUrl || '')
const look = computed(() => spineLook({ id: props.book?.id || props.book?.title || '' }))
const rating = computed(() => Number(props.book?.rating ?? props.book?.averageRating) || 0)
const ratingText = computed(() => rating.value.toFixed(1).replace(/\.0$/, ''))
const ratingsCount = computed(() => Number(props.book?.ratingsCount) || 0)
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

// follows the slider while it is dragged; saved when it is let go
const percent = ref(0)
watch(
  () => shelved.value?.progress,
  (progress) => {
    percent.value = progress || 0
  },
  { immediate: true },
)

// --- Reviews ------------------------------------------------------------------------------
const reviews = ref([])
const reviewsLoading = ref(false)
const reviewsError = ref(false)

async function loadReviews() {
  const id = props.book?.id
  if (!id) return
  reviewsLoading.value = true
  reviewsError.value = false
  try {
    const data = await getReviews(id)
    // a quicker reader may have opened another book meanwhile
    if (props.book?.id === id) reviews.value = data?.reviews ?? []
  } catch {
    if (props.book?.id === id) reviewsError.value = true
  } finally {
    if (props.book?.id === id) reviewsLoading.value = false
  }
}

watch(
  () => props.book?.id,
  () => {
    reviews.value = []
    loadReviews()
  },
  { immediate: true },
)

const dateFormat = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : dateFormat.format(date)
}
</script>

<style scoped>
/* Design-system tokens (design-system/tokens.json), kept local to the card. */
.details {
  --ds-surface: #fffdf9;
  --ds-primary: #7f5539;
  --ds-primary-pressed: #414833;
  --ds-accent: #b08968;
  --ds-clay: #9c6644;
  --ds-text: #414833;
  --ds-muted: #656d4a;
  --ds-line: #ddb892;
  --ds-serif: Georgia, 'Times New Roman', serif;

  display: flex;
  flex-direction: column;
  gap: 16px;
  font-family: var(--ds-serif);
  font-size: 15px;
  line-height: 22px;
  color: var(--ds-text);
}

/* --- Hero ------------------------------------------------------------------------------- */
.details__hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.details__cover {
  width: min(46%, 150px);
  aspect-ratio: 2 / 3;
  margin-bottom: 16px;
  filter: drop-shadow(0 8px 10px rgba(52, 33, 20, 0.35));
}

.details__cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 3px 6px 6px 3px;
}

/* A cloth-bound book: a darker spine on the left, a framed title plate on the front, and a
   sliver of page edges showing on the right. */
.fake-book {
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  border-radius: 3px 6px 6px 3px;
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.08), transparent 40%, rgba(0, 0, 0, 0.1)),
    var(--cloth);
  color: var(--cloth-ink);
  box-shadow: 3px 0 0 -1px #f3eadc, 5px 1px 0 -2px #e2d3bd;
}

.fake-book__spine {
  flex: 0 0 11%;
  border-radius: 3px 0 0 3px;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.32), rgba(0, 0, 0, 0.12) 70%, rgba(255, 255, 255, 0.18));
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
  outline: 1px solid currentColor;
  outline-offset: -5px;
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
  font-size: 11px;
  line-height: 14px;
  font-style: italic;
}

.details__title {
  margin: 0 0 2px;
  font-family: var(--ds-serif);
  font-size: 22px;
  line-height: 28px;
  font-weight: 700;
  color: var(--ds-text);
}

.details__author {
  margin: 0 0 6px;
  font-style: italic;
  color: var(--ds-muted);
}

.details__facts {
  margin: -4px 0 6px;
  font-size: 13px;
  line-height: 18px;
  color: var(--ds-muted);
}

.details__stars {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 10px;
}

.details__stars-value {
  font-size: 14px;
  font-weight: 700;
  color: var(--ds-muted);
}

.details__genres {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin: 0;
}

.details__genre {
  padding: 4px 10px;
  font-family: var(--ds-serif);
  font-size: 12px;
  line-height: 16px;
  font-weight: 700;
  color: var(--ds-text);
  background: rgba(255, 253, 249, 0.6);
  border: 1px solid var(--ds-line);
}

/* --- Stars ------------------------------------------------------------------------------ */
.details :deep(.stars) {
  position: relative;
  display: inline-block;
  font-size: 16px;
  line-height: 1;
  letter-spacing: 2px;
  white-space: nowrap;
}

.details :deep(.stars--big) {
  font-size: 40px;
  letter-spacing: 6px;
}

.details :deep(.stars__back) {
  color: rgba(65, 72, 51, 0.18);
}

.details :deep(.stars__fill) {
  position: absolute;
  inset: 0 auto 0 0;
  overflow: hidden;
  color: var(--ds-clay);
}

/* --- Status ----------------------------------------------------------------------------- */
.details__status-btn,
.details__link-btn {
  --bs-btn-padding-y: 8px;
  --bs-btn-font-family: var(--ds-serif);
  --bs-btn-font-size: 14px;
  --bs-btn-font-weight: 400;
  --bs-btn-color: var(--ds-primary);
  --bs-btn-bg: rgba(255, 253, 249, 0.55);
  --bs-btn-border-color: var(--ds-primary);
  --bs-btn-hover-color: var(--ds-primary);
  --bs-btn-hover-bg: var(--ds-surface);
  --bs-btn-hover-border-color: var(--ds-primary);
  --bs-btn-active-color: var(--ds-surface);
  --bs-btn-active-bg: var(--ds-primary-pressed);
  --bs-btn-active-border-color: var(--ds-primary-pressed);
  --bs-btn-disabled-color: var(--ds-primary);
  --bs-btn-disabled-bg: transparent;
  --bs-btn-disabled-border-color: var(--ds-primary);
  --bs-btn-focus-shadow-rgb: 127, 85, 57;
  --bs-btn-border-radius: 12px;
  line-height: 18px;
}

.details__status-btn.is-active,
.details__link-btn.is-active {
  --bs-btn-color: var(--ds-surface);
  --bs-btn-bg: var(--ds-primary);
  --bs-btn-hover-color: var(--ds-surface);
  --bs-btn-hover-bg: var(--ds-primary-pressed);
  --bs-btn-hover-border-color: var(--ds-primary-pressed);
}

.details__error {
  margin: -8px 0 0;
  font-size: 13px;
  font-weight: 700;
  color: #9b2c1f;
}

/* The panel under the status buttons (progress, or review and rate) */
.details__panel {
  margin: -6px 0 0;
  padding: 12px;
  border: 1px solid var(--ds-line);
  border-radius: 12px;
  background: rgba(255, 253, 249, 0.7);
  box-shadow: 0 1px 2px rgba(65, 72, 51, 0.1);
}

.details__progress {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.details__progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 700;
}

.details__progress-label output {
  color: var(--ds-muted);
}

.details__slider {
  height: 20px;
}

.details__slider::-webkit-slider-runnable-track {
  height: 6px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--ds-accent) var(--fill), var(--ds-line) var(--fill));
}

.details__slider::-moz-range-track {
  height: 6px;
  border-radius: 999px;
  background: var(--ds-line);
}

.details__slider::-moz-range-progress {
  height: 6px;
  border-radius: 999px;
  background: var(--ds-accent);
}

.details__slider::-webkit-slider-thumb {
  margin-top: -6px;
  background: var(--ds-primary);
}

.details__slider::-moz-range-thumb {
  background: var(--ds-primary);
}

.details__slider:focus::-webkit-slider-thumb {
  box-shadow: 0 0 0 3px rgba(127, 85, 57, 0.3);
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
  border-top: 1px solid rgba(127, 85, 57, 0.28);
}

.details__heading {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 8px;
  font-family: var(--ds-serif);
  font-size: 18px;
  line-height: 24px;
  font-weight: 700;
  color: var(--ds-text);
}

.details__heading::before {
  content: '❦';
  font-size: 15px;
  color: var(--ds-clay);
}

.details__synopsis {
  margin: 0;
  white-space: pre-line;
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
  font-size: 18px;
  color: var(--ds-muted);
}

.details__rating-score strong {
  font-size: 28px;
  line-height: 34px;
  color: var(--ds-text);
}

.details__rating-count {
  margin: 0;
  font-size: 13px;
  color: var(--ds-muted);
}

.details__note {
  margin: 0;
  font-size: 14px;
  color: var(--ds-muted);
}

.details__retry {
  padding: 0 0 0 4px;
  font-family: var(--ds-serif);
  font-size: 14px;
  font-weight: 700;
  color: var(--ds-primary);
  vertical-align: baseline;
}

.details__reviews {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
}

.details__review {
  padding: 12px;
  border: 1px solid var(--ds-line);
  border-radius: 12px;
  background: rgba(255, 253, 249, 0.7);
}

.details__review-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  font-size: 13px;
  color: var(--ds-muted);
}

.details__review-text {
  margin: 0;
  white-space: pre-line;
}
</style>
