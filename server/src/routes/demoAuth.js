// Scaffolded with AI assistance — see AI_USAGE.md
// Demo registration. An email on a demo domain (default demo.ikda.app, see DEMO_CODE_DOMAINS in
// services/env.js) skips the emailed code: this makes the account already confirmed, and the app
// then accepts the code 111111 (client/src/services/auth.js) and signs in with the password. Those
// addresses are not real inboxes, so no one is being impersonated. Any other email still
// registers through Supabase and gets a real code. Set DEMO_CODE_DOMAINS= (empty) to turn it off.
import { Router } from "express";
import { env } from "../services/env.js";
import { supabase } from "../services/supabase.js";

const router = Router();

const USERNAME = /^[a-z0-9._]{3,20}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isDemoEmail(email) {
  const text = String(email || "").trim().toLowerCase();
  // the domain is what follows the last @, so "a@demo.ikda.app@elsewhere.com" is not a demo email
  return text.indexOf("@") > 0 && env.DEMO_CODE_DOMAINS.includes(text.slice(text.lastIndexOf("@") + 1));
}

// A light brake on sign-ups from one address (kept in memory, per server instance): 60 an hour.
const WINDOW_MS = 60 * 60 * 1000;
const MOST_SIGNUPS = 60;
const recent = new Map();
// behind Vercel's proxy req.ip is the proxy, so use the address it forwards
const clientOf = (req) => String(req.headers["x-vercel-forwarded-for"] || req.headers["x-forwarded-for"] || req.ip || "").split(",")[0].trim();
function tooMany(ip) {
  const now = Date.now();
  const times = (recent.get(ip) || []).filter((time) => now - time < WINDOW_MS);
  times.push(now);
  recent.set(ip, times);
  if (recent.size > 5000) for (const [key, list] of recent) if (!list.some((time) => now - time < WINDOW_MS)) recent.delete(key);
  return times.length > MOST_SIGNUPS;
}

router.post("/register", async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    const username = String(req.body?.username || "").trim().toLowerCase();

    if (!EMAIL.test(email) || !isDemoEmail(email)) {
      return res.status(403).json({ error: "Demo sign-up is not available for that email." });
    }
    if (tooMany(clientOf(req))) return res.status(429).json({ error: "Too many sign-ups from here. Try again later." });
    if (password.length < 6) return res.status(400).json({ error: "Use a password of at least 6 characters." });
    if (!USERNAME.test(username)) {
      return res.status(400).json({ error: "A username is 3 to 20 letters, numbers, dots or underscores." });
    }
    if (!env.HAS_SUPABASE) return res.status(503).json({ error: "Sign-up is not set up on this server." });

    const { error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username },
    });
    if (error) {
      const taken = /already|exists|registered/i.test(error.message);
      return res
        .status(taken ? 409 : 400)
        .json({ error: taken ? "That email is already registered. Log in instead." : error.message });
    }
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
