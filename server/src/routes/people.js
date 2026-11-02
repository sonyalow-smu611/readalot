import { Router } from "express";
import { requireUser } from "../middleware/auth.js";
import { findReader, listReaders } from "../services/readers.js";

const router = Router();

// Other readers, with their shelves: the Cafe, the friends' houses in town, reader profiles.
router.get("/", requireUser, async (req, res, next) => {
  try {
    res.json({ readers: await listReaders(req.user.id) });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", requireUser, async (req, res, next) => {
  try {
    const reader = await findReader(req.params.id, req.user.id);
    if (!reader) return res.status(404).json({ error: "Reader not found" });
    res.json({ reader });
  } catch (err) {
    next(err);
  }
});

router.get("/:id/compatibility", async (req, res) => {
  res.json({ userId: req.params.id, compatibility: 72 });
});

export default router;
