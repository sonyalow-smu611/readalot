<!--
  Scaffolded with AI assistance — see AI_USAGE.md
  A book's synopsis as plain paragraphs, without the HTML Google Books sends with it. A long one
  is cut off after about six lines, with Read more / Show less; a short one has no button. Shown
  on a genre's book card (BookPreviewModal) and in the book's details (BookDetailsContent).
-->
<template>
  <div class="synopsis">
    <p v-if="!paragraphs.length" class="synopsis__paragraph synopsis__none">No synopsis for this book yet.</p>
    <div v-else :id="textId" ref="text" class="synopsis__text" :class="{ 'is-clamped': !open }">
      <p v-for="(paragraph, index) in paragraphs" :key="index" class="synopsis__paragraph">{{ paragraph }}</p>
    </div>
    <button
      v-if="long"
      type="button"
      class="btn btn-link btn-sm synopsis__toggle"
      :aria-expanded="open"
      :aria-controls="textId"
      @click="open = !open"
    >
      {{ open ? 'Show less' : 'Read more' }}
    </button>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { synopsisParagraphs } from '@/lib/book'

const props = defineProps({
  // the synopsis as the API gives it, HTML and all
  text: { type: String, default: '' },
})

const paragraphs = computed(() => synopsisParagraphs(props.text))
const textId = useId()
const text = ref(null)
const open = ref(false)
// whether the text runs past the six lines it shows when cut short
const long = ref(false)

function measure() {
  const el = text.value
  if (!el || open.value) return
  long.value = el.scrollHeight > el.clientHeight + 1
}

let resize = null
onMounted(() => {
  resize = new ResizeObserver(measure)
  // the text is there only while there's a synopsis
  watch(
    text,
    (el, old) => {
      if (old) resize.unobserve(old)
      if (el) resize.observe(el)
      measure()
    },
    { immediate: true },
  )
})
onBeforeUnmount(() => resize?.disconnect())

// another book's synopsis starts cut short again
watch(
  () => props.text,
  async () => {
    open.value = false
    await nextTick()
    measure()
  },
)
</script>

<style scoped>
.synopsis__text {
  line-height: 1.5;
}

/* six lines */
.synopsis__text.is-clamped {
  max-height: 9em;
  overflow: hidden;
}

.synopsis__paragraph {
  margin: 0 0 0.75em;
  white-space: pre-line;
}

.synopsis__paragraph:last-child {
  margin-bottom: 0;
}

.synopsis__toggle {
  margin-top: 6px;
  padding-inline: 0;
}
</style>
