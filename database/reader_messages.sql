-- Run this in the Supabase SQL editor. Requires Supabase Auth accounts.
-- Profiles visited at /people/:id must have IDs matching auth.users.id.
CREATE TABLE IF NOT EXISTS public.reader_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(btrim(content)) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT different_readers CHECK (sender_id <> receiver_id)
);
CREATE INDEX IF NOT EXISTS reader_messages_sender_idx
ON public.reader_messages (sender_id, receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS reader_messages_receiver_idx
ON public.reader_messages (receiver_id, sender_id, created_at DESC);
ALTER TABLE public.reader_messages ENABLE ROW LEVEL SECURITY;
-- No browser-facing policies: only the authenticated Express API, using
-- a server-side service-role client, can access this table.
REVOKE ALL ON TABLE public.reader_messages FROM anon, authenticated;
