import { test as base, expect } from "@playwright/test";
import { createReader, hasSupabase, NEEDS_SUPABASE, resetProfile, signInPage } from "./supabaseUser.js";

const PROFILE = { name: "Reader", favouriteGenres: ["Fantasy"] };

// The app sends a signed-out visitor to Log in. These tests cover the town, the room and the
// shelves, so each one starts as a returning reader: signed in, profile saved, tour already seen.
// Supabase limits how often anyone can sign in, so each worker signs in one reader once and every
// test puts that reader's profile back the way it was.
export const test = base.extend({
  account: [
    async ({}, use) => {
      if (!hasSupabase) {
        await use(null);
        return;
      }
      const reader = await createReader({ profile: PROFILE });
      await use(reader);
      await reader.remove();
    },
    { scope: "worker" },
  ],
  reader: async ({ account }, use, testInfo) => {
    testInfo.skip(!account, NEEDS_SUPABASE);
    await resetProfile(account.id, PROFILE);
    await use(account);
  },
  page: async ({ page, reader }, use) => {
    await signInPage(page, reader.session);
    await use(page);
  },
});

export { expect };
