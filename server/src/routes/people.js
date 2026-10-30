import { Router } from "express";
import { env } from "../services/env.js";
import { supabase } from "../services/supabase.js";
import { requireUser } from "../middleware/auth.js";
import { findReader, followingOf, listReaders, setFollowing } from "../services/readers.js";

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

// Other readers, with their shelves: the Cafe, the friends' houses in town, reader profiles.
router.get("/", requireUser, async (req, res, next) => {
  try {
    res.json({ readers: await listReaders(req.user.id) });
  } catch (err) {
    next(err);
  }
});

// The readers you follow, as reader ids.
router.get("/following", requireUser, async (req, res, next) => {
  try {
    res.json({ following: await followingOf(req.user.id) });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", requireUser, async (req, res, next) => {
  try {
    const reader = await findReader(req.params.id);
    if (!reader) return res.status(404).json({ error: "Reader not found" });
    res.json({ reader });
  } catch (err) {
    next(err);
  }
});

// Follow (PUT) or unfollow (DELETE) a reader.
for (const [method, follow] of [["put", true], ["delete", false]]) {
  router[method]("/:id/follow", requireUser, async (req, res, next) => {
    try {
      if (!(await setFollowing(req.user.id, req.params.id, follow))) {
        return res.status(404).json({ error: "Reader not found" });
      }
      res.json({ following: follow });
    } catch (err) {
      next(err);
    }
  });
}

router.get("/:id/compatibility", async (req, res) => {
  res.json({ userId: req.params.id, compatibility: 72 });
});

function approximate(value) {
  return value == null ? null : Number(Number(value).toFixed(2));
}

export default router;
