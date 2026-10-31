// Scaffolded with AI assistance — see AI_USAGE.md
// The notes on a reader's notice board, at /api/rooms/:readerId/notes. :readerId is the reader as
// the app links to them (their username, or account id). Anyone signed in reads a board; a reader
// pins notes on other readers' boards only, signed as themselves; a note comes down when its author
// or the board's owner takes it down.
import { Router } from "express";
import { env } from "../services/env.js";
import { findReader } from "../services/readers.js";
import { addNote, listNotes, NOTE_MAX, removeNote } from "../services/roomNotes.js";
import { supabase } from "../services/supabase.js";

const router = Router({ mergeParams: true });

// The account id inside a Supabase access token, unchecked.
function subjectOf(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
    return typeof payload.sub === "string" ? payload.sub : "";
  } catch {
    return "";
  }
}

// Notes are signed by who's asking, so there's no demo-user fallback here: only a sign-in counts.
// With Supabase the token is checked. Without it (local dev, the e2e tests) the server can't check
// one, so it takes the account id the token carries.
async function requireReader(req, res, next) {
  const match = /^Bearer (\S+)$/i.exec(req.headers.authorization || "");
  if (!match) return res.status(401).json({ error: "Sign in to see notes" });
  try {
    if (!env.HAS_SUPABASE) {
      const id = subjectOf(match[1]);
      if (!id) return res.status(401).json({ error: "Invalid sign-in" });
      req.readerId = id;
      return next();
    }
    const { data, error } = await supabase.auth.getUser(match[1]);
    if (error || !data?.user) return res.status(401).json({ error: "Invalid or expired sign-in" });
    req.readerId = data.user.id;
    next();
  } catch (err) {
    next(err);
  }
}

const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

// The account whose board it is, or null when there's no such reader: the reader asking (their own
// board, discoverable or not), or a discoverable reader. Without Supabase there are no profiles
// to look an account up in, so any account id names a board.
async function ownerOf(handle, readerId) {
  if (handle === readerId) return readerId;
  const reader = await findReader(handle);
  if (reader) return reader.userId;
  return !env.HAS_SUPABASE && isUuid(handle) ? handle : null;
}

router.use(requireReader);

router.get("/", async (req, res, next) => {
  try {
    const owner = await ownerOf(req.params.readerId, req.readerId);
    if (!owner) return res.status(404).json({ error: "Reader not found" });
    res.json({ notes: await listNotes(owner) });
  } catch (err) {
    next(err);
  }
});

// { text, author }: author is the writer's name, read only without Supabase (see addNote)
router.post("/", async (req, res, next) => {
  const text = String(req.body?.text ?? "").trim();
  if (!text || text.length > NOTE_MAX) {
    return res.status(400).json({ error: `A note needs 1 to ${NOTE_MAX} characters.` });
  }
  try {
    const owner = await ownerOf(req.params.readerId, req.readerId);
    if (!owner) return res.status(404).json({ error: "Reader not found" });
    if (owner === req.readerId) return res.status(400).json({ error: "Notes are for other readers' boards." });
    const author = { id: req.readerId, name: String(req.body?.author ?? "").trim().slice(0, 60) };
    res.status(201).json(await addNote(owner, author, text));
  } catch (err) {
    next(err);
  }
});

router.delete("/:noteId", async (req, res, next) => {
  try {
    const owner = await ownerOf(req.params.readerId, req.readerId);
    if (!owner) return res.status(404).json({ error: "Reader not found" });
    const result = await removeNote(owner, req.params.noteId, req.readerId);
    if (result === "missing") return res.status(404).json({ error: "Note not found" });
    if (result === "forbidden") return res.status(403).json({ error: "Only its author or the board's owner can take a note down." });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
