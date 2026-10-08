import { Router } from "express";
import { env } from "../services/env.js";
import { supabase } from "../services/supabase.js";

const router = Router();

router.get("/nearby", async (req, res, next) => {
  try {
    if (!env.HAS_SUPABASE) {
      return res.json({
        users: [
          {
            id: "demo-reader",
            username: "demo_reader",
            displayName: "Demo Reader",
            avatarUrl: "",
            favoriteGenres: ["Fantasy", "Classics"],
            compatibility: 72,
            currentlyReading: null,
            location: { lat: 1.35, lng: 103.82 }
          }
        ]
      });
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, favorite_genres, location_lat, location_lng")
      .eq("discoverable", true)
      .limit(30);

    if (error) throw error;

    res.json({
      users: (data || []).map((profile) => ({
        id: profile.id,
        username: profile.username,
        displayName: profile.display_name,
        avatarUrl: profile.avatar_url,
        favoriteGenres: profile.favorite_genres || [],
        compatibility: 72,
        currentlyReading: null,
        location: {
          lat: approximate(profile.location_lat),
          lng: approximate(profile.location_lng)
        }
      }))
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:id/compatibility", async (req, res) => {
  res.json({ userId: req.params.id, compatibility: 72 });
});

function approximate(value) {
  return value == null ? null : Number(Number(value).toFixed(2));
}

export default router;
