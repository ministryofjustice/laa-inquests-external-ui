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

    const noRadio = addAnotherForm.getByLabel("Yes");
    await expect(noRadio).toBeVisible();

    const continueButton = addAnotherForm.getByRole("button");
    await expect(continueButton).toBeVisible();

    const proceedingsTable = page.getByTestId("proceedings-table");
    await expect(proceedingsTable).toBeVisible();

    const proceedingsData = proceedingsTable.getByText(proceedingToSelect);
    await expect(proceedingsData).toContainText("Mental Health");
  });
  // renders radio after adding a proceeding
});
