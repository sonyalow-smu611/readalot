# Reader profile: pixel redesign

**Status:** ready-for-agent

## Problem Statement

A reader's profile (`/people/reader-<id>`, opened from a reader in the Cafe) is the last page in
the app still in the old soft, rounded, emoji style. Readers arrive from the pixel-art town, step
into a pixel-art room or library, and land on a page that looks like a different app: emoji
avatars and covers, pill buttons, and a long scroll that mixes the profile, a filtered bookshelf
and a chat box. It's hard to see at a glance who this reader is, how much you have in common, and
what to do next (visit their room, follow, message).

## Solution

The profile is redrawn as a short, pixel-art card stack that follows the wireframe, in the house's
pixel style and the Library's colours, on the Library hall's parchment wall colour:

1. **Back to Discover** at the top.
2. **Who they are:** their town character in a small framed picture (sky and grass), their name,
   `@username · neighbourhood`, and a **Match** bar with the percentage.
3. **Visit <name>'s room**, a wide green button, the page's main action.
4. **Follow** (wood brown) and **Message** side by side.
5. **Currently Reading:** a pixel book, the title, "by" the author, and a genre chip.
6. **Reading Prefs:** their favourite genres as chips, the shared ones starred, and
   "★ N in common: …".
7. **Books You Both Have:** "shared books with You", then each shared book as a row with a pixel
   book, title and author.

Each card has a tab-style heading in brass, a paper inside, a thin teal inner frame and a hard
pixel shadow, as in the wireframe.

## User Stories

1. As a reader, I want a reader's profile to look like the rest of the pixel-art town, so that the app feels like one world.
2. As a reader, I want to see the other reader's town character on their profile, so that I recognise them from the map and the Cafe.
3. As a reader, I want their character to be the same one the town shows for them, so that I'm not confused by two looks.
4. As a reader, I want to see their name as the page's main heading, so that I know whose profile I'm on.
5. As a reader, I want to see their username and neighbourhood under their name, so that I can tell readers with similar names apart.
6. As a reader, I want a Match bar with a percentage, so that I can see at a glance how alike our reading is.
7. As a screen reader user, I want the Match bar announced with its value, so that I get the same information without seeing the bar.
8. As a reader, I want Visit <name>'s room to be the biggest button, so that the fun thing to do next is obvious.
9. As a reader, I want Visit <name>'s room to take me into their room, so that I can look round their shelf and leave a note.
10. As a reader, I want to come back from their room to their profile, so that I don't lose my place.
11. As a reader, I want to Follow a reader from their profile, so that I can keep up with them.
12. As a reader, I want the Follow button to show when I'm already following, and let me unfollow, so that I know where I stand.
13. As a reader, I want my follow to still be there when I come back to the profile, so that it isn't lost.
14. As a reader, I want to see a message if following fails, so that I know to try again.
15. As a reader, I want a Message button that opens a chat with them, so that I can talk about books.
16. As a reader, I want the chat to open over the profile and close back to it, so that the profile stays short.
17. As a keyboard user, I want the chat to take focus when it opens, close with Escape, and give focus back to Message, so that I don't get lost.
18. As a reader, I want to see the book they're reading now with its title, author and genre, so that I can start a conversation about it.
19. As a reader, I want the book drawn as a pixel book in its genre's colour, so that it fits the art style and hints at the genre.
20. As a reader, I want to see "Not reading anything right now" when they aren't reading, so that the card isn't blank.
21. As a reader, I want to see their favourite genres as coloured chips, so that I can tell their taste quickly.
22. As a reader, I want the genres we share marked with a star, so that I can spot what we have in common.
23. As a reader, I want a line saying how many genres we have in common and which, so that I don't have to compare the chips myself.
24. As a reader, I want "No genres in common yet" when we share none, so that the line still makes sense.
25. As a reader, I want a list of the books we both have, so that I have an easy thing to talk about.
26. As a reader, I want each shared book shown as a pixel book with its title and author, so that the list fits the page's style.
27. As a reader, I want a friendly empty state when we share no books, pointing me to their room's shelf, so that I know where to see their books.
28. As a reader, I want each genre to keep the same colour everywhere (chips, books), the same as the Library's bookcases, so that colours mean something.
29. As a reader, I want Back to Discover to take me back to where I found them, so that I can keep browsing readers.
30. As a reader visiting an address for a reader who doesn't exist, I want a clear message and a link back, so that I'm not stuck.
31. As a reader on a phone, I want the whole profile to fit the screen's width with no sideways scrolling, so that it's comfortable to read.
32. As a reader on a laptop, I want the profile to stay a readable column in the middle, so that it doesn't stretch across the screen.
33. As a reader who prefers less motion, I want the character to stand still, so that nothing moves without my asking.
34. As a reader, I want the text on every card to be easy to read against its background, so that I'm not squinting at low-contrast colours.
35. As a screen reader user, I want each card to be a section with its heading, so that I can jump between them.
36. As a screen reader user, I want the pixel pictures described or hidden as fits (the character described, decorative books hidden), so that I hear what matters.
37. As a demo user, I want a small note that these are sample readers and follows and chat stay in this browser, so that I understand why.

## Implementation Decisions

