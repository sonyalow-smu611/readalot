// Scaffolded with AI assistance — see AI_USAGE.md
// A page's way back to where the reader came from. The router keeps the page before this one in
// the history state: Back goes there (to its tab and its place on the page), and says where that
// is. A page opened straight from a link has nothing before it, so Back goes to `fallback`.
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const NAMES = { town: 'town', house: 'My Room', library: 'the Library', cafe: 'the Cafe', salon: 'the Hair Salon' }

// What the way back says for the page before: 'Back to the Cafe', or just 'Back' for a page with
// no name of its own.
export function backLabelFor(router, previous) {
  const resolved = router.resolve(previous)
  if (resolved.name === 'reader-room') return 'Back to profile'
  const place = NAMES[resolved.name]
  return place ? `Back to ${place}` : 'Back'
}

export function useGoBack(fallback, fallbackLabel) {
  const router = useRouter()
  const route = useRoute()

  // read again whenever the address changes: the history state is not reactive
  const previous = computed(() => {
    void route.fullPath
    return typeof window.history.state?.back === 'string' ? window.history.state.back : null
  })
  const label = computed(() => {
    return previous.value ? backLabelFor(router, previous.value) : fallbackLabel
  })
  // an address for the link, so it still opens in a new tab
  const href = computed(() => router.resolve(previous.value ?? fallback).href)

  function goBack() {
    if (previous.value) router.back()
    else router.push(fallback)
  }

  return { goBack, label, href, hasPrevious: computed(() => Boolean(previous.value)) }
}
