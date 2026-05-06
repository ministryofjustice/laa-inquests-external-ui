import { CLIENT_DETAILS_ERROR } from "#src/infrastructure/locales/constants.js";
import { test, expect } from "../../../fixtures/index.js";

test.describe("Previous application", () => {
  test("renders basic heading, back link, and expected copy text", async ({
    page,
  }) => {
    page.goto("/apply/client-details/has-prev-application");
    const clientDetailsHeading = await page.getByRole("heading", {
      level: 2,
      name: "Has your client applied for Inquest legal aid before?",
    });
    await expect(clientDetailsHeading).toBeVisible();

    const backButton = page.getByRole("link", { name: "Back", exact: true });
    await expect(backButton).toBeVisible();
    await expect(backButton).toHaveAttribute(
      "href",
      "/apply/client-details/nino",
    );

    const descriptionText = page.getByText(
      "By this, we mean certificated and licensed work. You do not need to tell us about controlled work and family mediation. \n We\'ll find any previous records to make sure any contributions we calculate are correct.",
    );
    await expect(descriptionText).toBeVisible();
  });
  test("renders expected input fields and labels in form", async ({ page }) => {
    page.goto("/apply/client-details/has-prev-application");
    const prevApplicationStatusForm = await page.getByTestId(
      "has-prev-application-form",
    );
    await expect(prevApplicationStatusForm).toBeVisible();

    const yesRadioLabel = prevApplicationStatusForm.getByLabel("Yes");
    const noRadioLabel = prevApplicationStatusForm.getByLabel("No");
    const yesInputLabel = prevApplicationStatusForm.getByLabel(
      "Give the LAA reference number for any previous application.",
    );
    await expect(yesRadioLabel).toBeVisible();
    await expect(noRadioLabel).toBeVisible();
    await expect(yesInputLabel).toBeHidden();

    yesRadioLabel.click();
    await expect(yesInputLabel).toBeVisible();
  });
  test("continue button posts to expected URL", async ({ page }) => {
    page.goto("/apply/client-details/has-prev-application");
    const prevApplicationStatusForm = await page.getByTestId(
      "has-prev-application-form",
    );
    const continueButton = prevApplicationStatusForm.getByRole("button");
    const noRadio = prevApplicationStatusForm.getByLabel("No");
    await noRadio.click();

    await expect(continueButton).toHaveText("Continue");
    await expect(continueButton).toHaveAttribute("type", "submit");

    await continueButton.click();
    await page.waitForLoadState("domcontentloaded");

    await expect(page.url()).toContain("apply/proceedings");
  });
  test("renders error message when no input selected", async ({ page }) => {
    page.goto("/apply/client-details/has-prev-application");
    const prevApplicationStatusForm = await page.getByTestId(
      "has-prev-application-form",
    );
    const continueButton = prevApplicationStatusForm.getByRole("button");

    await continueButton.click();
    await page.waitForLoadState("domcontentloaded");
    const errorMessageElement = prevApplicationStatusForm.locator(
      "#has-prev-application-error",
    );
    await expect(errorMessageElement).toBeVisible();
    await expect(errorMessageElement).toContainText(
      CLIENT_DETAILS_ERROR.INPUT_NOT_SELECTED,
    );
  });
  test("renders error message when input selected but no reference provided", async ({
    page,
  }) => {
    page.goto("/apply/client-details/has-prev-application");
    const prevApplicationStatusForm = await page.getByTestId(
      "has-prev-application-form",
    );
    const yesRadio = prevApplicationStatusForm.getByLabel("Yes");
    const continueButton = prevApplicationStatusForm.getByRole("button");

    await yesRadio.click();
    await continueButton.click();
    await page.waitForLoadState("domcontentloaded");

    const errorMessageElement = prevApplicationStatusForm.locator(
      "#prev-laa-reference-input-error",
    );
    await expect(errorMessageElement).toBeVisible();
    await expect(errorMessageElement).toContainText(
      CLIENT_DETAILS_ERROR.MISSING_PREV_APPLICATION_REF,
    );
  });
  test("renders error message when reference provided exceeds max character length", async ({
    page,
  }) => {
    page.goto("/apply/client-details/has-prev-application");
    const prevApplicationStatusForm = await page.getByTestId(
      "has-prev-application-form",
    );
    const yesRadio = prevApplicationStatusForm.getByLabel("Yes");
    const continueButton = prevApplicationStatusForm.getByRole("button");

    await yesRadio.click();
    const prevApplicationRefInput = prevApplicationStatusForm.getByLabel(
      "Give the LAA reference number for any previous application.",
    );

    await prevApplicationRefInput.fill("a".repeat(36));
    await continueButton.click();
    await page.waitForLoadState("domcontentloaded");

    const errorMessageElement = prevApplicationStatusForm.locator(
      "#prev-laa-reference-input-error",
    );
    await expect(errorMessageElement).toBeVisible();
    await expect(errorMessageElement).toContainText(
      CLIENT_DETAILS_ERROR.APPLICATION_REFERENCE_EXCEEDS_MAX_CHARACTER_LENGTH,
    );
  });
});
