// Scaffolded with AI assistance — see AI_USAGE.md
// Adding a friend by username: everything the town needs from a username, in one place.
//
// Waiting on the salon: readers can't choose a username yet, so today only the demo readers have
// one. The rest already works: the Friends list's Add friend form sends the name to
// POST /api/friends/requests, which finds readers by username. Once usernames are saved:
//   1. Load it into the user store as `profile.username`. yourUsername() below picks it up, the
//      form then shows it and stops readers adding themselves.
//   2. Save it the way cleanUsername() leaves it. The server looks for an exact match, so a name
//      saved with capitals could not be found.
// Private readers and under-18s stay unfindable: the server answers "not found" for them, the
// same as for a name nobody has, so the form can't be used to find out who is on the app.

// What was typed, as usernames are stored: "@Emma.Reads " is emma.reads.
export function cleanUsername(text) {
  return text.trim().replace(/^@/, '').toLowerCase()
}

// '' until the salon saves one
export function yourUsername(profile) {
  return profile.username ?? ''
}
