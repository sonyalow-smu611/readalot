<script setup>
// AI-assisted scaffold — team review required (AI_USAGE.md).
// Café-only changes: display the four existing demo readers plus any discoverable API readers.
// No new database accounts, tables or records are created.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import BuildingShell from '@/components/shared/BuildingShell.vue'
import CafeViewport from './components/CafeViewport.vue'
import CafeReaderCard from './components/CafeReaderCard.vue'
import { drawCafeWeatherArt } from './cafeWeatherArt.js'
import { getDemoCafeReaders, loadCafeReaders, rotateCafeReaders } from './cafeReaders.js'
import { drawAvatar, makeRnd } from '@/lib/avatar/draw.js'
import { characterSeed, normaliseCharacter, presetCharacter, toDrawParams } from '@/lib/avatar/catalogue.js'
import { fetchWeather } from '@/services/weather.js'
import { useUserStore } from '@/stores/user'
import { PLACES } from '@/town/places.js'

const place = PLACES.find((p) => p.id === 'cafe')
const user = useUserStore()
const router = useRouter()

const weather = ref({ scene: 'cloudy', isDay: true, temperature: null })
const weatherProblem = ref(false)
const loading = ref(true)
const error = ref('')
const allReaders = ref([])
const guests = ref([])
const demoReaders = getDemoCafeReaders()
const demoSeats = [0, 2, 4, 6]
const liveSeats = [1, 3, 5, 7]
const activeId = ref('')
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

function displayGuests(databaseReaders = []) {
  // All four peopleDemo readers always have a seat. Only existing API users fill the other four.
  const real = rotateCafeReaders(databaseReaders, liveSeats.length)
  guests.value = [
    ...demoReaders.map((reader, index) => ({
      ...reader,
      seatIndex: demoSeats[index],
      sprite: guestImage(reader, index),
    })),
    ...real.map((reader, index) => ({
      ...reader,
      seatIndex: liveSeats[index],
      sprite: guestImage(reader, index + demoReaders.length),
    })),
  ]
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
    const profile = user.profile ?? {}
    const rawLat = profile.location_lat ?? profile.locationLat ?? profile.location?.lat
    const rawLng = profile.location_lng ?? profile.locationLng ?? profile.location?.lng
    const originLat = Number(rawLat), originLng = Number(rawLng)
    const origin = rawLat != null && rawLng != null &&
      Number.isFinite(originLat) && Number.isFinite(originLng) &&
      Math.abs(originLat) <= 90 && Math.abs(originLng) <= 180
      ? { lat: originLat, lng: originLng } : undefined
    const excludeId = user.user?.id ?? user.session?.user?.id ?? profile.id ?? null
    const results = await loadCafeReaders({ ...(origin ? { origin } : {}), excludeId })
    if (disposed) return
    allReaders.value = results
    displayGuests(results)
  } catch (err) {
    if (disposed) return
    allReaders.value = []
    displayGuests() // The sample café works even if the database API is unavailable.
    error.value = err?.message || 'Could not load database readers.'
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
function visitRoom() {
  if (!selectedReader.value) return
  router.push({ name: 'reader-room', params: { id: selectedReader.value.id } })
}

onMounted(() => {
  displayGuests()
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
  <BuildingShell :title="place.name" :subtitle="place.tab" :owner="place.owner" :accent="place.accent" flush>
    <main class="cafe" aria-label="Readalot cafe" data-tour="people-map">
      <CafeViewport :image="image" :foreground="foreground" :readers="guests" :player-image="selfImage" :selected-id="activeId"
        @walking="startWalking" @arrive="arrived" @route-error="movementError = $event" />

      <p class="cafe__weather" role="status" aria-live="polite">
        {{ night ? '🌙' : scene === 'rain' ? '🌧️' : scene === 'sunny' ? '☀️' : '☁️' }}
        {{ weatherProblem ? 'Weather unavailable' : weatherLabel + temperatureLabel }}
      </p>
      <p class="cafe__count" role="status">
        4 sample readers
        <span v-if="loading"> · checking database…</span>
        <span v-else-if="error"> · database unavailable</span>
        <span v-else-if="allReaders.length"> · {{ guests.length - demoReaders.length }} live seated<span v-if="allReaders.length > liveSeats.length"> ({{ allReaders.length }} available)</span></span>
      </p>
      <div v-if="movementError" class="cafe__notice" role="alert">{{ movementError }}</div>
      <div v-else-if="error && !loading" class="cafe__notice" role="status">
        Showing sample readers. Database lookup is unavailable.
        <button type="button" @click="updateReaders">Retry</button>
      </div>

      <Transition name="cafe-card">
        <CafeReaderCard v-if="selectedReader" :key="selectedReader.id" class="cafe__card"
          :reader="selectedReader" @close="activeId = ''" @visit="visitRoom" />
      </Transition>
    </main>
  </BuildingShell>
</template>

<style scoped>
.cafe{position:relative;width:100%;height:100%;min-height:0;overflow:hidden;background:#bf9064}
.cafe__weather,.cafe__count,.cafe__notice{position:absolute;z-index:5;margin:0;background:#fff9e9e8;color:#493424;border:2px solid #5b4334;border-radius:9px;box-shadow:2px 3px 0 #3c292455;font:700 12px/1.35 system-ui,sans-serif;padding:8px 12px}
.cafe__weather{top:12px;right:12px}.cafe__count{top:12px;left:12px}
.cafe__notice{left:50%;bottom:55px;transform:translateX(-50%);max-width:min(480px,90%);text-align:center}
.cafe__notice button{margin-left:8px;border:0;border-radius:6px;background:#39735e;color:white;padding:6px 9px;cursor:pointer}
.cafe__card{position:absolute;z-index:10;right:14px;bottom:14px;width:min(360px,calc(100% - 28px))}
.cafe-card-enter-active,.cafe-card-leave-active{transition:opacity 140ms ease,transform 140ms ease}
.cafe-card-enter-from,.cafe-card-leave-to{opacity:0;transform:translateY(12px)}
@media(max-width:640px){.cafe__weather,.cafe__count{font-size:10px;padding:5px 7px;top:7px}.cafe__card{left:0;right:0;bottom:0;width:100%}.cafe__notice{bottom:48px;font-size:11px}}
@media(prefers-reduced-motion:reduce){.cafe-card-enter-active,.cafe-card-leave-active{transition:none}}
</style>
