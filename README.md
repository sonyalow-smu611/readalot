# IKDA

**Social media, but for book lovers.** IKDA (읽다, Korean for "to read") is a mobile-first web app
(IS216 group project). After signing in you land in a pixel-art **town**. Each building is one part
of the app:

| Building | Part of the app | What you do there |
|---|---|---|
| Your house | **My Room** | Your own room: bookshelf, reading progress, shop, decorations |
| Library | **Discover** | Browse genre bookcases, search, scan a cover, add books to your shelf |
| Cafe | **Social** | Meet readers, view their profiles, add friends, message, visit rooms |
| Hair Salon | **Profile** | Restyle your character, edit your profile, level, coins, privacy |

This README is your **grading guide**. It takes you through every screen in order, one button at a
time, in three scenarios. The app is full of small animations, so each step also lists the
**👀 visual cues** to try. Please play with them: they are part of what we built.

---

## 1. Before you start (Read-Only)

| | |
|---|---|
| **Open the app** | **<https://ikda-rust.vercel.app>**. Nothing to install: just open the link in your browser. |
| **Best viewed** | On a **laptop**, in a full-size Chrome window. The app is built mobile-first, so for a second pass press F12, turn on device mode and pick 390 × 844. |
| **Time** | Scenario 1 about 25 min, Scenario 2 about 15 min, Scenario 3 about 15 min. |
| **Permissions** | Location and camera are **optional**. Each step says what happens if you say no. |

### How to read the steps

- **Press / Type / Tap** is what you do.
- **→** is what you should see.
- **👀** is a visual or interactive cue to try. Nothing breaks if you miss one.

### Signing in: no inbox needed

Every demo address ends in **`@demo.ikda.app`**. No email is sent to it, so there is nothing to check:
**the 6-digit code is always `111111`.** The code screen says so too.

- **Scenario 1 (create your own account).** Register with any email ending in `@demo.ikda.app`, for
  example `prof.yourname@demo.ikda.app`, any username you like, and a password of 6 or more characters.
- **Scenarios 2 and 3 (the demo account).** Log in as Jordan, who already has a full town, shelf and room:

| Demo account Example | |
|---|---|
| Email | `demo@demo.ikda.app` |
| Password | `Ikda-Demo-2026` |
| Code | `111111` |

> Emails on any other domain still get a real emailed code. Use `@demo.ikda.app` for grading.

### Demo-state preflight (important)

The public demo account is shared. That means counts, requests, chats and room items may have changed
since this README was last updated.

- If a step expects a specific person/count and you see a different one, do the **same action** with what
  is visible and continue.
- If you need the exact seeded baseline for verification, reset Jordan first with
  `npm run seed:demo -w server` (team/internal flow in [docs/DEMO.md](docs/DEMO.md)).

### What the demo account already has

So every feature has something to show. Jordan Lee (`@demo.reader`) comes with the following **baseline
after a reset**:

| Where | Already there |
|---|---|
| **Profile** | Level 4 with 620 XP (80 XP from level 5), 600 coins, favourite genres Fantasy / Sci-Fi / Mystery & Thriller / Memoir, a public profile, a pink "Rosie" character |
| **Bookshelf** | 10 books. **Finished and reviewed:** The Hobbit (5 stars), Pride and Prejudice (4), Project Hail Mary (5). **Reading:** Dune (45%), The Secret History (20%). **To be read:** Fourth Wing, Piranesi, The Night Circus, Circe, Gone Girl |
| **Friends** | **Emma Tan** and **Ayaan Rahman** (online now), **Sofia Lim** (last seen 12 days ago), **Mei Chen** (last seen 5 weeks ago, so her house looks dusty) |
| **Friend request** | **Noah Koh** is waiting to be accepted |
| **Chats** | A conversation with Emma and one with Ayaan |
| **Corkboard** | Notes from Emma and Ayaan. Jordan has also left a note on Emma's board |
| **Bell** | Emma and Ayaan visited your room today, plus Noah's friend request |
| **Saved quotes** | Three, from Dune, Pride and Prejudice and The Fellowship of the Ring |
| **Room** | Posters and frames on the wall, a Wingback chair, sage curtains, starry bedding, a Monstera, a Fiddle-leaf fig, two succulent pots, and a ginger and a black cat. The **Inventory** holds a Moon poster, a Rocking chair, a Calico cat, Navy curtains and Tartan bedding to place |
| **Starts fresh** | The **Daily** tasks and streak start at zero (they are saved to the account, and the reset puts them back). Today's **mood check-in** is remembered by each browser, so it appears the first time you open My Room in a new browser |

> Anything you change on the demo account stays changed. If something looks used up, ask the team to
> reset it.

---

## 2. Scenario 1: "Maya's first evening" (sign up, Salon and Library)

**Persona.** Maya is a 21-year-old student who loves fantasy and wants a cosy place to track her
reading. It is her first time here. She will mistype her name, notice, and fix it in the Salon.

### Part A: The landing page

Open <https://ikda-rust.vercel.app> in a **new private window** so you are signed out.

