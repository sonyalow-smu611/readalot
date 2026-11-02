// Scaffolded with AI assistance — see AI_USAGE.md
// The reader's saved mood quotes, at /api/saved-quotes: list, save (saving twice keeps one) and
// remove their own.
import { Router } from "express";
import { requireUser } from "../middleware/auth.js";
import { listQuotes, QUOTE_MAX, removeQuote, saveQuote } from "../services/savedQuotes.js";

const router = Router();
const text = (value, max = 300) => String(value ?? "").trim().slice(0, max);

router.use(requireUser);

router.get("/", async (req, res, next) => {
  try {
    res.json({ quotes: await listQuotes(req.user.id) });
  } catch (err) {
    next(err);
  }
});

// { quoteText, author, work, bookId?, sourceUrl?, mood? }
router.post("/", async (req, res, next) => {
  const quoteText = String(req.body?.quoteText ?? "").trim();
  if (!quoteText || quoteText.length > QUOTE_MAX) {
    return res.status(400).json({ error: `A quote needs 1 to ${QUOTE_MAX} characters.` });
  }
  const sourceUrl = text(req.body?.sourceUrl, 500);
  try {
    const quote = await saveQuote(req.user.id, {
      quoteText,
      author: text(req.body?.author),
      work: text(req.body?.work),
      bookId: text(req.body?.bookId, 120),
      // only a web link, so a saved quote can't carry a javascript: one into the salon
      sourceUrl: /^https?:\/\//i.test(sourceUrl) ? sourceUrl : null,
      mood: text(req.body?.mood, 30) || null
    });
    res.status(201).json(quote);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const removed = await removeQuote(req.user.id, req.params.id);
    if (!removed) return res.status(404).json({ error: "Quote not found" });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
