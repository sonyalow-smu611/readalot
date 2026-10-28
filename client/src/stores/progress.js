// Scaffolded with AI assistance — see AI_USAGE.md
// The reader's XP, level and coins, shared by the map's badge, the salon and the room's Shop.
// Earning is best effort: a failed call never gets in the way of what the reader was doing.
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { START_COINS, levelFor } from '@/lib/levels.js'
import { earnXp, loadProgress, spendCoins } from '@/services/progress.js'

export const useProgressStore = defineStore('progress', () => {
  const xp = ref(0)
  const coins = ref(START_COINS)
  const ready = ref(false)
  // bumped at each level-up, for the badge's pop and the salon's confetti
  const levelUps = ref(0)
  // the last XP earned, { xp, coins, key }, for the badge's +XP
  const lastGain = ref(null)

  const level = computed(() => levelFor(xp.value))

  async function load() {
    const { data, error } = await loadProgress()
    if (error || !data) return
    xp.value = data.xp
    coins.value = data.coins ?? START_COINS
    ready.value = true
  }

  async function earn(action, target = '') {
    try {
      const { data, error } = await earnXp(action, target)
      if (error || !data) return null
      xp.value = data.xp
      coins.value = data.coins
      if (data.gained > 0) lastGain.value = { xp: data.gained, coins: data.coins_gained, key: Date.now() }
      if (data.level_up) levelUps.value += 1
      return data
    } catch {
      return null
    }
  }

  // true once the coins are taken off; false if there weren't enough or the save failed
  async function spend(amount) {
    const { data, error } = await spendCoins(amount)
    if (error) return false
    coins.value = data
    return true
  }

  function reset() {
    xp.value = 0
    coins.value = START_COINS
    ready.value = false
    lastGain.value = null
  }

  return { xp, coins, ready, levelUps, lastGain, level, load, earn, spend, reset }
})
