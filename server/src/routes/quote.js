import { Router } from "express";
import { getApiDailyQuote, getDailyQuote } from "../services/dailyQuote.js";

const router = Router();

const FALLBACK = {
  quoteText: "A room without books is like a body without a soul.",
  author: "Cicero",
  work: "",
  topic: "books"
};

// GET /api/quote/today -> { quoteText, author, work, topic }
// Dataset quotes have no author. api-ninjas quotes include author and work.
router.get("/today", async (req, res, next) => {
  try {
    const fromList = getDailyQuote();
    if (fromList) {
      return res.json({ quoteText: fromList.quoteText, author: "", work: "", topic: fromList.topic });
    }

    const fromApi = await getApiDailyQuote();
    res.json(
      fromApi
        ? { quoteText: fromApi.quoteText, author: fromApi.author, work: fromApi.work, topic: fromApi.topic }
        : FALLBACK
    );
  } catch (err) {
    next(err);
  }
});

export default router;
