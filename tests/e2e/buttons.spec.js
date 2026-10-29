import { test as signedOut } from "@playwright/test";
import { buy, expect, fromMenu, goToPlace, inventory, mockQuote, mockWeather, openShop, roomReady, skipMoodCheckIn, test } from "./fixtures.js";
import { createReader, hasSupabase, NEEDS_SUPABASE, signInPage } from "./supabaseUser.js";

// a brand-new reader, who hasn't filled in Welcome yet
const newReader = signedOut.extend({
  page: async ({ page }, use, testInfo) => {
    testInfo.skip(!hasSupabase, NEEDS_SUPABASE);
    const reader = await createReader({ profile: null });
    await signInPage(page, reader.session);
    await use(page);
    await reader.remove();
  },
});

// Every button in the app has the pixel look of My Room's sprites: square corners, a solid dark
// outline, a hard shadow with no blur, room for a thumb (44 px) and a label you can read on it.
// The invisible tap zones over the pixel art (marked data-hit) and cards that are a button (marked
// data-card) are left as they are; a button drawn inside a tap zone is marked data-button. These checks read what's on screen, not how it's styled.
test.use({ viewport: { width: 360, height: 720 } });

// The buttons in `scope` that don't have the look, each with what's wrong: [] when they all do.
function offLook(scope) {
  return scope.evaluate((root) => {
    const shadows = (value) => (value === "none" ? [] : value.split(/,(?![^(]*\))/).map((one) => one.trim()));
    const parse = (colour) => (colour.match(/[\d.]+/g) || []).map(Number);
    const luminance = ([r, g, b]) => {
      const lin = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
      return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    };
    // the colour behind an element: its own fill, or the nearest filled box behind it
    const fillBehind = (el) => {
      for (let node = el; node; node = node.parentElement) {
        const rgba = parse(getComputedStyle(node).backgroundColor);
        if (rgba.length === 3 || rgba[3] > 0.5) return rgba.slice(0, 3);
      }
      return [255, 255, 255];
    };
    const contrast = (a, b) => {
      const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };

    // a button drawn inside a tap zone (Move and Remove on a placed piece) is marked data-button
    const all = [...root.querySelectorAll("button, a.btn, [role='button'], [data-button]")];
    return all
      .filter((el) => el.matches("[data-button]") || !el.closest("[data-hit], [data-card]"))
      .filter((el) => {
        const box = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return box.width > 0 && box.height > 0 && style.visibility !== "hidden" && style.display !== "none";
      })
      .map((el) => {
        const style = getComputedStyle(el);
        const box = el.getBoundingClientRect();
        const wrong = [];
        const radii = ["TopLeft", "TopRight", "BottomLeft", "BottomRight"].map((c) => parseFloat(style[`border${c}Radius`]));
        if (radii.some((r) => r > 0)) wrong.push("rounded corners");
        const sides = ["Top", "Right", "Bottom", "Left"];
        const quiet = parse(style.backgroundColor)[3] === 0 && sides.every((s) => style[`border${s}Style`] === "none" || parseFloat(style[`border${s}Width`]) === 0);
        if (!quiet && !sides.every((s) => style[`border${s}Style`] === "solid" && parseFloat(style[`border${s}Width`]) >= 2)) wrong.push("no 2 px solid outline");
        const drop = shadows(style.boxShadow).filter((one) => !one.includes("inset"));
        if (!quiet && !el.disabled && !drop.length) wrong.push("no pixel shadow");
        if (shadows(style.boxShadow).some((one) => (one.match(/-?[\d.]+px/g) || [])[2] && parseFloat(one.match(/-?[\d.]+px/g)[2]) > 0)) wrong.push("blurred shadow");
        if (box.height < 44 || box.width < 44) wrong.push(`smaller than 44 px (${Math.round(box.width)}×${Math.round(box.height)})`);
        if (el.textContent.trim() && !el.disabled) {
          const ratio = contrast(parse(style.color).slice(0, 3), fillBehind(el));
          if (ratio < 4.5) wrong.push(`label contrast ${ratio.toFixed(2)}`);
        }
        const name = el.getAttribute("aria-label") || el.textContent.trim().replace(/\s+/g, " ") || el.outerHTML.slice(0, 60);
        return wrong.length ? { button: name, wrong } : null;
      })
      .filter(Boolean);
  });
}

