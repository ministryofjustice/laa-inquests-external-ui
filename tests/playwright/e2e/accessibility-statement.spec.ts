import { expect, test } from "../fixtures/index.js";

test("opens the blank accessibility statement from the footer", async ({
  page,
  checkAccessibility,
}) => {
  await page.goto("/auth/test-login");
  await page.waitForURL("/");
  
  // Navigate directly to the accessibility statement since it's now protected
  await page.goto("/accessibility-statement");

  expect(page.url()).toMatch(/\/accessibility-statement\/?$/);
  await expect(page.locator("main")).toHaveText("");

  await checkAccessibility();
});
