import { test, expect } from "#tests/playwright/fixtures/index.js";

test.describe("Error pages", () => {
  test("renders the shared 404 page for an unknown route", async ({ page }) => {
    await page.goto("/route-that-does-not-exist");

    await expect(
      page.getByRole("heading", { level: 1, name: "404" }),
    ).toBeVisible();
    await expect(
      page.getByText("The page you are looking for could not be found."),
    ).toBeVisible();
  });
});
