// In-memory shelf served when Supabase is not configured. Resets whenever the server restarts.
// With GOOGLE_BOOKS_API_KEY it is 20 books picked at random from Google Books; without the key,
// or when Google cannot be reached, it is the 16 written-out books below, so the app is still
// demoable without keys.
// The random pick is kept in server/data/demoShelf.cache.json, because building it takes many
// slow API calls: every restart starts from the same 20 books. Delete the file for a new pick.
import { searchGoogleBooks } from "./books.js";
import { readCache, writeCache } from "./cacheFile.js";
import { env } from "./env.js";

function book(n, title, author, genre, pageCount, averageRating, status, progress, description) {
  return {
    id: `demo-shelf-${n}`,
    googleBooksId: `demo-shelf-${n}`,
    title,
    authors: [author],
    coverUrl: "",
    description,
    genres: [genre],
    publisher: "",
    publishedDate: "",
    isbn: "",
    averageRating,
    pageCount,
    status,
    progress,
    updatedAt: new Date(Date.UTC(2026, 0, 1) + n * 86400000).toISOString()
  };
}

const offlineShelf = [
  book(1, "Norwegian Wood", "Haruki Murakami", "Fiction", 296, 4.0, "reading", 42, "A student in 1960s Tokyo is pulled between two very different women while grieving a friend."),
  book(2, "The Hobbit", "J.R.R. Tolkien", "Fantasy", 310, 4.3, "want_to_read", 0, "A comfort-loving hobbit is swept into a quest to win back a dragon's hoard."),
  book(3, "Circe", "Madeline Miller", "Fantasy", 393, 4.2, "want_to_read", 0, "The exiled witch of the Odyssey tells her own story of gods, monsters and mortals."),
  book(4, "The Name of the Wind", "Patrick Rothfuss", "Fantasy", 662, 4.5, "want_to_read", 0, "An innkeeper with a hidden past recounts how he became a legend."),
  book(5, "Piranesi", "Susanna Clarke", "Fantasy", 245, 4.2, "want_to_read", 0, "A man lives alone in an endless house of statues and tides, and starts to doubt what he knows."),
  book(6, "A Wizard of Earthsea", "Ursula K. Le Guin", "Fantasy", 183, 4.0, "want_to_read", 0, "A gifted, proud young wizard unleashes a shadow he must hunt across the sea."),
  book(7, "Pride and Prejudice", "Jane Austen", "Classics", 279, 4.3, "read", 100, "Elizabeth Bennet spars with the proud Mr Darcy in a comedy of manners and misjudgement."),
  book(8, "Jane Eyre", "Charlotte Brontë", "Classics", 532, 4.1, "read", 100, "An orphaned governess falls for her employer and discovers the secret in his house."),
  book(9, "The Great Gatsby", "F. Scott Fitzgerald", "Classics", 180, 3.9, "read", 100, "A mysterious millionaire throws lavish parties in pursuit of a lost love."),
  book(10, "Frankenstein", "Mary Shelley", "Classics", 280, 3.9, "read", 100, "A young scientist creates life and is haunted by what he abandons."),
  book(11, "Little Women", "Louisa May Alcott", "Classics", 449, 4.1, "read", 100, "Four sisters grow up, quarrel and find their own paths in Civil War New England."),
  book(12, "Persuasion", "Jane Austen", "Romance", 249, 4.1, "read", 100, "Eight years after being persuaded to refuse him, Anne Elliot meets Captain Wentworth again."),
  book(13, "Normal People", "Sally Rooney", "Romance", 266, 3.8, "read", 100, "Two classmates from a small Irish town drift in and out of each other's lives."),
  book(14, "The Night Circus", "Erin Morgenstern", "Romance", 387, 4.0, "read", 100, "Two young magicians are bound into a duel staged inside a circus that only opens at night."),
  book(15, "Dune", "Frank Herbert", "Science Fiction", 612, 4.3, "want_to_read", 0, "A noble heir is cast into the desert of the only planet that produces the spice."),
  book(16, "Gone Girl", "Gillian Flynn", "Mystery", 415, 4.1, "read", 100, "A wife vanishes on her anniversary and her husband becomes the prime suspect.")
];

// Kept so a book taken off the shelf can still be opened, and put back as itself.
const originals = new Map(offlineShelf.map((item) => [item.id, structuredClone(item)]));

