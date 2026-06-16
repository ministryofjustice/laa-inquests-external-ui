import { test, expect } from "../../fixtures/index.js";
import type { Locator } from "playwright-core";
import {
  validateHeader,
  validateBackButton,
  validateCSRFToken,
  validateContinueButton,
  validateFormAttributes,
} from "../../utils/govuk-validators.js";

test.describe("Provider can", () => {
  let form: Locator;
  test.beforeEach(async ({ page }) => {
    await page.goto("/apply/upload-coroners-letter");
    form = page.getByTestId("upload-coroners-letter-form");
  });

  test("view the upload coroners letter evidence form", async ({ page }) => {
    await validateHeader(page, "Upload coroner's letter", 1);
    await validateBackButton(page, "/apply/public-authority");
    await validateFormAttributes(form, "/apply/upload-coroners-letter");
    await validateCSRFToken(form);
    await validateContinueButton(form);

    const uploadFormButton = form.getByLabel("Choose files");
    await expect(uploadFormButton).toBeVisible();
  });
});
