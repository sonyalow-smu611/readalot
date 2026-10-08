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

export async function searchGoogleBooks(query) {
  if (!query) return [];

  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.set("q", query);
  url.searchParams.set("maxResults", "12");

  if (env.GOOGLE_BOOKS_API_KEY) {
    url.searchParams.set("key", env.GOOGLE_BOOKS_API_KEY);
  }

  const response = await fetch(url);
  if (!response.ok) return fallbackBooks;

  const data = await response.json();
  return (data.items || []).map(toBook);
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

  const url = new URL(`https://www.googleapis.com/books/v1/volumes/${id}`);
  if (env.GOOGLE_BOOKS_API_KEY) {
    url.searchParams.set("key", env.GOOGLE_BOOKS_API_KEY);
  }

  const response = await fetch(url);
  if (!response.ok) return fallbackBooks[0];

  return toBook(await response.json());
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
    averageRating: info.averageRating || 0
  };
}