1. **Wait for the page to load.**
   → The **landing page** opens on the town map in daylight, with the **IKDA** sign, the word 읽다,
   the line "Social media, but for book lovers." and a **Sign up** button.
   - 👀 The town map drifts slowly behind the sign. Townsfolk walk the pavements.
   - 👀 Move your mouse across the page: the clouds and sparkles shift by different amounts, so the
     far ones move least (a depth effect). A soft lantern glow follows the cursor.

2. **Scroll down slowly, then fast.**
   → The sky behind the page changes with how far you have scrolled.
   - 👀 **Early evening at the top, deep night at the bottom.** The **sun sets**, the clouds thin out,
     the **stars come out and the moon rises**.
   - 👀 Scroll back up to watch the moon turn back into the sun.
   - 👀 Each section's words **fade in** as they arrive.

3. **Look at the bar at the top** (IKDA · Meet Maya · The town · Your character · Levels · How it
   works · FAQ · Sign up).
   → It stays at the top while you scroll.
   - 👀 The link for the section in view is **marked**, and the dark highlight **slides** along to it.
   - **Press** each link in turn → the page scrolls to that section.
   - **Press IKDA** → back to the top.

4. **Press "See how it works"** in the hero.
   → The page scrolls to the three steps.

5. **Section "Meet Maya".**
   → Maya, 19, beside her pixel character, and one evening of hers as five steps along a path. Each
   step shows where in town it happens and the XP it gives.
   - 👀 Move your mouse over the scene: the frame **tilts** towards it.

6. **Section "The town".**
   → Four building tabs on a strip of grass (Your house, Library, Cafe, Hair Salon).
   - **Press** each tab → its scene and a line about what you do there.
   - 👀 **Your house:** a wooden bookcase. **Hover over the books** and they come half off the shelf.
     Books being read have a ribbon and a progress bar; finished ones have a star. A black cat sleeps
     on the Reading shelf.
   - 👀 **Library:** a book is held up and the **scanner scans** it.
   - 👀 **Cafe:** two tables of readers; **speech bubbles take turns** and a **match score pops up**
     between each pair.
   - 👀 **Hair Salon:** every couple of seconds one part (hair, colour, top, shoes) **changes by itself**,
     the reader **hops**, and the tab for it lights up.
   - 👀 Click a tab, then use **← → Home End** on the keyboard: the tabs follow the keys.

7. **Section "Your character".**
   → A small character studio. **Type a name** in "Your name in town".
   - **Press** the tabs **Looks, Hair, Skin, Outfit** and pick parts.
   - **Press "Surprise me".**
   - → The character changes at once on the stage. Only free parts are offered.
   - 👀 The character and name you make **come back further down**: on the Levels badge and at the
     door of your house at the end.

8. **Section "Levels".**
   → A badge with your character, level, XP and coins.
   - **Press** the actions: **Add a book, Start reading, Visit a room, Leave a note, Send a message,
     Finish a book.**
   - → The XP adds up, the bar fills, and the level rises.
   - **Press "Start over"** → it resets. (Nothing here is saved.)

9. **Section "How it works".**
   → Three steps with small pictures: Make your character, Fill your shelf, Find your people.

10. **Section "FAQ".**
    **Press** each question (Is IKDA free? Do I need to download anything? Who can see my profile? What
    does IKDA mean? Where do the books come from? I only read a few books a year…).
    → The answer opens on its own card. Press again to close.

11. **The last screen.**
    → **Night has fallen**: the moon and stars, **your house with the character you made standing at the
    door under your name**, a street of neighbours, and "Your next book is waiting."
    **Press Sign up.**
    → Go to Part B.

### Part B: The "town wakes up" intro

12. After pressing **Sign up**, wait about 2–3 seconds.
    → A loading scene: the real town starts **at night with its lamps and windows lit**, **dawn breaks**,
    the camera glides out over the town, **cars drive the main road**, townsfolk walk the pavements,
    and the **IKDA** sign pops in over a pixel book flipping its pages. Then it fades into the app.

### Part C: The Register page

13. You are on **Create your card** ("A code will arrive in your inbox.").
    → A library-card style form on the town map. **Pixel cats and books** are clustered beside the form.
    - 👀 **Move your mouse around.** The cats' and books' **eyes follow your pointer**.
    - 👀 **Click into Email, Username, Password, Confirm password** one by one. The eyes **look at the
      field you are typing in**.
    - 👀 **Small floating books drift in the air.** Move the cursor over them: they **get shoved aside**
      and drift back. Try to push one across the page.
    - 👀 Move your cursor over the larger books and cats: they **pop up**.

14. **Press the Register button with the form empty.**
    → The browser asks you to fill in the first field. Nothing is sent.

15. **Type** an invalid email such as `maya` and press **Register**.
    → It asks for a proper email address.

16. **Type an email ending in `@demo.ikda.app`**, for example `prof.yourname@demo.ikda.app`.
    **Type a Username** such as `maya.reads`. (The hint says letters, numbers, dots or underscores; other
    readers see it. Try a `!` to see it refused. A space turns into a dot.)

17. **Type a Password** such as `Maya1234`. **Type a different Confirm password.** **Press Register.**
    → A red message says the passwords do not match.
    - 👀 **The cats and books duck** when the error appears.

18. **Press the eye icon** at the right of the password box (**Show password**).
    → The password and the confirm box turn into readable text.
    - 👀 **The cats and books cover their eyes** so they cannot peek. The eye icon blinks.
    - **Press it again** (**Hide password**) → the text hides and they uncover their eyes.

