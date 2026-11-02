// AI-assisted cafe presentation adapter. Review with the team and record in AI_USAGE.md.
// The application's People store already owns API reads, compatibility and following.
// This file only selects existing readers for the eight fixed cafe seats.
const ROTATION_KEY = 'readalot_cafe_visit_rotation_v2'

export function rotateCafeReaders(readers, seatCount) {
  if (!Array.isArray(readers) || !Number.isInteger(seatCount) || seatCount <= 0) return []
  if (readers.length <= seatCount) return readers.slice()

  let visit = 0
  try {
    visit = Math.max(0, Number(sessionStorage.getItem(ROTATION_KEY) || '0') || 0)
    sessionStorage.setItem(ROTATION_KEY, String(visit + 1))
  } catch {
    // Private browsing may restrict storage; show the first eligible readers instead.
  }
  const offset = (visit * seatCount) % readers.length
  return Array.from({ length: seatCount }, (_, i) => readers[(offset + i) % readers.length])
}
