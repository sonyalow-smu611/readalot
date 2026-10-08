const FALLBACK = {
  unix: null,
  abbreviation: 'SGT',
  utcOffset: '+08:00',
  unavailable: true,
}

export async function fetchSingaporeTime() {
  try {
    const res = await fetch('/api/time', { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return FALLBACK
    const data = await res.json()
    if (!Number.isFinite(Number(data?.unix))) return FALLBACK
    return {
      unix: Number(data.unix),
      abbreviation: data.abbreviation || 'SGT',
      utcOffset: data.utcOffset || '+08:00',
      unavailable: Boolean(data.unavailable),
    }
  } catch {
    return FALLBACK
  }
}
