import { expect, mockWeather, skipMoodCheckIn, test } from "./fixtures.js";
for (const vp of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
  test("shot " + vp.width, async ({ page }) => {
    await page.setViewportSize(vp);
    await skipMoodCheckIn(page); await mockWeather(page);
    await page.goto("/books/demo-shelf-9");
    await expect(page.getByRole("region", { name: "Reviews" })).toBeVisible();
    await page.screenshot({ path: "/private/tmp/claude-501/-Users-aceslow-Downloads-Y2SEM1-WAD2-grp-proj-readalot/74e8bf54-81df-494f-bc1f-1c080a7848d7/scratchpad/book-" + vp.width + ".png" });
    const star = page.locator(".review-form__star").nth(3);
    await star.scrollIntoViewIfNeeded();
    await page.screenshot({ path: "/private/tmp/claude-501/-Users-aceslow-Downloads-Y2SEM1-WAD2-grp-proj-readalot/74e8bf54-81df-494f-bc1f-1c080a7848d7/scratchpad/book-" + vp.width + "-form.png" });
    const box = await star.boundingBox();
    const hit = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.outerHTML.slice(0, 120), [box.x + box.width / 2, box.y + box.height / 2]);
    console.log(vp.width, "BOX", JSON.stringify(box), "HIT", hit);
  });
}
