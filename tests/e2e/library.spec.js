// Scaffolded with AI assistance — see AI_USAGE.md
import { expect, openPlaces, test } from "./fixtures.js";

// The bookcases fill from a book search; answer it here so the tests never wait on Google Books.
const BOOKS = [
  { id: "lib-dragon", title: "The Dragon's Library", authors: ["A. Reader"], coverUrl: "" },
  { id: "lib-map", title: "A Map of Stars", authors: ["B. Writer"], coverUrl: "" },
];

test.beforeEach(async ({ page }) => {
  await page.route("**/api/books/search**", (route) => route.fulfill({ json: { books: BOOKS } }));
  // the live weather, fixed: steady rain at 27 degrees by day
  await page.route("**/api/weather*", (route) =>
    route.fulfill({ json: { scene: "rain", temperature: 27, weatherCode: 63, isDay: true } })
  );
  await page.goto("/library");
});

const GENRES = [
  "Bestsellers",
  "Romance",
  "Romantasy",
  "Fantasy",
  "Mystery & Thriller",
  "Horror",
  "Science Fiction",
  "Historical Fiction",
  "Young Adult",
  "Memoir & Biography",
  "Graphic Novels & Manga",
];

test("the library hall has a Bestsellers bookcase and one for each of the ten most read genres", async ({ page }) => {
  for (const name of GENRES) {
    await expect(page.getByRole("button", { name: `${name} bookcase` })).toBeAttached();
  }
  await expect(page.getByRole("button", { name: "Places", exact: true })).toBeVisible();
});

