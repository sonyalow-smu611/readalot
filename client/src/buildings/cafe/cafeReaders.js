// AI-assisted API adapter scaffold — record and review with the team.
// Reuses four existing fictional peopleDemo.js profiles alongside read-only real API records.
// Never creates a database account or record.
import { getNearbyReaders } from '@/services/api.js'
import { getCompatibility, sampleReaders } from '@/services/peopleDemo.js'

const FALLBACK_ORIGIN = { lat: 1.3521, lng: 103.8198 } // Singapore, until user's consented location is available
const NEARBY_KM = 30
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ROTATION_KEY = 'readalot_cafe_visit_rotation_v1'

function kilometers(a, b) {
  const rad = Math.PI / 180
  const latDelta = (b.lat - a.lat) * rad
  const lngDelta = (b.lng - a.lng) * rad
  const v = Math.sin(latDelta / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(lngDelta / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(v), Math.sqrt(1 - v))
}

function approximateLocation(raw) {
  const src = raw?.location || raw || {}
  const latRaw = src.lat ?? src.latitude ?? raw?.location_lat
  const lngRaw = src.lng ?? src.lon ?? src.longitude ?? raw?.location_lng
  if (latRaw == null || lngRaw == null) return null
  const lat = Number(latRaw), lng = Number(lngRaw)
  if (!Number.isFinite(lat) || !Number.isFinite(lng) ||
      lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  return { lat, lng }
}

/** The existing fictional demo readers — these are NOT Supabase users. */
export function getDemoCafeReaders() {
  return sampleReaders.map((reader) => ({
    ...reader,
    avatarUrl: reader.avatarUrl ?? '',
    isDemo: true,
    compatibility: getCompatibility(reader),
  }))
}

export async function loadCafeReaders({ origin = FALLBACK_ORIGIN, excludeId = null } = {}) {
  const result = await getNearbyReaders(origin.lat, origin.lng)
  const raw = Array.isArray(result) ? result
    : result?.users ?? result?.readers ?? result?.people ?? result?.data ?? []
  if (!Array.isArray(raw)) throw new Error('Unexpected response from the people API.')

  const seen = new Set()
  return raw.flatMap((profile) => {
    const id = String(profile?.id ?? profile?.user_id ?? '')
    // This also excludes the Express route's hard-coded 'demo-reader' fallback.
    // The actual profiles table uses UUID identifiers.
    if (!UUID.test(id) || seen.has(id) || id === String(excludeId) ||
        profile?.discoverable === false || profile?.isDiscoverable === false) return []
    const location = approximateLocation(profile)
    // Missing location is not evidence that a reader is nearby.
    if (!location || kilometers(origin, location) > NEARBY_KM) return []
    seen.add(id)
    return [{
      id,
      isDemo: false,
      displayName: profile.displayName ?? profile.display_name ?? profile.username ?? 'Reader',
      username: profile.username ?? '',
      avatarUrl: profile.avatarUrl ?? profile.avatar_url ?? '',
      character: profile.character ?? null,
      favoriteGenres: Array.isArray(profile.favoriteGenres) ? profile.favoriteGenres
        : Array.isArray(profile.favorite_genres) ? profile.favorite_genres : [],
      location,
      // The uploaded people.js hardcodes 72% for every user. Don't misrepresent it as real.
      compatibility: null,
    }]
  })
}

export function rotateCafeReaders(readers, seatCount) {
  if (readers.length <= seatCount) return readers.slice()
  let visit = 0
  try {
    visit = Math.max(0, Number(sessionStorage.getItem(ROTATION_KEY) || '0') || 0)
    sessionStorage.setItem(ROTATION_KEY, String(visit + 1))
  } catch {
    // Without sessionStorage the first set of actual profiles remains usable.
  }
  const offset = (visit * seatCount) % readers.length
  return Array.from({ length: seatCount }, (_, i) => readers[(offset + i) % readers.length])
}
