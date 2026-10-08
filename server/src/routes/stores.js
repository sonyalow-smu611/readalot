import { Router } from "express";
import { env } from "../services/env.js";

const router = Router();

router.get("/nearby", async (req, res) => {
  if (!env.GOOGLE_MAPS_API_KEY) {
    return res.json({ stores: [] });
  }

  res.json({
    stores: [],
    note: "Call Google Places Nearby Search here once the Maps key is configured."
  });
});

export default router;
