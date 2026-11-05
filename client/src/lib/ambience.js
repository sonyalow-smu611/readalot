// Scaffolded with AI assistance — see AI_USAGE.md
// Background sounds that follow the live weather and where you are, under the music.
//   Town: rain, or a thunderstorm; on dry days birds (sunny) or a breeze (cloudy); crickets at night.
//   Inside (your room, the library, the cafe): rain tapping the window when it rains.
//   The cafe: a cup and saucer clinking now and then.
// The music note turns these off with the music (stores/music.js). All sounds are CC0, from
// OpenGameArt (see README); the loops in public/ambience/ are cut to repeat without a seam.
import { audioContext } from '@/lib/sfx.js'
import { fetchWeather } from '@/services/weather.js'

// Levels: the music files are all -16 LUFS and play at 0.35 (about -25 LUFS); the loops are all
// about -24 LUFS, so at 0.22 they sit some 12 dB under the music, there but in the background.
// Indoors the rain is a touch quieter again: it's on the other side of the glass.
const LOOPS = {
  rain: { file: '/ambience/rain.mp3', volume: 0.22 },
  storm: { file: '/ambience/storm.mp3', volume: 0.22 },
  sunny: { file: '/ambience/sunny.mp3', volume: 0.22 },
  cloudy: { file: '/ambience/cloudy.mp3', volume: 0.22 },
  night: { file: '/ambience/night.mp3', volume: 0.22 },
  window: { file: '/ambience/window.mp3', volume: 0.18 },
}
const CLINKS = [1, 2, 3, 4].map((i) => `/ambience/cafe-clink-${i}.mp3`)
const CLINK_VOLUME = 0.16
// a clink every CLINK_MIN to CLINK_MAX seconds
const CLINK_MIN = 9
const CLINK_MAX = 22
const FADE = 1.5
const WEATHER_EVERY = 10 * 60 * 1000
// Open-Meteo's thunderstorm codes (services/weather.js counts them as rain)
const THUNDER_CODES = new Set([95, 96, 99])
// buildings that show the weather through a window
const INDOORS_WITH_WINDOW = new Set(['house', 'library', 'cafe'])

const buffers = {}
let wanted = { on: false, area: 'town' }
let weather = null
let weatherTimer = 0
let playing = null // { name, source, gain }
let clinkTimer = 0

async function buffer(file) {
  if (!buffers[file]) {
    const ctx = audioContext()
    buffers[file] = fetch(file)
      .then((response) => response.arrayBuffer())
      .then((data) => ctx.decodeAudioData(data))
      .catch(() => null)
  }
  return buffers[file]
}

function refreshWeather() {
  fetchWeather()
    .then((now) => {
      weather = now
      apply()
    })
    .catch(() => {})
}

// Which loop belongs here, now.
function loopFor(area) {
  if (!weather || weather.unavailable) return null
  const raining = weather.scene === 'rain'
  if (area === 'town') {
    if (raining) return THUNDER_CODES.has(weather.weatherCode) ? 'storm' : 'rain'
    if (!weather.isDay) return 'night'
    return weather.scene === 'sunny' ? 'sunny' : 'cloudy'
  }
  if (INDOORS_WITH_WINDOW.has(area) && raining) return 'window'
  return null
}

function fadeOut(old) {
  if (!old) return
  const ctx = audioContext()
  const now = ctx.currentTime
  old.gain.gain.cancelScheduledValues(now)
  old.gain.gain.setValueAtTime(old.gain.gain.value, now)
  old.gain.gain.linearRampToValueAtTime(0, now + FADE)
  old.source.stop(now + FADE + 0.05)
}

async function switchTo(name) {
  if (playing?.name === name) return
  const old = playing
  playing = null
  fadeOut(old)
  if (import.meta.env.DEV) window.__ambience = null
  if (!name) return
  const ctx = audioContext()
  const loop = LOOPS[name]
  const data = await buffer(loop.file)
  // something else was asked for while it loaded
  if (!data || loopFor(wanted.area) !== name || !wanted.on || playing) return
  const source = ctx.createBufferSource()
  source.buffer = data
  source.loop = true
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(loop.volume, ctx.currentTime + FADE)
  source.connect(gain).connect(ctx.destination)
  source.start()
  playing = { name, source, gain }
  // development only: tests read what's playing from window.__ambience
  if (import.meta.env.DEV) window.__ambience = name
}

function scheduleClink() {
  clearTimeout(clinkTimer)
  if (!(wanted.on && wanted.area === 'cafe')) return
  const wait = (CLINK_MIN + Math.random() * (CLINK_MAX - CLINK_MIN)) * 1000
  clinkTimer = setTimeout(async () => {
    if (!(wanted.on && wanted.area === 'cafe')) return
    const ctx = audioContext()
    const data = await buffer(CLINKS[Math.floor(Math.random() * CLINKS.length)])
    if (data && ctx.state === 'running') {
      const source = ctx.createBufferSource()
      source.buffer = data
      const gain = ctx.createGain()
      gain.gain.value = CLINK_VOLUME * (0.7 + Math.random() * 0.3)
      source.connect(gain).connect(ctx.destination)
      source.start()
    }
    scheduleClink()
  }, wait)
}

function apply() {
  if (!audioContext()) return
  switchTo(wanted.on ? loopFor(wanted.area) : null)
}

// Called by the music store on every change: whether background audio is on, and where you are.
export function followAmbience({ on, area }) {
  const wasInCafe = wanted.on && wanted.area === 'cafe'
  wanted = { on, area }
  if (on && !weather && !weatherTimer) {
    refreshWeather()
    weatherTimer = setInterval(refreshWeather, WEATHER_EVERY)
  }
  apply()
  const inCafe = on && area === 'cafe'
  if (inCafe && !wasInCafe) scheduleClink()
  if (!inCafe) clearTimeout(clinkTimer)
}
