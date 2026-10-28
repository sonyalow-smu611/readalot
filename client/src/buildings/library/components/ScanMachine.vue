<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The library's book scanner. Khaleil's Scan Book (formerly views/ScanBookView.vue), moved into
// the library as a machine in the hall: a live camera with "Snap cover", or a photo upload, sent
// to the server, which reads the cover's text (Google Vision) and finds the book.
// Emits `found` with the book (the page opens its preview, where it can go on a shelf),
// `search` to look the book up by typing instead, and `close`.
import { onBeforeUnmount, onMounted, ref } from 'vue'
import BookCover from '@/components/BookCover.vue'
import { scanBook } from '@/services/api.js'

const emit = defineEmits(['close', 'found', 'search'])

// Longest side of the photo sent to the server: enough for Vision, small enough to upload fast.
const MAX_SIDE = 1280

const panel = ref(null)
const video = ref(null)
const cameraReady = ref(false)
const cameraError = ref('')
const scanning = ref(false)
const error = ref('')
const notFound = ref(false)
const sample = ref(false)
// the last book found, and the text read off its cover
const book = ref(null)
const detectedText = ref('')
let stream = null

onMounted(() => {
  panel.value?.focus()
  startCamera()
})

// the camera goes off as soon as the scanner closes
onBeforeUnmount(stopCamera)

function stopCamera() {
  stream?.getTracks().forEach((track) => track.stop())
  stream = null
}

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    cameraError.value = "This browser can't open the camera. Upload a photo instead."
    return
  }

  try {
    const opened = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: MAX_SIDE } },
      audio: false,
    })
    // closed while the browser was still asking for the camera
    if (!video.value) {
      opened.getTracks().forEach((track) => track.stop())
      return
    }
    stream = opened
    video.value.srcObject = stream
    await video.value.play()
    cameraReady.value = true
  } catch (err) {
    cameraError.value =
      err.name === 'NotAllowedError'
        ? "Camera access was blocked. Allow it in the browser's address bar, or upload a photo instead."
        : 'No camera found. Upload a photo instead.'
  }
}

function snap() {
  const { videoWidth, videoHeight } = video.value
  scan(toBase64(video.value, videoWidth, videoHeight))
}

async function upload(event) {
  const file = event.target.files?.[0]
  // clear the input so picking the same photo again still scans
  event.target.value = ''
  if (!file) return

  try {
    const image = await createImageBitmap(file)
    scan(toBase64(image, image.width, image.height))
  } catch {
    error.value = "That file isn't an image we can read."
  }
}

// Draws the source scaled down to MAX_SIDE and returns it as base64 JPEG (no data: prefix).
function toBase64(source, width, height) {
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.85).split(',')[1]
}

async function scan(imageBase64) {
  scanning.value = true
  error.value = ''
  notFound.value = false
  try {
    const result = await scanBook(imageBase64)
    detectedText.value = result.detectedText || ''
    sample.value = Boolean(result.sample)

    if (!result.book) {
      book.value = null
      notFound.value = true
      error.value = "Couldn't find that book. Try again with the title in view, or search for it."
      return
    }

    book.value = result.book
    emit('found', result.book)
  } catch {
    error.value = 'Scan failed. Try again.'
  } finally {
    scanning.value = false
  }
}
</script>

<template>
  <div class="scanner" @keydown.esc="$emit('close')">
    <button type="button" class="scanner__backdrop" tabindex="-1" aria-label="Close scanner" @click="$emit('close')" />

    <section
      ref="panel"
      class="scanner__panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scanner-title"
      tabindex="-1"
    >
      <header class="scanner__head">
        <h2 id="scanner-title" class="scanner__title"><span aria-hidden="true">📷</span> Book scanner</h2>
        <button type="button" class="scanner__close" aria-label="Close" @click="$emit('close')">✕</button>
      </header>
      <p class="scanner__lead">Hold a book's cover up to the camera, with its title in view.</p>

      <div v-if="!cameraError" class="scanner__viewfinder" data-tour="scan-camera">
        <video ref="video" class="scanner__video" autoplay playsinline muted aria-label="Camera view" />
        <span class="scanner__frame" aria-hidden="true" />
        <span v-if="scanning" class="scanner__beam" aria-hidden="true" />
        <p v-if="!cameraReady" class="scanner__hint">Starting camera…</p>
      </div>
      <p v-else class="scanner__note" data-tour="scan-camera" role="status">{{ cameraError }}</p>

      <button
        v-if="!cameraError"
        class="btn btn-primary w-100 mb-2 scanner__snap"
        data-tour="scan-snap"
        type="button"
        :disabled="!cameraReady || scanning"
        @click="snap"
      >
        {{ scanning ? 'Scanning…' : 'Snap cover' }}
      </button>

      <label class="scanner__label" for="scan-upload">Or upload a photo of the cover</label>
      <input
        id="scan-upload"
        data-tour="scan-upload"
        class="form-control mb-2"
        type="file"
        accept="image/*"
        capture="environment"
        :disabled="scanning"
        @change="upload"
      />

      <p v-if="scanning && cameraError" class="scanner__note" role="status">Scanning…</p>
      <p v-if="error" class="scanner__error" role="alert">
        {{ error }}
        <button v-if="notFound" type="button" class="scanner__link" @click="$emit('search')">Search by title</button>
      </p>
      <p v-if="sample" class="scanner__note">
        Sample result: covers can't be read until GOOGLE_CLOUD_VISION_KEY is set.
      </p>

      <RouterLink v-if="book" class="scanner__result" :to="`/books/${book.id}`">
        <BookCover class="scanner__cover" :cover-url="book.coverUrl" :title="book.title" :seed="book.id" />
        <span>
          <strong>{{ book.title }}</strong>
          <small>Read off the cover: {{ detectedText || '—' }}</small>
        </span>
      </RouterLink>
    </section>
  </div>
