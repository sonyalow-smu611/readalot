import { Router } from "express";
import { getApiDailyQuote } from "../services/dailyQuote.js";

const router = Router();

// GET /api/quote/today -> { quoteText, author, work, topic }
router.get("/today", async (req, res, next) => {
  try {
    const fromApi = await getApiDailyQuote();
    if (fromApi) {
      return res.json({
        quoteText: fromApi.quoteText,
        author: fromApi.author,
        work: fromApi.work,
        topic: fromApi.topic
      });
    }

    // no API key, or the API has no quote to give
    res.json({ quoteText: "A room without books is like a body without a soul.", author: "Cicero", work: "", topic: "books" });
  } catch (err) {
    next(err);
  }
});

export default router;
