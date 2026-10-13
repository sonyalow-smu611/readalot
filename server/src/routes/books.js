import { Router } from "express";
import { requireUser } from "../middleware/auth.js";
import { MAX_SEARCH_RESULTS, fallbackBooks, getGoogleBook, searchGoogleBooks } from "../services/books.js";
import { demoBookDetails, findDemoBook } from "../services/demoShelf.js";
import { supabase } from "../services/supabase.js";

const router = Router();

router.get("/search", async (req, res) => {
  try {
    // ?limit= asks for more results (the genre page wants 24); kept between 1 and Google's max
    const limit = Math.min(MAX_SEARCH_RESULTS, Math.max(1, Number.parseInt(req.query.limit, 10) || 12));
    const books = await searchGoogleBooks(String(req.query.q || ""), limit);
    res.json({ books });
  } catch {
    // quota or outage: a placeholder keeps Discover from going blank
    res.json({ books: fallbackBooks });
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    // the written-out demo books are not on Google Books; a shelf book that came from Google
    // is still shown from the shelf's copy when Google cannot be reached
    const book = await getGoogleBook(req.params.id).catch((err) => {
      const shelved = findDemoBook(req.params.id) || demoBookDetails(req.params.id);
      if (shelved) return shelved;
      throw err;
    });
    res.json({ book });
  } catch (err) {
    next(err);
  }
});

router.get("/:id/reviews", async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("book_id", req.params.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ reviews: data });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/reviews", requireUser, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .insert({
        user_id: req.user.id,
        book_id: req.params.id,
        rating: req.body.rating,
        review_text: req.body.reviewText
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ review: data });
  } catch (err) {
    next(err);
  }
});

router.get("/:id/quotes", async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .eq("book_id", req.params.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ quotes: data });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/quotes", requireUser, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("quotes")
      .insert({
        user_id: req.user.id,
        book_id: req.params.id,
        quote_text: req.body.quoteText,
        page_number: req.body.pageNumber
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ quote: data });
  } catch (err) {
    next(err);
  }
});

export default router;