</template>

<style scoped>
.scanner {
  position: absolute;
  inset: 0;
  z-index: 40;
  display: grid;
  place-items: center;
  padding: 16px;
}

.scanner__backdrop {
  position: absolute;
  inset: 0;
  padding: 0;
  border: 0;
  background: rgba(30, 26, 36, 0.45);
  cursor: pointer;
}

/* the machine's front: teal with a dark outline, like its sprite in the hall */
.scanner__panel {
  position: relative;
  width: 100%;
  max-width: 400px;
  max-height: 100%;
  overflow-y: auto;
  padding: 14px 16px 16px;
  border: 3px solid #1e1a24;
  border-radius: 18px;
  background: var(--rl-surface);
  box-shadow: inset 0 6px 0 var(--library-accent, #3f6b78), 0 14px 36px rgba(30, 26, 36, 0.35);
  color: var(--rl-text);
  animation: scanner-pop 0.22s cubic-bezier(0.2, 0.9, 0.3, 1.2);
}

.scanner__panel:focus {
  outline: none;
}

.scanner__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 4px;
}

.scanner__title {
  margin: 0;
  font-family: var(--rl-font-title);
  font-size: 20px;
}

.scanner__close {
  display: grid;
  place-items: center;
  flex: none;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid var(--rl-line);
  border-radius: 50%;
  background: var(--rl-surface);
  color: var(--rl-primary);
}

.scanner__lead {
  margin: 4px 0 12px;
  font-size: 13px;
  color: var(--rl-muted);
}

/* the screen: dark green glass round the camera */
.scanner__viewfinder {
  position: relative;
  overflow: hidden;
  aspect-ratio: 4 / 3;
  margin-bottom: 12px;
  border: 6px solid #1f3a34;
  border-radius: 12px;
  background: #1f3a34;
}

.scanner__video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* corner marks showing where the cover goes */
.scanner__frame {
  position: absolute;
  inset: 12% 22%;
  border: 2px dashed rgba(143, 224, 168, 0.8);
  border-radius: 6px;
  pointer-events: none;
}

/* the red scan line, sweeping while a cover is read */
.scanner__beam {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 2px;
  background: #e5484d;
  box-shadow: 0 0 10px 2px rgba(229, 72, 77, 0.7);
  animation: scanner-sweep 1.1s ease-in-out infinite alternate;
}

.scanner__hint {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  margin: 0;
  font-size: 13px;
  color: #f1e7da;
}

.scanner__label {
  display: block;
  margin: 6px 0 4px;
  font-size: 13px;
  color: var(--rl-muted);
}

.scanner__note {
  margin: 0 0 8px;
  font-size: 13px;
  color: var(--rl-muted);
}

.scanner__error {
  margin: 0 0 8px;
  font-size: 13px;
  color: #8d2218;
}

.scanner__link {
  padding: 0;
  border: 0;
  background: none;
  font-weight: 700;
  color: var(--library-accent, var(--rl-primary));
  text-decoration: underline;
}

.scanner__result {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 6px;
  padding: 10px;
  border: 1px solid var(--rl-line);
  border-radius: var(--rl-radius-card);
  color: var(--rl-text);
  text-decoration: none;
}

.scanner__cover {
  flex: none;
  width: 44px;
  height: 66px;
  border-radius: 4px;
}

.scanner__result small {
  display: block;
  margin-top: 2px;
  color: var(--rl-muted);
}

@keyframes scanner-pop {
  from {
    transform: scale(0.94);
    opacity: 0;
  }
}

@keyframes scanner-sweep {
  to {
    top: calc(100% - 2px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .scanner__panel,
  .scanner__beam {
    animation: none;
  }
}
</style>
