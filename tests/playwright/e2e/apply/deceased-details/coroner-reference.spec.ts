import { test, expect } from "../../../fixtures/index.js";
import type { Locator } from "playwright-core";
import {
  validateBackButton,
  validateContinueButton,
  validateCSRFToken,
  validateFormAttributes,
  validateHeader,
  continueToNextPage,
} from "./form-validation-utils.js";

test.describe("Provider can", () => {
  let form: Locator;
  test.beforeEach(async ({ page }) => {
    await page.goto("/apply/deceased-details/coroner-reference");
    form = await page.getByTestId("deceased-coroner-reference-form");
  });

  test("view the deceased coroner reference page", async ({ page }) => {
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
  });

  test("continue to the deceased further information page", async ({
    page,
  }) => {
    await continueToNextPage(form, page);
    await expect(page.url()).toContain(
      "apply/deceased-details/further-information",
    );
  });

  test("fill in details, continue and navigate back with deceased details coroner reference automatically filled in", async ({
    page,
  }) => {
    const yesInput = form.getByLabel("Please enter your reference number");
    await yesInput.fill("Test");

    await continueToNextPage(form, page);
    await page.goBack();
    await expect(yesInput).toHaveValue("Test");
  });
});
