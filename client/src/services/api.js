import { supabase } from "./supabase.js";

async function request(path, options = {}) {
  const { data } = await supabase.auth.getSession();
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

  return response.json();
}

export function searchBooks(query) {
  return request(`/books/search?q=${encodeURIComponent(query)}`);
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

export function getCompatibility(userId) {
  return request(`/people/${userId}/compatibility`);
}

export function getNearbyStores(lat, lng) {
  return request(`/stores/nearby?lat=${lat}&lng=${lng}`);
}

export function getRecommendations(mood) {
  return request(`/recommendations?mood=${encodeURIComponent(mood)}`);
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

export function addReview(bookId, data) {
  return request(`/books/${bookId}/reviews`, {
    method: "POST",
    body: JSON.stringify(data)
  });
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
