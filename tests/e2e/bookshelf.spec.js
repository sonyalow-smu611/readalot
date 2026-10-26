import { expect, test } from "./fixtures.js";

// What happens to a book taken off the bookshelf, shelf by shelf. Saves are answered here, so
// the shared demo shelf stays as it was for the other tests; `saves` records what was sent.
let saves;

test.beforeEach(async ({ page }) => {
  saves = [];
  await page.addInitScript(() => {
    // today's mood check-in already answered, so it does not open over the room
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    localStorage.setItem("readalot.moodCheckIn", `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
  });
  await page.route("**/api/user-books/*", (route) => {
    saves.push({ id: route.request().url().split("/").pop(), ...route.request().postDataJSON() });
    return route.fulfill({ json: { userBook: {} } });
  });
  await page.goto("/house");
});

async function turnToBookshelf(page) {
  // the room has loaded in 3D once the bookcase has its button; before that, Bookshelf in the
  // bar of places lists the books instead of turning to them
  await expect(page.getByRole("button", { name: /^Bookshelf, \d+ books$/ })).toBeVisible();
  await page.getByRole("navigation", { name: "Places in the room" }).getByRole("button", { name: "Bookshelf" }).click();
  // let the turn finish
  await page.waitForTimeout(900);
}

// A plain magenta picture, made in the page: nothing else in the room is that colour.
async function magentaPng(page) {
  const url = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 96;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ff00ff";
    ctx.fillRect(0, 0, 64, 96);
    return canvas.toDataURL("image/png");
  });
  return Buffer.from(url.split(",")[1], "base64");
}

// how many magenta pixels a screenshot of the page has
async function magentaIn(page, shot) {
  return page.evaluate(async (data) => {
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0);
    const { data: pixels } = ctx.getImageData(0, 0, image.width, image.height);
    let count = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      // magenta, however the room's light falls on it: red and blue alike, no green
      const [r, g, b] = [pixels[i], pixels[i + 1], pixels[i + 2]];
      if (r > 80 && b > 80 && g < 30 && Math.abs(r - b) < 40) count += 1;
    }
    return count;
  }, shot.toString("base64"));
}

// The Hobbit, given a cover picture on another site; `loads` says whether the room gets it (a
// site that does not allow the room to use its pictures fails the same way)
async function hobbitWithCover(page, { loads }) {
  const png = await magentaPng(page);
  await page.route("**/api/user-books", async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    const response = await route.fetch();
    const { books } = await response.json();
    const covered = books.map((book) =>
      book.id === "demo-shelf-2" ? { ...book, cover: "https://covers.example.test/hobbit.png" } : book
    );
    return route.fulfill({ response, json: { books: covered } });
  });
  await page.route("https://covers.example.test/**", (route) =>
    loads
      ? route.fulfill({ contentType: "image/png", headers: { "Access-Control-Allow-Origin": "*" }, body: png })
      : route.abort("accessdenied")
  );
  await page.reload();
  await turnToBookshelf(page);
}

// Takes screenshots while the book comes out; the most magenta any of them had.
async function mostMagentaWhileOpening(page) {
  let most = 0;
  for (let i = 0; i < 18; i += 1) {
    most = Math.max(most, await magentaIn(page, await page.screenshot()));
    await page.waitForTimeout(60);
  }
  return most;
}

// Books opened straight off the bookcase in the 3D room. Every book is a labelled button over
// its spine, so the room's books can be reached like any other button.
test.describe("from the room", () => {
  test.beforeEach(async ({ page }) => {
    await turnToBookshelf(page);
  });

  test("each shelf has a labelled row of its own: To be read, then Reading, then Finished", async ({ page }) => {
    const { books } = await (await page.request.get("/api/user-books")).json();
    const shelves = ["want_to_read", "reading", "read"];
    const bottoms = await Promise.all(
      shelves.map((status) =>
        Promise.all(
          books
            .filter((book) => book.status === status)
            .map(async (book) => {
              const box = await page.getByRole("button", { name: `${book.title} by ${book.authors[0]}` }).boundingBox();
              return box.y + box.height;
            })
        )
      )
    );

    for (const [row, status] of shelves.entries()) {
      // a shelf's books all stand on the same board, below the shelf before it
      expect(Math.max(...bottoms[row]) - Math.min(...bottoms[row])).toBeLessThan(12);
      if (row > 0) expect(Math.min(...bottoms[row])).toBeGreaterThan(Math.max(...bottoms[row - 1]));

      // and the shelf is named, with how many books are on it
      const count = bottoms[row].length;
      const name = ["To be read", "Reading", "Finished"][row];
      await expect(page.getByText(`${name} shelf, ${count} ${count === 1 ? "book" : "books"}`)).toHaveCount(1);
    }
  });

  test("a book lifts up and out of the shelf while pointed at, and settles back after", async ({ page }) => {
    const book = page.getByRole("button", { name: "Circe by Madeline Miller" });
    const box = await book.boundingBox();
    // the spine and a little round it, where the book moves to
    const clip = { x: box.x - 10, y: box.y - 20, width: box.width + 20, height: box.height + 30 };
    const before = await page.screenshot({ clip });

    await book.hover();
    await page.waitForTimeout(500);
    expect((await page.screenshot({ clip })).equals(before)).toBe(false);

    await page.mouse.move(5, 5);
    await expect.poll(async () => (await page.screenshot({ clip })).equals(before), { timeout: 3000 }).toBe(true);
  });

  test("books vary in size, and each keeps its size from one visit to the next", async ({ page }) => {
    const sizes = async () =>
      Promise.all(
        ["The Hobbit by J.R.R. Tolkien", "Circe by Madeline Miller", "Dune by Frank Herbert", "Gone Girl by Gillian Flynn"].map(
          async (name) => {
            const box = await page.getByRole("button", { name }).boundingBox();
            return Math.round(box.height);
          }
        )
      );
    const first = await sizes();
    expect(new Set(first).size).toBeGreaterThan(1);

    await page.reload();
    await turnToBookshelf(page);
    expect(await sizes()).toEqual(first);
  });

  test("a tapped book comes off the shelf and opens before its details show", async ({ page }) => {
    await page.getByRole("button", { name: "The Hobbit by J.R.R. Tolkien" }).click();

    const details = page.getByRole("dialog", { name: "Book details" });
    expect(await details.count()).toBe(0);
    await expect(details).toBeVisible({ timeout: 8000 });
  });

  test("a tap while the book comes out skips to it open", async ({ page }) => {
    await page.getByRole("button", { name: "The Hobbit by J.R.R. Tolkien" }).click();
    const view = page.viewportSize();
    await page.mouse.click(view.width / 2, view.height / 3);

    await expect(page.getByRole("dialog", { name: "Book details" })).toBeVisible({ timeout: 1000 });
  });

  test("with reduced motion the details show at once", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.getByRole("button", { name: "The Hobbit by J.R.R. Tolkien" }).click();

    await expect(page.getByRole("dialog", { name: "Book details" })).toBeVisible({ timeout: 300 });
  });

  test("the room stays put while a book is out", async ({ page }) => {
    const circe = page.getByRole("button", { name: "Circe by Madeline Miller" });
    const before = await circe.boundingBox();
    await page.getByRole("button", { name: "The Hobbit by J.R.R. Tolkien" }).click();
    // a drag across the room while the book comes out
    await page.mouse.move(100, 200);
    await page.mouse.down();
    await page.mouse.move(300, 260, { steps: 8 });
    await page.mouse.up();
    await page.getByRole("button", { name: "Close book" }).click();

    await expect(page.getByRole("dialog", { name: "Book details" })).toBeHidden();
    await expect.poll(async () => (await circe.boundingBox())?.x, { timeout: 8000 }).toBeCloseTo(before.x, 0);
  });

  test("a book started while open goes back on the Reading shelf", async ({ page }) => {
    const bottom = async (name) => {
      const box = await page.getByRole("button", { name }).boundingBox();
      return box.y + box.height;
    };
    const reading = await bottom("Norwegian Wood by Haruki Murakami");
    expect(Math.abs((await bottom("The Hobbit by J.R.R. Tolkien")) - reading)).toBeGreaterThan(40);

    await page.getByRole("button", { name: "The Hobbit by J.R.R. Tolkien" }).click();
    await page.getByRole("dialog", { name: "Book details" }).getByRole("button", { name: "Reading", exact: true }).click();
    await page.getByRole("button", { name: "Close book" }).click();

    await expect
      .poll(async () => Math.abs((await bottom("The Hobbit by J.R.R. Tolkien")) - reading), { timeout: 8000 })
      .toBeLessThan(12);
    await expect(page.getByText("Reading shelf, 2 books")).toHaveCount(1);
  });

  test("a book's own cover is on its front as it comes off the shelf", async ({ page }) => {
    // many screenshots, each checked pixel by pixel
    test.slow();
    await hobbitWithCover(page, { loads: true });
    await page.getByRole("button", { name: "The Hobbit by J.R.R. Tolkien" }).click();

    expect(await mostMagentaWhileOpening(page)).toBeGreaterThan(2000);
    await expect(page.getByRole("dialog", { name: "Book details" })).toBeVisible({ timeout: 8000 });
  });

  test("a cover picture that will not load leaves the cloth cover, and the book still opens", async ({ page }) => {
    test.slow();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await hobbitWithCover(page, { loads: false });
    await page.getByRole("button", { name: "The Hobbit by J.R.R. Tolkien" }).click();

    expect(await mostMagentaWhileOpening(page)).toBeLessThan(200);
    await expect(page.getByRole("dialog", { name: "Book details" })).toBeVisible({ timeout: 8000 });
    expect(errors).toEqual([]);
  });

  test("tapping a book on the bookcase opens its details", async ({ page }) => {
    await page.getByRole("button", { name: "The Hobbit by J.R.R. Tolkien" }).click();

    const details = page.getByRole("dialog", { name: "Book details" });
    await expect(details.getByRole("heading", { name: "The Hobbit" })).toBeVisible();
    await expect(details.getByText("A comfort-loving hobbit is swept into a quest to win back a dragon's hoard.")).toBeVisible();
  });

  test("Close book puts the details away and goes back to that book", async ({ page }) => {
    const book = page.getByRole("button", { name: "The Hobbit by J.R.R. Tolkien" });
    await book.click();
    await page.getByRole("button", { name: "Close book" }).click();

    await expect(page.getByRole("dialog", { name: "Book details" })).toBeHidden();
    await expect(book).toBeFocused();
  });

  test("a book can be opened and put away from the keyboard", async ({ page }) => {
    const book = page.getByRole("button", { name: "The Hobbit by J.R.R. Tolkien" });
    await book.focus();
    await page.keyboard.press("Enter");

    const details = page.getByRole("dialog", { name: "Book details" });
    await expect(details).toBeFocused();
    await page.keyboard.press("Escape");

    await expect(details).toBeHidden();
    await expect(book).toBeFocused();
  });

  test("a tap outside puts the details away without opening what was under it", async ({ page }) => {
    await page.getByRole("button", { name: "The Hobbit by J.R.R. Tolkien" }).click();
    const details = page.getByRole("dialog", { name: "Book details" });
    await expect(details).toBeVisible();

    // just above the details, over the bookcase
    const box = await details.boundingBox();
    await page.mouse.click(box.x + box.width / 2, box.y - 12);

    await expect(details).toBeHidden();
    // and nothing tapped through it opens instead
    await page.waitForTimeout(300);
    await expect(details).toBeHidden();
    await expect(page.getByRole("button", { name: "Back" })).toBeHidden();
  });

  test("the details lead to the book's own page", async ({ page }) => {
    await page.getByRole("button", { name: "The Hobbit by J.R.R. Tolkien" }).click();
    await page.getByRole("dialog", { name: "Book details" }).getByRole("link", { name: "Open book page" }).click();

    await expect(page).toHaveURL(/\/books\/demo-shelf-2$/);
    // the page is the same card: the book, and which shelf it is on
    await expect(page.getByRole("heading", { level: 1, name: "The Hobbit" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Want to read" })).toHaveAttribute("aria-pressed", "true");

    // and its close button goes back to the room
    await page.getByRole("button", { name: "Back" }).click();
    await expect(page).toHaveURL(/\/house$/);
  });

  test("a book can be removed from the shelf, and Undo puts it back", async ({ page }) => {
    await page.route("**/api/user-books/demo-shelf-2", (route) =>
      route.request().method() === "DELETE" ? route.fulfill({ status: 204 }) : route.fallback()
    );
    await page.route("**/api/user-books", (route) =>
      route.request().method() === "POST" ? route.fulfill({ json: { userBook: {} } }) : route.fallback()
    );
    await page.getByRole("button", { name: "The Hobbit by J.R.R. Tolkien" }).click();
    await page.getByRole("button", { name: "Remove from shelf" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Yes, remove" }).click();

    await expect(page.getByRole("dialog", { name: "Book details" })).toBeHidden();
    await expect(page.getByRole("button", { name: "The Hobbit by J.R.R. Tolkien" })).toHaveCount(0);
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.getByRole("button", { name: "The Hobbit by J.R.R. Tolkien" })).toHaveCount(1);
  });

  test("a To read book can be started, which makes it a Reading book", async ({ page }) => {
    await page.getByRole("button", { name: "The Hobbit by J.R.R. Tolkien" }).click();
    await page.getByRole("dialog", { name: "Book details" }).getByRole("button", { name: "Reading", exact: true }).click();

    await expect.poll(() => saves).toEqual([{ id: "demo-shelf-2", status: "reading" }]);
    // Reading is now the chosen shelf, and the progress slider pops up under it
    await expect(
      page.getByRole("dialog", { name: "Book details" }).getByRole("button", { name: "Reading", exact: true })
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("slider")).toHaveValue("0");
  });

  test("a Reading book has a progress slider and can be finished", async ({ page }) => {
    await page.getByRole("button", { name: "Norwegian Wood by Haruki Murakami" }).click();

    const slider = page.getByRole("slider");
    await expect(slider).toHaveValue("42");
    await slider.fill("80");
    await expect(page.getByText("80% read")).toBeVisible();
    await expect.poll(() => saves).toEqual([{ id: "demo-shelf-1", progress: 80 }]);

    await page.getByRole("button", { name: "Finished reading" }).click();
    await expect.poll(() => saves.at(-1)).toEqual({ id: "demo-shelf-1", status: "read", progress: 100 });

    // a Finished book that has not been reviewed or rated offers both, on the book's page
    await expect(page.getByRole("link", { name: "Review" })).toHaveAttribute("href", "/books/demo-shelf-1");
    await expect(page.getByRole("link", { name: "Rate" })).toHaveAttribute("href", "/books/demo-shelf-1");
  });

  test("a Finished book leads to its page to review and rate", async ({ page }) => {
    await page.getByRole("button", { name: "Pride and Prejudice by Jane Austen" }).click();

    await expect(page.getByRole("link", { name: "Rate" })).toBeVisible();
    await page.getByRole("link", { name: "Review" }).click();

    await expect(page).toHaveURL(/\/books\/demo-shelf-7$/);
    await expect(page.getByRole("dialog", { name: "Book details" })).toBeHidden();
  });

  test("a Finished book already reviewed and rated offers to view them", async ({ page }) => {
    await page.route("**/api/user-books", async (route) => {
      const response = await route.fetch();
      const { books } = await response.json();
      const reviewed = books.map((book) =>
        book.id === "demo-shelf-7" ? { ...book, reviewed: true, myRating: 5 } : book
      );
      return route.fulfill({ response, json: { books: reviewed } });
    });
    await page.reload();
    await turnToBookshelf(page);

    await page.getByRole("button", { name: "Pride and Prejudice by Jane Austen" }).click();

    await expect(page.getByRole("link", { name: "View review and rating" })).toHaveAttribute(
      "href",
      "/books/demo-shelf-7"
    );
    await expect(page.getByRole("link", { name: "Review", exact: true })).toHaveCount(0);
  });
});

// On a device that cannot draw 3D the room is a still picture, so the books are listed instead.
test.describe("without 3D", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (kind, ...rest) {
        return /webgl/.test(kind) ? null : getContext.call(this, kind, ...rest);
      };
    });
    await page.reload();
  });

  test("Bookshelf lists the books by shelf, and each opens its details", async ({ page }) => {
    await page.getByRole("navigation", { name: "Places in the room" }).getByRole("button", { name: "Bookshelf" }).click();

    const list = page.getByRole("dialog", { name: "Your books" });
    for (const shelf of ["Reading", "To read", "Finished"]) {
      await expect(list.getByRole("heading", { name: shelf })).toBeVisible();
    }
    const book = list.getByRole("button", { name: "The Hobbit by J.R.R. Tolkien" });
    await book.click();

    const details = page.getByRole("dialog", { name: "Book details" });
    await expect(details.getByRole("heading", { name: "The Hobbit" })).toBeVisible();
    await page.getByRole("dialog", { name: "Book details" }).getByRole("button", { name: "Reading", exact: true }).click();
    await expect.poll(() => saves).toEqual([{ id: "demo-shelf-2", status: "reading" }]);

    await page.getByRole("button", { name: "Close book" }).click();
    await expect(details).toBeHidden();
    await expect(book).toBeFocused();
  });

  test("an empty shelf says how to add the first book", async ({ page }) => {
    await page.route("**/api/user-books", (route) => route.fulfill({ json: { books: [] } }));
    await page.reload();
    await page.getByRole("navigation", { name: "Places in the room" }).getByRole("button", { name: "Bookshelf" }).click();

    const list = page.getByRole("dialog", { name: "Your books" });
    await expect(list.getByText("Add your first book")).toBeVisible();
    await expect(list.getByRole("link", { name: "Scan a cover" })).toHaveAttribute("href", "/scan");
  });
});
