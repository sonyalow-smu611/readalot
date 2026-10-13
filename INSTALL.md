# Readalot — complete local Discover People + Reader Room + Reader Chat demo

This add-on implements the missing README features with **fictional sample profiles** and browser `localStorage` (no Supabase setup required). It is a UI prototype, **not** real multi-user accounts, geolocation, social networking, or private messaging.

## Before you replace anything

1. In GitHub Desktop commit or back up the working version of your project.
2. **This ZIP replaces the existing PeopleView.vue and ReaderRoomView.vue.** If your teammates have changed either since the previously uploaded files, compare and merge instead of blindly overwriting.
3. From the ZIP root, copy `client/` into the **root** of your existing `readalot/` repo; merge folders and replace these five files:
   - `client/src/views/PeopleView.vue`
   - `client/src/views/ReaderRoomView.vue`
   - `client/src/services/peopleDemo.js` (new)
   - `client/src/services/chatApi.js`
   - `client/src/components/people/ReaderChat.vue`
4. **Do not** change `server/src/app.js`, `auth.js`, `supabase.js`, `.env`, or Supabase SQL for this demo. The old messaging backend from the previous package may remain unused.
5. Your existing Vue router needs `/people` → `PeopleView.vue`, `/people/:id` → `ReaderRoomView.vue`. Those routes are described in the README. Check `client/src/router/` and ensure they point to the two views here. Avoid duplicate routes.
6. From the project root, run `npm run dev:server` and `npm run dev:client` in separate terminals. Visit http://localhost:5173/people .

## Verify every feature

- **Map-based discovery:** An OpenStreetMap Singapore background with four clickable fictional-reader pins; selecting a pin updates reader preview. The base map requires internet. It is fixed and non-pan/zoom to keep the demo markers aligned. Search filters reader pins.
- **Calculated compatibility:** shared books and shared favourite genres, not fixed percentages. Demo formula: 60% × (shared titles / your 4 titles) + 40% × (shared genres / your 3 favourite genres). Purely illustrative; not a production recommendation score.
- **Reader Room:** click Visit Room; view reader profile, currently reading title, favourite genres, shared genres, shared books, complete sample bookshelf, and filter bookshelf status.
- **Follow / Unfollow:** works in Discover People and Reader Room and persists across refresh in the same browser (`readalot_demo_following_v1`).
- **Chat:** visit Room → leave a message; type, send, refresh, and use the View as switch to simulate a reply. Stored in the same browser (`readalot_demo_messages_v1`).

## Notes and limitations

- Sample profiles are fictional and located only in `peopleDemo.js`; the app does not read real profile data or write these follows to Supabase.
- The demo is not a working user-to-user service. Do **not** enter actual private information in chat.
- The existing backend may have other seeded or real readers whose IDs don't match the sample IDs. This demo deliberately uses only its four coordinated profiles on `/people` and `/people/:id` so the map, bookshelf, matches, follow and chat are consistent.
- These Vue views use standard Vue 3 and Vue Router; no extra library installs needed.
- Existing shared app shell, header, bottom navigation, and other routes are left intact.
- If the map is blank, check internet / OpenStreetMap availability; reader pins and cards remain accessible.
- For the final team merge, compare the existing `components/people/` map and original PeopleView before merging. Restore API-based data and proper account authorization for production.
