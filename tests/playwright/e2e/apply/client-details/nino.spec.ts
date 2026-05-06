import { CLIENT_DETAILS_ERROR } from "#src/infrastructure/locales/constants.js";
import { test, expect } from "../../../fixtures/index.js";

test.describe("Client details - NINO page", () => {
  test("renders NINO page header and back link", async ({ page }) => {
    page.goto("/apply/client-details/nino");

    const backButton = page.getByRole("link", { name: "Back", exact: true });
    const ninoHeading = await page.getByRole("heading", {
      level: 1,
      name: "Does your client have a National Insurance number?",
    });

    const ninoForm = await page.getByTestId("nino-form");
    const yesRadioLabel = ninoForm.getByLabel("Yes");
    const noRadioLabel = ninoForm.getByLabel("No");
    const yesInputLabel = ninoForm.getByLabel(
      "Enter your client's National Insurance number",
    );
    const continueButton = ninoForm.getByRole("button");

    await expect(ninoHeading).toBeVisible();

    await expect(backButton).toBeVisible();
    await expect(backButton).toHaveAttribute(
      "href",
      "/apply/client-details/name-and-dob",
    );

    await expect(yesRadioLabel).toBeVisible();
    await expect(noRadioLabel).toBeVisible();
    await expect(yesInputLabel).toBeHidden();

    yesRadioLabel.click();

    await expect(yesInputLabel).toBeVisible();
    await yesInputLabel.fill("PC123456A");

    await expect(continueButton).toHaveText("Continue");
    await expect(continueButton).toHaveAttribute("type", "submit");
    await continueButton.click();
    await page.waitForLoadState("domcontentloaded");
    await expect(page.url()).toContain(
      "apply/client-details/has-prev-application",
    );
  });
  test.describe("render validation errors", () => {
    test("if no radio selected for nino input", async ({ page }) => {
      page.goto("/apply/client-details/nino");
      const ninoForm = await page.getByTestId("nino-form");
      const continueButton = ninoForm.getByRole("button");

      continueButton.click();
      await page.waitForLoadState("domcontentloaded");

      const errorMessageElement = ninoForm.locator("#has-nino-error");

      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(
        CLIENT_DETAILS_ERROR.INPUT_NOT_SELECTED,
      );
    });
    test("if radio is selected but nino is not provided", async ({ page }) => {
      page.goto("/apply/client-details/nino");
      const ninoForm = await page.getByTestId("nino-form");
      const continueButton = ninoForm.getByRole("button");
      const yesNinoChangedRadio = ninoForm.getByLabel("Yes");
      await yesNinoChangedRadio.click();

      continueButton.click();
      await page.waitForLoadState("domcontentloaded");

      await expect(yesNinoChangedRadio).toBeChecked();
      const errorMessageElement = ninoForm.locator("#nino-input-error");

      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(
        CLIENT_DETAILS_ERROR.MISSING_NINO,
      );
    });
    test("if radio is selected and invalid nino is provided", async ({
      page,
    }) => {
      page.goto("/apply/client-details/nino");
      const ninoForm = await page.getByTestId("nino-form");
      const continueButton = ninoForm.getByRole("button");
      const yesNinoChangedRadio = ninoForm.getByLabel("Yes");
      await yesNinoChangedRadio.click();
      const ninoInput = ninoForm.getByLabel(
        "Enter your client's National Insurance number",
      );
      await ninoInput.fill("123");

      continueButton.click();
      await page.waitForLoadState("domcontentloaded");

      await expect(yesNinoChangedRadio).toBeChecked();
      const errorMessageElement = ninoForm.locator("#nino-input-error");

      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(
        CLIENT_DETAILS_ERROR.INVALID_NINO,
      );
    });
  });
});
