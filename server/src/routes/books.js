import { Router } from "express";
import { requireUser } from "../middleware/auth.js";
import { getGoogleBook, searchGoogleBooks } from "../services/books.js";
import { supabase } from "../services/supabase.js";

const router = Router();

router.get("/search", async (req, res, next) => {
  try {
    const books = await searchGoogleBooks(String(req.query.q || ""));
    res.json({ books });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const book = await getGoogleBook(req.params.id);
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
