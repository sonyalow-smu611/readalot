// Singapore time for the room clock. The browser asks this server, which asks a
// public time API, so the page shows Singapore time even if the laptop clock is off.
import { Router } from 'express'

const router = Router()

const SOURCES = [
  'https://utctime.app/api/now/Asia/Singapore',
  'https://time.now/developer/api/timezone/Asia/Singapore',
]

function fromPayload(data) {
  const unix = Number(data?.unix ?? data?.unixtime)
  if (!Number.isFinite(unix)) return null
  return {
    unix,
    abbreviation: 'SGT',
    utcOffset: data.utc_offset || '+08:00',
  }
}

router.get('/', async (req, res) => {
  for (const url of SOURCES) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) })
      if (!response.ok) continue
      const time = fromPayload(await response.json())
      if (time) {
        res.json(time)
        return
      }
    } catch {
      // try the next source
    }
  }

  res.json({
    unix: Math.floor(Date.now() / 1000),
    abbreviation: 'SGT',
    utcOffset: '+08:00',
    unavailable: true,
  })
})

export default router
