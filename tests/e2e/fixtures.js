import { test as base, expect } from "@playwright/test";

// The app sends a signed-out visitor to Log in. These tests cover the room and the shelves,
// so each one starts already signed in, the way the app does with no Supabase keys.
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      sessionStorage.setItem(
        "readalot-preview-user",
        JSON.stringify({
          id: "e2e-reader",
          email: "reader@readalot.test",
          user_metadata: { name: "Reader" },
        }),
      );
    });
    await use(page);
  },
});

export { expect };

// In the room: open the Places menu (unless it's open already), pick a place, and let the room
// finish sliding there.
export async function goToPlace(page, place) {
  const list = page.getByRole("navigation", { name: "Places in the room" });
  if (!(await list.isVisible())) await page.getByRole("button", { name: "Places", exact: true }).click();
  await list.getByRole("button", { name: place, exact: true }).click();
  await page.waitForTimeout(900);
}
