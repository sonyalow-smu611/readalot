// The works a mood recommendation can pick from: server/data/works.json.
// Each entry: { id, title, author, genres, pageCount, description, moods, quote }.
//   moods  which moods the work suits (calm, low, stressed, excited); none = any mood
//   quote  shown when the quotes API has no key, is down, or has nothing for the work
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const works = JSON.parse(readFileSync(fileURLToPath(new URL("../../data/works.json", import.meta.url)), "utf8"));

export function findWork(id) {
  return works.find((work) => work.id === id);
}

// A random work for the mood. `exclude` is the id shown last, so "another" never repeats it.
export function pickWork(mood, exclude) {
  const others = works.filter((work) => work.id !== exclude);
  const suited = others.filter((work) => work.moods?.includes(mood));
  const pool = suited.length ? suited : others.length ? others : works;
  return pool[Math.floor(Math.random() * pool.length)] || null;
}

// The work in the app's Book shape, for when Google Books has no match for it.
export function workToBook(work) {
  return {
    id: work.id,
    googleBooksId: "",
    title: work.title,
    authors: [work.author],
    coverUrl: "",
    description: work.description || "",
    genres: work.genres || [],
    publisher: "",
    publishedDate: "",
    isbn: "",
    averageRating: 0,
    pageCount: work.pageCount || 0
  };
}
