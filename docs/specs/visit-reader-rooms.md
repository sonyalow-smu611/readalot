# Visit other readers' rooms, leave them a note, and a pixel-only Shop

**Status:** ready-for-agent
**Part:** Your house → My Room (owner: Sonz), with small changes to the People page (Cafe,
owner: Emiley) and shared files, listed under "Who has to agree" below.

## Problem Statement

My Room is the most personal part of Readalot, but only its owner can ever see it. When I meet a
reader in the Cafe (Discover People) I can see a text page about them, but I can't walk into
their room, look at what's on their bookshelf, or leave something behind to say I was there. The
only way to talk to them is the chat box at the bottom of their page.

My own room's Shop also still sells the old drawn decorations (vases, statues, sofas, beanbags,
mattresses, food and water dishes, dogs, a bird). They are flat vector drawings that don't match
the pixel-art room and furniture library, so a furnished room looks like two different games.

## Solution

Every reader in the Cafe gets a room. Their page in the Cafe (`/people/reader-<name>`, e.g.
`/people/reader-emma`) becomes their profile, with a **Visit Emma's room** button. That button
opens Emma's room: the same pixel-art room as My Room, drawn by the same code from the same
template, but with Emma's books on the bookshelf and Emma's furniture in it.

A visitor can look around the room in the same ways as in My Room (swipe, drag, scroll, arrow
keys, the bar of places). They can tap Emma's books to read about them, and tap her bookshelf to
browse all her shelves. They can't change anything: there is no Shop, no inventory, no glowing
spots, and nothing can be moved, taken down or removed from a shelf.

In the bottom-right corner, where My Room has its menu (Mood check-in, Inventory, Shop), a
visitor gets one button: **Leave a note**. It opens a short note to write. Once posted, the note
is pinned on Emma's corkboard (the Quote of the Day board), next to the quote. Tapping the
corkboard opens the notice board, which shows the Quote of the Day and every note left there.

The Shop sells only pixel-art pieces from the furniture library: wall art, reading chairs, cats
and plants. Everything drawn in the old style is gone from the Shop, the inventory, the room and
the code.

## User Stories

### A pixel-only Shop

1. As a reader, I want the Shop to sell only pieces drawn in the room's pixel-art style, so that a furnished room looks like one place.
2. As a reader, I want the Shop's groups to be Wall art, Reading chairs, Cats and Plants, so that I can find what I'm after.
3. As a reader, I want vases, statues, sofas, beanbags, mattresses, food and water dishes, dogs and the cockatiel to be gone from the Shop, so that I can't buy something that clashes with the room.
4. As a reader, I want a piece I'm dragging from the inventory to look like the pixel picture the Shop showed, so that I know what I'm placing.
5. As a reader, I want the window seat, side table and nightstand spots to still take a small piece (the Succulent trio), so that those surfaces stay useful.
6. As a reader, I want my credits to work as before, so that removing the old pieces doesn't change what I can afford.
7. As a reader, I want the room's pets to be the three pixel cats only, so that every animal in my room walks and naps the same way.

### The reader's profile in the Cafe

8. As a reader browsing the Cafe, I want each reader's "Visit Room" button to open their profile at `/people/reader-<name>`, so that every reader has a page I can link to.
9. As a reader, I want the profile's heading to be the reader's name, not "Emma Tan's Room", so that it isn't confused with the room itself.
10. As a reader, I want a **Visit Emma's room** button near the top of Emma's profile, so that I can go from learning about her to walking into her room.
11. As a reader, I want everything already on the profile (match score, follow, currently reading, shared books, chat) to stay as it is, so that nothing I use now goes away.
12. As a reader, I want an address for a reader who doesn't exist to say the reader can't be found and link back to the Cafe, so that I'm never left on a blank page.

### Walking into someone else's room

13. As a visitor, I want Emma's room at `/people/reader-emma/room`, so that I can go straight back to it or share the link with a friend.
14. As a visitor, I want Emma's room to be the same room as mine (same walls, window, clock, corkboard, bookshelf, coffee table and bar of places), so that every reader's room feels like home in Readalot.
15. As a visitor, I want the header to say "Emma's Room", so that I always know whose room I'm in.
16. As a visitor, I want the back button in the header to say "Back to Emma's profile" and go there, so that I return to where I came from rather than the town.
17. As a visitor, I want the room to fill my laptop window and scroll sideways on my phone, exactly like My Room, so that it works on whatever I'm using.
18. As a visitor, I want to look around by swiping, dragging, scrolling, the arrow keys and the bar of places, so that I can explore the way I'm used to.
19. As a visitor, I want the window to show the live weather and the clock the time, as in my own room, so that the room feels alive.
20. As a visitor, I want the room to load with a still picture first and show a clear message if it can't load, as My Room does, so that I'm never stuck looking at nothing.
21. As a visitor, I want no credits, Mood check-in, Shop or inventory in someone else's room, so that it's clear this room isn't mine to change.
22. As a visitor using a screen reader, I want the room's region to be named "Emma's room", so that I know whose room I'm exploring.