test("a bookcase opens its books, and a book opens its preview", async ({ page }) => {
  await (await openPlaces(page)).getByRole("button", { name: "Fantasy" }).click();
  await page.getByRole("button", { name: "Fantasy bookcase" }).click();

  const sheet = page.getByRole("dialog", { name: "Fantasy" });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("button", { name: /The Dragon's Library/ })).toBeVisible();

  await sheet.getByRole("button", { name: /The Dragon's Library/ }).click();
  const preview = page.getByRole("dialog", { name: "Quick preview: The Dragon's Library" });
  await expect(preview).toBeVisible();
  await preview.getByRole("button", { name: "Close", exact: true }).click();
  await expect(preview).toBeHidden();

  await sheet.getByRole("button", { name: "Back to the hall" }).click();
  await expect(sheet).toBeHidden();
  await expect(page.getByRole("button", { name: "Fantasy bookcase" })).toBeFocused();
});

test("the help desk puts the reader in the search bar", async ({ page }) => {
  await (await openPlaces(page)).getByRole("button", { name: "Help desk" }).click();
  await page.getByRole("button", { name: "Help desk: search for any book" }).click();

  const search = page.getByRole("searchbox", { name: "Search books or authors" });
  await expect(search).toBeFocused();
  // the search bar asks what you're looking for, so it's clear where to type
  await expect(page.getByText("The librarian is listening: type a title or an author, then press Enter.")).toBeVisible();
  await expect(search).toHaveAttribute("placeholder", "What are you looking for?");
  await search.fill("dune");
  await page.getByRole("search").getByRole("button", { name: "Search" }).click();
  await expect(page).toHaveURL(/\/search\?q=dune$/);
});

test("the help desk's prompt goes away when the reader clicks elsewhere", async ({ page }) => {
  await page.getByRole("button", { name: "Help desk: search for any book" }).click();
  const prompt = page.getByText("The librarian is listening", { exact: false });
  await expect(prompt).toBeVisible();
  await page.getByRole("region", { name: /The library hall/ }).click({ position: { x: 5, y: 5 } });
  await expect(prompt).toBeHidden();
});

test("each lamp turns off and on by itself when tapped, and is remembered", async ({ page }) => {
  const deskLamp = page.getByRole("button", { name: "Help desk lamp", exact: true });
  const ceilingLamp = page.getByRole("button", { name: "Help desk ceiling lamp" });
  await expect(deskLamp).toHaveAttribute("aria-pressed", "true");

  await deskLamp.click();
  await expect(deskLamp).toHaveAttribute("aria-pressed", "false");
  // the other lamps stay on
  await expect(ceilingLamp).toHaveAttribute("aria-pressed", "true");

  await page.reload();
  await expect(page.getByRole("button", { name: "Help desk lamp", exact: true })).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Help desk lamp", exact: true }).click();
  await expect(page.getByRole("button", { name: "Help desk lamp", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("tapping the search bar itself opens it up too", async ({ page }) => {
  await page.getByRole("searchbox", { name: "Search books or authors" }).click();
  await expect(page.getByText("The librarian is listening", { exact: false })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Search books or authors" })).toHaveAttribute("placeholder", "What are you looking for?");
});

test("rain falls on the windows only while it rains, harder in a downpour", async ({ page }) => {
  await expect(page.locator('.hall__rain[data-rain="steady"]').first()).toBeAttached();

  await page.route("**/api/weather*", (route) =>
    route.fulfill({ json: { scene: "rain", temperature: 24, weatherCode: 95, isDay: true } })
  );
  await page.reload();
  await expect(page.getByRole("img", { name: "Weather outside: Heavy rain, 24 degrees" })).toBeVisible();
  await expect(page.locator('.hall__rain[data-rain="heavy"]').first()).toBeAttached();

  await page.route("**/api/weather*", (route) =>
    route.fulfill({ json: { scene: "sunny", temperature: 31, weatherCode: 0, isDay: true } })
  );
  await page.reload();
  await expect(page.getByRole("img", { name: "Weather outside: Sunny, 31 degrees" })).toBeVisible();
  await expect(page.locator(".hall__rain")).toHaveCount(0);
});

test("the library shows the live weather, and follows it after dark", async ({ page }) => {
  await expect(page.getByRole("img", { name: "Weather outside: Rain, 27 degrees" })).toBeVisible();

  await page.route("**/api/weather*", (route) =>
    route.fulfill({ json: { scene: "sunny", temperature: 25, weatherCode: 0, isDay: false } })
  );
  await page.reload();
  await expect(page.getByRole("img", { name: "Weather outside: Sunny night, 25 degrees" })).toBeVisible();

  // ?scene= previews a sky without waiting for that weather
  await page.goto("/library?scene=cloudy");
  await expect(page.getByRole("img", { name: /Weather outside: Cloudy, 25 degrees/ })).toBeVisible();
});

test("the Places menu in the bottom right lists the hall, then the shelves, and goes to a bookcase", async ({ page }) => {
  const toggle = page.getByRole("button", { name: "Places", exact: true });
  const view = page.viewportSize();
  const box = await toggle.boundingBox();
  expect(box.x + box.width).toBeGreaterThan(view.width - 40);
  expect(box.y + box.height).toBeGreaterThan(view.height - 40);

  const list = await openPlaces(page);
  await expect(list.getByRole("region", { name: "Around the library" }).getByRole("button", { name: "Scanner" })).toBeVisible();
  await expect(list.getByRole("region", { name: "Shelves" }).getByRole("button", { name: "Fantasy" })).toBeVisible();

  await list.getByRole("button", { name: "Fantasy" }).click();
  await expect(list).toBeHidden();
  await expect(page.getByRole("button", { name: "Fantasy bookcase" })).toBeInViewport();

  await openPlaces(page);
  await page.keyboard.press("Escape");
  await expect(list).toBeHidden();
  await expect(toggle).toBeFocused();
});

for (const [label, viewport] of [
  ["a laptop", { width: 1440, height: 900 }],
  ["a phone", { width: 390, height: 844 }],
]) {
  test(`on ${label}, the back button, search and weather share the top line`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const back = await page.getByRole("link", { name: "Back to town" }).boundingBox();
    const search = await page.getByRole("search").boundingBox();
    const weather = await page.getByRole("img", { name: /Weather outside/ }).boundingBox();

    // one line in the top corner: the three start at the same height, left, middle, right, without touching
    expect(back.y).toBeLessThan(20);
    for (const box of [search, weather]) expect(Math.abs(box.y - back.y)).toBeLessThan(4);
    expect(back.x + back.width).toBeLessThan(search.x);
    expect(search.x + search.width).toBeLessThan(weather.x);
    expect(Math.abs(search.x + search.width / 2 - viewport.width / 2)).toBeLessThan(4);
    expect(weather.x + weather.width).toBeGreaterThan(viewport.width - 30);
  });
}

test("on a phone, the search rests as a magnifier and grows into a bar when tapped", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const box = page.getByRole("searchbox", { name: "Search books or authors" });
  await expect(box).toBeHidden();

  await page.getByRole("button", { name: "Search books or authors" }).click();
  await expect(box).toBeFocused();
  await expect(page.getByText("The librarian is listening", { exact: false })).toBeVisible();
  expect((await page.getByRole("search").boundingBox()).width).toBeGreaterThan(340);

  await box.fill("dune");
  await box.press("Enter");
  await expect(page).toHaveURL(/\/search\?q=dune$/);
});

test("each bookcase has a sign with its genre's name and pixel icon, in its own font", async ({ page }) => {
  const horror = page.locator('[data-place="horror"] .hall__sign');
  await expect(horror).toHaveText("Horror");
  await expect(horror.locator("img")).toHaveAttribute("src", /^data:image\/png/);
  await expect(horror).toHaveCSS("font-family", /Jacquard 24/);
  await expect(page.locator('[data-place="scifi"] .hall__sign')).toHaveCSS("font-family", /Workbench/);
  // big enough to read
  const size = await page.locator('[data-place="romance"] .hall__sign-text').evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(size).toBeGreaterThanOrEqual(16);
});

test("the library has no emoji anywhere, only pixel icons", async ({ page }) => {
  const emoji = /\p{Extended_Pictographic}/u;
  await expect(page.getByRole("button", { name: "Places", exact: true })).toBeVisible();
  expect(await page.locator("body").innerText()).not.toMatch(emoji);

  await page.getByRole("button", { name: "Horror bookcase" }).click();
  const sheet = page.getByRole("dialog", { name: "Horror" });
  await expect(sheet.getByRole("button", { name: /The Dragon's Library/ })).toBeVisible();
  expect(await sheet.innerText()).not.toMatch(emoji);
  await sheet.getByRole("button", { name: "Back to the hall" }).click();

  await page.getByRole("button", { name: "Book scanner: scan a book cover" }).click();
  const scanner = page.getByRole("dialog", { name: "Book scanner" });
  await expect(scanner).toBeVisible();
  expect(await scanner.innerText()).not.toMatch(emoji);
});

// 24 books, so the opened bookcase fills several shelves
const MANY = Array.from({ length: 24 }, (_, i) => ({
  id: `many-${i}`,
  title: i === 0 ? "The Haunting of Hill House" : `Night Book ${i + 1}`,
  authors: ["C. Writer"],
  coverUrl: "",
}));

test.describe("an opened bookcase", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/books/search**", (route) => route.fulfill({ json: { books: MANY } }));
  });

  test("fills the library with a real bookcase: spines with readable titles on several uneven shelves", async ({ page }) => {
    const asked = page.waitForRequest((request) => request.url().includes("/api/books/search"));
    await page.getByRole("button", { name: "Horror bookcase" }).click();
    expect(new URL((await asked).url()).searchParams.get("limit")).toBe("24");

    const bookcase = page.getByRole("dialog", { name: "Horror" });
    await expect(bookcase).toBeVisible();
    // it covers the whole hall, once it has grown in
    const view = page.viewportSize();
    await expect.poll(async () => (await bookcase.boundingBox()).width).toBeGreaterThanOrEqual(view.width - 1);
    expect((await bookcase.boundingBox()).height).toBeGreaterThan(view.height - 10);

    const spine = bookcase.getByRole("button", { name: "The Haunting of Hill House by C. Writer" });
    await expect(spine).toBeVisible();
    await expect(spine).toContainText("The Haunting of Hill House");
    const size = await spine.locator("span").evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(size).toBeGreaterThanOrEqual(14);

    // all 24 books, on more than one shelf, and the shelves aren't all the same height
    await expect(bookcase.getByRole("button", { name: /by C\. Writer$/ })).toHaveCount(24);
    const heights = await bookcase.locator(".case__shelf").evaluateAll((shelves) => shelves.map((shelf) => shelf.offsetHeight));
    expect(heights.length).toBeGreaterThan(1);
    expect(new Set(heights).size).toBeGreaterThan(1);
  });

  test("turns its books face out with Covers, and back with Spines", async ({ page }) => {
    await page.getByRole("button", { name: "Fantasy bookcase" }).click();
    const bookcase = page.getByRole("dialog", { name: "Fantasy" });
    const spines = bookcase.getByRole("button", { name: "Spines" });
    const covers = bookcase.getByRole("button", { name: "Covers" });
    await expect(spines).toHaveAttribute("aria-pressed", "true");
    await expect(bookcase.locator(".case__spine").first()).toBeVisible();

    await covers.click();
    await expect(covers).toHaveAttribute("aria-pressed", "true");
    await expect(spines).toHaveAttribute("aria-pressed", "false");
    await expect(bookcase.locator(".case__spine")).toHaveCount(0);
    await expect(bookcase.locator(".case__cover")).toHaveCount(24);

    await spines.click();
    await expect(bookcase.locator(".case__cover")).toHaveCount(0);
  });

  test("a book slides out and opens its preview; Esc goes back to the hall", async ({ page }) => {
    await page.getByRole("button", { name: "Romance bookcase" }).click();
    const bookcase = page.getByRole("dialog", { name: "Romance" });
    await bookcase.getByRole("button", { name: "The Haunting of Hill House by C. Writer" }).click();
    const preview = page.getByRole("dialog", { name: "Quick preview: The Haunting of Hill House" });
    await expect(preview).toBeVisible();
    await preview.getByRole("button", { name: "Close", exact: true }).click();
    await expect(preview).toBeHidden();

    await bookcase.focus();
    await page.keyboard.press("Escape");
    await expect(bookcase).toBeHidden();
    await expect(page.getByRole("button", { name: "Romance bookcase" })).toBeFocused();
  });

  test("works on a phone too", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await (await openPlaces(page)).getByRole("button", { name: "Sci-Fi" }).click();
    await page.getByRole("button", { name: "Science Fiction bookcase" }).click();
    const bookcase = page.getByRole("dialog", { name: "Science Fiction" });
    await expect(bookcase.getByRole("button", { name: "Back to the hall" })).toBeVisible();
    await expect(bookcase.getByRole("button", { name: "Covers" })).toBeVisible();
    await expect(bookcase.getByRole("button", { name: "The Haunting of Hill House by C. Writer" })).toBeVisible();
    // nothing runs off the side of the screen
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});

test("the library always opens at its left end, with the help desk and the scanner in view", async ({ page }) => {
  const hall = page.getByRole("region", { name: /The library hall/ });
  await (await openPlaces(page)).getByRole("button", { name: "Graphic Novels" }).click();
  await expect(page.getByRole("button", { name: "Graphic Novels & Manga bookcase" })).toBeInViewport();
  await expect.poll(() => hall.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);

  // away to search and back, inside the app: the hall starts from the left again
  const search = page.getByRole("searchbox", { name: "Search books or authors" });
  await search.fill("dune");
  await search.press("Enter");
  await expect(page).toHaveURL(/\/search\?q=dune$/);
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page).toHaveURL(/\/library$/);
  await expect(page.getByRole("button", { name: "Help desk: search for any book" })).toBeInViewport();
  await expect(page.getByRole("button", { name: "Book scanner: scan a book cover" })).toBeInViewport();
  expect(await hall.evaluate((el) => el.scrollLeft)).toBe(0);
});

test("the help desk and the scanner say what they're for", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Help desk: search for any book" })).toContainText("Search for any book here");
  await expect(page.getByRole("button", { name: "Book scanner: scan a book cover" })).toContainText("Scan a book to find it");
  await expect(page.getByText("Search for any book here")).toBeVisible();
  await expect(page.getByText("Scan a book to find it")).toBeVisible();
});

test("on a phone, the library opens with the whole help desk in view, and its sign", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  const desk = page.getByRole("button", { name: "Help desk: search for any book" });
  await expect(desk).toBeInViewport({ ratio: 1 });
  await expect(page.getByText("Search for any book here")).toBeInViewport({ ratio: 1 });
});

test.describe("the Bestsellers bookcase", () => {
  const bestsellers = (source) => ({
    source,
    updatedAt: Date.now(),
    books: [
      { id: "best-1", title: "The Women", authors: ["Kristin Hannah"], coverUrl: "" },
      { id: "best-2", title: "Fourth Wing", authors: ["Rebecca Yarros"], coverUrl: "" },
    ],
  });

  test("stands first, by the help desk and the scanner", async ({ page }) => {
    const scanner = await page.getByRole("button", { name: "Book scanner: scan a book cover" }).boundingBox();
    const best = await page.getByRole("button", { name: "Bestsellers bookcase" }).boundingBox();
    const romance = await page.getByRole("button", { name: "Romance bookcase" }).boundingBox();
    expect(best.x).toBeGreaterThan(scanner.x);
    expect(best.x).toBeLessThan(romance.x);
    await expect(page.locator('[data-place="bestsellers"] .hall__sign')).toHaveText("Bestsellers");
    const places = await openPlaces(page);
    await expect(places.getByRole("region", { name: "Shelves" }).getByRole("button").first()).toHaveText("Bestsellers");
  });

  test("fills from this week's bestseller lists, and credits the New York Times", async ({ page }) => {
    let searched = false;
    await page.route("**/api/books/search**", (route) => {
      searched = true;
      return route.fulfill({ json: { books: [] } });
    });
    await page.route("**/api/books/bestsellers", (route) => route.fulfill({ json: bestsellers("nyt") }));
    await page.getByRole("button", { name: "Bestsellers bookcase" }).click();

    const bookcase = page.getByRole("dialog", { name: "Bestsellers" });
    await expect(bookcase.getByRole("button", { name: "The Women by Kristin Hannah" })).toBeVisible();
    await expect(bookcase.getByRole("button", { name: "Fourth Wing by Rebecca Yarros" })).toBeVisible();
    const credit = bookcase.getByRole("link", { name: /Data provided by The New York Times/ });
    await expect(credit).toHaveAttribute("href", "https://www.nytimes.com/books/best-sellers/");
    await expect(credit).toHaveAttribute("target", "_blank");
    expect(searched).toBe(false);

    await bookcase.getByRole("button", { name: "The Women by Kristin Hannah" }).click();
    await expect(page.getByRole("dialog", { name: "Quick preview: The Women" }).getByRole("button", { name: "Add to To be read" })).toBeVisible();
  });

  test("without the NYT, credits Open Library's trending list instead", async ({ page }) => {
    await page.route("**/api/books/bestsellers", (route) => route.fulfill({ json: bestsellers("openlibrary") }));
    await page.getByRole("button", { name: "Bestsellers bookcase" }).click();
    const bookcase = page.getByRole("dialog", { name: "Bestsellers" });
    await expect(bookcase.getByRole("link", { name: /Trending this week on Open Library/ })).toBeVisible();
  });

  test("when no list can be had, it says so and offers Retry, never made-up books", async ({ page }) => {
    let fail = true;
    await page.route("**/api/books/bestsellers", (route) =>
      fail ? route.fulfill({ status: 502, json: { error: "Couldn't load the bestsellers right now." } }) : route.fulfill({ json: bestsellers("nyt") })
    );
    await page.getByRole("button", { name: "Bestsellers bookcase" }).click();
    const bookcase = page.getByRole("dialog", { name: "Bestsellers" });
    await expect(bookcase.getByText("Couldn't load these books")).toBeVisible();
    fail = false;
    await bookcase.getByRole("button", { name: "Retry" }).click();
    await expect(bookcase.getByRole("button", { name: "The Women by Kristin Hannah" })).toBeVisible();
  });
});
