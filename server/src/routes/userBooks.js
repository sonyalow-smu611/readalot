import { Router } from "express";
import { requireUser } from "../middleware/auth.js";
import { supabase } from "../services/supabase.js";

const router = Router();
const statuses = new Set(["want_to_read", "reading", "read"]);

router.post("/", requireUser, async (req, res, next) => {
  try {
    if (!statuses.has(req.body.status)) {
      return res.status(400).json({ error: "Invalid reading status" });
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

export default router;