### Their furniture

23. As a visitor, I want to see the furniture Emma has chosen (her reading chair, her wall art, her plants, her cat), so that her room reflects her.
24. As a visitor, I want each reader's room furnished differently, so that visiting several readers is worth it.
25. As a visitor, I want Emma's cat to wander, sit and nap as cats do in my room, and stay still if I prefer reduced motion, so that the room feels lived in.
26. As a visitor, I want Emma's furniture to be lit by the weather and darkened at night like mine, so that it belongs in the room.
27. As a visitor, I want tapping a piece of Emma's furniture to tell me what it is but offer no Take down, so that I can admire it without changing it.
28. As a visitor, I want no glowing spots ever to appear in Emma's room, so that nothing hints I can place something there.
29. As a reader, I want furniture I own and place in my room to stay in my room and never appear in anyone else's, so that rooms stay separate.

### Their bookshelf

30. As a visitor, I want Emma's books on the bookshelf, grouped into the same rows as mine (To be read and Read, by genre), so that I can see what she reads at a glance.
31. As a visitor, I want the book on Emma's coffee table to be the one she's currently reading, and tapping it to show it, so that I know what she's into right now.
32. As a visitor, I want tapping a book's spine to lift it off the shelf and show its details (title, author, genre and which of her shelves it's on), so that I can browse her books one by one.
33. As a visitor, I want a book's details in someone else's room to have no Reading status buttons, progress slider, rating link or Remove from shelf, so that I can't change Emma's shelf or mine by accident.
34. As a visitor, I want a book to go back on the shelf when I close its details (Esc, the close button or a tap outside), as in my room, so that it behaves the same.
35. As a visitor, I want tapping the bookshelf itself to open **Emma's Shelf**, a page with all her books in rows like My Shelf, so that I can browse everything she owns.
36. As a visitor, I want Emma's Shelf at `/people/reader-emma/room/shelf`, with a back button to her room, so that I can go back and forth.
37. As a visitor, I want Emma's Shelf rows to scroll the same ways as My Shelf (swipe, drag, Previous / Next, arrow keys), so that I don't have to learn anything new.
38. As a visitor, I want Emma's Shelf to have no Add a book or search for my own shelf, so that it's clearly hers.
39. As a visitor, I want an empty shelf in someone's room to say they have no books there yet, so that I know it isn't still loading.

### Leaving a note

40. As a visitor, I want a **Leave a note** button in the bottom-right corner of someone's room, where my room has its menu, so that the one thing I can do here is easy to find.
41. As a visitor, I want Leave a note to open a small card with a text box and Post note and Cancel buttons, so that writing a note is quick.
42. As a visitor, I want a note limited to 140 characters with a live count, so that notes stay short enough to pin up.
43. As a visitor, I want Post note to stay disabled while the note is empty or only spaces, so that I can't pin up a blank note.
44. As a visitor, I want my note signed with my name and the date, so that Emma knows who left it and when.
45. As a visitor, I want my posted note to appear pinned on the corkboard as a small pixel paper note, so that I can see it there.
46. As a visitor, I want a short confirmation ("Your note is on Emma's board") after posting, so that I know it worked.
47. As a visitor, I want the corkboard to show at most three pinned notes, with the board still readable, so that a busy board doesn't cover the room.
48. As a visitor, I want tapping the corkboard to open the **notice board**: the Quote of the Day at the top, then every note, newest first, so that I can read them all.
49. As a visitor, I want a notice board with no notes to say "No notes yet. Be the first to leave one.", so that an empty board isn't confusing.
50. As a visitor, I want to take down a note I left, from the notice board, so that I can fix a mistake.
51. As a visitor, I want my notes to still be on Emma's board when I come back later, so that leaving one means something.
52. As a visitor, I want notes I leave for Emma to appear only on Emma's board, so that each reader's board is their own.
53. As a visitor, I want the note card and the notice board to close with Esc or Cancel and return focus to the button that opened them, so that I can use them from the keyboard.
54. As a visitor, I want a note that can't be saved (browser storage blocked) to tell me so, so that I don't think it was pinned up when it wasn't.
55. As a visitor, I want the notice board to say notes are saved on this browser only, like the Cafe's follows and chat, so that I understand what the demo can and can't do.

