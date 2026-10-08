// Scaffolded with AI assistance (Phase 1) — see AI_USAGE.md
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import usersData from '@/data/users.json'

// Phase 1: the signed-in reader is a local mock; other readers come from users.json.
export const useUserStore = defineStore('user', () => {
  const profile = ref({
    id: 'me',
    name: 'Alex',
    avatar: '🐨',
    favouriteGenres: ['Fantasy', 'Mystery', 'Literary Fiction'],
  })

  const readers = ref(structuredClone(usersData))

  const readersByCompatibility = computed(() =>
    [...readers.value].sort((a, b) => b.compatibility - a.compatibility),
  )

  function findReader(id) {
    return readers.value.find((reader) => reader.id === id) ?? null
  }

  return { profile, readers, readersByCompatibility, findReader }
})
