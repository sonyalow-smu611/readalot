import { supabase } from "./supabase.js";
import { earnXp } from "./progress.js";

async function request(path, options = {}) {
  const { data } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
  const token = data.session?.access_token;
  const headers = new Headers(options.headers);

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`/api${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Request failed");
  }

  // 204 No Content (e.g. a delete) has no body to parse
  if (response.status === 204) return null;

  return response.json();
}

// `limit` is how many results to ask for (the server's default is 12, its max 40)
export function searchBooks(query, limit) {
  const params = new URLSearchParams({ q: query });
  if (limit) params.set("limit", String(limit));
  return request(`/books/search?${params}`);
}

export function getBook(id) {
  return request(`/books/${id}`);
}

export function getUser(id) {
  return request(`/users/${id}`);
}

export function getUserBooks(id) {
  return request(`/users/${id}/books`);
}

export function getMyBooks() {
  return request("/user-books");
}

export function saveUserBook(data) {
  return request("/user-books", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export function updateReadingStatus(bookId, data) {
  return request(`/user-books/${bookId}`, {
    method: "PATCH",
    body: JSON.stringify(data)
  });
}

export function removeUserBook(bookId) {
  return request(`/user-books/${bookId}`, {
    method: "DELETE"
  });
}

export function getWeather(lat, lng) {
  return request(`/weather?lat=${lat}&lng=${lng}`);
}

export function getNearbyReaders(lat, lng) {
  return request(`/people/nearby?lat=${lat}&lng=${lng}`);
}

// Other readers with their shelves (see stores/people.js); `id` is the reader's username.
export function getReaders() {
  return request("/people");
}

export function getReader(id) {
  return request(`/people/${encodeURIComponent(id)}`);
}

export function getFollowing() {
  return request("/people/following");
}

export function setFollowing(id, follow) {
  return request(`/people/${encodeURIComponent(id)}/follow`, { method: follow ? "PUT" : "DELETE" });
}

export function getCompatibility(userId) {
  return request(`/people/${userId}/compatibility`);
}

export function getNearbyStores(lat, lng) {
  return request(`/stores/nearby?lat=${lat}&lng=${lng}`);
}

// A book for the mood with a quote from it. `exclude` is the work shown last, so asking for
// another recommendation gives a different book.
export function getRecommendations(mood, exclude = "") {
  const query = new URLSearchParams({ mood });
  if (exclude) query.set("exclude", exclude);
  return request(`/recommendations?${query}`);
}

export function scanBook(imageBase64) {
  return request("/scan-book", {
    method: "POST",
    body: JSON.stringify({ imageBase64 })
  });
}

export function getReviews(bookId) {
  return request(`/books/${bookId}/reviews`);
}

// A saved review earns XP, once per book (best effort: a failed XP call doesn't fail the review).
export async function addReview(bookId, data) {
  const saved = await request(`/books/${bookId}/reviews`, {
    method: "POST",
    body: JSON.stringify(data)
  });
  earnXp("write_review", bookId).catch(() => {});
  return saved;
}

export function getQuotes(bookId) {
  return request(`/books/${bookId}/quotes`);
}

export function addQuote(bookId, data) {
  return request(`/books/${bookId}/quotes`, {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export function getTodayQuote() {
  return request("/quote/today");
}
