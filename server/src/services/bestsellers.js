// Scaffolded with AI assistance — see AI_USAGE.md
// The library's Bestsellers bookcase: this week's New York Times Best Sellers (all the current
// lists, top books first), or, with no NYT key or when the NYT cannot be reached, what's trending
// this week on Open Library. Google Books' own search has no idea of "popular", so each book is
// matched to its Google Books entry by title and author (findGoogleBook): the library's preview,
// Add to To be read, the book's page and its reviews all work with Google Books ids. A book with
// no match is left out.
//
// The lists change once a week and the NYT allows few requests a day, so the answer is kept for
// six hours, in memory and in server/data/bestsellers.cache.json across restarts.
import { findGoogleBook } from "./books.js";
import { readCache, writeCache } from "./cacheFile.js";
import { env } from "./env.js";

const NYT_URL = "https://api.nytimes.com/svc/books/v3/lists/overview.json";
const OPEN_LIBRARY_URL = "https://openlibrary.org/trending/weekly.json?limit=60";
// a bookcase's worth, as the genre bookcases have
const COUNT = 24;
const FRESH_MS = 6 * 60 * 60 * 1000;
const TIMEOUT_MS = 8000;
// how many books are matched to Google Books at once, to go easy on its quota
const BATCH = 6;

// { source: "nyt" | "openlibrary", updatedAt, books }
let saved = readCache("bestsellers");

// Where the books should come from: the NYT once there is a key for it.
const preferred = () => (env.NYT_BOOKS_API_KEY ? "nyt" : "openlibrary");

// { source, updatedAt, books }: books are Google Books books, in bestseller order. Throws with a
// `status` of 502 when no list can be had and none was saved.
export async function getBestsellers() {
  const fresh = saved?.books?.length && Date.now() - saved.updatedAt < FRESH_MS && saved.source === preferred();
  if (fresh) return saved;

  const sources = preferred() === "nyt" ? ["nyt", "openlibrary"] : ["openlibrary"];
  for (const source of sources) {
    try {
      const picks = source === "nyt" ? await nytPicks() : await openLibraryPicks();
      const books = await matchToGoogle(picks);
      if (books.length) {
        saved = { source, updatedAt: Date.now(), books };
        writeCache("bestsellers", saved);
        return saved;
      }
    } catch {
      // that source failed: try the next one
    }
  }

  // nothing new could be had: last time's list is better than none
  if (saved?.books?.length) return saved;
  const error = new Error("Couldn't load the bestsellers right now.");
  error.status = 502;
  throw error;
}

async function fetchJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  return response.json();
}

// Every current NYT list's books, list by list, each book once: { title, author, cover, description }.
async function nytPicks() {
  const url = `${NYT_URL}?api-key=${encodeURIComponent(env.NYT_BOOKS_API_KEY)}`;
  const data = await fetchJson(url);
  const seen = new Set();
  const picks = [];
  for (const list of data.results?.lists ?? []) {
    for (const book of list.books ?? []) {
      const id = book.primary_isbn13 || book.title;
      if (!book.title || seen.has(id)) continue;
      seen.add(id);
      picks.push({
        title: titleCase(book.title),
        author: book.author || "",
        cover: book.book_image || "",
        description: book.description || "",
      });
    }
  }
  return picks;
}

// This week's most read and borrowed works on Open Library: { title, author, cover, description }.
async function openLibraryPicks() {
  const data = await fetchJson(OPEN_LIBRARY_URL);
  return (data.works ?? [])
    .filter((work) => work.title && work.author_name?.length)
    .map((work) => ({
      title: work.title,
      author: work.author_name[0],
      cover: work.cover_i ? `https://covers.openlibrary.org/b/id/${work.cover_i}-L.jpg` : "",
      description: "",
    }));
}

// The picks as Google Books books, in order, until there are COUNT of them. The list's own
// cover and description fill in where Google has none.
async function matchToGoogle(picks) {
  const books = [];
  const ids = new Set();
  for (let start = 0; start < picks.length && books.length < COUNT; start += BATCH) {
    const batch = picks.slice(start, start + BATCH);
    const matches = await Promise.all(batch.map((pick) => findGoogleBook(pick.title, pick.author)));
    matches.forEach((book, index) => {
      if (!book || ids.has(book.id) || books.length >= COUNT) return;
      const pick = batch[index];
      ids.add(book.id);
      books.push({ ...book, coverUrl: book.coverUrl || pick.cover, description: book.description || pick.description });
    });
  }
  return books;
}

// The NYT writes titles in capitals: "THE WOMEN" becomes "The Women".
const SMALL = new Set(["a", "an", "and", "as", "at", "but", "by", "for", "in", "of", "on", "or", "the", "to", "with"]);
function titleCase(text) {
  return text
    .toLowerCase()
    .split(" ")
    .map((word, index) => (index && SMALL.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(" ");
}
