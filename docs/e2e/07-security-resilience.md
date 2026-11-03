# E2E scenarios 07: permissions and data safety, errors and empty states, responsive and accessibility

Suites: **SEC** (8), **ERR** (8), **RSP** (6) = 22. Format, accounts and rules: header of
[01-public-auth-onboarding.md](01-public-auth-onboarding.md) and C1 to C5 of [../E2E_GUIDE.md](../E2E_GUIDE.md). SEC scenarios call the API
and Supabase directly (use a throw-away script with the readers' access tokens; see C1). **Never** try to read or change a real
teammate's data: use only accounts you created (ACCT-A, ACCT-B) and the seeded sample readers. Never print keys or tokens.

---

## SEC: Permissions and data safety

### SEC-01 · Signed-out requests are refused · Critical
**Pre:** no token.
1. Call `GET /api/user-books`, `/api/friends`, `/api/messages/<any>`, `/api/people`, `/api/notifications/visits`, `/api/saved-quotes` → each returns **401** ("Missing access token").
2. Call with a made-up token `Bearer abc` → **401** ("Invalid access token").
3. Public endpoints still answer: `GET /api/health`, `/api/weather`, `/api/time`, `/api/quote/today`, `/api/books/search?q=dune` → 200.
**DB:** none. **Pass:** protected routes never return data without a valid token.

### SEC-02 · One reader cannot change another's data · Critical
**Pre:** ACCT-A and ACCT-B tokens.
1. A calls `PUT /api/rooms/<B>/furniture` → **403** "Only a room's owner can change its furniture."
2. A calls `DELETE /api/rooms/<B>/notes/<a note A did not write>` (when A is not the owner) → refused (403).
3. A calls `PATCH /api/user-books/<book>` for B's book id → only A's own row exists; B's is unaffected (404 if A doesn't have it).
4. A calls `DELETE /api/friends/<B's friendship with C>` → refused / no effect.
5. A calls `POST /api/messages/<B>` as A → creates a message **from A only** (the sender id cannot be forged in the body).
**DB:** B's rows unchanged. **Pass:** every cross-account write is refused or scoped to the caller. **Existing coverage:** `visit-room.spec.js`, `friends.spec.js`.

### SEC-03 · The public key cannot read locked tables; coins are not writable · Critical
**Pre:** `database/lock_down.sql` applied. Use the browser anon key (`visitorClient()` in `supabaseUser.js`).
1. Select from `user_books`, `books`, `reviews`, `quotes`, `featured_quotes`, `saved_quotes` → an error or zero rows (RLS), never other readers' data.
2. Call `rpc('daily_settled', { ... })` as anon → refused.
3. As a signed-in reader: `update profiles set coins = 99999 where id = me` → refused; `select * from profile_private` → only your own row.
4. As a signed-in reader read `reader_messages` → only rows you sent or received.
**DB:** none changed. **Pass:** exactly the access listed in C5. **Existing coverage:** `database-access.spec.js`.

### SEC-04 · Messages are private · High
1. A and B chat. C (a third account) calls `GET /api/messages/<A>` → only the C ↔ A thread (empty), never A ↔ B.
2. Look at `reader_messages` via C's Supabase session → zero A ↔ B rows.
3. The chat box of A and B shows only their own conversation.
**DB:** none. **Pass:** no leakage. **Note:** any signed-in reader may message any reader (a known product gap, C7); the test is that threads are private, not that messaging needs friendship.

### SEC-05 · Private readers stay private · High
**Pre:** ACCT-A private, ACCT-B signed in (not friends).
1. B's Cafe, **Readers nearby** and `GET /api/people` do not list A; `GET /api/nearby` never returns coordinates.
2. A's bell/visit entries name a visitor only if the visitor is a friend or public; otherwise "someone".
3. A becomes public → listed; private again → unlisted.
**DB:** `profiles.discoverable`. **Pass:** listing equals the setting; no exact coordinates anywhere. **Existing coverage:** `nearby.spec.js`, `notifications.spec.js`.

### SEC-06 · Under-18 rules · High
1. A 16-year-old can never be public (switch locked; `discoverable` stays false even if the API is called to set it).
2. Changing age from 21 to 16 in **Edit profile** while public → the profile becomes private (trigger).
3. Age 12 is refused everywhere (Welcome, Edit profile).
**DB:** `profile_private.age`, `profiles.discoverable`, `reader_areas` deleted. **Pass:** triggers hold. **Existing coverage:** `nearby.spec.js`.