19. **Fix Confirm password** so both match. **Press Register.**
    → The button says **Sending…**, then you arrive on **Check your email**.

### Part D: The code

20. On **Check your email**: six digit boxes, and a line saying **"Demo account: no email is sent. Enter
    the code 111111."**
    **Type a wrong code** such as `123456` and press **Confirm code**.
    → A red message, **"That code is not right. The demo code is 111111."**, and you stay on this screen.
    👀 The cats duck again.

21. **Clear the boxes** (Backspace), then **type `111111`**. (You can also paste it: the digits fill all
    six boxes.) **Press Confirm code.**
    → The boxes show **Code accepted** with a tick. 👀 **The cats and books hop with joy.**
    - The **Resend** link starts as **Resend in 30s** and counts down; after 30 seconds it becomes **Resend
      code**. Nothing is emailed for a demo address (there is no inbox), so you never need it.

22. **Then:** the **Welcome** screen opens (a new reader).

### Part E: Welcome (six steps)

Each step has a title and a short note. **Next** moves on, **Back** goes back, and the last step says
**Finish**.

23. **Your name.** **Press Next/Enter with the box empty** → it asks for your name.
    **Type `Mya`** (Enter Mya, we change it later) → **Next**.
24. **Gender.** Pick one (or **Prefer not to say**) → **Next/Enter**.
25. **Age.** **Type `abc`** (or `12`) → **Next/Enter** → it asks for an age from 13 to 120. **Type `21`** → **Next**.
26. **Religion.** Press **Next/Enter** with nothing chosen → it asks you to choose one (**Prefer not to say** counts). Pick one → **Next**.
27. **Genres you like.** **Press Next/Enter with none picked** → it asks for at least one.
    **Pick Fantasy and Magical Realism** → **Next/Enter**.
28. **Pick your character.** Five ready-made characters are shown as pixel sprites.
    - 👀 **Press each one**: the big character in the middle **hops in** and is alive (it breathes and
      blinks).
    - Choose one → **Finish**.
    → The button says **Saving…**, then you zoom into the town.

### Part F: The guided tour

29. The town opens and **your own character floats over the screen** in a speech bubble with a counter
    such as **"1 of 33 · Town"**. It shows every part of the app in order
    (Town, Your house, Library, Cafe, Salon). **Press Next** to move on, or **do what it asks** (it
    says, in bold, things like "Tap your house, then go in"; doing it moves on by itself).
    - 👀 It circles the thing it is talking about (the badge, the weather chip, the Daily button, the bell…).
    - It also makes **real changes**: it asks you to search for *The Hobbit* and add it to your shelf,
      then to make friends with **Pip the Librarian**, send Pip a hello (Pip writes back), and visit Pip's
      room, where Pip has pinned a welcome note.
    - Buttons: **Back**, **Next**, **Skip this part** (jump to the next section) and **Skip tour**.
    → The last step says "That's all of IKDA!" with a **Done** button. A skipped or finished tour does not
    come back by itself; the Salon's **Replay the walkthrough** plays it again.
    (The full walkthrough verification guide is in [docs/E2E_GUIDE.md](docs/E2E_GUIDE.md), section A7.)

### Part G: The town

30. **Look around.**
    - 👀 **Water moves:** a waterfall pours, currents flow down the river, **fish swim** in the lake and
      pond, and the plaza fountain sprays.
    - 👀 **A campfire** by the tent flickers, with sparks and smoke.
    - 👀 **Cars drive** the roads on the left. **Townsfolk walk** the pavements.
    - 👀 **Tap a townsperson**: they jiggle.
    - 👀 **The big building signs bob**, sparkle, and each has a moving motif (an open book, a coffee cup,
      a roof, scissors and a comb).
    - 👀 **Your character** has a white glow and a **green diamond floating over its head** so you can
      always tell which one is you.

31. **Drag the map** to pan. **Pinch** (or scroll the wheel) to zoom. **Press the + and − buttons**
    (**Zoom in**, **Zoom out**). **Press Follow my character, the GPS icon**.
    → The camera moves, zooms, and returns to your character.

32. **Tap the empty ground** somewhere on the pavement.
    → Your character **walks there**. Tap the lake or a building: it walks as close as it can get.

33. **Tap the Hair Salon once.**
    → A **place card slides up** with the sign in the building's colour, a blurb and an **Enter** button.
    **Press ✕ (Close).**
    → The card closes.

