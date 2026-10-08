import { env } from "../services/env.js";
import { supabase } from "../services/supabase.js";

export async function requireUser(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    // Demo-user seam: no login in the MVP, OAuth replaces this fallback later.
    const demoUserId = env.DEMO_USER_ID || (!env.HAS_SUPABASE && "demo-user");

    if (demoUserId) {
      req.user = { id: demoUserId };
      return next();
    }

    return res.status(401).json({ error: "Missing access token" });
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return res.status(401).json({ error: "Invalid access token" });
  }

  req.user = data.user;
  next();
}
