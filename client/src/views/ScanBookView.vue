<template>
  <section class="app-shell">
    <h1 class="h3 mb-3">Scan Book</h1>

    <div v-if="!cameraError" class="scan__viewfinder mb-3">
      <video ref="video" class="scan__video" autoplay playsinline muted aria-label="Camera view" />
      <p v-if="!cameraReady" class="scan__hint">Starting camera…</p>
    </div>
    <p v-else class="small text-muted" role="status">{{ cameraError }}</p>

    <button
      v-if="!cameraError"
      class="btn btn-primary w-100 mb-2"
      type="button"
      :disabled="!cameraReady || scanning"
      @click="snap"
    >
      {{ scanning ? "Scanning…" : "Snap cover" }}
    </button>

    <label class="form-label small text-muted mb-1" for="scan-upload">Or upload a photo of the cover</label>
    <input
      id="scan-upload"
      class="form-control mb-3"
      type="file"
      accept="image/*"
      capture="environment"
      :disabled="scanning"
      @change="upload"
    >

    <p v-if="scanning && cameraError" class="small text-muted">Scanning…</p>
    <p v-if="error" class="small text-danger" role="alert">
      {{ error }}
      <RouterLink v-if="notFound" to="/search">Search manually</RouterLink>
    </p>
    <p v-if="sample" class="small text-muted">
      Sample result: covers can't be read until GOOGLE_CLOUD_VISION_KEY is set.
    </p>

    <RouterLink
      v-if="book"
      class="d-flex gap-3 text-decoration-none text-dark p-3 border bg-white rounded-2"
      :to="`/books/${book.id}`"
    >
      <BookCover :cover-url="book.coverUrl" :title="book.title" />
      <div>
        <h2 class="h5">{{ book.title }}</h2>
        <p class="small text-muted mb-0">{{ detectedText }}</p>
      </div>
    </RouterLink>

    <BookPreviewModal :book="previewOpen ? book : null" @close="previewOpen = false" @status="shelve" />
  </section>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import BookCover from "../components/BookCover.vue";
import BookPreviewModal from "../components/BookPreviewModal.vue";
import { useToast } from "../composables/useToast.js";
import { getMyBooks, saveUserBook, scanBook } from "../services/api.js";
import { STATUSES } from "../services/shelves.js";

// Longest side of the photo sent to the server: enough for Vision, small enough to upload fast.
const MAX_SIDE = 1280;

const video = ref(null);
const cameraReady = ref(false);
const cameraError = ref("");
const book = ref(null);
const detectedText = ref("");
const previewOpen = ref(false);
const scanning = ref(false);
const error = ref("");
const notFound = ref(false);
const sample = ref(false);
const { show } = useToast();
let stream = null;

onMounted(startCamera);
onBeforeUnmount(() => stream?.getTracks().forEach((track) => track.stop()));

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    cameraError.value = "This browser can't open the camera. Upload a photo instead.";
    return;
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment", width: { ideal: MAX_SIDE } },
      audio: false
    });
    video.value.srcObject = stream;
    await video.value.play();
    cameraReady.value = true;
  } catch (err) {
    cameraError.value =
      err.name === "NotAllowedError"
        ? "Camera access was blocked. Allow it in the browser's address bar, or upload a photo instead."
        : "No camera found. Upload a photo instead.";
  }
}

function snap() {
  const { videoWidth, videoHeight } = video.value;
  scan(toBase64(video.value, videoWidth, videoHeight));
}

async function upload(event) {
  const file = event.target.files?.[0];
  // clear the input so picking the same photo again still scans
  event.target.value = "";
  if (!file) return;

  try {
    const image = await createImageBitmap(file);
    scan(toBase64(image, image.width, image.height));
  } catch {
    error.value = "That file isn't an image we can read.";
  }
}

// Draw the source scaled down to MAX_SIDE and return it as base64 JPEG (no data: prefix).
function toBase64(source, width, height) {
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  canvas.getContext("2d").drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85).split(",")[1];
}

async function scan(imageBase64) {
  scanning.value = true;
  error.value = "";
  notFound.value = false;
  try {
    const result = await scanBook(imageBase64);
    detectedText.value = result.detectedText;
    sample.value = Boolean(result.sample);

    if (!result.book) {
      book.value = null;
      notFound.value = true;
      error.value = "Couldn't find that book. Try again with the title in view, or";
      return;
    }

    // a book already on the shelf opens with its current status highlighted
    book.value = { ...result.book, status: await shelfStatus(result.book.id) };
    previewOpen.value = true;
  } catch {
    error.value = "Scan failed. Try again.";
  } finally {
    scanning.value = false;
  }
}

async function shelfStatus(id) {
  try {
    const { books } = await getMyBooks();
    return books.find((item) => item.id === id)?.status || null;
  } catch {
    return null;
  }
}

// POST /user-books upserts, so this both adds a new book and moves one already shelved
async function shelve(status) {
  const target = book.value;
  const label = STATUSES.find((option) => option.value === status).short;
  const moved = Boolean(target.status);

  if (target.status === status) {
    previewOpen.value = false;
    show(`Already in ${label}`);
    return;
  }

  try {
    await saveUserBook({ bookId: target.id, status });
    target.status = status;
    previewOpen.value = false;
    show(`${moved ? "Moved" : "Added"} to ${label}`);
  } catch {
    show(`Couldn't add "${target.title}". Try again.`);
  }
}
</script>

<style scoped>
.scan__viewfinder {
  position: relative;
  overflow: hidden;
  aspect-ratio: 4 / 3;
  border-radius: 12px;
  background: #2b211b;
}

.scan__video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scan__hint {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  margin: 0;
  font-size: 13px;
  color: #f1e7da;
}
</style>
