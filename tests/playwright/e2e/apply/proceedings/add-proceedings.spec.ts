import {
  PROCEEDING_ERROR,
  PROCEEDING_OPTIONS,
} from "#src/infrastructure/locales/constants.js";
import { test, expect } from "#tests/playwright/fixtures/index.js";
import { selectProceeding } from "#tests/playwright/fixtures/pages/Proceedings.js";

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
      const radio = await page.getByLabel(option, { exact: true });
      await expect(radio).toBeVisible();
    }
  });
  // renders radio after adding a proceeding
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
  test("after adding another proceeding, on redirect, the page displays a summary list of proceedings already added", async ({
    page,
  }) => {
    const proceedingToSelect = "Mental Health";
    await selectProceeding(page, proceedingToSelect);

    const addAnotherForm = await page.getByTestId(
      "add-another-proceeding-form",
    );
    const yesRadio = addAnotherForm.getByLabel("Yes");
    await yesRadio.click();

    const continueButton = addAnotherForm.getByRole("button");
    await continueButton.click();
    await page.waitForLoadState("domcontentloaded");

    const proceedingsTable = page.getByTestId("proceedings-table");
    await expect(proceedingsTable).toBeVisible();

    const proceedingsData = proceedingsTable.getByText(proceedingToSelect);
    await expect(proceedingsData).toContainText("Mental Health");
  });
});
