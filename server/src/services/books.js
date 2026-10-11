import { findDemoBook } from "./demoShelf.js";
import { env } from "./env.js";
import { findWork, workToBook } from "./works.js";

const fallbackBooks = [
  {
    id: "demo-1",
    googleBooksId: "demo-1",
    title: "The Reading Room",
    authors: ["Readalot Team"],
    coverUrl: "",
    description: "A placeholder book returned until Google Books is configured.",
    genres: ["Fiction"],
    publisher: "Readalot",
    publishedDate: "2026",
    isbn: "",
    averageRating: 4
  }
];

// Search results by query, kept in memory until the server restarts. Once a shelf has loaded,
// it keeps working through Google outages and does not use up the daily quota again.
const searchCache = new Map();
const SEARCH_CACHE_LIMIT = 200;

// Every book a search has returned, by id. Saving a book found on Discover then needs no
// second Google call, which could fail during an outage and shelve the placeholder instead.
const seenBooks = new Map();
const SEEN_BOOKS_LIMIT = 2000;

// Google Books returns at most 40 results per request.
export const MAX_SEARCH_RESULTS = 40;

// Map keeps insertion order, so the first key is the oldest entry.
function remember(cache, key, value, limit) {
  if (cache.size >= limit) cache.delete(cache.keys().next().value);
  cache.set(key, value);
}

// Google Books sometimes answers 503 "temporarily unavailable"; a short pause and a retry
// usually gets through. Only server errors (5xx) are retried, not quota (429) or bad requests.
const RETRY_DELAYS_MS = [400, 1000];

async function fetchWithRetry(url) {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(url, { signal: AbortSignal.timeout(6000) });
    const lastTry = attempt === RETRY_DELAYS_MS.length;
    if (response.status < 500 || lastTry) return response;
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
  }
}

export async function searchGoogleBooks(query, maxResults = 12) {
  if (!query) return [];

  // the count is part of the key: a 12-book shelf and the 24-book genre page are different searches
  const cacheKey = `${maxResults}:${query.trim().toLowerCase()}`;
  if (searchCache.has(cacheKey)) return searchCache.get(cacheKey);

  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.set("q", query);
  url.searchParams.set("maxResults", String(maxResults));

  if (env.GOOGLE_BOOKS_API_KEY) {
    url.searchParams.set("key", env.GOOGLE_BOOKS_API_KEY);
  }

  let response;
  try {
    response = await fetchWithRetry(url);
  } catch {
    return fallbackBooks; // timed out or network down
  }
  if (!response.ok) return fallbackBooks;

  const data = await response.json();
  const books = (data.items || []).map(toBook);

  // only cache real results, so a failed or empty search is tried again next time
  if (books.length) {
    remember(searchCache, cacheKey, books, SEARCH_CACHE_LIMIT);
    books.forEach((book) => remember(seenBooks, book.id, book, SEEN_BOOKS_LIMIT));
  }
  return books;
}


// The best Google Books match for a known title and author, or null if there is none
// (no match, quota used up, network down).
export async function findGoogleBook(title, author) {
  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.set("q", `intitle:"${title}" inauthor:"${author}"`);
  url.searchParams.set("maxResults", "1");

  if (env.GOOGLE_BOOKS_API_KEY) {
    url.searchParams.set("key", env.GOOGLE_BOOKS_API_KEY);
  }

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!response.ok) return null;

    const [item] = (await response.json()).items || [];
    return item ? toBook(item) : null;
  } catch {
    return null;
  }
}

export async function getGoogleBook(id) {
  if (id.startsWith("demo-")) return findDemoBook(id) || fallbackBooks[0];
  // a recommended work that had no Google Books match keeps its own id
  if (id.startsWith("work-")) {
    const work = findWork(id);
    return work ? workToBook(work) : fallbackBooks[0];
  }

  if (seenBooks.has(id)) return seenBooks.get(id);

  const url = new URL(`https://www.googleapis.com/books/v1/volumes/${id}`);
  if (env.GOOGLE_BOOKS_API_KEY) {
    url.searchParams.set("key", env.GOOGLE_BOOKS_API_KEY);
  }

  let response;
  try {
    response = await fetchWithRetry(url);
  } catch {
    return fallbackBooks[0]; // timed out or network down
  }
  if (!response.ok) return fallbackBooks[0];

  const book = toBook(await response.json());
  remember(seenBooks, book.id, book, SEEN_BOOKS_LIMIT);
  return book;
}

export function toBook(item) {
  const info = item.volumeInfo || {};
  const identifiers = info.industryIdentifiers || [];

  return {
    id: item.id,
    googleBooksId: item.id,
    title: info.title || "Untitled",
    authors: info.authors || [],
    coverUrl: info.imageLinks?.thumbnail || "",
    description: info.description || "",
    genres: info.categories || [],
    publisher: info.publisher || "",
    publishedDate: info.publishedDate || "",
    isbn: identifiers[0]?.identifier || "",
    averageRating: info.averageRating || 0,
    // for sorting the genre shelf: popularity and length
    ratingsCount: info.ratingsCount || 0,
    pageCount: info.pageCount || 0
  };
}
