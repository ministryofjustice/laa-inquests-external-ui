import { test, expect } from "../../../fixtures/index.js";
import type { Locator } from "playwright-core";
import { DECEASED_DETAILS_ERROR } from "#src/infrastructure/locales/constants.js";
import {
  validateBackButton,
  validateContinueButton,
  validateCSRFToken,
  validateFormAttributes,
  validateHeader,
  continueToNextPage,
} from "../../../utils/govuk-validators.js";

test.describe("Provider can", () => {
  let form: Locator;
  test.beforeEach(async ({ page }) => {
    await page.goto("/apply/deceased-details/coroner-reference");
    form = await page.getByTestId("deceased-coroner-reference-form");
  });

  test("view the deceased coroner reference page", async ({
    page,
    checkAccessibility,
  }) => {
    await validateHeader(page, "What is the coroner's reference?", 2);
    await validateBackButton(
      page,
      "/apply/deceased-details/client-relationship",
    );
    await validateFormAttributes(
      form,
      "/apply/deceased-details/coroner-reference",
    );
    await validateCSRFToken(form);
    await validateContinueButton(form);

    const inputField = await form.getByLabel(
      "Please enter your reference number",
    );
    await expect(inputField).toBeVisible();

    await checkAccessibility();
  });

  test("continue to the deceased further information page", async ({
    page,
  }) => {
    const inputField = form.getByLabel("Please enter your reference number");
    await inputField.fill("test reference");
    await continueToNextPage(form, page);
    await expect(page.url()).toContain(
      "apply/deceased-details/further-information",
    );
  });

  test("shows an error when coroner reference exceeds 50 characters", async ({
    page,
  }) => {
    const inputField = form.getByLabel("Please enter your reference number");
    await inputField.fill("a".repeat(51));

    await continueToNextPage(form, page);

    await expect(page.url()).toContain(
      "/apply/deceased-details/coroner-reference",
    );
    await expect(
      form.getByText(
        DECEASED_DETAILS_ERROR.CORONER_REFERENCE_EXCEEDS_MAX_CHARACTER_LENGTH,
      ),
    ).toBeVisible();
  });

  test("renders error when coroners reference not supplied", async ({
    page,
  }) => {
    const errorSummary = await page.getByRole("alert");
    await expect(errorSummary).not.toBeVisible();

    await continueToNextPage(form, page);
    await expect(errorSummary).toBeVisible();
    await expect(errorSummary).toContainText("There is a problem");
    await expect(errorSummary).toContainText(
      DECEASED_DETAILS_ERROR.MISSING_CORONER_REFERENCE,
    );
  });

  test("fill in details, continue and navigate back with deceased details coroner reference automatically filled in", async ({
    page,
  }) => {
    const referenceInput = form.getByLabel(
      "Please enter your reference number",
    );
    await referenceInput.fill("Test");

    await continueToNextPage(form, page);
    await page.goto("/apply/deceased-details/coroner-reference");
    await expect(referenceInput).toHaveValue("Test");
  });
});
