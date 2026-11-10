import { test, expect } from "../../fixtures/index.js";

test.describe("Claim - journey guard", () => {
  test("redirects to the declaration when check your answers is accessed before the journey starts", async ({
    page,
    authorizeStep,
  }) => {
    await authorizeStep("/claim");

    await page.goto("/claim/check-your-answers");

    await expect(page).toHaveURL(/\/claim\/?$/);
  });

  test("allows the search page after the declaration step is complete", async ({
    page,
    authorizeStep,
  }) => {
    await authorizeStep("/claim/search");

    await page.goto("/claim/search");

    await expect(page).toHaveURL(/\/claim\/search$/);
    await expect(page.getByTestId("case-search-form")).toBeVisible();
  });
});
