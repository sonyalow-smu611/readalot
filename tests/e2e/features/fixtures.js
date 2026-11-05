// Scaffolded with AI assistance — see AI_USAGE.md
import { test as base, expect, mockQuote, mockTime, mockWeather, skipMoodCheckIn } from "../fixtures.js";
import { skipDailyPanel } from "../townFriends.js";

export const test = base.extend({
  page: async ({ page, reader }, use, testInfo) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.stack || error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await mockWeather(page);
    await mockTime(page);
    await mockQuote(page);
    await skipMoodCheckIn(page);
    await skipDailyPanel(reader.id);
    await use(page);
    if (errors.length) await testInfo.attach("browser-errors", { body: errors.join("\n\n"), contentType: "text/plain" });
  },
});
export { expect };

// The phone folds these controls into Menu. Test the UI the reader actually sees.
export async function townControl(page, role, name) {
  const menu = page.getByRole("button", { name: /^Menu(?:, something new)?$/ });
  if (await menu.isVisible()) {
    if ((await menu.getAttribute("aria-expanded")) !== "true") await menu.click();
    return page.getByRole("group", { name: "Town menu" }).getByRole(role, { name });
  }
  return page.getByRole(role, { name });
}

export async function fitsScreen(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

export const BOOK = {
  id: "feature-midnight", title: "The Midnight Library", authors: ["Matt Haig"],
  coverUrl: "/favicon.svg", description: "Between life and death there is a library.",
  genres: ["Fantasy"], isbn: "9780525559474", averageRating: 4,
};

export async function catalogue(page) {
  const shelf = [];
  await page.route("**/api/user-books", (route) => {
    if (route.request().method() === "POST") {
      const { status } = route.request().postDataJSON();
      shelf.push({ ...BOOK, status, progress: 0 });
      return route.fulfill({ status: 201, json: { userBook: shelf[0] } });
    }
    return route.fulfill({ json: { books: shelf } });
  });
  await page.route(`**/api/user-books/${BOOK.id}`, (route) => {
    if (route.request().method() === "DELETE") shelf.splice(0);
    return route.fulfill({ json: { userBook: {} } });
  });
  await page.route("**/api/books/search**", (route) => route.fulfill({ json: { books: [BOOK] } }));
  await page.route(`**/api/books/${BOOK.id}`, (route) => route.fulfill({ json: { book: BOOK } }));
}