### My own room stays mine

56. As a reader, I want My Room to behave exactly as before (Shop, inventory, placing, Mood check-in, removing books), so that visiting others changes nothing at home.
57. As a reader, I want my corkboard to still open the Quote of the Day, so that my own room works the same.
58. As a reader, I want visiting someone's room never to change my credits, inventory, placed furniture or bookshelf, so that I can explore freely.

## Implementation Decisions

**One room, two modes.** My Room and a visitor's room are the same view and the same room
component, not a copy. The room component stops reading the decoration store directly for what
is placed. Instead it takes the placed furniture and an editable flag as props:

- **Owner mode:** the owner's view passes the decoration store's placed pieces with editing on.
- **Visitor mode:** the visitor's view passes the reader's furnishings with editing off.

With editing off:

- no zone or wall spot glows and nothing can be placed;
- placed pieces have no Take down;
- dropping a piece does nothing.

Everything else (painting, sizing, cats, the bar of places, weather, books) is shared.

**Routes.** Three routes, all `wide` and full-bleed like My Room:

| Address | What it is | Back button |
|---|---|---|
| `/people/:id` | The reader's profile: the existing reader page, renamed and given the new button | (unchanged) |
| `/people/:id/room` | The reader's room, in the house's BuildingShell, titled "<First name>'s Room" | "Back to <first name>'s profile" |
| `/people/:id/room/shelf` | The reader's shelf, in the same shell | Back to their room |

The new pages live in the house folder. `/people/:id/room` and `/people/:id/room/shelf` are
the house's routes. The Cafe's placeholder `/people/:id/shelf` is left alone. The router file is
shared, so these routes need a teammate's review.

**Where a reader's room gets its data.**

- **Who readers are:** the Cafe's demo reader list (the same service the Cafe page reads),
  looked up by id. The house only reads it.
- **Books:** the reader's books, mapped into the shape the room's shelf uses.
  - Status: Finished → read, Reading → reading, To Read → want_to_read.
  - The genre becomes the first of `genres`.
  - The spine look comes from the book id, as for the reader's own books.
- **Furniture:** a small, house-owned table of furnishings per reader id. Each entry is a list of
  `{ id, zone, x }` pieces from the furniture library: a reading chair, one or two wall pieces, a
  plant, and a cat. A reader missing from the table gets the plain template room.
- **Unknown id:** the room and shelf show the "reader not found" state with a link back to the
  Cafe.

**Read-only book details.** A visitor's book opens in the same BookCard frame, with a new
house component inside: title, author, genre, and the reader's shelf for that book. It has none
of the reading status buttons, progress, rating or Remove from shelf controls that the shared
book details carry. The book page link is left out too, since demo books have no book page.

**The dock.** In visitor mode the room menu button is replaced by a single **Leave a note**
button in the same bottom-right place, with the same look and size. The Mood check-in doesn't
open on its own in someone else's room. The credits chip is hidden.

**Notes.** A house-owned notes module keeps notes per reader id in browser storage, the same
approach as the Cafe's follows and demo chat. One key holds every board, with each note shaped:

```
{ id, readerId, author, text, createdAt }
```

- **Author:** the signed-in reader's display name from the user store.
- **Text:** trimmed, 1–140 characters.
- **Order:** newest first.
- **Actions:** add, list for a reader, and remove (by id).
- **Errors:** if storage is blocked, the module raises an error, which the note card shows.

There's no server endpoint. The demo readers aren't real accounts, so the server's reader
messages route (which needs real account ids) can't take them. Team policy also keeps backend
endpoints out of AI-written work.

**The notice board.**

- **On the corkboard:** up to three of the newest notes are drawn as small pixel paper notes with
  a pin, beside the quote card. They are painted into the room canvas, so they get the room's
  light and night shading.
- **Tapping the corkboard (visitor):** opens a notice board dialog. It holds the existing Quote of
  the Day content, then the list of notes with each one's author and date. Each note the visitor
  left has a **Take down** button.
- **My Room's corkboard:** keeps opening the plain Quote of the Day.