- **Where it lives:** the profile page is today an old page in the shared views folder, built for
  the Cafe. It is redesigned in place (same route and route name, so every existing link and
  `router.push` keeps working). New parts of it are their own components: the reader card (picture,
  name, handle, Match bar), a pixel card frame with a tab heading (used by all three info cards), a
  genre chip, and a pixel book row (used by Currently Reading and Books You Both Have). A
  section-card frame is the repeated markup; it becomes one component that takes a title and an
  icon and wraps its content in a slot.
- **Colours:** the page background is the Library hall's wall colour (parchment). Everything else
  is from the Library's palette: paper for card insides, the darkest wood for outlines and pixel
  shadows, brass for the card heading tabs and the Match label, teal for the thin inner frame,
  green for Visit <name>'s room and the Match bar's fill, wood brown for Follow, and the Library's
  rug red for Message (the Library has no pink, so the wireframe's pink becomes the rug red).
  The page reads the Library's palette rather than copying the values, so the two stay in step.
- **Genre colours:** each genre's colour comes from the Library's bookcase of that genre (the first
  colour its books are drawn in). Fantasy, Mystery, Romance, Sci-Fi, History and Classics map to
  the bookcase of the same name; any other genre uses a neutral wood colour. One small lookup
  (genre to colour) is shared by the chips and the pixel books. Chip text is white or dark by
  contrast with the chip colour.
- **Pixel style, following the house:** pictures are drawn with the same drawing helpers and
  1 px outline as the house and town art, scaled by whole numbers and shown with hard pixel edges.
  UI frames copy the house's look: square corners, solid dark outlines, hard offset shadows with no
  blur, and the house's small uppercase, letter-spaced labels for headings and buttons. No new font
  is added; the house's title and body fonts are used.
- **The character:** the reader's look is the same one the town gives them (the demo look made from
  their id, which the town's friends list already uses). That lookup is shared so the profile and
  the town can't disagree. It's drawn with the shared live character component, standing on a
  small sky and grass backdrop, still with reduced motion.
- **Pixel books:** a small book sprite (cover, spine band, label) drawn in the genre colour, shared
  by Currently Reading and Books You Both Have. Decorative: the title next to it says what it is.
- **Data:** no new data or API. The page keeps using the Cafe's demo people service: the reader,
  the match percentage, the currently reading book, shared genres, shared books, and follow state.
  The handle line is `@username · neighbourhood`, with the "(demo)" suffix dropped from the
  neighbourhood on this page.
- **Match bar:** a progress bar with the percentage as its value, labelled "Reading match", with
  the number shown beside it.
- **Follow:** a toggle button (pressed when following) showing "Follow" or "Following". Errors
  from saving the follow show in an alert under the buttons, as now.
- **Message:** opens the existing reader chat in a pixel-framed dialog titled "Message <first
  name>". The chat itself is unchanged. The chat is no longer drawn inline at the bottom of the
  page.
- **What's removed:** the tagline, the full bookshelf list with status filters, and the inline
  chat are not in the wireframe. The reader's books are reached through Visit <name>'s room and
  its shelf page; the chat through Message. The empty state of Books You Both Have links to their
  room's shelf.
- **Back to Discover** goes where the old back link went (the Cafe, where readers are found).
- **Layout:** one column, at most about 420 px wide, centred, with 16 px side gutters on phones.

## Testing Decisions

- **Seam:** one, the page in the browser, through Playwright end-to-end tests that use labelled
  buttons, headings and visible text, as the rest of the house and Cafe tests do. No unit tests: the
  repo's test runner is Playwright only, and the page has no logic of its own beyond showing the
  demo service's data.
- **A good test** checks what a reader sees and can do (headings, text, the Match value, where a
  button goes, what's pressed), never class names, colours as numbers or component structure. A
  colour check, if any, asks only that a shared genre's chip and its book look the same colour.
- **New spec file** for the profile journey: the reader card (name heading, handle, Match bar
  value); Visit <name>'s room goes to their room and back; Follow toggles to Following and stays
  after a reload; Message opens the chat dialog, closes with Escape and returns focus; Currently
  Reading shows title, author and genre, and the empty state for a reader reading nothing; Reading
  Prefs shows the chips, stars the shared genres and the "N in common" line; Books You Both Have
  lists the shared books and its empty state; an unknown reader shows the not-found message; at
  360 px wide nothing scrolls sideways.
- **Prior art:** the visit-room spec's "a reader's profile in the Cafe has a button into their
  room" test (heading "Emma Tan", link "Visit Emma's room"), which must keep passing; the furniture
  and salon specs for checking pixel pictures load crisp.

## Out of Scope

- Real accounts: the profile still shows the Cafe's sample readers; following and chat stay in the
  browser.
- Changes to the chat itself, the Cafe's reader list, or the room the Visit button opens.
- A pixel font, or changing the house's or Library's own colours.
- The reader's own profile in the Salon.
- A dark navy background as in the wireframe: the page uses the Library wall colour instead.

## Further Notes

- **Ownership:** the profile page was built for the Cafe (Emiley's part) and sits in the shared
  views folder. Agree with the Cafe's owner before starting; the change should go through a pull
  request they review. Sharing the town's demo look and the Library's palette touches the town and
  the Library, so their owners should see the PR too.
- **AI use:** record the work in AI_USAGE.md and add the top-of-file comment to new files.
- **To confirm with the team:** dropping the bookshelf list and inline chat from the page, and the
  rug red for Message in place of the wireframe's pink.
