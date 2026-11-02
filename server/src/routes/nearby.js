// Scaffolded with AI assistance — see AI_USAGE.md
// The town's check-in: says you're active, optionally with your position, and answers with who is
// near you (services/nearby.js).
import { Router } from "express";
import { requireSignedIn } from "../middleware/auth.js";
import { checkIn } from "../services/nearby.js";

const router = Router();

router.post("/", requireSignedIn, async (req, res, next) => {
  try {
    res.json({ readers: await checkIn(req.user.id, req.body) });
  } catch (err) {
    next(err);
  }
});

export default router;
