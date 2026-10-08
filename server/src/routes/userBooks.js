import { Router } from "express";
import { requireUser } from "../middleware/auth.js";
import { getGoogleBook } from "../services/books.js";
import { demoShelf, findDemoBook } from "../services/demoShelf.js";
import { env } from "../services/env.js";
import { supabase } from "../services/supabase.js";

const router = Router();
const statuses = new Set(["want_to_read", "reading", "read"]);

// The current user's shelf: Book shape plus status, progress and updatedAt.
router.get("/", requireUser, async (req, res, next) => {
  try {
    if (!env.HAS_SUPABASE) {
      return res.json({ books: demoShelf });
    }

    const { data: rows, error } = await supabase
      .from("user_books")
      .select("*")
      .eq("user_id", req.user.id)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    const { data: saved, error: booksError } = await supabase
      .from("books")
      .select("*")
      .in("id", rows.map((row) => row.book_id));

    if (booksError) throw booksError;

    const { data: reviews, error: reviewsError } = await supabase
      .from("reviews")
      .select("book_id")
      .eq("user_id", req.user.id);

    if (reviewsError) throw reviewsError;

    const reviewedIds = new Set(reviews.map((review) => review.book_id));
    const byId = new Map(saved.map((book) => [book.id, toBook(book)]));
    const books = await Promise.all(
      rows.map(async (row) => ({
        // user_books has no foreign key to books, so a saved book may only exist on Google Books
        ...(byId.get(row.book_id) || (await getGoogleBook(row.book_id))),
        id: row.book_id,
        status: row.status,
        progress: row.progress || 0,
        // the reader's own rating (1-5) and whether they have written a review
        myRating: row.rating ?? null,
        reviewed: reviewedIds.has(row.book_id),
        updatedAt: row.updated_at
      }))
    );

    res.json({ books });
  } catch (err) {
    next(err);
  }
});

router.post("/", requireUser, async (req, res, next) => {
  try {
    if (!statuses.has(req.body.status)) {
      return res.status(400).json({ error: "Invalid reading status" });
    }

    if (!env.HAS_SUPABASE) {
      let book = findDemoBook(req.body.bookId);

      if (!book) {
        book = { ...(await getGoogleBook(req.body.bookId)), id: req.body.bookId };
        demoShelf.unshift(book);
      }

      Object.assign(book, {
        status: req.body.status,
        progress: req.body.progress || 0,
        updatedAt: new Date().toISOString()
      });
      return res.status(201).json({ userBook: book });
    }

    const { data, error } = await supabase
      .from("user_books")
      .upsert({
        user_id: req.user.id,
        book_id: req.body.bookId,
        status: req.body.status,
        progress: req.body.progress || 0,
        rating: req.body.rating || null,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ userBook: data });
  } catch (err) {
    next(err);
  }
});

router.patch("/:bookId", requireUser, async (req, res, next) => {
  try {
    if (req.body.status && !statuses.has(req.body.status)) {
      return res.status(400).json({ error: "Invalid reading status" });
    }

    if (!env.HAS_SUPABASE) {
      const book = findDemoBook(req.params.bookId);

      if (!book) {
        return res.status(404).json({ error: "Book is not on your shelf" });
      }

      if (req.body.status) book.status = req.body.status;
      if (req.body.progress !== undefined) book.progress = req.body.progress;
      book.updatedAt = new Date().toISOString();
      return res.json({ userBook: book });
    }

    const { data, error } = await supabase
      .from("user_books")
      .update({
        status: req.body.status,
        progress: req.body.progress,
        rating: req.body.rating,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", req.user.id)
      .eq("book_id", req.params.bookId)
      .select()
      .single();

    if (error) throw error;
    res.json({ userBook: data });
  } catch (err) {
    next(err);
  }
});

router.delete("/:bookId", requireUser, async (req, res, next) => {
  try {
    if (!env.HAS_SUPABASE) {
      const index = demoShelf.findIndex((book) => book.id === req.params.bookId);
      if (index >= 0) demoShelf.splice(index, 1);
      return res.status(204).end();
    }

    const { error } = await supabase
      .from("user_books")
      .delete()
      .eq("user_id", req.user.id)
      .eq("book_id", req.params.bookId);

    if (error) throw error;
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

function toBook(row) {
  return {
    id: row.id,
    googleBooksId: row.google_books_id,
    title: row.title,
    authors: row.authors || [],
    coverUrl: row.cover_url || "",
    description: row.description || "",
    genres: row.genres || [],
    publisher: row.publisher || "",
    publishedDate: row.published_date || "",
    isbn: row.isbn || "",
    averageRating: 0,
    pageCount: row.page_count || 0,
    ratingsCount: row.ratings_count || 0,
    buyUrl: row.buy_url || ""
  };
}

export default router;
