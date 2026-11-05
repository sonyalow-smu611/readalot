// Scaffolded with AI assistance — see AI_USAGE.md
// The walkthrough: the reader's own character floats round the app and shows them every part of it,
// in order: the town, their house, the library, the cafe (where they make friends with Pip, the
// neighbour), the salon, and back to town. It plays once after Welcome, and the salon replays it.
// GuideTour.vue plays these steps. There are two kinds:
//
//   explain  the screen greys out and holds still, the character hops to each thing in `stops`
//            (one short line each, one after another) and a shape the exact outline of the thing
//            is lit. The reader reads, then presses Next.
//   try      the screen stays clear and the pointer shows what to do. Only the thing it points at
//            works (plus anything in `allow`). The reader does it themselves, and the walkthrough
//            carries on the moment they have. Nothing is done for them.
//
// A step:
//   id, section   its name, and the part of the app it's in ("Skip this part" jumps past it)
//   to            the page it's on: the walkthrough goes there first (null: wherever the reader is)
//   focus         a place id in town/places.js: the town's camera glides to it (TownView)
//   kind          'explain' (the default) or 'try'
//   say           what the character says
//   stops         explain: [{ target, say }]: what to light, one after the other. A step with
//                 just `target` and `say` is one stop; no target is a greyed screen with no outline
//   target        try: what to circle (a CSS selector)
//   ask           try: what to do, in bold
//   hint          try: 'tap', 'slide' or 'drag', the pointer's motion (default: from `until`)
//   hintTo        try: where a drag ends (a selector); the pointer carries the thing there
//   allow         try: more selectors that work as well as the target (a card that opens)
//   until         try: what counts as doing it:
//                   'tap'                 tapping the target
//                   'slide'               sliding along the whole of the target (a swipe, if it has
//                                         nothing to scroll)
//                   'book-moved'          a book moved to another shelf
//                   { tap: selector }     tapping that
//                   /pattern/             reaching a page whose address matches
//                   'dialog-closed'       a pop-up dialog opening and the reader closing it again
//
// Targets are marked in the app with data-tour="…" (or data-tour-spot for a place on the map). An
// element with data-tour-mask="…" is outlined by the shape of its picture, not its box.

const t = (name) => `[data-tour="${name}"]`
const PIP = '[aria-label^="Walk to Pip"]'

