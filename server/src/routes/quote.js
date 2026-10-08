import { Router } from "express";
import { getDailyQuote } from "../services/dailyQuote.js";

const router = Router();

// GET /api/quote/today -> { quoteText, author, topic }
// `author` is empty for quotes from the dataset, which does not record who said them.
router.get("/today", (req, res) => {
  const quote = getDailyQuote();

  res.json(
    quote
      ? { quoteText: quote.quoteText, author: "", topic: quote.topic }
      : // the quote list has not been built (see scripts/importQuotes.js)
        { quoteText: "A room without books is like a body without a soul.", author: "Cicero", topic: "books" }
  );
});

export default router;
