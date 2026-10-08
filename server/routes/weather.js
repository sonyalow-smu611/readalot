// Scaffolded with AI assistance (Phase 1) — see AI_USAGE.md
import { Router } from 'express'

const router = Router()

const FORECAST_URL =
  'https://api.open-meteo.com/v1/forecast?latitude=1.3521&longitude=103.8198&current=weather_code,temperature_2m,is_day&timezone=Asia%2FSingapore'

const FALLBACK = {
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

function fromForecast(data) {
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

router.get('/', async (req, res) => {
  try {
    const signal =
      typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
        ? AbortSignal.timeout(8000)
        : undefined
    const upstream = await fetch(FORECAST_URL, signal ? { signal } : undefined)
    if (!upstream.ok) {
      res.json(FALLBACK)
      return
    }
    const payload = fromForecast(await upstream.json())
    res.json(payload ?? FALLBACK)
  } catch {
    res.json(FALLBACK)
  }
})

export default router
