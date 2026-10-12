import { Router } from "express";
import { findGoogleBook } from "../services/books.js";
import { getBookQuote } from "../services/wikimedia.js";
import { pickWork, workToBook } from "../services/works.js";

const router = Router();

const MOODS = new Set(["calm", "low", "stressed", "excited"]);

// GET /api/recommendations?mood=calm[&exclude=<work id>]
// A book for the mood, with a quote from that book.
router.get("/", async (req, res, next) => {
  try {
    const mood = String(req.query.mood || "").toLowerCase();
    if (!MOODS.has(mood)) {
      return res.status(400).json({ error: "Pick a mood: calm, low, stressed or excited." });
    }

    const work = pickWork(mood, String(req.query.exclude || ""));
    if (!work) {
      return res.status(503).json({ error: "No books to recommend yet." });
    }

    const book = (await findGoogleBook(work.title, work.author)) || workToBook(work);

    // Best match first: a quote looked up on Wikiquote under the title Google Books gives the
    // book, then under the title in our list (Google's may name an edition, "... Annotated"),
    // then the line kept with the book in the list.
    const quote =
      (await getBookQuote({ title: book.title, authors: [book.authors[0], work.author] })) ||
      (book.title !== work.title && (await getBookQuote({ title: work.title, authors: [work.author] }))) ||
      { quoteText: work.quote, sourceUrl: "" };

    res.json({
      mood,
      workId: work.id,
      book,
      quote: { ...quote, author: work.author, work: work.title }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
