import { test } from "./fixtures.js";
for (const [w, h, tag] of [[1280, 800, "laptop"], [390, 844, "phone"]]) {
  test(`shots ${tag}`, async ({ page }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width: w, height: h });
    for (const path of ["/salon", "/cafe", "/library", "/house"]) {
      await page.goto(path);
      await page.waitForTimeout(7000);
      await page.screenshot({ path: `test-results/shot-${tag}-${path.slice(1)}.png` });
    }
    await page.goto("/salon");
    await page.waitForTimeout(1500);
    await page.getByRole("tab", { name: "Profile" }).click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: `test-results/shot-${tag}-profile.png` });
    await page.goto("/welcome");
  });
}
