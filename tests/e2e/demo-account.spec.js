// Scaffolded with AI assistance — see AI_USAGE.md
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";
import { useRealApi } from "./fixtures.js";
import { hasSupabase, NEEDS_SUPABASE } from "./supabaseUser.js";

// The demo account (pnpm --filter readalot-server seed:demo): demo@demo.ikda.app, signed in with the code
// 111111 because no email is sent to a demo address. Needs the account seeded in the Supabase
// project the .env points at. Registering a demo-domain address goes through the API with Supabase
// on (useRealApi), and every account a test makes is deleted after it.
test.skip(!hasSupabase, NEEDS_SUPABASE);

const EMAIL = "demo@demo.ikda.app";
const PASSWORD = process.env.DEMO_PASSWORD || "Ikda-Demo-2026";

const admin = hasSupabase
  ? createClient(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

async function removeAccount(email) {
  const list = await admin.auth.admin.listUsers({ perPage: 1000 });
  const found = list.data?.users?.find((user) => user.email === email);
  if (!found) return;
  await admin.from("profiles").delete().eq("id", found.id);
  await admin.auth.admin.deleteUser(found.id);
}

const codeBoxes = (page) => page.getByRole("group", { name: "Verification code" }).locator("input");

async function enterCode(page, code) {
  await codeBoxes(page).first().click();
  await page.keyboard.type(code);
  await page.getByRole("button", { name: "Confirm code" }).click();
}

test.describe("the demo account", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(EMAIL);
    await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
  });

  test("the code screen says no email is sent and which code to enter", async ({ page }) => {
    await expect(page.getByText("Demo account: no email is sent. Enter the code 111111.")).toBeVisible();
  });

  test("a wrong code is turned away and the right one signs in to the town", async ({ page }) => {
    await enterCode(page, "123456");
    await expect(page.getByRole("alert")).toHaveText("That code is not right. The demo code is 111111.");
    await expect(page).toHaveURL(/\/verify/);

    for (let i = 0; i < 6; i += 1) await codeBoxes(page).nth(i).fill("");
    await enterCode(page, "111111");
    await expect(page).toHaveURL(/\/$/, { timeout: 20_000 });
    await expect(page.getByText("Jordan Lee")).toBeVisible({ timeout: 20_000 });
  });

  test("Resend starts as a 30 second countdown, sends nothing when it opens, and the code still works", async ({ page }) => {
    test.setTimeout(90_000);
    await expect(page.getByRole("button", { name: /Resend in \d+s/ })).toBeDisabled();
    const resend = page.getByRole("button", { name: "Resend code" });
    await expect(resend).toBeEnabled({ timeout: 40_000 });
    await resend.click();
    await expect(page.getByRole("button", { name: /Resend in \d+s/ })).toBeDisabled();
    await expect(page.getByRole("alert")).toHaveCount(0);
    await enterCode(page, "111111");
    await expect(page).toHaveURL(/\/$/, { timeout: 20_000 });
  });
});

