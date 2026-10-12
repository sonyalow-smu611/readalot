// Quote of the Day: one quote, the same for everyone all day.
// It is a random quote from api-ninjas, asked for once a day and kept in memory. Without a key,
// or when the API is down, the route answers with one built-in quote.
import { getRandomQuote } from "./quotes.js";

const DAY_MS = 86400000;
const SINGAPORE_OFFSET_MS = 8 * 60 * 60 * 1000;
// The quote comes from one of these api-ninjas categories, picked at random for each request:
// the API only returns quotes that match every category it is given, so it gets one at a time.
const CATEGORIES = ["writing", "art", "happiness", "courage", "love", "humor", "philosophy", "time", "freedom", "death"];
// The API cannot filter by length, and its `safe` filter is for paying subscribers only, so
// both are checked here and another quote is asked for when one does not pass.
const MAX_LENGTH = 150;
const ATTEMPTS = 8;
const COARSE =
  /\b(fuck|shit|bitch|bastard|asshole|damn|whore|slut|sex|porn|rape|cunt|dick|cock|pussy|nigg|fag|suicid)\w*/i;

// Days since 1970 on the Singapore calendar, so the quote changes at midnight in Singapore
// wherever the server is hosted.
function singaporeDay(date) {
  return Math.floor((date.getTime() + SINGAPORE_OFFSET_MS) / DAY_MS);
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
