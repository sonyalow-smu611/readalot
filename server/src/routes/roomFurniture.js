// Scaffolded with AI assistance — see AI_USAGE.md
// A reader's room furniture, at /api/rooms/:readerId/furniture. :readerId is the reader as the app
// links to them (their username, or account id). Anyone signed in reads a room; only its owner
// changes it, sending the whole list of their pieces.
import { Router } from "express";
import { ownerOf, requireReader } from "./roomNotes.js";
import { cleanPieces, getPieces, savePieces } from "../services/roomFurniture.js";

const router = Router({ mergeParams: true });

router.use(requireReader);

router.get("/", async (req, res, next) => {
  try {
    const owner = await ownerOf(req.params.readerId, req.readerId);
    if (!owner) return res.status(404).json({ error: "Reader not found" });
    res.json({ pieces: await getPieces(owner) });
  } catch (err) {
    next(err);
  }
});

// { pieces }: everything in the room and the inventory
router.put("/", async (req, res, next) => {
  try {
    const owner = await ownerOf(req.params.readerId, req.readerId);
    if (!owner) return res.status(404).json({ error: "Reader not found" });
    if (owner !== req.readerId) return res.status(403).json({ error: "Only a room's owner can change its furniture." });
    const pieces = cleanPieces(req.body?.pieces);
    if (!pieces) return res.status(400).json({ error: "That isn't a list of furniture." });
    res.json({ pieces: await savePieces(owner, pieces) });
  } catch (err) {
    next(err);
  }
});

export default router;
