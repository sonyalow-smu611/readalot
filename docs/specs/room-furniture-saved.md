# Keep each reader's room furniture in Supabase

**Status:** done
**Part:** Your house → My Room (owner: Sonz), with a new server route and a Supabase migration.
Record the AI use in AI_USAGE.md as usual; the new endpoints need the team's agreement, as the
room notes' did.

## Problem Statement

I spend coins in the Shop on a poster, a plant or a cat, put them where I want them in My Room,
and the room starts to feel like mine. Then I reload the page, or open Readalot on my phone, and
the room is bare again. The coins are gone, but the pieces I paid for, and the inventory of pieces
I hadn't placed yet, are lost. When a friend visits my room they see nothing of what I've done,
and when I visit a sample reader I see a fixed demo arrangement rather than anything they chose.

## Solution

My Room's furniture is kept in my account. Everything I own from the Shop, placed or still in the
inventory, and where each placed piece stands, is saved the moment it changes and loaded when the
room opens, on any device. A visitor to my room sees my furniture exactly where I put it. The
Cafe's sample readers keep their demo furniture, since they aren't real accounts.

## User Stories

### Keeping what I bought

1. As a reader, I want a piece I buy in the Shop to stay in my inventory after a reload, so that the coins I spent aren't wasted.
2. As a reader, I want my inventory to be the same on my phone and my laptop, so that I can decorate from either.
3. As a reader, I want a piece I placed to be in the same place after a reload, so that I don't have to arrange my room again.
4. As a reader, I want a piece I moved (by press-and-hold, or Move on its card) saved where I left it, so that moving it sticks.
5. As a reader, I want a piece I took down with Remove to stay in my inventory after a reload, so that it doesn't come back up or disappear.
6. As a reader, I want a chair, curtains or bedding I swapped in to stay swapped in, and the one it replaced to stay in my inventory, so that swaps stick.
7. As a reader, I want my cats to still be in my room after a reload, so that my pets don't vanish (they may start somewhere else along the floor and then roam).
8. As a reader, I want saving to happen on its own after each change, so that there's no Save button to forget.

### When things go wrong

9. As a reader, I want a clear message if my room's furniture couldn't load, with Try again, so that an empty room doesn't look like I lost everything.
10. As a reader, I want the Shop and inventory to wait until my furniture has loaded, so that I can't buy or place over a room that hasn't arrived.
11. As a reader, I want a message if a change couldn't be saved, so that I know a reload might undo it.
12. As a reader, I want my next change to save everything, including the one that failed, so that one failure doesn't lose my room.
13. As a reader whose purchase couldn't be saved, I want to be told straight away, so that I know the piece may not be there after a reload.

### Visiting

14. As a visitor, I want to see a reader's furniture where they placed it, so that their room looks like theirs.
15. As a visitor, I want my own furniture left alone while I visit, so that someone else's room never changes mine.
16. As a visitor, I don't want to be able to change another reader's furniture in any way, so that rooms belong to their owners.
17. As a visitor to one of the Cafe's sample readers, I want to keep seeing their demo furniture, so that the demo still makes sense.
18. As a visitor to a reader who hasn't furnished their room, I want to see their room's own furniture with nothing added, so that an unfurnished room still looks right.

### Accounts

19. As a reader who signs out and someone else signs in on the same browser, I want them to see their own room, never mine, so that rooms stay private to each account.
20. As a new reader, I want to start with an empty inventory and no placed pieces, so that the Shop is where the room begins.

## Implementation Decisions

- **One row per reader, the whole room in it.** A new migration adds a table keyed by the reader's
  account (references the profile, cascade on delete), holding the list of their pieces and an
  updated time. Each piece is `{ uid, id, zone?, x?, at? }`: `id` is the furniture library id; a
  piece with no `zone` is in the inventory; a placed piece has its `zone` and `x` and, when it
  stands anywhere, its point `at` (cats included, where they were put down). RLS on, no browser
  policies; only the Express API with the service-role client reads or writes it, as for room notes.
- **Why one row:** the room already saves and loads as one list, a reader changes only their own
  room, and every change is small. Saving the whole list after each change keeps one code path for
  buy, place, move, swap and remove. Two devices changing the room at once: the last save wins.
