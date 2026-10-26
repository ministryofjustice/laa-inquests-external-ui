import { expect, test } from "../fixtures/index.js";

test("opens the blank accessibility statement from the footer", async ({
  page,
  checkAccessibility,
}) => {
  const [response] = await Promise.all([
    page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/accessibility-statement" &&
        response.request().isNavigationRequest(),
    ),
    page
      .getByRole("link", { name: "Accessibility statement", exact: true })
      .click(),
  ]);

  expect(response.status()).toBe(200);
  await expect(page).toHaveURL(/\/accessibility-statement\/?$/);
  await expect(page.locator("main")).toHaveText("");

  await checkAccessibility();
});
