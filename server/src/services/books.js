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
    authors: ["IKDA Team"],
    coverUrl: "",
    description: "A placeholder book returned until Google Books is configured.",
    genres: ["Fiction"],
    publisher: "IKDA",
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

// One test search, for /api/health?deep=1: whether a key is set, what Google answered and why it
// refused (never the key itself). It is how to tell a bad key, a used-up quota and an outage apart,
// since the search route hides all three behind the placeholder book.
export async function checkGoogleBooks() {
  const url = new URL(`${API_URL}/volumes`);
  url.searchParams.set("q", "dune");
  url.searchParams.set("maxResults", "1");
  if (env.GOOGLE_BOOKS_API_KEY) url.searchParams.set("key", env.GOOGLE_BOOKS_API_KEY);
  const started = Date.now();
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    const body = await response.json().catch(() => ({}));
    const problem = body.error;
    return {
      keySet: Boolean(env.GOOGLE_BOOKS_API_KEY),
      status: response.status,
      ok: response.ok,
      reason: problem?.errors?.[0]?.reason ?? problem?.status ?? null,
      message: problem?.message ? String(problem.message).replace(/key=[^\s&]+/g, "key=…").slice(0, 200) : null,
      ms: Date.now() - started
    };
  } catch (err) {
    return { keySet: Boolean(env.GOOGLE_BOOKS_API_KEY), status: 0, ok: false, reason: err?.name ?? "error", message: err?.message ?? null, ms: Date.now() - started };
  }
}

// ---- Open Library: the answer when Google Books cannot be had ----------------------------------
// Google Books can refuse this server (a used-up daily quota, a limit on a shared host's address, an
// outage), and then no shelf in the library loads. Open Library needs no key and has covers and
// subjects, so searches and book pages fall back to it. Its books have ids like "ol-OL45804W"
// (the "ol-" marks them, and getGoogleBook knows how to fetch one again).
const OPEN_LIBRARY = "https://openlibrary.org";
// after Google Books has failed, it is left alone this long and Open Library answers straight away,
// so a refusing Google doesn't slow every search down
const GOOGLE_RESTS_MS = 60 * 1000;
let googleRestsUntil = 0;
const OPEN_LIBRARY_TIMEOUT_MS = 8000;
const OPEN_LIBRARY_FIELDS =
  "key,title,author_name,cover_i,first_publish_year,subject,number_of_pages_median,publisher,isbn,language,ratings_average,ratings_count";

async function openLibrary(path, params = {}) {
  const url = new URL(`${OPEN_LIBRARY}${path}`);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
  const response = await fetch(url, {
    headers: { "User-Agent": "IKDA reading app (student project)", Accept: "application/json" },
    signal: AbortSignal.timeout(OPEN_LIBRARY_TIMEOUT_MS)
  });
  if (!response.ok) {
    const error = new Error(response.status === 404 ? "Book not found." : "Open Library is unavailable. Try again.");
    error.status = response.status === 404 ? 404 : 502;
    throw error;
  }
  return response.json();
}

const coverOf = (coverId) => (coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : "");

// an Open Library search result as a book, in the shape a Google Books book has
function fromOpenLibrary(doc) {
  const workId = String(doc.key || "").replace("/works/", "");
  return {
    id: `ol-${workId}`,
    googleBooksId: `ol-${workId}`,
    title: doc.title,
    authors: doc.author_name || [],
    coverUrl: coverOf(doc.cover_i),
    description: "",
    genres: (doc.subject || []).slice(0, 4),
    publisher: doc.publisher?.[0] || "",
    publishedDate: doc.first_publish_year ? String(doc.first_publish_year) : "",
    isbn: doc.isbn?.[0] || "",
    language: doc.language?.[0] || "",
    averageRating: Math.round((doc.ratings_average || 0) * 10) / 10,
    ratingsCount: doc.ratings_count || 0,
    pageCount: doc.number_of_pages_median || 0,
    buyUrl: ""
  };
}

async function searchOpenLibrary(query, maxResults) {
  const data = await openLibrary("/search.json", {
    q: query,
    limit: String(Math.min(maxResults, MAX_SEARCH_RESULTS)),
    fields: OPEN_LIBRARY_FIELDS
  });
  return (data.docs || []).filter((doc) => doc.key?.startsWith("/works/") && doc.title).map(fromOpenLibrary);
}

// One Open Library book on its own (a book's page, or saving it): the work, with its authors' names.
async function getOpenLibraryBook(id) {
  const workId = String(id).slice(3);
  if (!/^OL\d+W$/.test(workId)) {
    const error = new Error("Book not found.");
    error.status = 404;
    throw error;
  }
  const work = await openLibrary(`/works/${workId}.json`);
  // a redirect or an empty record has no title: not a book to show
  if (!work.title) {
    const error = new Error("Book not found.");
    error.status = 404;
    throw error;
  }
  const authorKeys = (work.authors || []).map((entry) => entry.author?.key).filter(Boolean).slice(0, 3);
  const names = await Promise.all(
    authorKeys.map((key) => openLibrary(`${key}.json`).then((author) => author.name).catch(() => null))
  );
  const description = typeof work.description === "string" ? work.description : work.description?.value || "";
  return {
    id,
    googleBooksId: id,
    title: work.title,
    authors: names.filter(Boolean),
    coverUrl: coverOf(work.covers?.[0]),
    description: plainText(description),
    genres: (work.subjects || []).slice(0, 4),
    publisher: "",
    publishedDate: work.first_publish_date || "",
    isbn: "",
    language: "",
    averageRating: 0,
    ratingsCount: 0,
    pageCount: 0,
    buyUrl: ""
  };
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

  let books;
  try {
    if (Date.now() < googleRestsUntil) throw new Error("Google Books is resting.");
    const data = await googleBooks("/volumes", params);
    books = (data.items || []).map(toBook);
  } catch (err) {
    // Google Books can't be had just now: Open Library answers instead, so the shelves still load
    googleRestsUntil = Date.now() + GOOGLE_RESTS_MS;
    books = await searchOpenLibrary(query, maxResults).catch(() => {
      throw err;
    });
  }

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

    // only a match is kept: a miss may be Google failing, and is asked for again next time; an Open
    // Library stand-in isn't, so the real Google Books edition is found once it is back
    if (book && !String(book.id).startsWith("ol-")) {
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

  // an Open Library book (see searchOpenLibrary), from this server's memory or from Open Library
  if (String(id).startsWith("ol-")) {
    if (seenBooks.has(id)) return seenBooks.get(id);
    const book = await getOpenLibraryBook(id);
    remember(seenBooks, book.id, book, SEEN_BOOKS_LIMIT);
    return book;
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
