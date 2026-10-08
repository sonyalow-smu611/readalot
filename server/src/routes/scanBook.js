import { Router } from "express";
import { searchGoogleBooks } from "../services/books.js";

const router = Router();

router.post("/", async (req, res, next) => {
  try {
    const detectedText = req.body.detectedText || "Norwegian Wood Haruki Murakami";
    const books = await searchGoogleBooks(detectedText);

    res.json({
      detectedText,
      book: books[0] || null
    });
  } catch (err) {
    next(err);
  }
});

export default router;
