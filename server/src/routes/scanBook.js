import { Router } from "express";
import { findGoogleBook } from "../services/books.js";
import { env } from "../services/env.js";
import { detectBookFromImage } from "../services/vision.js";
import { pickWork, workToBook } from "../services/works.js";

const router = Router();
let lastSampleId = "";

router.post("/", async (req, res, next) => {
  try {
    if (!req.body.imageBase64) {
      return res.status(400).json({ error: "No image sent" });
    }

    if (env.GOOGLE_CLOUD_VISION_KEY) {
      return res.json(await detectBookFromImage(req.body.imageBase64));
    }

    // Without a Vision key the photo can't be read, so a random curated work (never the same
    // one twice running) keeps the flow testable.
    const work = pickWork(null, lastSampleId);
    lastSampleId = work.id;

    res.json({
      detectedText: `${work.title} ${work.author}`,
      book: (await findGoogleBook(work.title, work.author)) || workToBook(work),
      confidence: 0,
      sample: true
    });
  } catch (err) {
    next(err);
  }
});

export default router;
