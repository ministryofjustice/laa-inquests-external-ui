import { test, expect } from "#tests/playwright/fixtures/index.js";
import type { Locator } from "playwright-core";
import { DECEASED_DETAILS_ERROR } from "#src/infrastructure/locales/constants.js";
import {
  continueToNextPage,
  validateBackButton,
  validateContinueButton,
  validateCSRFToken,
  validateFormAttributes,
  validateHeader,
  validateYesNoRadioWithConditionalInput,
} from "./form-validation-utils.js";

test.describe("Provider can", () => {
  let form: Locator;
  test.beforeEach(async ({ page }) => {
    await page.goto("/apply/deceased-details/further-information");
    form = await page.getByTestId("deceased-further-information-form");
  });

  test("view deceased details further information page", async ({ page }) => {
    await validateHeader(
      page,
      "Are there any other applications for legal aid being made by family members for an inquest arising from this same incident?",
      2,
    );
    await validateBackButton(page, "/apply/deceased-details/coroner-reference");
    await validateFormAttributes(
      form,
      "/apply/deceased-details/further-information",
    );
    await validateCSRFToken(form);
    await validateContinueButton(form);
    await validateYesNoRadioWithConditionalInput(
      form,
      "Please provide any details available of linked or bridged inquests",
    );
  });

  test("continue to confirmation page", async ({ page }) => {
    const noRadio = form.getByLabel("No");
    await noRadio.click();

    await continueToNextPage(form, page);
    await expect(page.url()).toContain("apply/public-authority");
  });

  test("shows an error when no option is selected", async ({ page }) => {
    await continueToNextPage(form, page);

    await expect(page.url()).toContain(
      "/apply/deceased-details/further-information",
    );
    await expect(
      form.getByText(
        DECEASED_DETAILS_ERROR.FURTHER_INFORMATION_SELECTION_REQUIRED,
      ),
    ).toBeVisible();
  });

  test("shows an error when yes is selected and text is less than 2 characters", async ({
    page,
  }) => {
    const yesRadio = form.getByLabel("Yes");
    await yesRadio.click();

    const infoInput = form.getByLabel(
      "Please provide any details available of linked or bridged inquests",
    );
    await infoInput.fill("a");

    await continueToNextPage(form, page);

    await expect(page.url()).toContain(
      "/apply/deceased-details/further-information",
    );
    await expect(
      form.getByText(DECEASED_DETAILS_ERROR.FURTHER_INFORMATION_MIN_MAX),
    ).toBeVisible();
  });

  test("shows an error when yes is selected and text exceeds 500 characters", async ({
    page,
  }) => {
    const yesRadio = form.getByLabel("Yes");
    await yesRadio.click();

    const infoInput = form.getByLabel(
      "Please provide any details available of linked or bridged inquests",
    );
    await infoInput.fill("a".repeat(501));

    await continueToNextPage(form, page);

    await expect(page.url()).toContain(
      "/apply/deceased-details/further-information",
    );
    await expect(
      form.getByText(DECEASED_DETAILS_ERROR.FURTHER_INFORMATION_MIN_MAX),
    ).toBeVisible();
  });

  test("fill in details, continue and navigate back with deceased details further information automatically filled in", async ({
    page,
  }) => {
    const yesRadio = form.getByLabel("Yes");
    await yesRadio.click();
    const yesInput = form.getByLabel(
      "Please provide any details available of linked or bridged inquests",
    );
    await yesInput.fill("Test");

    await continueToNextPage(form, page);
    await page.goto("/apply/deceased-details/further-information");
    await expect(yesRadio).toBeChecked();
    await expect(yesInput).toHaveValue("Test");
  });
});
