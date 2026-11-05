<script setup>
// AI-assisted scaffold — team review required (AI_USAGE.md).
// Café-only changes: use the shared People store and its existing readers.
// No database accounts, tables or records are created.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import BuildingShell from '@/components/shared/BuildingShell.vue'
import CafeViewport from './components/CafeViewport.vue'
import CafeReaderCard from './components/CafeReaderCard.vue'
import { drawCafeWeatherArt } from './cafeWeatherArt.js'
import { rotateCafeReaders } from './cafeReaders.js'
import { NEIGHBOUR } from '@/lib/neighbour.js'
import { stashView, takeView } from '@/lib/returnState.js'
import { usePeopleStore } from '@/stores/people.js'
import { drawAvatar, makeRnd } from '@/lib/avatar/draw.js'
import { characterSeed, normaliseCharacter, presetCharacter, toDrawParams } from '@/lib/avatar/catalogue.js'
import { fetchWeather } from '@/services/weather.js'
import { useUserStore } from '@/stores/user'
import { PLACES } from '@/town/places.js'

const place = PLACES.find((p) => p.id === 'cafe')
const user = useUserStore()
const people = usePeopleStore()

const weather = ref({ scene: 'cloudy', isDay: true, temperature: null })
const weatherProblem = ref(false)
const loading = ref(true)
const error = ref('')
const seatedIds = ref([])
const guests = computed(() => seatedIds.value.flatMap((id, index) => {
  const reader = people.find(id)
  if (!reader) return []
  return [{
    ...reader,
    id: reader.id, // Usernames are the app's reader-room route IDs.
    displayName: reader.displayName || reader.username || 'Reader',
    favoriteGenres: reader.favoriteGenres || [],
    compatibility: people.compatibility(reader),
    seatIndex: index,
    sprite: guestImage(reader, index),
  }]
}))
const activeId = ref('')
// the reader whose card was open when you left for their room: you come back to the same seats, to
// them and to their card, so you don't lose track of who you were meeting
const resumeId = ref('')
const CARD_VIEW = 'cafe-card'
const CARD_FOR = 30 * 60 * 1000
const READER_PAGES = ['reader-house', 'reader-house-shelf', 'reader-room', 'reader-shelf']
let resume = (() => {
  const back = takeView(CARD_VIEW)
  return back && Date.now() - back.at < CARD_FOR ? back : null
})()

onBeforeRouteLeave((to) => {
  if (activeId.value && READER_PAGES.includes(to.name)) {
    stashView(CARD_VIEW, { id: activeId.value, seated: seatedIds.value, at: Date.now() })
  }
})
const movementError = ref('')
const selectedReader = computed(() => guests.value.find((r) => r.id === activeId.value) ?? null)
const scene = computed(() => ['sunny', 'cloudy', 'rain'].includes(weather.value?.scene) ? weather.value.scene : 'cloudy')
const night = computed(() => weather.value?.isDay === false)
const artwork = computed(() => drawCafeWeatherArt({ scene: scene.value, night: night.value }))
const image = computed(() => artwork.value.desktop)
const foreground = computed(() => artwork.value.foreground)
const weatherLabel = computed(() => night.value ? 'Night' : ({ sunny: 'Sunny', cloudy: 'Cloudy', rain: 'Rainy' })[scene.value])
const temperatureLabel = computed(() => Number.isFinite(weather.value?.temperature) ? ` · ${Math.round(weather.value.temperature)}°C` : '')

function avatarData(character) {
  const normal = normaliseCharacter(character ?? presetCharacter('rosie'))
  return drawAvatar(toDrawParams(normal), makeRnd(characterSeed(normal))).toDataURL('image/png')
}

const selfImage = computed(() => avatarData(user.profile?.character))
const visualPresets = ['maya', 'jay', 'rosie', 'nova', 'rex']
function guestImage(reader, index) {
  // Sprite presets only affect appearance, never create another user.
  return reader.avatarUrl || avatarData(reader.character ?? presetCharacter(visualPresets[index % visualPresets.length]))
}


let disposed = false
let weatherTimer = null

async function updateWeather() {
  try {
    const result = await fetchWeather()
    if (disposed) return
    weatherProblem.value = Boolean(result?.unavailable)
    if (result && !result.unavailable) weather.value = result
  } catch {
    if (!disposed) weatherProblem.value = true
  }
}

