import { test, expect } from "#tests/playwright/fixtures/index.js";
import { PUBLIC_AUTHORITY_OPTIONS } from "#src/infrastructure/locales/constants.js";

test.describe("Add public authority", () => {
  test("renders expected public authority page heading, public authority options and continue button", async ({
    page,
  }) => {
    await page.goto("/apply/public-authority");

    const selectPublicAuthorityForm = await page.getByTestId(
      "add-public-authority-form",
    );

    const heading = page.getByRole("heading", {
      name: "Which public authorities are listed as interested parties?",
    });

    const continueButton = page.getByRole("button");

    await expect(heading).toBeVisible();
    await expect(continueButton).toBeVisible();

    for (const option of PUBLIC_AUTHORITY_OPTIONS) {
      const radio = await page.getByLabel(option.publicAuthorityDescription, {
        exact: true,
      });
      await expect(radio).toBeVisible();
    }
  });
});
