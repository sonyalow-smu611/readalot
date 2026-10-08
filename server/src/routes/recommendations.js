import { Router } from "express";
import { searchGoogleBooks } from "../services/books.js";

const router = Router();

const moodQueries = {
  sad: "comfort fiction",
  stressed: "cozy fiction",
  bored: "adventure",
  reflective: "philosophical fiction",
  romantic: "romance"
};

router.get("/", async (req, res, next) => {
  try {
    const mood = String(req.query.mood || "").toLowerCase();
    const books = await searchGoogleBooks(moodQueries[mood] || "popular fiction");
    const book = books[Math.floor(Math.random() * books.length)];

    res.json({ mood, book });
  } catch (err) {
    next(err);
  }
});

export default router;
