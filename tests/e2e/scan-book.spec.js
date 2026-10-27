// Scaffolded with AI assistance — see AI_USAGE.md
// Scan Book (T28), Khaleil's feature, now the book scanner machine in the library.
import { expect, test } from "./fixtures.js";

const SCANNED = { id: "lib-scanned", title: "The Scanned Book", authors: ["C. Author"], coverUrl: "" };
// a 1 x 1 PNG, standing in for a photo of a cover
const PHOTO = {
  name: "cover.png",
  mimeType: "image/png",
  buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64"),
};

// Chromium's stand-in camera, so "Snap cover" has a picture to take
test.use({
  permissions: ["camera"],
  launchOptions: { args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] },
});

test.beforeEach(async ({ page }) => {
  await page.goto("/library");
});

test("snapping a cover finds the book and opens its preview", async ({ page }) => {
  await page.route("**/api/scan-book", (route) =>
    route.fulfill({ json: { book: SCANNED, detectedText: "The Scanned Book C. Author", confidence: 0.9 } }),
  );
  await page.getByRole("navigation", { name: "Places in the library" }).getByRole("button", { name: "Scanner" }).click();
  await page.getByRole("button", { name: "Book scanner: scan a book cover" }).click();

  const scanner = page.getByRole("dialog", { name: "Book scanner" });
  await expect(scanner).toBeVisible();
  const snap = scanner.getByRole("button", { name: "Snap cover" });
  await expect(snap).toBeEnabled();
  await snap.click();

  const preview = page.getByRole("dialog", { name: "Quick preview: The Scanned Book" });
  await expect(preview).toBeVisible();
  await preview.getByRole("button", { name: "Close", exact: true }).click();
  await expect(scanner.getByRole("link", { name: /The Scanned Book/ })).toBeVisible();

  await scanner.getByRole("button", { name: "Close", exact: true }).click();
  await expect(scanner).toBeHidden();
  await expect(page.getByRole("button", { name: "Book scanner: scan a book cover" })).toBeFocused();
});

test("the old /scan address opens the scanner, and a photo can be uploaded", async ({ page }) => {
  await page.route("**/api/scan-book", (route) => route.fulfill({ json: { book: SCANNED, detectedText: "" } }));
  await page.goto("/scan");
  await expect(page).toHaveURL(/\/library\?scan=1$/);

  const scanner = page.getByRole("dialog", { name: "Book scanner" });
  await scanner.getByLabel("Or upload a photo of the cover").setInputFiles(PHOTO);
  await expect(page.getByRole("dialog", { name: "Quick preview: The Scanned Book" })).toBeVisible();
});

test("a cover that can't be matched offers a search instead", async ({ page }) => {
  await page.route("**/api/scan-book", (route) => route.fulfill({ json: { book: null, detectedText: "blurry" } }));
  await page.goto("/scan");
  const scanner = page.getByRole("dialog", { name: "Book scanner" });
  await scanner.getByLabel("Or upload a photo of the cover").setInputFiles(PHOTO);
  await expect(scanner.getByRole("alert")).toContainText("Couldn't find that book");

  await scanner.getByRole("button", { name: "Search by title" }).click();
  await expect(scanner).toBeHidden();
  await expect(page.getByRole("searchbox", { name: "Search books or authors" })).toBeFocused();
});
