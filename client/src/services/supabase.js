import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// The app needs a Supabase project: without the keys there is no sign-in and no saved profile.
export const MISSING_KEYS = "Supabase keys are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env (see .env.example).";

export const supabase = url && key ? createClient(url, key) : null;
