// Scaffolded with AI assistance — see AI_USAGE.md
// Reviews the demo readers (data/demoReaders.js) have written, served without Supabase (the e2e
// tests). Rin Sato's profile is private, so her name shows without a link to her page.
// daysAgo: how long before the server started it was posted.

export const PRIVATE_DEMO_READER = {
  id: "00000000-0000-4000-8000-000000000299",
  displayName: "Rin Sato",
  character: null
};

export const DEMO_REVIEWS = [
  { reader: "emma.reads", bookId: "demo-shelf-7", rating: 5, text: "Funnier every time I read it.", daysAgo: 3 },
  { reader: "mei.margins", bookId: "demo-shelf-7", rating: 4, text: "", daysAgo: 10 },
  { reader: PRIVATE_DEMO_READER.id, bookId: "demo-shelf-7", rating: 3, text: "Slow start, lovely ending.", daysAgo: 14 },
  { reader: "noah.bookmarks", bookId: "demo-shelf-15", rating: 5, text: "The spice must flow.", daysAgo: 30 }
];
