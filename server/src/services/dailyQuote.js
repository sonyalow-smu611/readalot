// Quote of the Day: one quote from server/data/quotes.json, the same for everyone all day.
// The list is built from the "Goodreads Quotes" Kaggle dataset by scripts/importQuotes.js;
// each entry is { quoteText, topic }. The dataset has no author or book for its quotes.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const DAY_MS = 86400000;
const SINGAPORE_OFFSET_MS = 8 * 60 * 60 * 1000;
// Stepping through the list by a prime that does not divide its length visits every quote
// once before any repeats, and keeps neighbouring days on different topics.
const STEP = 7919;

function loadQuotes() {
  try {
    return JSON.parse(readFileSync(fileURLToPath(new URL("../../data/quotes.json", import.meta.url)), "utf8"));
  } catch {
    // no list built yet: the route answers with its fallback quote
    return [];
  }
}

const quotes = loadQuotes();

// Days since 1970 on the Singapore calendar, so the quote changes at midnight in Singapore
// wherever the server is hosted.
function singaporeDay(date) {
  return Math.floor((date.getTime() + SINGAPORE_OFFSET_MS) / DAY_MS);
}

export function pickDailyQuote(list, date = new Date()) {
  if (!list.length) return null;
  const step = list.length % STEP === 0 ? 1 : STEP;
  return list[(singaporeDay(date) * step) % list.length];
}

export function getDailyQuote(date = new Date()) {
  return pickDailyQuote(quotes, date);
}
