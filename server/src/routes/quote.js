import { Router } from "express";
import { env } from "../services/env.js";
import { supabase } from "../services/supabase.js";

const router = Router();

router.get("/today", async (req, res, next) => {
  try {
    if (!env.HAS_SUPABASE) {
      return res.json(fallbackQuote());
    }

    const { data, error } = await supabase.from("featured_quotes").select("*");

    if (error || !data?.length) {
      return res.json(fallbackQuote());
    }

    const day = Math.floor((Date.now() - Date.UTC(new Date().getFullYear(), 0, 0)) / 86400000);
    const quote = data[day % data.length];

    res.json({
      id: quote.id,
      quoteText: quote.quote_text,
      bookId: quote.book_id,
      author: quote.author
    });
  } catch (err) {
    next(err);
  }
});

function fallbackQuote() {
  return {
    quoteText: "A room without books is like a body without a soul.",
    author: "Cicero"
  };
}

export default router;
