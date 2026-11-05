import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// The app needs a Supabase project: without the keys there is no sign-in and no saved profile.
export const MISSING_KEYS = "Supabase keys are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env (see .env.example).";

// Remember me. Where the session is kept depends on the choice made at log in:
//   remembered     in localStorage until the date saved with it (30 days), then signed out
//   not remembered in sessionStorage, so closing the browser signs out
//   no choice saved (someone signed in before this existed) in localStorage as it always was
const REMEMBER_KEY = "readalot-remember";
export const REMEMBER_DAYS = 30;

function readChoice() {
  try {
    return JSON.parse(localStorage.getItem(REMEMBER_KEY) || "null");
  } catch {
    return null;
  }
}

// Whether a saved session may live in localStorage right now.
function mayRemember() {
  const choice = readChoice();
  if (!choice) return true;
  if (choice.session) return false;
  return Number(choice.until) > Date.now();
}

// Saved at log in, before the session is made: remembered for 30 days, or until the browser closes.
export function setRemember(remember) {
  try {
    localStorage.setItem(
      REMEMBER_KEY,
      JSON.stringify(remember ? { until: Date.now() + REMEMBER_DAYS * 24 * 60 * 60 * 1000 } : { session: true })
    );
  } catch {
    // no storage: the session lasts as long as the page
  }
}

// What the Supabase client reads and writes its session through: either store, never both.
const sessionStore = {
  getItem(name) {
    try {
      if (mayRemember()) return localStorage.getItem(name) ?? sessionStorage.getItem(name);
      // a login that wasn't remembered, or whose 30 days are over, ends here
      localStorage.removeItem(name);
      return sessionStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem(name, value) {
    try {
      if (mayRemember()) {
        localStorage.setItem(name, value);
        sessionStorage.removeItem(name);
      } else {
        sessionStorage.setItem(name, value);
        localStorage.removeItem(name);
      }
    } catch {
      // no storage: the session lasts as long as the page
    }
  },
  removeItem(name) {
    try {
      localStorage.removeItem(name);
      sessionStorage.removeItem(name);
    } catch {
      // nothing was kept
    }
  }
};

export const supabase = url && key ? createClient(url, key, { auth: { storage: sessionStore } }) : null;
