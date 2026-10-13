import { Router } from "express";
import { supabase } from "../services/supabase.js";

const router = Router();
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Private messages must NEVER use requireUser's demo-user fallback.
// Only a valid Supabase access token establishes the sender identity.
async function requireRealUser(req, res, next) {
  const match = /^Bearer (\S+)$/i.exec(req.headers.authorization || "");
  if (!match) return res.status(401).json({ error: "Sign in to use Reader Chat" });
  try {
    const { data, error } = await supabase.auth.getUser(match[1]);
    if (error || !data?.user || !UUID.test(data.user.id)) {
      return res.status(401).json({ error: "Invalid or expired sign-in" });
    }
    req.chatUserId = data.user.id;
    next();
  } catch (err) { next(err); }
}

router.use(requireRealUser);

router.get("/:readerId", async (req, res, next) => {
  const me = req.chatUserId;
  const other = req.params.readerId;
  if (!UUID.test(other) || other === me) {
    return res.status(400).json({ error: "Invalid reader" });
  }
  try {
    // Both directions must involve the authenticated user.
    const { data, error } = await supabase.from("reader_messages")
      .select("id,sender_id,receiver_id,content,created_at")
      .or(`and(sender_id.eq.${me},receiver_id.eq.${other}),and(sender_id.eq.${other},receiver_id.eq.${me})`)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    res.json({ messages: (data || []).reverse() });
  } catch (err) { next(err); }
});

// Minimal per-process rate limiting for coursework demo. Production requires
// shared rate limiting and blocking/reporting/moderation before public launch.
const lastSent = new Map();
router.post("/:readerId", async (req, res, next) => {
  const me = req.chatUserId;
  const other = req.params.readerId;
  const content = req.body?.content;
  if (!UUID.test(other) || other === me) {
    return res.status(400).json({ error: "Invalid reader" });
  }
  if (typeof content !== "string" || !content.trim() || content.trim().length > 1000) {
    return res.status(400).json({ error: "Message must contain 1–1000 characters" });
  }
  const now = Date.now();
  if (now - (lastSent.get(me) || 0) < 1500) {
    return res.status(429).json({ error: "Please wait before sending another message" });
  }
  lastSent.set(me, now);
  try {
    const { data, error } = await supabase.from("reader_messages")
      .insert({ sender_id: me, receiver_id: other, content: content.trim() })
      .select("id,sender_id,receiver_id,content,created_at").single();
    if (error) {
      if (error.code === "23503") return res.status(404).json({ error: "Reader account not found" });
      throw error;
    }
    res.status(201).json({ message: data });
  } catch (err) { next(err); }
});

export default router;
