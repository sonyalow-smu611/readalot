// api-ninjas v2 quotes, called from the server only so the key never reaches the browser.
// Docs: https://api-ninjas.com/api/quotes
import { env } from "./env.js";

const RANDOM_QUOTES_URL = "https://api.api-ninjas.com/v2/randomquotes";

// One random quote matching the filters, or null when there is none to show (no key set,
// the API is unreachable, or nothing matches). Callers decide what to fall back to.
//   work      partial match on the title of the source work
//   category  one of the API's categories, e.g. "wisdom"
export async function getRandomQuote({ work, category } = {}) {
  if (!env.API_NINJAS_KEY) return null;

  const url = new URL(RANDOM_QUOTES_URL);
  if (work) url.searchParams.set("work", work);
  if (category) url.searchParams.set("categories", category);

  try {
    const response = await fetch(url, {
      headers: { "X-Api-Key": env.API_NINJAS_KEY },
      signal: AbortSignal.timeout(6000)
    });
    if (!response.ok) return null;

    const [found] = await response.json();
    if (!found?.quote) return null;

    return {
      quoteText: found.quote,
      author: found.author || "",
      work: found.work || "",
      categories: found.categories || []
    };
  } catch {
    return null;
  }
}
