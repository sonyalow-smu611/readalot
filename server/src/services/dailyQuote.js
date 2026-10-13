// Quote of the Day: one quote, the same for everyone all day.
// The list in server/data/quotes.json is built from the "Goodreads Quotes" Kaggle dataset by
// scripts/importQuotes.js; each entry is { quoteText, topic }. When that file has not been
// built, a random api-ninjas quote is asked for once a day and kept in memory. The route
// answers with one built-in quote when both are empty.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { getRandomQuote } from "./quotes.js";

const DAY_MS = 86400000;
const SINGAPORE_OFFSET_MS = 8 * 60 * 60 * 1000;
// Stepping through the list by a prime that does not divide its length visits every quote
// once before any repeats, and keeps neighbouring days on different topics.
const STEP = 7919;
// The quote comes from one of these api-ninjas categories, picked at random for each request:
// the API only returns quotes that match every category it is given, so it gets one at a time.
const CATEGORIES = ["writing", "art", "happiness", "courage", "love", "humor", "philosophy", "time", "freedom", "death"];
// The API cannot filter by length, and its `safe` filter is for paying subscribers only, so
// both are checked here and another quote is asked for when one does not pass.
const MAX_LENGTH = 150;
const ATTEMPTS = 8;
const COARSE =
  /\b(fuck|shit|bitch|bastard|asshole|damn|whore|slut|sex|porn|rape|cunt|dick|cock|pussy|nigg|fag|suicid)\w*/i;

function loadQuotes() {
  try {
    return JSON.parse(readFileSync(fileURLToPath(new URL("../../data/quotes.json", import.meta.url)), "utf8"));
  } catch {
    // no list built yet: the route tries api-ninjas, then its built-in quote
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

// The first of a few random quotes that is short enough and clean, or null if none is.
async function fetchRandomQuote() {
  for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
    const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const quote = await getRandomQuote({ category });
    if (!quote) return null;
    if (quote.quoteText.length <= MAX_LENGTH && !COARSE.test(quote.quoteText)) {
      return { ...quote, topic: category };
    }
  }
  return null;
}

let today = { day: null, quote: null };

// The day's quote from the API, or null when it has none to give. Only a quote that arrived is
// kept, so a failed request is tried again the next time the popup opens.
export async function getApiDailyQuote(date = new Date()) {
  const day = singaporeDay(date);

  if (today.day !== day) {
    const quote = await fetchRandomQuote();
    if (!quote) return null;
    today = { day, quote };
  }
  return today.quote;
}
