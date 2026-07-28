import { test, expect } from "#tests/playwright/fixtures/index.js";
import { PUBLIC_AUTHORITY_OPTIONS } from "#src/infrastructure/locales/constants.js";

test.describe("Add public authority", () => {
  test("renders expected public authority page heading, public authority options and continue button", async ({
    page,
  }) => {
    await page.goto("/apply/public-authority");

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

  test("redirects to upload coroner's letter after selecting a public authority", async ({
    page,
  }) => {
    await page.goto("/apply/public-authority");

    await page.getByLabel("Cabinet Office", { exact: true }).check();
    await page.getByRole("button").click();

    await expect(page).toHaveURL("/apply/upload-coroners-letter");
  });

  test("renders validation error when no public authority is selected", async ({
    page,
  }) => {
    await page.goto("/apply/public-authority");

    await page.getByRole("button").click();

    const errorMessage = page.getByText("Please select a public authority", {
      exact: true,
    });
    await expect(errorMessage).toBeVisible();
  });
});