const RAW = [
  // --- The town ------------------------------------------------------------------------------------
  {
    id: 'hello',
    section: 'Town',
    to: '/',
    say: "Hi, it's you! I'm your character in IKDA Town. Let me show you round everything.",
  },
  {
    id: 'hud',
    section: 'Town',
    to: '/',
    stops: [
      { target: t('town-weather'), say: "The weather: the town's sky follows the real weather where you are." },
      { target: t('town-badge'), say: 'You! The number is your level, the ring fills with XP, and the coin is your coins.' },
      { target: t('town-daily'), say: 'Daily tasks: finish three a day to claim coins and XP, and keep your streak going.' },
      { target: t('town-places'), say: 'Places lists every building, so you can go straight to one.' },
      { target: t('town-friends'), say: "Friends: see who's online, answer requests, and add someone by username." },
      { target: t('town-bell'), say: 'The bell: friend requests, friends coming online and readers visiting your room.' },
      { target: t('town-privacy'), say: 'Private or Public. Public lists you in the cafe and shows your rough area, never your exact spot.' },
    ],
  },
  {
    id: 'map',
    section: 'Town',
    to: '/',
    target: t('town-zoom'),
    say: 'Drag the map to look around and tap the ground to walk there. Zoom here, and the target keeps the camera on you.',
  },
  {
    id: 'to-house',
    section: 'Town',
    to: '/',
    kind: 'try',
    focus: 'house',
    target: '[data-tour-spot="house"]',
    allow: ['[role="dialog"]'],
    say: 'This blue house is yours.',
    ask: 'Tap your house, then go in.',
    hint: 'tap',
    until: /^\/house$/,
  },

  // --- Your house -----------------------------------------------------------------------------------
  {
    id: 'room',
    section: 'Your house',
    to: '/house',
    kind: 'try',
    target: t('room'),
    say: 'Welcome to My Room! Everything in it does something.',
    ask: 'Slide all the way along to look round the room.',
    until: 'slide',
  },
  {
    id: 'room-things',
    section: 'Your house',
    to: '/house',
    stops: [
      { target: t('window'), say: 'The window shows the live weather: sun, rain, clouds, or the moon at night.' },
      { target: t('clock'), say: 'The clock keeps the real time.' },
      { target: t('quote'), say: 'Your corkboard: the Quote of the Day, and the notes friends leave when they visit.' },
      { target: t('chair'), say: "The book on the table is what you're reading now. Tap it to see your progress." },
    ],
  },
  {
    id: 'menu',
    section: 'Your house',
    to: '/house',
    kind: 'try',
    target: t('menu'),
    say: 'The room menu.',
    ask: 'Tap it to open it.',
    until: 'tap',
  },
  {
    id: 'menu-items',
    section: 'Your house',
    to: '/house',
    stops: [
      { target: t('menu-mood'), say: "Mood check-in: tell me how you feel and I'll find a book and a quote to match." },
      { target: t('menu-inventory'), say: 'What you buy goes in your Inventory. Drag a piece into the room: friends who visit see it too.' },
      { target: t('menu-shop'), say: 'The Shop sells chairs, plants, posters, lamps, even cats, for your coins.' },
      { target: t('credits'), say: 'Your coins, to spend in the Shop.' },
    ],
  },
  {
    id: 'to-library',
    section: 'Your house',
    to: '/',
    kind: 'try',
    focus: 'library',
    target: '[data-tour-spot="library"]',
    allow: ['[role="dialog"]'],
    say: 'Next door: the library, for finding books.',
    ask: 'Tap the library, then go in.',
    hint: 'tap',
    until: /^\/library/,
  },

  // --- The library ---------------------------------------------------------------------------------
  {
    id: 'hall',
    section: 'Library',
    to: '/library',
    kind: 'try',
    target: t('library-hall'),
    say: 'The library is one long hall.',
    ask: 'Slide all the way along to see the whole collection.',
    until: 'slide',
  },
  {
    id: 'hall-things',
    section: 'Library',
    to: '/library',
    stops: [
      { target: t('library-genre'), say: 'Every bookcase is a genre: Romance, Fantasy, Mystery, Sci-Fi and more. Tap one to browse.' },
      { target: t('library-bestsellers'), say: "This week's bestsellers, fresh from the charts." },
      { target: t('library-scanner'), say: 'Holding a book? The scanner reads its cover with your camera (or a photo) and finds it.' },
      { target: t('library-places'), say: 'Places slides the hall straight to the desk, the scanner or any bookcase.' },
    ],
  },
  {
    id: 'desk',
    section: 'Library',
    to: '/library',
    kind: 'try',
    target: t('library-desk'),
    say: 'The help desk finds any book by its title or author.',
    ask: 'Tap the help desk.',
    until: 'tap',
  },
  {
    id: 'search',
    section: 'Library',
    to: '/library',
    kind: 'try',
    target: t('discover-search'),
    allow: ['.library__bar'],
    say: 'Look up a book you love, like The Hobbit.',
    ask: 'Type it in and press Search.',
    hint: 'tap',
    until: /^\/search/,
  },
  {
    id: 'results',
    section: 'Library',
    to: null,
    kind: 'try',
    target: t('search-results'),
    say: 'Here are the books that match.',
    ask: 'Tap a book to open it.',
    hint: 'tap',
    until: { tap: `${t('search-results')} button` },
  },
  {
    id: 'book',
    section: 'Library',
    to: null,
    stops: [
      { target: '.preview__meta', say: "A book's cover, its rating and a short summary." },
      { target: t('book-where'), say: 'Where to get it: shops to buy it from, and libraries to borrow it.' },
      { target: t('book-reviews'), say: 'What other readers think of it. Open the full page to rate it and write your own review: reviews earn XP.' },
    ],
  },
  {
    id: 'add-book',
    section: 'Library',
    to: null,
    kind: 'try',
    target: t('book-add'),
    say: 'Add to To be read puts it on your shelf at home.',
    ask: 'Add it to your shelf.',
    until: 'tap',
  },
  {
    id: 'shelves',
    section: 'Your shelf',
    to: '/house/shelf',
    stops: [
      { target: '[data-shelf="want_to_read"]', say: 'Your shelf at home. To be read holds the books you want to read: your new one is here.' },
      { target: '[data-shelf="reading"]', say: "Currently reading: the book you're in the middle of. Starting a book earns 20 XP." },
      { target: '[data-shelf="read"]', say: 'Finished reading: the books you have read. Finishing a book earns 100 XP!' },
    ],
  },
  {
    id: 'shelf-drag',
    section: 'Your shelf',
    to: '/house/shelf',
    kind: 'try',
    target: '[data-shelf="want_to_read"] button',
    allow: ['[data-shelf]'],
    say: 'Moving a book between shelves saves it.',
    ask: 'Drag your new book onto Currently reading.',
    hintTo: '[data-shelf="reading"]',
    until: 'book-moved',
  },
  {
    id: 'shelf-done',
    section: 'Your shelf',
    to: '/house/shelf',
    stops: [{ target: '[data-shelf="reading"]', say: "It's on your Reading shelf now! Tap any book to rate it, read about it or take it off." }],
  },
  {
    id: 'to-cafe',
    section: 'Library',
    to: '/',
    kind: 'try',
    focus: 'cafe',
    target: '[data-tour-spot="cafe"]',
    allow: ['[role="dialog"]'],
    say: 'Now the cafe, where readers meet.',
    ask: 'Tap the cafe, then go in.',
    hint: 'tap',
    until: /^\/cafe$/,
  },

  // --- The cafe and friends -------------------------------------------------------------------------
  {
    id: 'cafe',
    section: 'Cafe',
    to: '/cafe',
    say: 'Readers sit at the tables, and each shows how well your books and genres match theirs.',
  },
  {
    id: 'meet-pip',
    section: 'Cafe',
    to: '/cafe',
    kind: 'try',
    target: PIP,
    say: "That's Pip, the town librarian and your neighbour.",
    ask: 'Tap Pip to walk over and say hi.',
    until: 'tap',
  },
  {
    id: 'pip-profile',
    section: 'Cafe',
    to: null,
    stops: [{ target: t('reader-profile'), say: "A reader's profile: their favourite genres, what they're reading, and the books you share." }],
  },
  {
    id: 'add-pip',
    section: 'Cafe',
    to: null,
    kind: 'try',
    target: t('reader-add'),
    say: "Friends get a house in your town, and you see when they're online.",
    ask: 'Send Pip a friend request.',
    until: 'tap',
  },
  {
    id: 'message-pip',
    section: 'Cafe',
    to: null,
    kind: 'try',
    target: t('reader-message'),
    say: 'Pip said yes! Messages are private between the two of you, and Pip writes back.',
    ask: 'Tap Message, send Pip a hello, then close the chat.',
    until: 'dialog-closed',
  },
  {
    id: 'visit-pip',
    section: 'Cafe',
    to: null,
    kind: 'try',
    target: t('reader-visit'),
    say: "You can visit any reader's room.",
    ask: "Visit Pip's room.",
    until: /\/room$/,
  },
  {
    id: 'pip-room',
    section: 'Cafe',
    to: null,
    stops: [{ target: t('quote'), say: "Pip's room! Tap the corkboard to leave them a note. Pip already pinned a welcome note on yours." }],
  },
  {
    id: 'friend-house',
    section: 'Cafe',
    to: '/',
    target: t('town-friends'),
    say: 'Back in town, Pip has a house now. Friends who are online walk around: tap one to chat or visit. Your chats wait in boxes by the zoom buttons.',
  },

  // --- The salon -----------------------------------------------------------------------------------
  {
    id: 'to-salon',
    section: 'Salon',
    to: '/',
    kind: 'try',
    focus: 'salon',
    target: '[data-tour-spot="salon"]',
    allow: ['[role="dialog"]'],
    say: 'Last stop: the hair salon, for your look and your profile.',
    ask: 'Tap the salon, then go in.',
    hint: 'tap',
    until: /^\/salon$/,
  },
  {
    id: 'studio',
    section: 'Salon',
    to: '/salon',
    target: t('salon-studio'),
    say: "Restyle me here: hair, outfit, colours and extras. Pieces with a lock cost coins. Save look when you're happy.",
  },
  {
    id: 'profile-tab',
    section: 'Salon',
    to: '/salon',
    kind: 'try',
    target: t('salon-profile-tab'),
    say: 'Your profile lives on the other tab.',
    ask: 'Tap Profile.',
    until: 'tap',
  },
  {
    id: 'profile-cards',
    section: 'Salon',
    to: '/salon',
    stops: [
      { target: t('profile-edit'), say: 'Your card: books reading, to read and finished. Edit changes your name, details and genres.' },
      { target: t('profile-level'), say: 'Your level, and every way to earn XP.' },
      { target: t('profile-shop'), say: 'Your coins, and a shortcut to the Shop.' },
      { target: t('profile-map'), say: 'Switch between public and private any time.' },
      { target: t('profile-quotes'), say: 'Quotes you saved from your mood check-ins are kept here.' },
      { target: t('profile-replay'), say: 'Want this tour again? Replay it from here. Log out is just below.' },
    ],
  },
  {
    id: 'bye',
    section: 'Salon',
    to: '/',
    say: "That's all of IKDA! Add books, make friends, and have fun reading. See you around town!",
  },
]

// Every step the same shape: a kind, and (explain) the stops to light, each with its own line.
export const WALKTHROUGH = RAW.map((step) => {
  const kind = step.kind ?? 'explain'
  const stops = kind === 'explain' ? (step.stops ?? [{ target: step.target ?? null, say: step.say }]) : []
  return { ...step, kind, stops, say: step.say ?? stops[0]?.say ?? '' }
})

// The text bar's height. The app shrinks by this while the walkthrough plays, so the bar never
// covers anything and stays in the same place on every step.
export const BAR_HEIGHT = 200
