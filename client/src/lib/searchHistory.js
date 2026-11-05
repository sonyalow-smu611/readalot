// Scaffolded with AI assistance — see AI_USAGE.md
// The book searches a reader has made, newest first, kept on this device for each reader. Storage
// can be blocked (a private window), so every read and write is allowed to fail: there is then
// simply no history.
const KEEP = 8
const keyOf = (readerId) => `readalot.searchHistory.${readerId || 'guest'}`

export function loadSearches(readerId) {
  try {
    const found = JSON.parse(localStorage.getItem(keyOf(readerId)) ?? '[]')
    return Array.isArray(found) ? found.filter((text) => typeof text === 'string').slice(0, KEEP) : []
  } catch {
    return []
  }
}

// Remembers a search at the top; the same words again move up rather than repeat. Returns the list.
export function rememberSearch(readerId, text) {
  const words = String(text ?? '').trim()
  if (!words) return loadSearches(readerId)
  const list = [words, ...loadSearches(readerId).filter((old) => old.toLowerCase() !== words.toLowerCase())].slice(0, KEEP)
  try {
    localStorage.setItem(keyOf(readerId), JSON.stringify(list))
  } catch {
    // the list still shows for this visit
  }
  return list
}

export function clearSearches(readerId) {
  try {
    localStorage.removeItem(keyOf(readerId))
  } catch {
    // nothing was kept
  }
  return []
}
