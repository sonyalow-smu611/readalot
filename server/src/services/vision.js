// T26: Google Vision text detection on a cover image, then top Google Books match.
import { searchGoogleBooks } from "./books.js";
import { env } from "./env.js";

// Returns { detectedText, book, confidence }; book is null when the cover has no readable
// text or Google Books has no match.
export async function detectBookFromImage(imageBase64) {
  const detectedText = await detectText(imageBase64);
  if (!detectedText) return { detectedText: "", book: null, confidence: 0 };

  let book = null;
  try {
    [book] = await searchGoogleBooks(detectedText);
  } catch {
    book = null;
  }
  return {
    detectedText,
    book: book || null,
    confidence: book ? titleSimilarity(book.title, detectedText) : 0
  };
}

async function detectText(imageBase64) {
  const url = new URL("https://vision.googleapis.com/v1/images:annotate");
  url.searchParams.set("key", env.GOOGLE_CLOUD_VISION_KEY);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: [{ image: { content: imageBase64 }, features: [{ type: "TEXT_DETECTION" }] }]
    }),
    signal: AbortSignal.timeout(15000)
  });

  const data = await response.json().catch(() => ({}));
  const result = data.responses?.[0];
  const error = data.error || result?.error;
  if (!response.ok || error) {
    throw Object.assign(new Error(`Vision: ${error?.message || response.statusText}`), { status: 502 });
  }

  // Cover text arrives line by line; one line keeps the Google Books query simple. Long
  // blurbs only add noise, so the query stops at about 12 words.
  const text = result?.fullTextAnnotation?.text || "";
  return text.replace(/\s+/g, " ").trim().split(" ").slice(0, 12).join(" ");
}

// Heuristic: share of the title's words that were read off the cover. Not a real score.
function titleSimilarity(title, text) {
  const words = (value) => value.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
  const seen = new Set(words(text));
  const titleWords = words(title);
  if (!titleWords.length) return 0;
  return titleWords.filter((word) => seen.has(word)).length / titleWords.length;
}
