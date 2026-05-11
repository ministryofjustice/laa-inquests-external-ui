import { PROCEEDING_ERROR } from "#src/infrastructure/locales/constants.js";
import { test, expect } from "#tests/playwright/fixtures/index.js";
import { selectProceeding } from "#tests/playwright/fixtures/pages/Proceedings.js";

test.describe("Confirm proceedings", () => {
  test("renders expected proceeding confirmation page heading, summary table, form to add another proceeding, and continue button", async ({
    page,
  }) => {
    const proceedingToSelect = "Mental Health";
    await selectProceeding(page, proceedingToSelect);

    const addAnotherForm = await page.getByTestId(
      "add-another-proceeding-form",
    );
    const formHeading = addAnotherForm.getByText(
      "Do you want to add another proceeding?",
    );
    await expect(formHeading).toBeVisible();

    const yesRadio = addAnotherForm.getByLabel("Yes");
    await expect(yesRadio).toBeVisible();

    const noRadio = addAnotherForm.getByLabel("No");
    await expect(noRadio).toBeVisible();

    const continueButton = addAnotherForm.getByRole("button");
    await expect(continueButton).toBeVisible();

    const proceedingsTable = page.getByTestId("proceedings-table");
    await expect(proceedingsTable).toBeVisible();

    const proceedingsData = proceedingsTable.getByText(proceedingToSelect);
    await expect(proceedingsData).toContainText("Mental Health");
  });
  test("renders error message if option is not selected before clicking continue", async ({
    page,
  }) => {
    const proceedingToSelect = "Mental Health";
    await selectProceeding(page, proceedingToSelect);

    const addAnotherForm = await page.getByTestId(
      "add-another-proceeding-form",
    );

    const continueButton = addAnotherForm.getByRole("button");
    await expect(continueButton).toBeVisible();

    await continueButton.click();

    const errorMessageElement = addAnotherForm.locator(
      "#add-another-proceeding-error",
    );
    await expect(errorMessageElement).toBeVisible();
    await expect(errorMessageElement).toContainText(
      PROCEEDING_ERROR.NO_CONFIRMATION_SPECIFIED,
    );
  });
  test("redirects to deceased details page if no selected", async ({
    page,
  }) => {
    const proceedingToSelect = "Mental Health";
    await selectProceeding(page, proceedingToSelect);

    const addAnotherForm = await page.getByTestId(
      "add-another-proceeding-form",
    );

    const noRadio = addAnotherForm.getByLabel("No");
    await expect(noRadio).toBeVisible();

    await noRadio.click();

    const continueButton = addAnotherForm.getByRole("button");
    await expect(continueButton).toBeVisible();

    await continueButton.click();
    await page.waitForLoadState("domcontentloaded");
    await expect(page.url()).toContain("apply/deceased-details/name");
  });
  test("redirects to add proceedings page if yes selected", async ({
    page,
  }) => {
    const proceedingToSelect = "Mental Health";
    await selectProceeding(page, proceedingToSelect);

    const addAnotherForm = await page.getByTestId(
      "add-another-proceeding-form",
    );

    const yesRadio = addAnotherForm.getByLabel("Yes");
    await expect(yesRadio).toBeVisible();

    await yesRadio.click();

    const continueButton = addAnotherForm.getByRole("button");
    await expect(continueButton).toBeVisible();

    await continueButton.click();
    await page.waitForLoadState("domcontentloaded");
    await expect(page.url()).toContain("apply/proceedings");
  });
});
