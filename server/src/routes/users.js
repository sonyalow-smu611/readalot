import { Router } from "express";
import { env } from "../services/env.js";
import { supabase } from "../services/supabase.js";

const router = Router();

router.get("/:id", async (req, res, next) => {
  try {
    if (!env.HAS_SUPABASE) {
      return res.json({
        user: {
          id: req.params.id,
          username: "demo_reader",
          displayName: "Demo Reader",
          avatarUrl: "",
          favoriteGenres: ["Fantasy", "Classics"],
          compatibility: 72,
          currentlyReading: null
        }
      });
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error) throw error;
    res.json({ user: toUser(data) });
  } catch (err) {
    next(err);
  }
});

router.get("/:id/books", async (req, res, next) => {
  try {
    if (!env.HAS_SUPABASE) {
      return res.json({ books: [] });
    }

    const { data, error } = await supabase
      .from("user_books")
      .select("*, books(*)")
      .eq("user_id", req.params.id);

    if (error) throw error;
    res.json({ books: data });
  } catch (err) {
    next(err);
  }
});

function toUser(profile) {
  return {
    id: profile.id,
    username: profile.username,
    displayName: profile.display_name,
    avatarUrl: profile.avatar_url,
    favoriteGenres: profile.favorite_genres || [],
    compatibility: 0,
    currentlyReading: null
  };
}

export default router;