test("a wrong password never gets to the code", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password", { exact: true }).fill("not-the-password");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test.describe("registering with a demo address", () => {
  const made = [];
  const newAddress = () => {
    const email = `prof.${randomUUID().slice(0, 8)}@demo.ikda.app`;
    made.push(email);
    return email;
  };
  const username = () => `prof.${randomUUID().replace(/-/g, "").slice(0, 8)}`;

  test.afterAll(async () => {
    for (const email of made) await removeAccount(email);
  });

  async function fillRegister(page, email, name = username()) {
    await page.goto("/register");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Username").fill(name);
    await page.getByLabel("Password", { exact: true }).fill("Maya1234");
    await page.getByLabel("Confirm password").fill("Maya1234");
    await page.getByRole("button", { name: "Register" }).click();
  }

  test("a new demo reader enters 111111 and reaches Welcome; a wrong code stays put", async ({ page }) => {
    await useRealApi(page);
    await fillRegister(page, newAddress());
    await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("Demo account: no email is sent. Enter the code 111111.")).toBeVisible();

    await enterCode(page, "000000");
    await expect(page.getByRole("alert")).toHaveText("That code is not right. The demo code is 111111.");

    for (let i = 0; i < 6; i += 1) await codeBoxes(page).nth(i).fill("");
    await enterCode(page, "111111");
    await expect(page).toHaveURL(/\/welcome/, { timeout: 20_000 });
  });

  test("the same address can't register twice", async ({ page, browser }) => {
    const email = newAddress();
    await useRealApi(page);
    await fillRegister(page, email);
    await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible({ timeout: 20_000 });

    const second = await (await browser.newContext()).newPage();
    await useRealApi(second);
    await fillRegister(second, email);
    await expect(second.getByRole("alert")).toHaveText("That email is already registered. Log in instead.");
    await expect(second).toHaveURL(/\/register/);
  });

  test("a demo reader logs in with their password and 111111, and a wrong password is refused", async ({ page }) => {
    const email = newAddress();
    await useRealApi(page);
    await fillRegister(page, email);
    await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible({ timeout: 20_000 });

    const again = await (await page.context().browser().newContext()).newPage();
    await again.goto("/login");
    await again.getByLabel("Email").fill(email);
    await again.getByLabel("Password", { exact: true }).fill("Wrong-pass1");
    await again.getByRole("button", { name: "Log in" }).click();
    await expect(again.getByRole("alert")).toBeVisible();
    await expect(again).toHaveURL(/\/login/);

    await again.getByLabel("Password", { exact: true }).fill("Maya1234");
    await again.getByRole("button", { name: "Log in" }).click();
    await expect(again.getByRole("heading", { name: "Check your email" })).toBeVisible();
    await enterCode(again, "111111");
    await expect(again).toHaveURL(/\/welcome/, { timeout: 20_000 });
  });

  test("an email that is not an address is turned away before anything is sent", async ({ page }) => {
    let apiCalls = 0;
    await page.route("**/api/demo-auth/**", (route) => {
      apiCalls += 1;
      return route.abort();
    });
    await fillRegister(page, "maya");
    await expect(page).toHaveURL(/\/register/);
    expect(apiCalls).toBe(0);
  });

  test("a password that is too short is turned away", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("Email").fill(newAddress());
    await page.getByLabel("Username").fill(username());
    await page.getByLabel("Password", { exact: true }).fill("abc");
    await page.getByLabel("Confirm password").fill("abc");
    await page.getByRole("button", { name: "Register" }).click();
    await expect(page.getByRole("alert")).toHaveText("Use at least 6 characters.");
  });
});

test.describe("every other address keeps the real emailed code", () => {
  test("registering with a normal address does not use the demo route and shows no demo line", async ({ page }) => {
    let demoCalls = 0;
    let signUps = 0;
    await page.route("**/api/demo-auth/**", (route) => {
      demoCalls += 1;
      return route.abort();
    });
    // Supabase's sign-up is answered here so no real email is sent and no real account is made
    await page.route("**/auth/v1/signup**", (route) => {
      signUps += 1;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: randomUUID(), email: "reader@example.org", identities: [{ id: "x" }] }),
      });
    });
    await page.goto("/register");
    await page.getByLabel("Email").fill("reader@example.org");
    await page.getByLabel("Username").fill(`real.${randomUUID().replace(/-/g, "").slice(0, 8)}`);
    await page.getByLabel("Password", { exact: true }).fill("Maya1234");
    await page.getByLabel("Confirm password").fill("Maya1234");
    await page.getByRole("button", { name: "Register" }).click();
    await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Demo account/)).toHaveCount(0);
    expect(demoCalls).toBe(0);
    expect(signUps).toBe(1);
  });

  test("111111 does not sign in a normal address", async ({ page }) => {
    let verifyBody = "";
    await page.route("**/auth/v1/signup**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: randomUUID(), email: "reader@example.org", identities: [{ id: "x" }] }),
      })
    );
    await page.route("**/auth/v1/verify**", (route) => {
      verifyBody = route.request().postData() || "";
      return route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({ code: 403, error_code: "otp_expired", msg: "Token has expired or is invalid" }),
      });
    });
    await page.goto("/register");
    await page.getByLabel("Email").fill("reader@example.org");
    await page.getByLabel("Username").fill(`real.${randomUUID().replace(/-/g, "").slice(0, 8)}`);
    await page.getByLabel("Password", { exact: true }).fill("Maya1234");
    await page.getByLabel("Confirm password").fill("Maya1234");
    await page.getByRole("button", { name: "Register" }).click();
    await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible({ timeout: 20_000 });
    await enterCode(page, "111111");
    // the code went to Supabase to be checked, which refused it: nothing is skipped for this address
    await expect(page.getByRole("alert")).toBeVisible();
    expect(verifyBody).toContain("111111");
    await expect(page).toHaveURL(/\/verify/);
  });
});