test.describe("shared pop-ups", () => {
  test("the mood check-in's buttons are pixel buttons", async ({ page }) => {
    await mockWeather(page);
    await page.goto("/house");
    const dialog = page.getByRole("dialog", { name: "How are you feeling today?" });
    await expect(dialog).toBeVisible();
    expect(await offLook(dialog)).toEqual([]);
  });

  test("the mood result's buttons are pixel buttons", async ({ page }) => {
    await mockWeather(page);
    const walden = {
      mood: "calm", category: "nature", workId: "work-walden",
      book: { id: "work-walden", title: "Walden", authors: ["Henry David Thoreau"], coverUrl: "" },
      quote: { quoteText: "I went to the woods because I wished to live deliberately.", author: "Henry David Thoreau", work: "Walden" },
    };
    await page.route("**/api/recommendations*", (route) => route.fulfill({ json: walden }));
    await page.goto("/house");
    const checkIn = page.getByRole("dialog", { name: "How are you feeling today?" });
    await checkIn.getByRole("button", { name: /^Calm/ }).click();
    await checkIn.getByRole("button", { name: "Continue" }).click();
    const result = page.getByRole("dialog", { name: "A book for your mood" });
    await expect(result.getByRole("heading", { name: "Walden" })).toBeVisible();
    expect(await offLook(result)).toEqual([]);
  });

  test("the quote of the day's buttons are pixel buttons", async ({ page }) => {
    await skipMoodCheckIn(page);
    await mockWeather(page);
    await mockQuote(page);
    await page.goto("/house");
    await roomReady(page);
    await page.getByRole("button", { name: "Quote of the day" }).click();
    const quote = page.getByRole("dialog", { name: /quote/i });
    await expect(quote.getByText("So many books, so little time.")).toBeVisible();
    expect(await offLook(quote)).toEqual([]);
  });

  test("the remove-book question's buttons are pixel buttons", async ({ page }) => {
    await skipMoodCheckIn(page);
    await mockWeather(page);
    await page.goto("/house");
    await roomReady(page);
    await page.getByRole("button", { name: "The Hobbit by J.R.R. Tolkien" }).click();
    await page.getByRole("button", { name: "Remove from shelf" }).click();
    const ask = page.getByRole("alertdialog");
    await expect(ask.getByRole("button", { name: "Yes, remove" })).toBeVisible();
    expect(await offLook(ask)).toEqual([]);
  });
});

test.describe("states", () => {
  test("a disabled button is flat, and the keyboard's focus shows a chunky ring", async ({ page }) => {
    await mockWeather(page);
    await page.goto("/house");
    const checkIn = page.getByRole("dialog", { name: "How are you feeling today?" });
    const go = checkIn.getByRole("button", { name: "Continue" });
    await expect(go).toBeDisabled();
    expect(await go.evaluate((el) => getComputedStyle(el).boxShadow)).toBe("none");

    await checkIn.getByRole("button", { name: /^Calm/ }).focus();
    await page.keyboard.press("Tab");
    const ring = await page.evaluate(() => {
      const style = getComputedStyle(document.activeElement);
      return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
    });
    expect(ring.style).toBe("solid");
    expect(ring.width).toBeGreaterThanOrEqual(3);
  });
});