34. **Top bar and corner controls.** Go through them one at a time:
    - **Places** → a list of the buildings. **Press one later on** → your character walks to its door.
      👀 **The door swings open with lamplight inside** and your character steps in.
    - **Weather chip** (top left) → shows the live weather. **Press it repeatedly** → it steps through
      **day, night, rain and rainy night** previews.
      - 👀 **At night** the street lamps, windows and lighthouse **light up** and cars turn on headlights.
      - 👀 **In rain** drops blow past the camera and **splash on the ground**.
    - **Bell** (Notifications) → an empty state explaining what will appear. Close it.
    - **Friends** → a list (empty for a new reader) with **Add friend**. Close it.
    - **Daily** (flame, on the left). The tasks panel **opens by itself** the first time you arrive in town.
      Close it, then **point at the flame with your mouse** → **"Daily task" slides out** with a
      ring that fills as tasks are done. **Press it** → the day's three tasks: **Check in at town** is
      already ticked; **Update your reading progress**; and one of Visit a friend's room, Say hi to a reader,
      Add a book to your shelf, or Leave a note. 👀 **Streak freezes**, and **this week's rewards as seven
      tiles** with the 7th a chest.
      **Press Go** on a task → your character flies you to that building. Close the panel.
    - **Public / private chip** (under Daily) → **press it** → a prompt **"Find readers near you?"** with
      **Go public** and **Stay private**. Choose **Stay private** (or **Go public**; if your browser blocks
      location it explains that politely).
    - **Your badge** (bottom left): your face in a ring that fills with XP, a gold level tab, your name and
      coins. 👀 The face bobs and blinks. **Press it** → opens the Hair Salon.

### Part H: The Hair Salon

35. **Press the Hair Salon building OR Click your badge → Enter the salon.**
    → 👀 **Pixel clouds cover the screen and part to the sides** to reveal the salon.
    → A pixel salon: **a tall mirror ringed with bulbs**, a counter and barber chair, and your character
    standing beside it **alive** (it breathes, blinks and sometimes walks on the spot). Your
    **reflection shows in the mirror**.

36. **Style studio tab.**
    - **Press Looks** → five ready-made characters. **Press each** → your character changes and
      **hops**. A save bar slides up: **New look ready**.
    - **Press "Surprise me"** → a random look.
    - **Press Hair, Skin, Outfit, Extras** (or use ← → on the keyboard) → tiles for each part. Change:
      hair style and colour, skin tone, top, top colour, bottoms, shoes, glasses, hat, hair accessory,
      scarf, earrings, bag.
      - Each tile **shows your character wearing that part**. Colours are named swatches. Some parts show
        a price and say they unlock with coins soon; all are free to try on.
      - A part that clashes with another says why.
    - **Press Reset** → back to your saved look.
    - **Change a few parts, then press Save look.**
      → 👀 **Pixel confetti** bursts and the character hops. A "Look saved" message appears.

37. **Try to leave with an unsaved look.** Change the hair, then press **Back to town**.
    → A **"Save your new look?"** dialog with **Save look and leave**, **Stay** and **Discard and leave**. **Press Stay.** (Escape also picks the safe choice.)

38. **Profile tab.**
    → Your reader card (name, avatar, book counts), a **Reader level** card with XP and a bar, **Favourite
    genres**, **Coins** (with a **Visit the shop** button), **About you**, **Privacy**, **Saved quotes**, **Log out**.
    - 👀 The XP **counts up** and the bar fills.
    - **Press "How to earn XP"** → it lists the actions and their XP.

39. **Change your name.** Your name says `Mya`.
    **Press Edit profile** (the pencil on the reader card).
    → A form: Name, Gender, Age, Religion, Location (optional), Favourite genres, and **Change look**.
    - **Change Name to `Maya`.**
    - **Type `abc` in Age** → **Save** → it is refused with a message. **Type `-5`** → refused. **Type `21`.**
    - **Type a Location** such as `Tampines, Singapore`.
    - **Add and remove a Favourite genre.**
    - **Press Save.**
    → The new name shows on the card and on your badge in town.
    - **Press Cancel** after changing something else → the changes are dropped.
    - **Press Change look in "Edit"** → it takes you to the Style studio.

40. **About you.** **Press the pencil on a single field** (for example Location) → only that field
    opens. **Edit** and **Save**, then open another and **Cancel**.

41. **Privacy.** **Switch "Public profile and location" on.**
    → 👀 **A pop-up: your character cheers.** It says other readers can now find you.
    **Switch it off** → 👀 **your character puts on a mask** and it says you are hidden.

42. **Reader card book counts.** **Press To be read / Reading / Finished.**
    → A sheet of those books, with a remove button on each. Empty shelves say so. Close it.

43. **Saved quotes.** → "No saved quotes yet", with **Go to My Room** and **Find a book**.

44. **Show more / show less.** On a phone-size window, **press the handle at the top of the panel** → it
    opens fully and closes.

45. **Press Back to town.**

### Part I: The Library

46. **Press the Library → Enter the library.**
    → The **help desk** is in view, in a pixel library hall. 👀 The hall is lit by the **live weather**
    through its windows (sun, cloud or **rain on the windows**).

47. **Look around.** **Drag, swipe, scroll the wheel, or use ← →.**
    → The hall moves sideways: bookcases for each genre, the help desk, the scanner, a reading nook.
    - 👀 **Tap a lamp** on the wall → it **turns off and on**.
    - 👀 Each genre has **its own sign** (colour, font, icon) and its own coloured wall.

48. **Places menu** (bottom right). **Press it.**
    → Two groups: **Around the library** (Help desk, Scanner, Reading nook) and **Shelves** (Bestsellers,
    Romance, Romantasy, Fantasy, Mystery & Thriller, Horror, Sci-Fi, Historical Fiction, Young Adult,
    Memoir, Graphic Novels). **Press Esc** to close it. **Press a place** → the hall slides to it.

