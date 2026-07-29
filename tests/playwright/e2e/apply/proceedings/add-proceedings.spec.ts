import {
  PROCEEDING_ERROR,
  PROCEEDING_OPTIONS,
} from "#src/infrastructure/locales/constants.js";
import { test, expect } from "#tests/playwright/fixtures/index.js";

test.describe("Add proceedings", () => {
  test("renders expected proceeding page heading, proceeding options and continue button", async ({
    page,
  }) => {
    await page.goto("/apply/proceedings");

    const selectProceedingForm = await page.getByTestId("add-proceeding-form");
    const heading = selectProceedingForm.getByText(
      "What does your client want legal aid for?",
    );
    const continueButton = selectProceedingForm.getByRole("button");

    await expect(heading).toBeVisible();
    await expect(continueButton).toBeVisible();

    for (const option of PROCEEDING_OPTIONS) {
      const radio = await page.getByLabel(option.proceedingName, {
        exact: true,
      });
      await expect(radio).toBeVisible();
    }
  });
  test("renders error message on clicking continue without selecting a proceeding", async ({
    page,
  }) => {
    await page.goto("/apply/proceedings");
    const selectProceedingForm = await page.getByTestId("add-proceeding-form");

    const continueButton = selectProceedingForm.getByRole("button");
    await continueButton.click();
    const errorMessageElement = selectProceedingForm.locator(
      "#proceeding-option-error",
    );

    await expect(errorMessageElement).toBeVisible();
    await expect(errorMessageElement).toContainText(
      PROCEEDING_ERROR.NO_PROCEEDING_SPECIFIED,
    );
  });
});
