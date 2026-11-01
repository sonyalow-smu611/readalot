-- Run this in the Supabase SQL editor. Requires Supabase Auth accounts and the profiles table.
-- Each reader's room furniture from the Shop, so My Room looks the same after a reload and on any
-- device, and visitors see it. One row per reader holds the whole list of their pieces:
--   { uid, id }                    in the inventory
--   { uid, id, zone, x, at? }      placed: its zone, how far along it (0 to 1), and the point it
--                                  stands on or hangs from, in the room's art pixels
-- The Cafe's sample readers aren't accounts, so their demo furniture stays in the app.
--
-- Who may do what, for the Express API to enforce:
--   read    the room's owner, and anyone visiting the room
--   write   the room's owner only
CREATE TABLE IF NOT EXISTS public.room_furniture (
  owner_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  pieces jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(pieces) = 'array'),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- No browser policies: only the Express API, with the service-role key, reads or writes it.
ALTER TABLE public.room_furniture ENABLE ROW LEVEL SECURITY;
