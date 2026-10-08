import { Router } from "express";
import { findGoogleBook } from "../services/books.js";
import { getRandomQuote } from "../services/quotes.js";
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

    const category = categories[Math.floor(Math.random() * categories.length)];

    // Best match first: a quote from this book in the mood's category, then any quote from
    // the book, then the line kept with the book in the list.
    const [book, inCategory] = await Promise.all([
      findGoogleBook(work.title, work.author),
      getRandomQuote({ work: work.title, category })
    ]);
    const quote = inCategory || (await getRandomQuote({ work: work.title }));

    res.json({
      mood,
      // only named when the quote really is from that category
      category: inCategory ? category : null,
      workId: work.id,
      book: book || workToBook(work),
      quote: quote
        ? { ...quote, author: quote.author || work.author, work: work.title }
        : { quoteText: work.quote, author: work.author, work: work.title, categories: [] }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
