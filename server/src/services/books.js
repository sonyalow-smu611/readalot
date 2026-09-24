import { env } from "./env.js";

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

export async function getGoogleBook(id) {
  if (id.startsWith("demo-")) return fallbackBooks[0];

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
