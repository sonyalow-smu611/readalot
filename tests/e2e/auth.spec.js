// Scaffolded with AI assistance — see AI_USAGE.md
import { expect, test } from "@playwright/test";

// Signing in, with no Supabase keys: the app's preview mode accepts any email and any code.
// These start signed out, so they use Playwright's own test, not the signed-in fixture.

test.describe("log in and register", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("log in shows the form over the town, and Show password reveals it", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    const password = page.getByLabel("Password", { exact: true });
    await expect(password).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Show password" }).click();
    await expect(password).toHaveAttribute("type", "text");
    await expect(page.getByRole("button", { name: "Hide password" })).toBeVisible();
  });

  test("a short password is turned away", async ({ page }) => {
    await page.getByLabel("Email").fill("reader@readalot.test");
    await page.getByLabel("Password", { exact: true }).fill("abc");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByRole("alert")).toHaveText("Use at least 6 characters.");
  });

  test("register checks the two passwords match", async ({ page }) => {
    await page.getByRole("link", { name: "Need a card? Register" }).click();
    await expect(page.getByRole("heading", { name: "Create your card" })).toBeVisible();
    await page.getByLabel("Email").fill("new@readalot.test");
    await page.getByLabel("Password", { exact: true }).fill("secret1");
    await page.getByLabel("Confirm password").fill("secret2");
    await page.getByRole("button", { name: "Register" }).click();
    await expect(page.getByRole("alert")).toHaveText("Those passwords do not match.");
  });

  test("log in, then any code, opens the app", async ({ page }) => {
    await page.getByLabel("Email").fill("reader@readalot.test");
    await page.getByLabel("Password", { exact: true }).fill("secret1");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
    for (const digit of [1, 2, 3, 4, 5, 6]) await page.getByLabel(`Digit ${digit}`).fill(String(digit));
    // the preview reader has no name yet, so Welcome comes next
    await expect(page.getByRole("heading", { name: "Your name" })).toBeVisible();
  });
});

test("a new reader picks a character during Welcome", async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem(
      "readalot-preview-user",
      JSON.stringify({ id: "new-reader", email: "new@readalot.test", user_metadata: {} }),
    );
  });
  await page.goto("/welcome");
  const next = page.getByRole("button", { name: "Next" });

  await page.getByLabel("Name").fill("Alex");
  await next.click();
  await page.getByRole("button", { name: "Prefer not to say" }).click();
  await next.click();
  await page.getByLabel("Age").fill("21");
  await next.click();
  await page.getByRole("button", { name: "Prefer not to say" }).click();
  await next.click();
  await page.getByRole("button", { name: "Fantasy" }).click();
  await next.click();

  await expect(page.getByRole("heading", { name: "Pick your character" })).toBeVisible();
  await expect(page.getByText("6 of 6")).toBeVisible();
  await expect(page.getByRole("radio", { name: "Rosie" })).toBeChecked();
  await page.getByRole("radio", { name: "Maya" }).check();
  await expect(page.getByRole("radio", { name: "Maya" })).toBeChecked();
  await page.getByRole("button", { name: "Finish" }).click();

  // Welcome drops the new reader into the town
  await expect(page).toHaveURL(/\/$/);
  const saved = await page.evaluate(
    () => JSON.parse(sessionStorage.getItem("readalot-preview-user")).user_metadata.character,
  );
  expect(saved).toMatchObject({ base: "maya", hair: "bun" });
});

test("a new reader registers, lands in the town, and the tour flies round the map", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Email").fill("brand-new@readalot.test");
  await page.getByLabel("Password", { exact: true }).fill("secret1");
  await page.getByLabel("Confirm password").fill("secret1");
  await page.getByRole("button", { name: "Register" }).click();
  for (const digit of [1, 2, 3, 4, 5, 6]) await page.getByLabel(`Digit ${digit}`).fill(String(digit));

  const next = page.getByRole("button", { name: "Next" });
  await page.getByLabel("Name").fill("Sam");
  await next.click();
  await page.getByRole("button", { name: "Prefer not to say" }).click();
  await next.click();
  await page.getByLabel("Age").fill("20");
  await next.click();
  await page.getByRole("button", { name: "Prefer not to say" }).click();
  await next.click();
  await page.getByRole("button", { name: "Mystery" }).click();
  await next.click();
  await page.getByRole("button", { name: "Finish" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Welcome to Readalot Town" })).toBeVisible();
  // the camera flies to each building in turn, then the town's buttons are pointed out
  for (const stop of ["Your house", "The library", "The cafe", "The hair salon", "Friends’ houses", "Places"]) {
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByRole("heading", { name: stop })).toBeVisible();
    // the building's own card stays closed so it doesn't cover the tour
    await expect(page.getByRole("button", { name: /^Enter|^Go inside|^Visit/ })).toHaveCount(0);
  }
  await page.getByRole("button", { name: "Skip" }).click();
  await expect(page.getByRole("heading", { name: "Places" })).toBeHidden();
});