test.describe("shared pages", () => {
  test("a book's page has pixel buttons", async ({ page }) => {
    await page.goto("/books/demo-shelf-1");
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    expect(await offLook(page.locator("main").first())).toEqual([]);
  });

  test("a genre shelf has pixel buttons", async ({ page }) => {
    const books = ["Dune", "Emma", "Ivanhoe"].map((title, i) => ({
      id: `genre-${i}`, title, authors: ["A. Writer"], coverUrl: "", ratingsCount: i, pageCount: 100, averageRating: 4,
    }));
    await page.route("**/api/books/search**", (route) => route.fulfill({ json: { books } }));
    await page.goto("/discover/fantasy");
    await expect(page.getByText("Dune").first()).toBeVisible();
    expect(await offLook(page.locator("body"))).toEqual([]);
  });

  test("the mood page's sticker button is a pixel button", async ({ page }) => {
    await page.goto("/mood");
    await expect(page.getByRole("button", { name: /Another quote/ })).toBeVisible();
    expect(await offLook(page.locator("main").first())).toEqual([]);
  });

  test("search has pixel buttons", async ({ page }) => {
    await page.route("**/api/books/search**", (route) => route.fulfill({ json: { books: [] } }));
    await page.goto("/search");
    await expect(page.getByRole("searchbox").or(page.getByRole("textbox")).first()).toBeVisible();
    expect(await offLook(page.locator("body"))).toEqual([]);
  });
});

signedOut.describe("signed out", () => {
  signedOut.use({ viewport: { width: 360, height: 720 } });

  signedOut("log in has pixel buttons", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    expect(await offLook(page.locator("body"))).toEqual([]);
  });

  signedOut("verify has pixel buttons", async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem("readalot-pending-auth", JSON.stringify({ email: "reader@readalot.test", purpose: "signup" }));
    });
    await page.goto("/verify");
    await expect(page.getByRole("heading").first()).toBeVisible();
    expect(await offLook(page.locator("body"))).toEqual([]);
  });
});

newReader.describe("a new reader", () => {
  newReader.use({ viewport: { width: 360, height: 720 } });

  newReader("Welcome has pixel buttons on every step", async ({ page }) => {
    const next = page.getByRole("button", { name: "Next" });
    await page.goto("/welcome");
    await page.getByLabel("Name").fill("Alex");
    expect(await offLook(page.locator("body"))).toEqual([]);
    await next.click();
    await page.getByRole("button", { name: "Prefer not to say" }).click();
    expect(await offLook(page.locator("body"))).toEqual([]);
    await next.click();
    await page.getByLabel("Age").fill("21");
    await next.click();
    await page.getByRole("button", { name: "Prefer not to say" }).click();
    await next.click();
    await page.getByRole("button", { name: "Fantasy" }).click();
    expect(await offLook(page.locator("body"))).toEqual([]);
    await next.click();
    await expect(page.getByRole("heading", { name: "Pick your character" })).toBeVisible();
    expect(await offLook(page.locator("body"))).toEqual([]);
  });
});

