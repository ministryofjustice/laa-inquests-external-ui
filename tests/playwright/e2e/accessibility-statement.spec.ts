import { expect, test } from "../fixtures/index.js";

test("opens the blank accessibility statement from the footer", async ({
  page,
  checkAccessibility,
  authorizeStep,
}) => {
  await authorizeStep("/accessibility-statement");

  await page.goto("/accessibility-statement");

  expect(page.url()).toMatch(/\/accessibility-statement\/?$/);
  await expect(page.locator("main")).toHaveText("");

  await checkAccessibility();
});
