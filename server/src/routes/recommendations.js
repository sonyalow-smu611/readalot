import { Router } from "express";
import { findGoogleBook } from "../services/books.js";
import { getRandomQuote } from "../services/quotes.js";
import { getBookQuote } from "../services/wikimedia.js";
import { pickWork, workToBook } from "../services/works.js";

const router = Router();

// Each mood maps to a group of quote categories. One is used per request, because the quotes
// API only returns quotes that match every category it is given.
const MOOD_CATEGORIES = {
  calm: ["nature", "wisdom", "philosophy"],
  low: ["inspirational", "courage", "happiness"],
  stressed: ["time", "freedom", "truth"],
  excited: ["success", "humor", "art"]
};

// GET /api/recommendations?mood=calm[&exclude=<work id>]
// A book for the mood, with a quote from that book.
router.get("/", async (req, res, next) => {
  try {
    const mood = String(req.query.mood || "").toLowerCase();
    const categories = MOOD_CATEGORIES[mood];
    if (!categories) {
      return res.status(400).json({ error: "Pick a mood: calm, low, stressed or excited." });
    }

    const work = pickWork(mood, String(req.query.exclude || ""));
    if (!work) {
      return res.status(503).json({ error: "No books to recommend yet." });
    }

    const book = (await findGoogleBook(work.title, work.author)) || workToBook(work);
    const category = categories[Math.floor(Math.random() * categories.length)];

    // Best match first: a line from the book's Wikiquote page, then an api-ninjas quote from
    // the work, then the line kept with the book in the list.
    const fromWiki =
      (await getBookQuote({ title: book.title, authors: [book.authors[0], work.author] })) ||
      (book.title !== work.title && (await getBookQuote({ title: work.title, authors: [work.author] })));

    let quote = fromWiki || null;
    let usedCategory = null;
    if (!quote) {
      const inCategory = await getRandomQuote({ work: work.title, category });
      const fromApi = inCategory || (await getRandomQuote({ work: work.title }));
      if (fromApi) {
        quote = fromApi;
        usedCategory = inCategory ? category : null;
      }
    }

    res.json({
      mood,
      // only named when the quote really is from that api-ninjas category
      category: usedCategory,
      workId: work.id,
      book,
      quote: quote
        ? { ...quote, author: quote.author || work.author, work: work.title, sourceUrl: quote.sourceUrl || "" }
        : { quoteText: work.quote, author: work.author, work: work.title, sourceUrl: "", categories: [] }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