- **API** under `/api/rooms/:readerId/furniture`, next to the room notes:
  - `GET` → `{ pieces }`, for the owner and for visitors. An account with no row gets `[]`.
  - `PUT` with `{ pieces }` → the saved `{ pieces }`. Only the owner may write: the account from the
    token must be the room's account, otherwise 403. No demo-user fallback in Supabase mode.
  - The server checks the shape: a list of at most 200 pieces, each with a string `uid` and `id`;
    `zone` one of the room's zones; `x` a number from 0 to 1; `at` two whole numbers inside the
    room. Anything else is a 400, and nothing is saved.
  - `:readerId` is a reader's handle or account id, resolved the same way room notes resolve theirs.
- **Without Supabase** (local dev, Playwright), the server keeps rooms in memory per account, as
  room notes and reviews do. As with room notes, it takes the account id from the token unchecked
  only in that mode.
- **Client:**
  - **Services:** new `getRoomFurniture(readerId)` and `saveRoomFurniture(readerId, pieces)`.
  - **Decor state** (the composable that holds the inventory and the placed pieces):
    - Loads the signed-in reader's pieces once when My Room opens. Until they arrive, the Shop and
      the inventory are disabled.
    - After every change, saves the whole list: a buy, a place, a move, a swap or a remove.
    - Saves one at a time. A change made while a save is running triggers another save of the
      newest list once that one finishes.
    - A failed save shows "Couldn't save your room. Your next change will try again." and keeps the
      list as it is.
    - Clears everything on sign-out, so the next account starts fresh.
- **New pieces' uids** become unique strings (not a counter that restarts at 1 on every page load),
  so pieces bought on two devices never clash.
- **Buying:** coins are spent first (as today, through the Supabase function). Then the piece goes
  in the inventory and the room is saved. If that save fails, the reader sees the save-failure
  message; the piece stays in the inventory for this visit and is saved with the next change.
- **Visiting:**
  - A visit to a real account loads that reader's pieces through the same `GET`, replacing
    `FURNISHINGS` for them.
  - The Cafe's sample readers keep their `FURNISHINGS` in the house's visitors module.
  - A visited room never writes.
- **Old placements:** furniture saved before this has no `at`, and the room already stands it on
  the nearest slot. That stays.

## Testing Decisions

- **One seam: Playwright through the room**, as the room notes were tested. Tests buy, place, move
  and remove through labelled buttons, the inventory and taps in the room. They check the result by
  visible pieces and where they stand on screen, never by reading storage. They run against the
  test server with no Supabase, so they use the in-memory store.
- **Journeys to cover:**
  - Buy a piece, then reload: it's still in the inventory.
  - Place a piece, then reload: it's in the same place, within a pixel.
  - Move it, then reload: it's in the new place.
  - Remove it, then reload: it's in the inventory and not in the room.
  - Swap in a chair, then reload: the new chair is in the nook and the old one is in the inventory.
  - Open the room in a new browser context (another device) and the furniture is there.
  - A failed load shows the message with Try again, and Try again loads the furniture.
  - A failed save shows its message, and the next change saves both changes.
  - A visitor sees the owner's placed piece. The owner's placed piece is created through the API
    with a made-up second reader's token, as the room-notes tests do.
  - The Cafe's sample readers still show their demo furniture.
- **Prior art:** `tests/e2e/visit-room.spec.js` (room notes on the server, a second reader through
  the API, a fresh browser context, failed load and retry), and `tests/e2e/furniture.spec.js`
  (buying, placing, `placeAt`, `tapRoomAt`, `artBox`).
- **Cleanup:** the in-memory store lives for the whole test run, so tests use their own accounts
  (one per worker, as today) and empty their room at the end.
- Before finishing: the client build passes, and the touched e2e files pass.

## Out of Scope

- Checking on the server that a reader paid for each piece. Coins are spent through the Supabase
  function and the server trusts the list it's sent. A purchases table could close that later.
- Moving the Cafe's sample readers' demo furniture into Supabase.
- Saving the room's theme, the lamps on or off, or where a cat has wandered to.
- Merging changes made on two devices at the same moment (the last save wins).
- Selling pieces back for coins.

## Further Notes

- Run the new migration in the Supabase SQL editor before trying this against the real project.
- The Shop and inventory being disabled until the room loads matters most on a slow connection:
  without it, a piece bought before the load finishes would be overwritten by the loaded list.
- If the team prefers, the PUT can move to one-row-per-piece later without changing the client's
  services.
