import { test as signedOut } from "@playwright/test";
import { expect, mockQuote, mockWeather, roomReady, skipMoodCheckIn, test } from "./fixtures.js";

// Every button in the app has the pixel look of My Room's sprites: square corners, a solid dark
// outline, a hard shadow with no blur, room for a thumb (44 px) and a label you can read on it.
// The invisible tap zones over the pixel art (marked data-hit) and cards that are a button (marked
// data-card) are left as they are. These checks read what's on screen, not how it's styled.
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

    const all = [...root.querySelectorAll("button, a.btn, [role='button']")];
    return all
      .filter((el) => !el.closest("[data-hit], [data-card]"))
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