test.describe("the house", () => {
  test.beforeEach(async ({ page }) => {
    await skipMoodCheckIn(page);
    await mockWeather(page);
    await mockQuote(page);
  });

  test("My Room has pixel buttons", async ({ page }) => {
    await page.goto("/house");
    await roomReady(page);
    expect(await offLook(page.locator("body"))).toEqual([]);
  });

  test("the Places menu has pixel buttons", async ({ page }) => {
    await page.goto("/house");
    await roomReady(page);
    await page.getByRole("button", { name: "Places" }).click();
    const places = page.getByRole("navigation", { name: "Places in the room" });
    await expect(places).toBeVisible();
    expect(await offLook(places)).toEqual([]);
  });

  test("the room menu, the Shop, buying and the Inventory have pixel buttons", async ({ page }) => {
    await page.goto("/house");
    await roomReady(page);
    await page.getByRole("button", { name: "Room menu" }).click();
    await expect(page.getByRole("button", { name: "Shop", exact: true })).toBeVisible();
    await expect.poll(() => offLook(page.locator("body"))).toEqual([]);

    const shop = await openShop(page);
    await expect(shop).toBeVisible();
    await expect.poll(() => offLook(page.locator("body"))).toEqual([]);

    await shop.getByRole("button", { name: /Mountain poster/ }).click();
    const ask = page.getByRole("dialog", { name: /Buy Mountain poster/ });
    await expect(ask).toBeVisible();
    await expect.poll(() => offLook(ask)).toEqual([]);

    await ask.getByRole("button", { name: "Confirm" }).click();
    await fromMenu(page, "Inventory");
    await expect(inventory(page)).toBeVisible();
    await expect.poll(() => offLook(page.locator("body"))).toEqual([]);
  });

  test("placing, Move and Remove on a placed piece, and the moving bar have pixel buttons", async ({ page }) => {
    await page.goto("/house");
    await roomReady(page);
    await buy(page, "Mountain poster");
    await fromMenu(page, "Inventory");
    await inventory(page).getByRole("button", { name: /Mountain poster/ }).click();
    const placing = page.getByRole("status").filter({ hasText: "Tap a glowing spot" });
    await expect(placing).toBeVisible();
    expect(await offLook(placing)).toEqual([]);

    await goToPlace(page, "Chair");
    await page.getByRole("button", { name: "Put Mountain poster on the wall by the reading chair" }).click();
    const poster = page.getByRole("button", { name: "Mountain poster", exact: true });
    await poster.click();
    await expect(poster.getByText("Remove")).toBeVisible();
    expect(await offLook(poster)).toEqual([]);

    await poster.getByText("Move", { exact: true }).click();
    const bar = page.getByRole("group", { name: "Moving Mountain poster" });
    await expect(bar).toBeVisible();
    expect(await offLook(bar)).toEqual([]);
  });

  test("a book's card in the room has pixel buttons", async ({ page }) => {
    await page.goto("/house");
    await roomReady(page);
    await page.getByRole("button", { name: "The Hobbit by J.R.R. Tolkien" }).click();
    const card = page.getByRole("dialog", { name: "Book details" });
    await expect(card.getByRole("button", { name: "Remove from shelf" })).toBeVisible();
    await expect.poll(() => offLook(card)).toEqual([]);
  });

  test("My Shelf has pixel buttons", async ({ page }) => {
    await page.goto("/house/shelf");
    await expect(page.getByRole("region", { name: /^To be read, \d+ books?$/ })).toBeVisible();
    expect(await offLook(page.locator("body"))).toEqual([]);
  });

  test("a visited room, its note card and its notice board have pixel buttons", async ({ page }) => {
    await page.goto("/people/reader-emma/room");
    await roomReady(page);
    expect(await offLook(page.locator("body"))).toEqual([]);

    await page.getByRole("button", { name: "Leave a note" }).click();
    const card = page.getByRole("dialog", { name: "Leave a note for Emma" });
    await card.getByRole("textbox", { name: "Your note" }).fill("Loved your shelf!");
    await expect.poll(() => offLook(card)).toEqual([]);
    await card.getByRole("button", { name: "Post note" }).click();
    await expect(card).toBeHidden();

    await goToPlace(page, "Corkboard");
    await page.getByRole("button", { name: "Notice board" }).click();
    const board = page.getByRole("dialog", { name: "Notice board" });
    await expect(board.getByText("Loved your shelf!")).toBeVisible();
    await expect.poll(() => offLook(board)).toEqual([]);
  });

  test("the Currently reading card has pixel buttons", async ({ page }) => {
    await page.goto("/house");
    await roomReady(page);
    await page.getByRole("button", { name: /^Currently reading/ }).click();
    const card = page.getByRole("dialog", { name: "Currently reading" });
    await expect(card.getByRole("button", { name: "Close" })).toBeVisible();
    await expect.poll(() => offLook(card)).toEqual([]);
  });
});