### SEC-07 · User text is shown as text, never run · High
1. Put `<img src=x onerror=alert(1)>` and `<script>alert(2)</script>` in: a username attempt, display name, a corkboard note, a chat message, a review, **Location**.
2. View each in the places it is shown (room notice board, chat box, book reviews, cafe popup, Friends panel, Salon).
3. No alert appears; the raw text is shown (escaped); layout is not broken by long unbroken text (a 140-character word).
**DB:** the text is stored verbatim. **Pass:** no script execution anywhere.

### SEC-08 · No secrets in the browser; demo bypass limits · Critical
1. Search the built JavaScript (`client/dist` or the live site's `/assets/*.js`) for `service_role`, `SUPABASE_SERVICE_ROLE_KEY`, `API_NINJAS`, `GOOGLE_`, any long `eyJ…` JWT whose role is not `anon` → none found.
2. The only Supabase key in the page is the anon key (decode its payload: `role = anon`).
3. The demo route `POST /api/demo-auth/register`: non-demo email → 403; `a@demo.ikda.app@gmail.com` → 403; bad password/username → 400; 61 sign-ups from one address in an hour → **429** (the limit is 60).
4. Setting `DEMO_CODE_DOMAINS=` (empty) on the server and `VITE_DEMO_CODE_DOMAINS=` on the client disables the bypass (a local check; do not change production).
**DB:** none (use only throw-away demo-domain emails and delete them). **Pass:** no secrets; the bypass is bounded. **Existing coverage:** `server/tests/demoAuth.check.js`, `demo-account.spec.js`.

---

## ERR: Errors, empty and loading states

### ERR-01 · The API fails: the app degrades, not crashes · High
1. Block `/api/*` entirely (DevTools "Block request URL") and reload the town → the town renders; Friends/Daily/notifications show empty or error states; no white screen.
2. Return 500 from `GET /api/user-books` → My Room shows a failure state for the shelf ("couldn't load") with a retry; the room itself still renders.
3. Return 500 from `PUT /api/rooms/<me>/furniture` while placing → the placement is reported as unsaved or rolled back; reload shows the server's state.
**DB:** none. **Pass:** each failure shows a message; no uncaught exception in the console. **Existing coverage:** `my-shelf.spec.js` ("a shelf that fails to load").

### ERR-02 · Going offline and back · Medium
1. Go offline (DevTools) while on the town → actions that need the API (add friend, send message) show an error; the map keeps working.
2. Go online → retry succeeds without a reload.
**DB:** none. **Pass:** no duplicate sends after reconnecting.

### ERR-03 · Google Books fails · High
1. Block `GET /api/books/search` → **Search is offline** (LIB-10).
2. Block `GET /api/books/<id>` → **Couldn't open this book.** with **Retry**.
3. With a shelf row whose book cannot be resolved → the shelf shows "Unavailable book" rather than failing the whole shelf.
**DB:** none. **Pass:** the rest of the app is unaffected.

### ERR-04 · Every empty state · High
**Pre:** ACCT-NEW-TOURSEEN (no books, no friends, no notes, no quotes).
1. My Room shelf: empty rows; **My Shelf**: **No books yet** (+ links). 2. **Friends**: no friends, "No requests right now."; **Readers nearby** empty or a hint. 3. **Bell**: "Nothing yet. Friend requests, friends coming online and visits to your room will show here." 4. Salon → **Saved quotes**: "No saved quotes yet" (+ links); **Favourite genres** chips present (chosen at Welcome); counts `0 / 0 / 0`. 5. Corkboard: only the Quote of the Day. 6. Cafe with no readers: **No other readers available yet.** 7. Inventory: "Buy something in the shop, then place it in the room."
**DB:** none. **Pass:** each empty state is worded and has a next step; none shows "undefined" or a blank panel.

### ERR-05 · Loading states · Medium
1. Throttle to Slow 3G: the app loader (IKDA sign, pixel book) on first load; "Loading the town…"; "Loading readers…"; book-shaped skeletons on shelves; "Knocking on the door…" on a visit; "Saving…" on Welcome/Save look; "Sending…" on Register.
2. Each loading state is replaced by content or an error within the timeout.
**DB:** none. **Pass:** no spinner that never resolves; no layout jump larger than a few pixels.

### ERR-06 · Session expiry while using the app · High
1. In DevTools delete the Supabase session (local storage `sb-…-auth-token`) while on the town and press a button that needs the API (e.g. Add friend) → the app reports being signed out (`You are signed out. Log in again.`) or redirects to `/login`; no crash.
2. Log in again → returns to the town.
**DB:** none. **Pass:** a clear path back in. **(unverified)** exact message per action.

### ERR-07 · Deep links and reloads on every route · Medium
1. Signed in, open each route directly and reload: `/`, `/house`, `/house/shelf`, `/library`, `/search?q=dune`, `/cafe`, `/salon`, `/books/<id>`, `/people/emma.reads`, `/people/emma.reads/room`, `/people/emma.reads/room/shelf` → each renders (no 404 page; unknown paths go to `/`).
2. Signed out, open `/house` → login; after logging in you land on the town (not back on `/house`) **(record actual behaviour)**.
3. Old addresses redirect: `/room`, `/discover`, `/people`, `/profile`, `/scan`.
**DB:** none. **Pass:** direct loads work; redirects as in A2.

### ERR-08 · Double clicks and rapid repeats make no duplicates · High
1. Double-click **Confirm** on a purchase → one charge, one piece.
2. Double-click **Accept** on a request, **SEND →** twice quickly, **Save review** twice, **Add to To be read** twice, **Post note** twice, **Claim** twice → exactly one row/effect each.
3. Press **Register** twice quickly → one account (or the second is refused).
**DB:** one row each; `xp_events` once. **Pass:** idempotent at every step. **Existing coverage:** partly in `friends.spec.js`, `furniture.spec.js`.

---

## RSP: Responsive and accessibility

### RSP-01 · Phone layout of every main page · High
**Pre:** Phone 390 × 844. Visit: `/start`, `/login`, `/register`, `/verify`, `/welcome`, `/`, `/house`, `/house/shelf`, `/library`, `/search?q=dune`, `/cafe`, `/salon` (both tabs), a book card, the Shop, the Friends panel, the Daily panel, a chat box.
1. No horizontal scrollbar on any (`scrollWidth ≤ innerWidth`); no clipped or overlapping controls; text readable; fixed buttons (back, Places, Daily, room menu) do not cover content you need.
2. The Salon panel is a bottom sheet with a handle; the cafe popup is a bottom sheet.
**DB:** none. **Pass:** usable on each page 📸. **Existing coverage:** `start.spec.js`, `house-desktop.spec.js`, `library-wide.spec.js`, `buttons.spec.js`.

### RSP-02 · Touch targets and gestures · Medium
1. On the phone viewport every button is at least 44 × 44 px.
2. Touch gestures: swipe the room and the hall, pinch-zoom the town, press-and-hold to drag a book between shelves, drag a furniture piece; none scroll the page by accident.
**DB:** none. **Pass:** targets and gestures as listed.

### RSP-03 · Keyboard only · High
1. Sign up, log in and finish Welcome using only the keyboard (Tab, Shift+Tab, Enter, Space, arrow keys, Esc) → every control reachable in a sensible order; focus visible.
2. In the town open Places, Friends, the bell, Daily with the keyboard; Esc closes menus.
3. In the room use ←/→ to move, Tab to a book spine, Enter to open it; in a dialog focus is trapped and returns to the opener on close.
**DB:** none. **Pass:** every flow completes without a mouse.

### RSP-04 · Names, roles and announcements · Medium
1. Inspect the accessibility tree: buttons have names (e.g. `Show password`, `Chat with Emma`, `Friends, 2 online, 1 friend request`), dialogs have names (`Book details`, `Meet Emma Tan`), tab lists have `aria-selected`, form fields have labels, errors use `role="alert"`, status messages `role="status"`, the walkthrough bubble `aria-live="polite"`.
2. Images that matter have text alternatives; decorative sprites are hidden from the tree.
**DB:** none. **Pass:** no unnamed interactive element. **Existing coverage:** the tests use role/name selectors throughout.

### RSP-05 · Reduced motion · Medium
1. Emulate `prefers-reduced-motion: reduce` → the book-open flight, clouds in the Salon, the walkthrough glide, the intro and floating books are skipped or calmer; all actions still complete.
**DB:** none. **Pass:** nothing depends on an animation to work. **Existing coverage:** `bookshelf.spec.js` (reduced motion).

### RSP-06 · Mid-size windows, zoom and contrast · Low
1. 1024 × 768 and 1920 × 1080: pages fill the window sensibly (the town, buildings and sign-in fill the window; the Cafe keeps a 1:1 world and becomes draggable when narrow).
2. Browser zoom 200% → layouts reflow; no unreachable controls.
3. Spot-check text contrast (≥ 4.5:1) on cards, buttons and the pixel UI in light conditions.
**DB:** none. **Pass:** no unusable layout at these sizes.
