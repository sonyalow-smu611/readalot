// Scaffolded with AI assistance — see AI_USAGE.md
// Which place you left the town for, so you come back out of its door. It lasts until the page is
// refreshed: after that the town starts from your front door again.
let placeId = ''

export function rememberPlace(id) {
  placeId = id
}

export function lastPlace() {
  return placeId
}
