-- AI-assisted database migration — coordinate with your team's DB owner before applying.
-- Creates a PRIVATE one-to-one message table; no new user accounts are created.
CREATE TABLE IF NOT EXISTS public.reader_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(btrim(content)) BETWEEN 1 AND 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT reader_messages_not_self CHECK (sender_id <> receiver_id)
);

CREATE INDEX IF NOT EXISTS reader_messages_sender_idx
  ON public.reader_messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS reader_messages_receiver_idx
  ON public.reader_messages(receiver_id, sender_id, created_at DESC);

ALTER TABLE public.reader_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.reader_messages FROM anon, PUBLIC;
GRANT SELECT, INSERT ON public.reader_messages TO authenticated;

DROP POLICY IF EXISTS reader_messages_participant_select ON public.reader_messages;
CREATE POLICY reader_messages_participant_select ON public.reader_messages
  FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS reader_messages_sender_insert ON public.reader_messages;
CREATE POLICY reader_messages_sender_insert ON public.reader_messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND receiver_id <> auth.uid());

-- No UPDATE/DELETE policies are granted: recipients cannot edit each other's messages.
