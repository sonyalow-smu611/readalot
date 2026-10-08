// Scaffolded with AI assistance — see AI_USAGE.md

const OPEN_METEO_URL =
  'https://api.open-meteo.com/v1/forecast?latitude=1.3521&longitude=103.8198&current=weather_code,temperature_2m,is_day&timezone=Asia%2FSingapore'

const UNAVAILABLE = {
  scene: 'cloudy',
  temperature: null,
  weatherCode: null,
  isDay: true,
  unavailable: true,
}

const RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99])

function sceneForCode(code) {
  if (code === 0 || code === 1) return 'sunny'
  if (RAIN_CODES.has(code)) return 'rain'
  return 'cloudy'
}

function fromOpenMeteo(data) {
  const current = data?.current
  const weatherCode = Number(current?.weather_code)
  const temperature = Number(current?.temperature_2m)
  if (!Number.isFinite(weatherCode) || !Number.isFinite(temperature)) return null

  return {
    scene: sceneForCode(weatherCode),
    temperature: Math.round(temperature),
    weatherCode,
    isDay: current.is_day === 1 || current.is_day === true,
  }
}

function timeoutSignal() {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(8000)
  }
  return undefined
}

async function fetchOpenMeteoDirect() {
  const signal = timeoutSignal()
  const res = await fetch(OPEN_METEO_URL, signal ? { signal } : undefined)
  if (!res.ok) return null
  return fromOpenMeteo(await res.json())
}

export async function fetchWeather() {
  let useDirect = false

  try {
    const signal = timeoutSignal()
    const res = await fetch('/api/weather', signal ? { signal } : undefined)
    if (res.ok) {
      const data = await res.json()
      if (data && (data.scene === 'sunny' || data.scene === 'cloudy' || data.scene === 'rain')) {
        return data
      }
      return UNAVAILABLE
    }
    useDirect = res.status === 404
  } catch {
    useDirect = true
  }

  if (!useDirect) return UNAVAILABLE

  try {
    return (await fetchOpenMeteoDirect()) ?? UNAVAILABLE
  } catch {
    return UNAVAILABLE
  }
}
