// Pure helpers for laying books out on shelves. No API calls here.

export const STATUSES = [
  { value: "reading", label: "Currently reading", short: "Reading" },
  { value: "want_to_read", label: "To be read", short: "Want to Read" },
  { value: "read", label: "Read", short: "Read" }
];

// [spine colour, text colour]: muted, bookish tones that sit with the room palette
const SPINE_COLOURS = [
  ["#8C4A3C", "#FFF4E6"],
  ["#3F5B52", "#F1EBDD"],
  ["#C9A45C", "#3F2E24"],
  ["#2F4156", "#F1E7DA"],
  ["#B7705A", "#FFF8EF"],
  ["#6E5A7A", "#F5EEF2"],
  ["#D8C3A5", "#3F2E24"],
  ["#5E6B3A", "#F4F0DC"],
  ["#9A7A55", "#FFFDF9"],
  ["#3F2E24", "#F1E7DA"]
];

function hash(text) {
  let value = 0;
  for (const char of String(text)) value = (value * 31 + char.charCodeAt(0)) >>> 0;
  return value;
}

// Stable look per book, so a spine keeps its colour and size wherever it is drawn.
export function spineLook(book) {
  const seed = hash(book.id);
  const [colour, ink] = SPINE_COLOURS[seed % SPINE_COLOURS.length];
  const pages = book.pageCount || 180 + (seed % 400);

  return {
    colour,
    ink,
    // 0 = slimmest, 1 = thickest
    thickness: Math.min(1, Math.max(0, (pages - 150) / 500)),
    // 0 = shortest, 1 = tallest
    height: ((seed >>> 4) % 100) / 100,
    band: (seed >>> 9) % 3
  };
}

const ROOM_ROW_LABELS = { want_to_read: "To be read", read: "Read" };

// My Room shelf rows: reading status x most common genre, at most 3 rows of 8 spines.
export function roomRows(books, maxRows = 3, perRow = 8) {
  const groups = new Map();

  for (const book of books) {
    if (!ROOM_ROW_LABELS[book.status]) continue;
    const genre = book.genres?.[0] || "Other";
    const key = `${book.status}|${genre}`;
    if (!groups.has(key)) groups.set(key, { key, status: book.status, genre, books: [] });
    groups.get(key).books.push(book);
  }

  return [...groups.values()]
    .sort((a, b) => b.books.length - a.books.length)
    .slice(0, maxRows)
    .sort((a, b) => (a.status === b.status ? 0 : a.status === "want_to_read" ? -1 : 1))
    .map((group) => ({
      ...group,
      label: `${ROOM_ROW_LABELS[group.status]} · ${group.genre}`,
      books: group.books.slice(0, perRow)
    }));
}
