# Readalot: Spec Summary

What the MVP is and the decisions behind it. How to run it, the API and the known limits are in
[README.md](README.md); the course brief and team rules are in [PROJECT.md](PROJECT.md).

## Problem

Students and young readers who love books have no single mobile place that feels like *their*
reading space, helps them pick a book for how they feel, and lets them find nearby readers who
share their taste. Existing tools are either plain catalogue apps or generic social feeds.

## Solution

A mobile-first web app built around four areas that share one book record and one reading status:

| Area | What the reader gets |
|------|----------------------|
| **My Room** (home) | A 3D bedroom: their own books on the bookcase, the live weather through the bay window, the time on the wall clock, a Currently Reading card, the Quote of the Day, a daily mood check-in, and a shop to decorate the room |
| **Discover Books** | Search, genre shelf carousels, full genre shelves sorted by popularity, length or rating |
| **Discover People** | A map of nearby readers with compatibility scores, their read-only rooms and shelves, follow and chat |
| **Scan Book** | Add a physical book from a photo of its cover |

A shared **Book Details** page (About, Reviews, Quotes, Buy, Similar) ties them together, and
every book can be marked **Want to Read**, **Reading** or **Read**.

## Key decisions

**Identity and data**
- No login for the MVP: the auth guard falls back to one seeded demo user. That fallback is the only seam real sign-in replaces.
- One shared Supabase project, plus a seed script (demo user, fake readers around Singapore, saved books). Without Supabase the server keeps an in-memory demo shelf.
- Vue components only talk to our own API (`client/src/services/api.js`); every outside API is called by the server.

**Look and shell**
- Mockup tokens (warm canvas, brown primary, Georgia titles) override Bootstrap variables. Bootstrap stays for grid, utilities and modals.
- Five bottom tabs: Home, Discover, People, Scan, Profile. On desktop the app sits in a centred phone-width frame.
- Mood check-in, mood result, Quote of the Day, Quick Book Preview, Write review and Add quote are modals, not routes.

**My Room**
- A 3D room modelled in Blender and drawn with Three.js. The reader stands in the middle and looks around (drag, pinch or scroll, keyboard), or uses the bar of places (Bookshelf, Chair, Window, Corkboard, Clock).
- Everything tappable is a real, labelled HTML button laid over the 3D scene, so it works with a keyboard and screen readers and can be tested.
- The bookcase gives each shelf a labelled row: To be read, Reading, Finished, top to bottom. A book pointed at lifts out a little. Tapping it plays the animation from `bookshelf.blend` (the book slides out, flies to the reader, the cover opens and the pages flip), then shows its details on a wood-framed card: shelf buttons (with progress for Reading), Review and Rate, synopsis, rating, reviews, Remove from shelf, and a link to Book Details, which is the same card as a page. Reduced motion skips the animations.
- The bay window shows the live weather: sun and birds, clouds, rain, or the moon at night.
- The corkboard opens the Quote of the Day; the book on the armchair opens Currently Reading.
- Devices that cannot draw 3D get a still picture of the room and a plain list of their books.

**Mood and quotes**
- Moods are Calm, Low, Stressed and Excited. The recommender picks from a curated list of works and shows a quote from the book (Wikiquote, then api-ninjas, then the stored line).
- Quote of the Day is one quote a day for everyone, from a locally built quotes dataset, with api-ninjas as a fallback.

**People**
- Leaflet and OpenStreetMap. Compatibility is 60% shared books plus 40% shared favourite genres, computed by the server. Other readers' locations are rounded to about 1 km.
- Follow is one-way and instant. A reader's room is a read-only copy of My Room with their data.

**Scan Book**
- A cover photo goes through Google Vision text detection, then the top Google Books match with a confidence chip. The reader confirms it and picks a reading status.

## Testing

Playwright end-to-end tests drive the running app the way a reader does: through labelled buttons
and visible text, with outside answers (weather, time, saves) mocked by route. See README for how
to run them.

## Out of scope for the MVP

Real accounts and sign-in, real-time chat between devices, drag-to-reorder books, push
notifications, and native mobile apps.