**Deleting the old Shop items.** These are removed from the catalog:

- the old vector pieces: Vases, Statues, Sofas, Beanbags, Mattresses, Dispensers, Dogs, Birds;
- the food/water helpers that only those pieces used.

Removing them makes these unnecessary:

- the shared vector decoration component (only the house uses it);
- the room's code path that stood those pieces on their spots;
- DecorArt's fallback to the old drawing.

The drag ghost uses DecorArt. Pets left in the catalog are only the three cats, so the room's pet
code is the cat code alone.

**Who has to agree** (shared or another teammate's files):

- **Router:** the two new routes. Shared; needs review.
- **Decoration store:** the old items deleted, and the placed list read by the owner's view only.
  Shared; needs review.
- **The shared vector decoration component:** deleted. Shared; needs review, after checking no
  other part uses it.
- **The Cafe's reader page:** heading renamed, Visit room button added. Emiley owns it, so ask
  her first, or hand her the change as a pull request.

## Testing Decisions

- **One seam:** Playwright end-to-end tests through the real app, as for every house feature.
  Tests use labelled buttons, region names and visible text (and canvas pixels only where the
  only change is in the picture, as the furniture tests already do). They never use component
  internals, the decoration store or storage keys directly.
- **What a good test is here:** it walks a journey the way a reader would (Cafe → profile →
  room → book → shelf → note) and checks what they'd see or be unable to do. It doesn't check how
  the room got there.
- **Prior art:**
  - `furniture.spec.js`: helpers for opening the Shop, sprites loaded, canvas colour checks.
  - `room.spec.js` and `my-shelf.spec.js`: phone-sized room journeys and shelf row scrolling.
  - `house-desktop.spec.js`: laptop sizing.
  - `town.spec.js`: building entry and back buttons.
- **New file `visit-room.spec.js`**, covering:
  - Cafe → profile has **Visit <name>'s room** → the room opens at the right address with the
    right header.
  - The back button returns to the profile.
  - An unknown reader shows "not found".
  - The visitor sees the reader's furniture (canvas differs from the template at the chair /
    wall spots) and their cat. No Room menu, Shop, Inventory, credits or glowing spots exist,
    and a furniture piece has no Take down.
  - A book tapped on the shelf opens read-only details (the reader's shelf shown; no Reading
    status, Remove from shelf).
  - The bookshelf opens the reader's shelf page with their books and scrolling rows.
  - **Leave a note:** Post note is disabled when empty, the count is shown, posting shows the
    confirmation, and the corkboard opens a notice board with the quote and the note.
  - The note survives a reload and appears on that reader's board only.
  - Take down removes it, and the empty board shows its message.
  - My Room afterwards is unchanged: Shop present, and the corkboard opens the plain quote.
- **Updated:**
  - `room.spec.js`: the decoration journey uses a pixel piece (the Succulent trio on the window
    seat) instead of the Clay vase.
  - `furniture.spec.js`: the Shop has exactly the four groups, and none of the old pieces (Clay
    vase, Husky, Cockatiel…) are offered.
- **Done when:** the client build passes and the full e2e suite passes.

## Out of Scope

- **Real notes between real accounts:** a server table and endpoint, and notes reaching the other
  reader's device. The demo keeps notes in this browser, like the Cafe's follows and chat.
- **Seeing, on my own corkboard, notes other people left for me.** That needs the real backend
  above.
- **Furnishing my room from what I saw in someone else's** ("buy this too"), and following or
  chatting from inside the room. The profile already has follow and chat.
- **Adding more books to the demo readers.** Their rooms show exactly the books the Cafe's demo
  data gives them, which is three each today. Fuller shelves are a change to the Cafe's data.
- **Moderation, reporting or blocking of notes.**
- **Book pages for demo books,** and adding a visited reader's book to my own shelf.
- **Changing the Cafe list page,** beyond its existing Visit Room button now landing on the
  profile.

## Further Notes

- The demo readers' ids are already of the form `reader-<name>` (`reader-emma`, `reader-ayaan`,
  `reader-sofia`, `reader-noah`), so the profile address the request asked for already matches
  what the Cafe links to. This spec gives that page its "Visit room" button and its own room.
- Notes are signed with the reader's display name, so a reader who changes their name in the
  salon keeps the old name on notes already posted.
- After this, the house README needs a "Visiting a room" section. AI_USAGE.md needs a new entry
  for the code written for it.