49. **Press the Fantasy bookcase.**
    → It opens with its books.
    - **Press Spines / Covers** → the books change between spines and cover-out.
    - 👀 **Hover or focus a book** → it **slides up out of the shelf**.
    - **Press a book.**
    → A card: cover, title, author, stars, genres, synopsis, a shelf button, and **Where to get**.
    - **Press Where to get** → a list of shops, downloads or ways to borrow it.
    - **Add it to To be read.**
    → The button changes to show it is on your shelf, and a toast appears.
    - **Close the card.**

50. **Press the Bestsellers bookcase.**
    → This week's list, credited under the sign.

51. **Help desk search.** **Press the search bar**, type `hobbit`, press **Search**.
    → The **Search** page: your query in the address bar, with the books in a bookcase.
    - **Press the browser's Back button** → earlier searches come back.
    - **Reload** → the results survive.
    - **Search `zzzqqq`** → a clean "nothing found" message.
    - If the book source is down, a **Search is offline** message with **Try again**.

52. **Scanner.** **Press the Scanner** (or Places → Scanner).
    - **Allow the camera** → a live view. Hold a book cover up with its title in view and press **Snap
      cover**. 👀 The scanner lights and says **Scanning…**.
    - **If you refuse the camera** → use **Or upload a photo of the cover**, or **Search by title**.
    → The scanner finds the book and opens its card. **Press the close button** to leave.

53. **Press Back to town.** **Press your badge (bottom left)** → the Salon's profile.
    → Your **To be read** count has gone up, and XP and the Daily task have moved on.

**Scenario 1 is complete. Log out now if needed.** Please write down what confused you.

---

## 3. Scenario 2: "Catching up with friends" (Cafe, friends and messages)

**Persona.** Jordan is a keen reader with a few friends already. Tonight Jordan goes to the cafe to see
who shares their taste, answers a friend request, catches up in the chat, and visits a friend's room.
Use the **demo account** (Jordan Lee).

### Part A: Log in

1. Open <https://ikda-rust.vercel.app> in a **new private window**. If you land on the landing page,
   **press the small "Log in" link** under the Sign up button.
   → **Welcome back** ("Enter your details, then the code from your email.").

   Use the following demo account details:

   | Field | Login details |
   |---|---|
   | Email | `demo@demo.ikda.app` |
   | Password | `Ikda-Demo-2026` |
   | Verification code | `111111` |

### Part B: The bell and the friends list

5. **Look at the top bar.**
   → You should see **bell**, **Friends**, **Places**, **Daily**, weather and your badge. In a freshly reset
   demo state, Friends starts at 2 online and 1 request.
6. **Press the bell (Notifications).**
   → You should see recent friend requests and room visits (exact names/times depend on account state).
   **Press Clear all** → the list empties and says what will appear. Close it.
7. **Press Friends.** The panel shows:
   → **Add friend** and **Remove friends** buttons, **Friend requests** (if any), **Your friends** with
   each friend's reading status and a **Chat with …** button, and **Readers nearby**.
   - 👀 At least one friend should show **Online now** in a seeded demo state.
8. **Press "Accept Noah Koh".**
   → If Noah's request is present, Friend requests now says **"No requests right now."**, and Noah moves
   into **Your friends**. If Noah was already accepted earlier, accept any visible request instead.
9. **Press Chat with Emma.**
   → The panel closes and a **chat box opens** in the bottom corner, **READER MESSAGES**, with the
   conversation already in it: Emma's "Hi Jordan! I saw you just finished Project Hail Mary…" and Jordan's
   replies. The note at the bottom says only you two can read it.
   - **Press SEND → with nothing typed** → nothing is sent.
   - **Type** `Tell me when you finish it!` **and press SEND →** → your message appears at the bottom.
   - **Press Minimise chat** → it tucks away. **Press Close chat with Emma Tan** → the box goes.
10. **Press Friends → Add friend.**
    → A **Friend's username** box.
    - **Type** `nobody_here` **and press Send request** → a friendly message, **"Couldn't find nobody_here.
      Check the spelling."** Nothing breaks.
    - **Type** `priya.pagecount` **and press Send request** → **"You and priya.pagecount are now friends."**
      (the sample readers accept straight away). 👀 Priya moves into **Your friends**.
11. **Press Friends → Remove friends.**
    → The friends become tickable. **Tick Priya** and confirm. → Her house goes. (Skip this if you want to
    keep her.)

### Part C: Walking the town

12. **Look for the friends walking.**
    → 👀 Friends who are online **walk the streets with an orange glow**. **Tap one.**
    → A **friend card slides up**: their name, what they are reading, and buttons to talk, **Visit
    &lt;name&gt;'s house**, and **Remove friend** (it asks again: **Yes, remove &lt;name&gt;**; press ✕ to
    cancel).

### Part D: The Cafe

13. **Press the Cafe building → Enter the cafe.**
    → A cosy pixel cafe, **BREW &amp; BOOKS**, with readers sitting at tables (usually 8 in the seeded demo).
    A label at the top left says `N readers in café`, and the weather is in the top right. A hint at the bottom says **"Click a
    reader to walk over"**.
    - 👀 Every reader has a name tag and a **match score** (for example Emma around 38–40% in the seeded demo): it is how much your
      shelves and genres overlap.
    - 👀 **You** stand by the **WELCOME** mat with a **YOU** tag.
