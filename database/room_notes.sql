-- Run this in the Supabase SQL editor. Requires Supabase Auth accounts.
-- Notes left on a reader's notice board (the corkboard in their room), so the room's owner
-- sees them on any device. Today the room keeps them in the browser only
-- (client/src/buildings/house/notes.js); this table is for moving them to the server.
--
-- Rooms visited at /people/:id/room must have IDs matching auth.users.id. The Cafe's sample
-- readers (reader-emma, …) aren't accounts, so their boards stay in the browser.
--
-- Who may do what, for the Express API to enforce:
--   read    the room's owner, and anyone visiting the room
--   write   any signed-in reader except the owner, on someone else's board
--   delete  the note's author, or the room's owner
CREATE TABLE IF NOT EXISTS public.room_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- whose board it's pinned on
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- who left it
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- 140 characters, as NOTE_MAX in notes.js
  content text NOT NULL CHECK (char_length(btrim(content)) BETWEEN 1 AND 140),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT not_own_board CHECK (author_id <> owner_id)
);

-- a board's notes, newest first
CREATE INDEX IF NOT EXISTS room_notes_owner_idx
ON public.room_notes (owner_id, created_at DESC);

-- the notes a reader has left, for taking their own down
CREATE INDEX IF NOT EXISTS room_notes_author_idx
ON public.room_notes (author_id, created_at DESC);

ALTER TABLE public.room_notes ENABLE ROW LEVEL SECURITY;
-- No browser-facing policies: only the authenticated Express API, using
-- a server-side service-role client, can access this table.
REVOKE ALL ON TABLE public.room_notes FROM anon, authenticated;
