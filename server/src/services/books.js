import { readCache, writeCache } from "./cacheFile.js";
import { env } from "./env.js";
import { findWork, workToBook } from "./works.js";

const API_URL = "https://www.googleapis.com/books/v1";
// Google Books often answers a good request with 503, so each call is tried a few times.
const ATTEMPTS = 4;
const RETRY_DELAY_MS = 300;
const TIMEOUT_MS = 5000;

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

// Plain keywords only: at the time of writing the API returns nothing for field operators
// such as intitle:, inauthor:, subject: and isbn:.
export async function searchGoogleBooks(query, { maxResults = 12, language = "" } = {}) {
  if (!query) return [];

  const params = { q: query, maxResults: String(maxResults), printType: "books" };
  if (language) params.langRestrict = language;

  const data = await googleBooks("/volumes", params);
  return (data.items || []).map(toBook);
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
    }
    return book;
  } catch {
    return null;
  }
}

export async function getGoogleBook(id) {
  // a recommended work that had no Google Books match keeps its own id
  if (id.startsWith("work-")) {
    const work = findWork(id);
    if (work) return workToBook(work);
  }

  return toBook(await googleBooks(`/volumes/${encodeURIComponent(id)}`));
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
    ratingsCount: info.ratingsCount || 0,
    pageCount: info.pageCount || 0,
    buyUrl: item.saleInfo?.buyLink || info.infoLink || ""
  };
}