14. **Click Emma Tan.**
    → 👀 Your character **walks across the cafe** to her table. Then a **profile popup** opens: "Emma Tan
    @emma.reads · Bishan", **MATCH 38%**, and the buttons **Visit Emma's room**, **Added as friend**
    (already friends) and **Message**.
    - Scroll the popup: **Currently Reading** (The Secret History), **Reading Prefs** (genres you both like
      are starred), and **Books You Both Have** (The Hobbit, The Secret History, Fourth Wing).
15. **Press Message.**
    → A **Reader messages** chat opens with the same history as before. **Type and send a message.**
    **Close the chat.**
16. **Press the × (Close reader profile).** You stay in the cafe.
17. **Click Daniel Ong** (about **22% match** in the seeded demo).
    → His popup shows **Add friend**. **Press it.**
    → The button changes to **Request sent** (or **Added as friend** straight away for a demo reader).
    **Close the popup.**
18. **Press Back to town.**

### Part E: Visit a friend's home

19. **Press Emma's house** (the small house with a green dot) → on its card, press the button to go in.
    (You can also press **Visit Emma's room** on her profile.)
    → **Knocking on the door…**, then her room, in her own colours, with **Back to Emma's profile** at
    the top left.
20. **Look around** (drag, swipe, scroll the wheel, or use ← →).
    - 👀 Her room has its own posters, furniture and colours.
    - 👀 **Tap a lamp** → it turns off and on, but **only for your visit**.
21. **Press her bookshelf.**
    → Her shelf, read-only: **no search, no status buttons**. **Press a book** → a card with nothing to edit.
    **Go back.**
22. **Press the corkboard** (notice board).
    → The **Quote of the Day** and notes, including **Jordan's note on Emma's board**.
23. **Press "Leave a note"** (bottom right).
    → A note box, **"Say hello, recommend a book…"**, with **Post note** and **Cancel**. **Press Cancel** →
    it closes. **Reopen it, type** `Great taste in books!` **and press Post note.**
    👀 Visiting her room earns **+15 XP** and the note **+10 XP**.
    → The note appears on her board. You can take down **your own** note.
24. **Press Back to Emma's profile**, then **Back to town.**
25. **Open Daily** (the flame).
    → Tasks for the day. Doing things earns ticks. When all three are done, **Claim** glows gold.
26. **Press Claim** (if it is ready).
    → 👀 **A chest bounces in and pops open with coins flying out.** It shows the streak day and the
    reward. **Press Nice!** → your coin count in the badge **counts up**.
27. **Bad address.** In the address bar, go to `/people/nobody/room`.
    → **We couldn't find that reader.**, with **Find readers in the Cafe**.

**Scenario 2 is complete.**

---

## 4. Scenario 3: "My own reading room" (My Room, shop and decorations)

**Persona.** Jordan wants a cosy corner that shows who they are. Use the **demo account** (still signed
in from Scenario 2, or log in again: `demo@demo.ikda.app` / `Ikda-Demo-2026` / `111111`).


### Part A: Mood check-in

8. **On your first visit of the day**, a card opens by itself: **"How are you feeling today?"**, with a
   step tracker (**1 Check-in, 2 Result, 3 Saved**). If it does not appear, it has been done today: open
   it from the room menu (the button at the bottom right).
   → Four moods: **Calm** (Settled, unhurried), **Low** (Could use a lift), **Stressed** (A lot on my
   mind), **Excited** (Full of energy). **Continue** stays greyed out until you pick one.
9. **Press a mood → Continue.**
    → **A book for your mood** with a quote from it. (The quote links back to its source.)
10. **Press "Save quote".** → It changes to **Unsave** (press it to take the quote out again).
11. **Press "Add to To Be Read".** → **Added to To Be Read** with an **Undo** button beside it (press it and the book comes off the shelf).
12. **Press "Show another recommendation".** → A different book.
13. **Close it.** (Another day, **Skip for today** keeps it away until tomorrow.)
14. **Check Saved quotes** in the Salon's Profile tab → your three quotes, plus the new one.

### Part B: Walk in and look around

1. **Press Your house → Go inside.**
   → My Room: one wide pixel-art picture of a room, side on. Your current coin total shows at the top right
   (600 in a freshly reset demo state).
   - 👀 The **cats wander** the floor. A **ginger** one is by the armchair, a **black** one near the left.
2. **Look around.** **Drag, swipe, scroll the wheel, or use ← →.**
   → The room slides sideways: the bay-window nook, the reading chair and coffee table, the bookshelf,
   the clock and corkboard, then the bed with **starry bedding**.
3. **Press Places** (top left, hamburger icon): **Window, Chair, Bookshelf, Clock, Corkboard, Bed.**
   → Each one slides the room to that place. **Press Esc** to close the list.
4. **The window.**
   → The **live Singapore weather**: 👀 the sun with birds flying past, drifting clouds, rain, or the
   moon at night, with the temperature. The town across the street shows through the glass.
   - Add `?scene=rain` to the address (`https://ikda-rust.vercel.app/house?scene=rain`), then `sunny` and
     `cloudy`, to preview each sky.
5. **The clock.** → Singapore time.
6. **The lamps.** **Tap a lamp** (the floor lamp and the table lamp).
   → 👀 It **switches off and on**, and the room's light changes. At night the lamps light their corners.
7. **The corkboard.** → The **Quote of the Day**, plus the **notes from Emma and Ayaan**.

### Part C: The bookshelf

15. **Look at the bookshelf.**
    → Three rows, each named on a plate: **To be read, Currently reading, Finished reading**.
    - 👀 **Hover or focus a spine** → it lifts a little out of its row.
16. **Press a book spine** (for example **Dune** on Currently reading).
    → 👀 **The book lifts out, flies up to the middle of the room as its cover, and swings open on its
    pages.** (Reduced-motion settings skip this.)
    - **Press anywhere while it flies** → it skips straight to open.
17. **On the card:** cover, title, author, stars (when readers have rated it), synopsis, **Remove from
    shelf**, and **Leave/Read Reviews**. What else shows depends on the shelf:
    - A **Currently reading** book (Dune) has a **progress slider**, and **Mark as finished**. 👀 **Drag the
      slider** (Dune starts at 45%) → the percent saves.
    - **Press "Mark as finished"** → the book moves to **Finished reading**. 👀 Finishing a book is worth
      **+100 XP**: Jordan has 620 (visiting a room, leaving a note and sending a message in Scenario 2 add
      only a few more), so this crosses **700 XP and levels up to level 5**, and you get **125 coins** (600
      becomes 725). Check the badge in the town, or the Salon's **Reader level** card, afterwards.
    - **Press "Leave/Read Reviews"** → **Rate this book** with five stars (**★ 1 star** … **★ 5 stars**), a **Your
      review (optional)** box and **Post Review**. **Choose 5 stars, type a sentence and press Save
      review** → your review appears with **Edit your review** and **Delete your review**, and you earn
      **+40 XP**.
    - Open **The Hobbit** (Finished) and press **Leave/Read Reviews** → **Jordan's 5-star review** and the
      reviews of **Emma** and **Ayaan**, and the rating **4.7 from 3 readers**.
    - Open **Fourth Wing** (To be read) → **Start reading** and **Where to get**.
18. **Press "Remove from shelf".**
    → It asks first. **Confirm.** → A toast with **Undo**. **Press Undo** → it comes back.
19. **Close the card.** → The book **flies back onto the shelf** the way it came.
20. **Press the bookshelf itself** → **My Shelf.**
    → The Library's bookcase with exactly three shelves, in My Room's colours.
    - **Press Spines / Covers** → changes the look.
    - **Press a genre chip** and **type in "Search your books"** → the books filter.
    - 👀 **Drag a book up or down out of its shelf** (on a touch screen, press and hold). The book is
      carried under the pointer, the shelf below **lights up**, and letting go over another shelf **moves
      the book and changes its status**. Press **Esc** while holding, or let go elsewhere: it goes back.
    - 👀 Hold a book near the top or bottom edge → the page scrolls so you can reach another shelf.
    - **Press Next / Previous** on a long row, or swipe, or press the arrow keys.
    - **Empty state:** search for `zzzz` → **No books yet** with **Discover books** and **Scan a cover**.
    - **Press Back to room.**

### Part D: The shop and decorations

21. **Press the Room menu → Shop** (the button at the bottom right).
    → Groups with prices: **Wall art** (posters, botanical print, gold frame), **Reading chairs**,
    **Plants**, **Cats**, **Curtains** (five fabrics), **Bedding** (five designs). Your current coin total is
    shown at the top right (600 in a freshly reset demo state). "Swipe the row. Each card says where that
    piece can sit."
22. **Buy a poster.** **Press it.** → **"Buy <name>?"** with the price. **Press Confirm.** (The price comes
    out of your credits, the same coins shown at the top right.)
    → "Tap a piece, then where it should go in the room. Or drag it there."
    - **Tap a spot on the wall** (or drag it there) → it hangs on the wall.
    - **Tap the floor** with a wall piece → it will not go there; the card says where it can sit.
23. **Buy a plant** (floor) and **a succulent trio** (the window seat, side table or nightstand).
    → Each only fits where its card says.
24. **Open Inventory.**
    → Five pieces are waiting: the **Moon poster**, **Rocking chair**, **Calico cat**, **Navy curtains**
    and **Tartan bedding**. **Press the Calico cat, then tap the floor** → 👀 it wanders the floor with
    the other two cats.
25. **Press the Rocking chair, then tap the reading nook.**
    → It **swaps with the Wingback chair**, which goes back to the Inventory.
26. **Place the Navy curtains and the Tartan bedding.**
    → They replace the sage curtains and the starry bedding, which go back to the Inventory.
27. **Move a placed piece.** **Tap it.**
    → A card with **arrow buttons** (or the arrow keys), **Done** and **Cancel**.
28. **Spend until you cannot afford the next piece.**
    → The buy card says **"Not enough credits."**, **Confirm** is greyed out, and your coins do not go
    negative.
29. **Reload the page.** → Your pieces are still where you put them.
30. **Open the Salon → Profile → Coins.** → The coins have dropped. **Press Visit the shop** → back to the
    room.

### Part E: Check your progress and finish up

31. **Open the Salon → Profile.**
    → The **Reader level** card shows your new level and XP, **Coins** shows what is left after the shop,
    and **Finished** on the reader card has gone up by one.
32. **Press the Salon's "Log out".**
    → A dialog with a little book shutting above the title. **Press Stay** to confirm the safe choice
    works. **Press Log out** again, then confirm.
33. **You are back at the landing/login page.** **Press the browser's Back button.**
    → You are **not** let back into the town.

**Scenario 3 is complete.**

---

## 5. Visual and interactive cue checklist

Tick off what you tried:

**Landing page**
- [ ] Map drifts behind the sign; townsfolk walk
- [ ] Mouse parallax on clouds and sparkles; lantern glow follows the cursor
- [ ] Scrolling changes sun → sunset → stars → moon, and houses light up one by one
- [ ] Words fade in as sections arrive
- [ ] Nav highlight slides along to the section in view
- [ ] Scene frames tilt with the mouse; characters and piles hop when tapped
- [ ] Bookcase books come half off the shelf on hover
- [ ] Cafe speech bubbles and match scores; salon scene changes parts on its own
- [ ] Character studio, "Surprise me", and your character at your door at the end
- [ ] Level badge fills as you tap actions; FAQ cards open

**Sign-in**
- [ ] "Town wakes up" intro (night → dawn, cars, townsfolk, IKDA sign)
- [ ] Cats' and books' eyes follow the pointer and the field being typed in
- [ ] Floating books are shoved by the cursor; larger books pop up
- [ ] Show password → cats and books cover their eyes
- [ ] Error → they duck; code accepted → they hop

**Welcome and tour**
- [ ] Character hops in when you change the preset
- [ ] Tour spotlights each building after the camera flies to it

**Town**
- [ ] Moving water, fish, campfire, cars, rain, night lamps, headlights
- [ ] Bobbing, sparkling building signs
- [ ] Your glowing character with the green diamond
- [ ] Door swings open as you enter
- [ ] Friends' orange glow, online dots, dusty houses
- [ ] Daily button slides out; chest reward animation; badge XP floats

**Salon**
- [ ] Clouds part on entry; mirror reflection; confetti on save
- [ ] Privacy pop-up: cheer / mask

**Library**
- [ ] Lamps turn off and on; rain on windows; genre signs and walls
- [ ] Books slide out on hover; scanner scans

**My Room**
- [ ] Weather in the window; lamps; cats wander
- [ ] Book flies out and opens; flies back
- [ ] Drag a book between shelves; shelf lights up

---

## 6. What to look for in your feedback

1. **First impression.** Is it clear within 10 seconds what IKDA is for?
2. **Navigation.** Can you always tell where you are and get back?
3. **Visual design.** Hierarchy, spacing, readability, and whether the colours mean something.
4. **Consistency.** Do buttons, fonts and cards look and behave the same across the four buildings?
5. **Feedback.** Do loading, empty, error and success states tell you what happened?
6. **Laptop and mobile.** Does the layout use a wide window well? On a 390 × 844 phone view, check touch
   targets, text size, and anything cut off or overlapping.
7. **Accessibility.** Contrast, keyboard use, labels, and whether motion can be too much.
8. **Delight vs clarity.** Do the animations help, or get in the way?
9. **Bugs.** Anything that crashed, froze or looked wrong. Please say which step.

A copy-and-paste template:

```text
Scenario / step:
What I expected:
What happened:
Severity (blocker / major / minor / polish):
```

---

## 7. Known limits

- Camera, location and the book scanner depend on your browser's permissions. Each has a fallback.
- Book search uses Google Books, which can be slow or rate-limited. A search may need a retry.
- Daily-task progress is kept in the browser for now.
- Cafe readers are shared demo readers.
- The animations respect "reduce motion": if your system asks for less motion, some of them are skipped.

## 8. The team

| Part | Owner |
|---|---|
| Town | Dylan |
| My Room | Sonz |
| Library | Aasim |
| Cafe | Emiley |
| Hair Salon, sign-in | Aalric |

## 9. E2E testing guide (for the verification phase)

A complete user guide and 215 numbered end-to-end scenarios (with steps, expected results, database checks and
priorities) are in **[docs/E2E_GUIDE.md](docs/E2E_GUIDE.md)** and the seven files in **[docs/e2e/](docs/e2e/)**:

| File | Covers |
|---|---|
| [01-public-auth-onboarding](docs/e2e/01-public-auth-onboarding.md) | Landing page, register, log in, the code, log out, route guard, Welcome |
| [02-walkthrough](docs/e2e/02-walkthrough.md) | The walkthrough (33 stops), Pip, skip and replay |
| [03-town-social](docs/e2e/03-town-social.md) | Town and HUD, Daily tasks, friends and chat, Cafe, visiting rooms |
| [04-room-shelf-shop-mood](docs/e2e/04-room-shelf-shop-mood.md) | My Room, bookshelf and My Shelf, mood check-in, Shop and Inventory |
| [05-library-books](docs/e2e/05-library-books.md) | Library, search, scanner, book cards, reviews |
| [06-salon-progress-journeys](docs/e2e/06-salon-progress-journeys.md) | Salon, XP/coins/levels, connecting journeys |
| [07-security-resilience](docs/e2e/07-security-resilience.md) | Permissions, errors and empty states, responsive and accessibility |

