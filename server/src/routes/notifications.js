// Scaffolded with AI assistance — see AI_USAGE.md
// The town's notifications that only the server knows about: who has visited your room since a
// date (services/notifications.js). Friend requests and who is online come from /api/friends.
import { Router } from "express";
import { requireSignedIn } from "../middleware/auth.js";
import { roomVisits } from "../services/notifications.js";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const router = Router();

router.get("/visits", requireSignedIn, async (req, res, next) => {
  try {
    const asked = new Date(String(req.query.since ?? ""));
    const since = Number.isNaN(asked.getTime()) ? new Date(Date.now() - WEEK_MS) : asked;
    res.json({ visits: await roomVisits(req.user.id, since) });
  } catch (err) {
    next(err);
  }
});

export default router;
