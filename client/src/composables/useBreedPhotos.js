import { ref } from 'vue'
import { cutout } from '@/lib/cutout.js'

const photos = ref({})
let started = false

async function load() {
  try {
    const res = await fetch('/api/creatures', { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return
    const data = await res.json()
    const images = data?.images || {}
    await Promise.all(
      Object.entries(images).map(async ([id, url]) => {
        const cut = await cutout(url)
        if (!cut) return
        photos.value = { ...photos.value, [id]: cut }
      }),
    )
  } catch {
    // Drawings stay in place when the breed photos cannot be fetched.
  }
}

export function useBreedPhotos() {
  if (!started) {
    started = true
    load()
  }
  return { photos }
}
