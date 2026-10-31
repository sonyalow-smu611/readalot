# Nearby readers and friends' houses

Decisions made with Dylan in a Q&A session, 31 October 2026. The team agreed that AI writes this
feature, including its endpoints (see `AI_USAGE.md`). Furniture in the database is left to Sonz.

Build order: (1) location, nearby readers and friend requests, (2) houses that appear with
friends. If the Tuesday 3 November merge is at risk, the extra house spots are cut first and the
existing seven spots stay.

## Going public

- One setting: public means location on, private means location off. `profiles.discoverable` is
  that setting. It shows as a chip on the map and as the Salon's privacy toggle.
- A new reader chooses after the tour (Done or Skip), before the daily panel. A reader who has
  already finished the tour sees the same prompt once on their next town visit, and stays as they
  are until they answer.
- The prompt spells out both effects: going public lists you in the Cafe and shows your last
  rough area to nearby readers, even when the app is closed.
- Closing the prompt means private. The browser's permission request appears only after choosing
  public. If the browser blocks location, the reader stays private and sees how to allow it.
- Under-18s are always private: no prompt, and the switch is disabled with a short explanation.
  Public readers who are under 18 become private.

## Location

- A web app can't track location while it's closed, so sharing means the last known area.
- Only a rough area of about 1 km is stored, in its own table that clients can't read. The exact
  position is discarded on the server.
- It updates while the app is open. Going private deletes it straight away.
- The server works out who is nearby and never sends coordinates to other readers.
- `GET /api/people/nearby` (no login, no distance filter) is replaced.

## Nearby readers

- You only see others while you are public yourself.
- Up to 8 readers within about 2 km, most recently active first, with no distance shown.
- Anyone inactive for over 14 days is hidden until they open the app again.
- They wander the town like online friends. Their place in town says nothing about where they
  really are. Offline readers show "Last seen around here".
- The town refreshes every 30 seconds while it is open, through our API. That refresh also writes
  `last_active_at`, which makes "Online now" real.

## Friends

- Add friend sends a request; the other reader accepts or declines from the Friends list, and the
  Friends button shows a badge.
- Declining is silent, and the two readers stop seeing each other nearby.
- Remove friend, on the friend's card, ends the friendship for both and stops them seeing each
  other nearby.
- Friends have their own table. Follows stay one-way in the Cafe.
- A friend who goes private keeps their place in your list and their house, but leaves nearby.

## Houses

- `map.png` no longer shows the cottages. A cottage appears when a friend is added.
- About 14 spots, given out in the order you became friends. A friend keeps their spot. When one
  is removed, the next friend without a house moves in. Further friends are in the list only.
- The seven demo readers have no automatic house.
- A real friend's room shows their books in a plain room until furniture is saved.
- The daily "visit a friend" task is swapped for another task when you have no friends.

## Demo and tests

- Demo readers get set areas near SMU and accept requests by themselves, so a grader testing alone
  can try the whole journey. The teaching team needs to be asked about this.
- Playwright tests use a fake location. Town tests that relied on the demo readers are rewritten.
- "Say hi" stays on the friend card if it works with real accounts, and is hidden if it doesn't.