// The random shelf is drawn from these authors' books: a search by author name gives far better
// results than a search by genre, which mostly returns books about books.
const AUTHORS = [
  "Haruki Murakami", "Jane Austen", "J.R.R. Tolkien", "Madeline Miller", "Ursula K. Le Guin",
  "Agatha Christie", "Sally Rooney", "Frank Herbert", "Kazuo Ishiguro", "Neil Gaiman",
  "Donna Tartt", "George Orwell", "Terry Pratchett", "Celeste Ng", "Stephen King",
  "Margaret Atwood", "Susanna Clarke", "Brandon Sanderson", "Charlotte Bronte", "Khaled Hosseini",
  "Erin Morgenstern", "Ann Patchett", "Gabriel Garcia Marquez", "Emily St. John Mandel"
];
const SHELF_SIZE = 20;
const PER_AUTHOR = 3;
// authors asked at once; more are asked only if these do not fill the shelf
const BATCH = 10;
// fewer books than this from Google and the written-out shelf is used instead
const MIN_BOOKS = 5;
const MAX_PAGES = 1400;
const NOT_A_NOVEL =
  /\b(complete|collected|collection|works|omnibus|box(ed)? set|set of|best of|graphic novel|volumes?|vol|novella|companion|guide|letters|conversations)\b/i;

function shuffle(list) {
  const items = [...list];
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

// "Dune (Movie Tie-In)" and "Dune: Deluxe Edition" are the same book as "Dune"
const titleKey = (title) => title.split(/[:(]/)[0].toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// The author's novels that can stand on the shelf: in English, with a cover, a description and
// a page count (the page count sets how thick the spine is drawn).
async function booksBy(author) {
  const surname = author.split(" ").at(-1).toLowerCase();

  try {
    const found = await searchGoogleBooks(author, { maxResults: 20, language: "en" });
    return found.filter(
      (item) =>
        item.authors.some((name) => name.toLowerCase().includes(surname)) &&
        item.language === "en" &&
        item.coverUrl &&
        item.description &&
        item.pageCount >= 80 &&
        item.pageCount <= MAX_PAGES &&
        item.genres.some((genre) => /fiction/i.test(genre)) &&
        !NOT_A_NOVEL.test(item.title) &&
        // a title that names its own author is usually a study edition
        !item.title.toLowerCase().includes(surname)
    );
  } catch {
    return [];
  }
}

async function randomShelf() {
  const authors = shuffle(AUTHORS);
  const seen = new Set();
  const picked = [];

  for (let start = 0; start < authors.length && picked.length < SHELF_SIZE; start += BATCH) {
    const results = await Promise.all(authors.slice(start, start + BATCH).map(booksBy));

    for (const found of results) {
      let taken = 0;
      for (const item of shuffle(found)) {
        const key = titleKey(item.title);
        if (taken === PER_AUTHOR || seen.has(key)) continue;
        seen.add(key);
        picked.push(item);
        taken += 1;
      }
    }
  }

  // one book being read, some waiting, the rest finished
  return shuffle(picked)
    .slice(0, SHELF_SIZE)
    .map((item, index) => ({
      ...item,
      status: index === 0 ? "reading" : index < 9 ? "want_to_read" : "read",
      progress: index === 0 ? 20 + Math.floor(Math.random() * 50) : index < 9 ? 0 : 100,
      updatedAt: new Date(Date.now() - index * 86400000).toISOString()
    }));
}

async function buildShelf() {
  if (env.GOOGLE_BOOKS_API_KEY) {
    const cached = readCache("demoShelf");
    if (Array.isArray(cached) && cached.length >= MIN_BOOKS) return cached;

    const books = await randomShelf();
    // a short shelf (Google was failing) is used for this run but not kept
    if (books.length === SHELF_SIZE) writeCache("demoShelf", books);
    if (books.length >= MIN_BOOKS) return books;
    console.warn("Google Books gave too few books for the demo shelf; using the built-in one.");
  }
  return offlineShelf;
}

let shelf = null;
let building = null;

// The shelf itself, not a copy: the routes add to it, remove from it and edit its books.
// It is loaded the first time it is asked for, so a server restart alone costs no API calls.
export async function getDemoShelf() {
  if (!shelf) {
    building ??= buildShelf();
    shelf = await building;
    for (const item of shelf) {
      if (!originals.has(item.id)) originals.set(item.id, structuredClone(item));
    }
  }
  return shelf;
}

export function findDemoBook(id) {
  return (shelf || offlineShelf).find((item) => item.id === id);
}

// Details for a demo book whether or not it is on the shelf right now.
export function demoBookDetails(id) {
  const live = findDemoBook(id);
  if (live) return live;
  const saved = originals.get(id);
  return saved ? structuredClone(saved) : null;
}