async function updateReaders() {
  loading.value = true
  error.value = ''
  movementError.value = ''
  activeId.value = ''
  try {
    // Reuse the same reader records and computed matches as the town / Reader Room.
    // The store requests GET /api/people, not the removed /api/people/nearby endpoint.
    await people.load(true)
    if (disposed) return
    if (people.error) throw new Error(people.error)
    const available = people.readers.filter((reader) => reader?.id && reader.id !== user.profile?.username)
    // Pip, the neighbour, always has a seat, the one in view when the cafe opens (the third of the
    // first row); the other readers take turns in the rest
    const pip = available.find((reader) => reader.id === NEIGHBOUR)
    const others = rotateCafeReaders(available.filter((reader) => reader !== pip), pip ? 7 : 8)
    const seated = pip ? [...others.slice(0, 2), pip, ...others.slice(2)] : others
    seatedIds.value = seated.map((reader) => reader.id)
    // back from their room: the same seats, you beside them, and their card open
    const back = resume
    resume = null
    if (back && available.some((reader) => reader.id === back.id)) {
      const there = back.seated.filter((id) => available.some((reader) => reader.id === id))
      seatedIds.value = there
      resumeId.value = back.id
      activeId.value = back.id
    }
  } catch (err) {
    if (disposed) return
    seatedIds.value = []
    error.value = err?.message || 'Could not load readers.'
  } finally {
    if (!disposed) loading.value = false
  }
}

function startWalking() {
  activeId.value = ''
  movementError.value = ''
}
function arrived(id) {
  activeId.value = id
  movementError.value = ''
}

onMounted(() => {
  updateWeather()
  updateReaders()
  weatherTimer = window.setInterval(updateWeather, 10 * 60 * 1000)
})
onBeforeUnmount(() => {
  disposed = true
  window.clearInterval(weatherTimer)
})
</script>

<template>
  <BuildingShell :title="place.name" :subtitle="place.tab" :owner="place.owner" flush>
    <main class="cafe" aria-label="IKDA cafe" data-tour="people-map">
      <CafeViewport :image="image" :foreground="foreground" :readers="guests" :player-image="selfImage" :selected-id="activeId" :resume-id="resumeId"
        @walking="startWalking" @arrive="arrived" @route-error="movementError = $event" />

      <p class="cafe__weather" role="status" aria-live="polite">
        {{ night ? '🌙' : scene === 'rain' ? '🌧️' : scene === 'sunny' ? '☀️' : '☁️' }}
        {{ weatherProblem ? 'Weather unavailable' : weatherLabel + temperatureLabel }}
      </p>
      <p class="cafe__count" role="status">
        <span v-if="loading">Loading readers…</span>
        <span v-else-if="error">Readers unavailable</span>
        <span v-else>{{ guests.length }} readers in café</span>
      </p>
      <div v-if="movementError" class="cafe__notice" role="alert">{{ movementError }}</div>
      <div v-else-if="error && !loading" class="cafe__notice" role="status">
        Could not load the reader list.
        <button type="button" @click="updateReaders">Retry</button>
      </div>

      <div v-if="!loading && !error && guests.length === 0" class="cafe__notice" role="status">No other readers available yet.</div>

      <Transition name="cafe-card">
        <CafeReaderCard v-if="selectedReader" :key="selectedReader.id" class="cafe__card"
          :reader="selectedReader" @close="activeId = ''" />
      </Transition>
    </main>
  </BuildingShell>
</template>

<style scoped>
.cafe{position:relative;width:100%;height:100%;min-height:0;overflow:hidden;background:#bf9064}
.cafe__weather,.cafe__count,.cafe__notice{position:absolute;z-index:5;margin:0;background:#fff9e9e8;color:#493424;border:2px solid #5b4334;border-radius:9px;box-shadow:2px 3px 0 #3c292455;font:700 12px/1.35 system-ui,sans-serif;padding:8px 12px}
.cafe__weather{top:12px;right:12px}.cafe__count{top:calc(var(--building-back-space,0px) + 12px);left:12px}
.cafe__notice{left:50%;bottom:55px;transform:translateX(-50%);max-width:min(480px,90%);text-align:center}
.cafe__notice button{margin-left:8px;border:0;border-radius:6px;background:#39735e;color:white;padding:6px 9px;cursor:pointer}
.cafe__card{position:absolute;z-index:10;inset:0;margin:auto;width:min(660px,calc(100% - 28px));height:fit-content;max-height:calc(100% - 28px)}
.cafe-card-enter-active,.cafe-card-leave-active{transition:opacity 140ms ease,transform 140ms ease}
.cafe-card-enter-from,.cafe-card-leave-to{opacity:0;transform:translateY(12px)}
@media(max-width:640px){.cafe__weather,.cafe__count{font-size:10px;padding:5px 7px}.cafe__weather{top:7px}.cafe__count{top:calc(var(--building-back-space,0px) + 7px)}.cafe__card{top:auto;margin:0;width:100%;max-height:calc(100% - 156px)}.cafe__notice{bottom:48px;font-size:11px}}
@media(prefers-reduced-motion:reduce){.cafe-card-enter-active,.cafe-card-leave-active{transition:none}}
</style>
