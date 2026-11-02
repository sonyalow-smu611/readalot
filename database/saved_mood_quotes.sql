-- Run this in the Supabase SQL editor. Requires Supabase Auth accounts.
-- Quotes a reader keeps from their mood check-in, listed in the salon's Saved quotes card.
-- A mood quote comes from the works catalogue / Wikiquote, not the quotes table, so this keeps a
-- copy of the quote itself. The older saved_quotes table (a link to quotes) is left alone.
--
-- Who may do what, for the Express API to enforce: a reader reads, saves and removes their own.
CREATE TABLE IF NOT EXISTS public.saved_mood_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quote_text text NOT NULL CHECK (char_length(btrim(quote_text)) BETWEEN 1 AND 2000),
  author text NOT NULL DEFAULT '',
  -- the book's title
  work text NOT NULL DEFAULT '',
  -- the book's id in the app, for its page; '' when there is none
  book_id text NOT NULL DEFAULT '',
  source_url text,
  -- the mood it was found for
  mood text,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- the same line from the same book is kept once
  CONSTRAINT saved_mood_quotes_once UNIQUE (user_id, book_id, quote_text)
);

-- a reader's quotes, newest first
CREATE INDEX IF NOT EXISTS saved_mood_quotes_user_idx
ON public.saved_mood_quotes (user_id, created_at DESC);

ALTER TABLE public.saved_mood_quotes ENABLE ROW LEVEL SECURITY;
-- No browser-facing policies: only the authenticated Express API, using
-- a server-side service-role client, can access this table.
REVOKE ALL ON TABLE public.saved_mood_quotes FROM anon, authenticated;
