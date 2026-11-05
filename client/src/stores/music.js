// Scaffolded with AI assistance — see AI_USAGE.md
// Background music: one looping track per building, for signed-in readers only.
// Tracks are from Fesliyan Studios (free for non-commercial use, credit in README):
// https://www.FesliyanStudios.com
//
// The reader's on/off choice is remembered on this device. Browsers refuse to start sound before
// the first tap or key press, so a blocked start waits for that and tries again.
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { followAmbience } from '@/lib/ambience.js'

const STORAGE_KEY = 'readalot-music'
const VOLUME = 0.35
const FADE_MS = 600

// which track each building plays (files in client/public/music/)
export const TRACKS = {
  town: '/music/town.mp3', // News Chill – Steve Oxen (the home page)
  house: '/music/house.mp3', // Talk To Me – David Renda
  library: '/music/library.mp3', // Morning Refresher – Steve Oxen
  cafe: '/music/cafe.mp3', // The Lounge – David Renda
  salon: '/music/salon.mp3', // Swinging Sixties – Steve Oxen
}

// Route name → building. Pages opened from a building (a book, search, a shelf) aren't listed:
// they keep the building's track that was already playing.
const AREA_BY_ROUTE = {
  town: 'town',
  house: 'house',
  'my-shelf': 'house',
  'reader-house': 'house',
  'reader-house-shelf': 'house',
  library: 'library',
  search: 'library',
  'genre-shelf': 'library',
  cafe: 'cafe',
  'reader-room': 'cafe',
  'reader-shelf': 'cafe',
  salon: 'salon',
}

export function areaForRoute(name) {
  return AREA_BY_ROUTE[name] ?? null
}

function savedChoice() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off'
  } catch {
    return true
  }
}

export const useMusicStore = defineStore('music', () => {
  const enabled = ref(savedChoice())
  // signed in and on a page where music belongs
  const active = ref(false)
  const area = ref('town')

  let audio = null
  let fadeTimer = 0
  let waitingForTap = false
  // where each track was left, so going back to a building carries on from there
  const positions = {}

  function element() {
    if (!audio) {
      audio = new Audio()
      audio.loop = true
      audio.preload = 'auto'
      audio.volume = 0
    }
    return audio
  }

  function fadeTo(target, done) {
    const el = element()
    clearInterval(fadeTimer)
    const start = el.volume
    const steps = Math.max(1, Math.round(FADE_MS / 30))
    let step = 0
    fadeTimer = setInterval(() => {
      step += 1
      el.volume = Math.min(1, Math.max(0, start + ((target - start) * step) / steps))
      if (step >= steps) {
        clearInterval(fadeTimer)
        done?.()
      }
    }, 30)
  }

  function retry(event) {
    // a tap on the music button itself is handled by toggle(), which starts the music
    if (event?.target?.closest?.('.music-toggle')) return
    stopWaiting()
    sync()
  }

  function stopWaiting() {
    if (!waitingForTap) return
    window.removeEventListener('pointerdown', retry, true)
    window.removeEventListener('keydown', retry, true)
    waitingForTap = false
  }

  function retryOnFirstTap() {
    if (waitingForTap) return
    waitingForTap = true
    window.addEventListener('pointerdown', retry, true)
    window.addEventListener('keydown', retry, true)
  }

  function wanted() {
    return active.value && enabled.value
  }

  function start() {
    const el = element()
    const src = TRACKS[area.value]
    const switching = !el.src.endsWith(src)
    const begin = () => {
      if (!wanted()) return
      if (switching || !el.src) {
        el.src = src
        el.currentTime = positions[src] ?? 0
      }
      el.play().then(
        // the reader may have turned music off (or left) while it was starting
        () => (wanted() ? fadeTo(VOLUME) : el.pause()),
        () => {
          if (wanted()) retryOnFirstTap()
        },
      )
    }
    // a different building: fade the old track out first
    if (switching && !el.paused) {
      positions[el.src.slice(el.src.indexOf('/music/'))] = el.currentTime
      fadeTo(0, begin)
    } else {
      begin()
    }
  }

  function stop() {
    if (!audio || audio.paused) return
    fadeTo(0, () => {
      positions[audio.src.slice(audio.src.indexOf('/music/'))] = audio.currentTime
      audio.pause()
    })
  }

  function sync() {
    if (wanted()) start()
    else stop()
    // the weather sounds go with the music: same building, and the note turns both off
    followAmbience({ on: wanted(), area: area.value })
  }

  // Called on every page change: whether music belongs here, and which building's track.
  function follow({ signedIn, routeName, bare }) {
    active.value = Boolean(signedIn && !bare)
    const next = areaForRoute(routeName)
    if (next) area.value = next
    sync()
  }

  function toggle() {
    // Music is on but the browser hasn't let it start yet (no tap so far): this tap starts it
    // rather than turning it off, since the reader hasn't heard anything to turn off.
    if (enabled.value && waitingForTap) {
      stopWaiting()
      sync()
      return
    }
    stopWaiting()
    enabled.value = !enabled.value
    try {
      localStorage.setItem(STORAGE_KEY, enabled.value ? 'on' : 'off')
    } catch {
      // private mode: the choice lasts until the tab closes
    }
    sync()
  }

  return { enabled, active, area, follow, toggle }
})
