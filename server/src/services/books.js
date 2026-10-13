import { readCache, writeCache } from "./cacheFile.js";
import { env } from "./env.js";
import { findWork, workToBook } from "./works.js";

const API_URL = "https://www.googleapis.com/books/v1";
// Google Books often answers a good request with 503, so each call is tried a few times.
const ATTEMPTS = 4;
const RETRY_DELAY_MS = 300;
const TIMEOUT_MS = 5000;

// Shown by the search route when Google Books cannot be reached, so Discover is not blank.
export const fallbackBooks = [
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
    language: "",
    averageRating: 4,
    ratingsCount: 0,
    pageCount: 0,
    buyUrl: ""
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

// One Google Books request. Throws an error with a `status` for the API's error handler when
// the book does not exist (404) or Google cannot be reached (502).
async function googleBooks(path, params = {}) {
  const url = new URL(`${API_URL}${path}`);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
  if (env.GOOGLE_BOOKS_API_KEY) url.searchParams.set("key", env.GOOGLE_BOOKS_API_KEY);

  let status = 0;
  for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
    if (attempt) await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));

    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (response.ok) return await response.json();
      status = response.status;
      // a bad key, a used-up quota or an unknown id will not get better on another try
      if (status < 500) break;
    } catch {
      status = 0;
    }
  }

  const notFound = status === 404;
  const error = new Error(notFound ? "Book not found." : "Google Books is unavailable. Try again.");
  error.status = notFound ? 404 : 502;
  throw error;
}

// Discover calls this with a result count. The demo shelf calls it with { maxResults, language }.
function searchOptions(options) {
  if (typeof options === "number") return { maxResults: options, language: "" };
  return { maxResults: options?.maxResults ?? 12, language: options?.language || "" };
}

// Plain keywords only: at the time of writing the API returns nothing for field operators
// such as intitle:, inauthor:, subject: and isbn:.
export async function searchGoogleBooks(query, options = {}) {
  const { maxResults, language } = searchOptions(options);
  if (!query) return [];

  // the count and language are part of the key: a 12-book shelf and the 24-book genre page differ
  const cacheKey = `${maxResults}:${language}:${query.trim().toLowerCase()}`;
  if (searchCache.has(cacheKey)) return searchCache.get(cacheKey);

  const params = { q: query, maxResults: String(maxResults), printType: "books" };
  if (language) params.langRestrict = language;

  const data = await googleBooks("/volumes", params);
  const books = (data.items || []).map(toBook);

  // only cache real results, so a failed or empty search is tried again next time
  if (books.length) {
    remember(searchCache, cacheKey, books, SEARCH_CACHE_LIMIT);
    books.forEach((book) => remember(seenBooks, book.id, book, SEEN_BOOKS_LIMIT));
  }
  return books;
}

const words = (text) => String(text).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

// matches already found, by "title|author", kept in server/data/googleMatches.cache.json:
// Google Books is slow and often fails, and a known title's match does not change
const matched = readCache("googleMatches") || {};

// The best Google Books match for a known title and author, or null if there is none
// (no match, quota used up, network down).
export async function findGoogleBook(title, author) {
  const key = `${words(title)}|${words(author)}`;
  if (matched[key]) return matched[key];

  try {
    const surname = words(author).split(" ").at(-1);
    const books = await searchGoogleBooks(`${title} ${author}`, { maxResults: 10 });
    const matches = books.filter(
      (book) => words(book.title).includes(words(title)) && book.authors.some((name) => words(name).includes(surname))
    );

    // an edition under the plain title, not "F. Scott Fitzgerald: The Great Gatsby", and one
    // with a cover and a description, when there is one
    const exact = matches.filter((book) => words(book.title) === words(title));
    const editions = exact.length ? exact : matches;
    const book = editions.find((item) => item.coverUrl && item.description) || editions[0] || null;

    // only a match is kept: a miss may be Google failing, and is asked for again next time
    if (book) {
      matched[key] = book;
      writeCache("googleMatches", matched);
      remember(seenBooks, book.id, book, SEEN_BOOKS_LIMIT);
    }
    return book;
  } catch {
    return null;
  }
}

export async function getGoogleBook(id) {
  // written-out demo books are not on Google Books, including ones taken off the shelf
  if (String(id).startsWith("demo-")) {
    const { demoBookDetails } = await import("./demoShelf.js");
    const book = demoBookDetails(id);
    if (book) return book;
    const error = new Error("Book not found.");
    error.status = 404;
    throw error;
  }

  // a recommended work that had no Google Books match keeps its own id
  if (String(id).startsWith("work-")) {
    const work = findWork(id);
    if (work) return workToBook(work);
    const error = new Error("Book not found.");
    error.status = 404;
    throw error;
  }

  if (seenBooks.has(id)) return seenBooks.get(id);

  const book = toBook(await googleBooks(`/volumes/${encodeURIComponent(id)}`));
  remember(seenBooks, book.id, book, SEEN_BOOKS_LIMIT);
  return book;
}

// A single volume's description is HTML; a search result's is plain text.
function plainText(html = "") {
  return html
    .replace(/<\s*br\s*\/?>|<\/p>|<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
}

// "Fiction / Fantasy / General" -> Fiction, Fantasy
function toGenres(categories = []) {
  const names = categories
    .flatMap((category) => category.split("/"))
    .map((name) => name.trim())
    .filter((name) => name && name !== "General");
  return [...new Set(names)].slice(0, 4);
}

export function toBook(item) {
  const info = item.volumeInfo || {};
  const identifiers = info.industryIdentifiers || [];
  const isbn = identifiers.find((entry) => entry.type === "ISBN_13") || identifiers.find((entry) => entry.type === "ISBN_10");

  return {
    id: item.id,
    googleBooksId: item.id,
    title: info.title || "Untitled",
    authors: info.authors || [],
    // Google sends http:// links, which an https page will not load, with a page-curl effect
    coverUrl: (info.imageLinks?.thumbnail || "").replace(/^http:/, "https:").replace("&edge=curl", ""),
    description: plainText(info.description),
    genres: toGenres(info.categories),
    publisher: info.publisher || "",
    publishedDate: info.publishedDate || "",
    isbn: isbn?.identifier || "",
    language: info.language || "",
    averageRating: info.averageRating || 0,
    // for sorting the genre shelf: popularity and length
    ratingsCount: info.ratingsCount || 0,
    pageCount: info.pageCount || 0,
    buyUrl: item.saleInfo?.buyLink || info.infoLink || ""
  };
}
