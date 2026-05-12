import { test, expect } from "../../../fixtures/index.js";
import type { Locator } from "playwright-core";
import {
  validateBackButton,
  validateContinueButton,
  validateCSRFToken,
  validateFormAttributes,
  validateHeader,
} from "./form-validation-utils.js";

test.describe("Deceased details - date of birth", () => {
  let form: Locator;
  test.beforeEach(async ({ page }) => {
    await page.goto("/apply/deceased-details/dob");
    form = await page.getByTestId("deceased-date-of-birth-form");
  });

  test("view deceased date of birth page", async ({ page }) => {
    await validateHeader(page, "What was their date of birth?", 2);
    await validateBackButton(page, "/apply/deceased-details/dod");
    await validateFormAttributes(form, "/apply/deceased-details/dob");
    await validateCSRFToken(form);
    await validateContinueButton(form);

    const dateOfDeathInput = await form.getByText("Date of birth");
    await expect(dateOfDeathInput).toBeVisible();
  });

  test("redirects to client relationship on valid input", async ({ page }) => {
    page.goto("/apply/deceased-details/dob");
    const deceasedForm = await page.getByTestId("deceased-date-of-birth-form");

    const dayInput = deceasedForm.getByLabel("Day");
    const monthInput = deceasedForm.getByLabel("Month");
    const yearInput = deceasedForm.getByLabel("Year");

    await dayInput.fill("1");
    await monthInput.fill("1");
    await yearInput.fill("1990");

    const continueButton = deceasedForm.getByRole("button");
    await continueButton.click();
    await page.waitForLoadState("domcontentloaded");
    await expect(page.url()).toContain(
      "apply/deceased-details/client-relationship",
    );
  });
  test("auto-populates field with session data", async ({ page }) => {
    page.goto("/apply/deceased-details/dob");
    const deceasedForm = await page.getByTestId("deceased-date-of-birth-form");

    const dayInput = deceasedForm.getByLabel("Day");
    const monthInput = deceasedForm.getByLabel("Month");
    const yearInput = deceasedForm.getByLabel("Year");

    const [day, month, year] = ["1", "1", "1990"];

    await dayInput.fill(day);
    await monthInput.fill(month);
    await yearInput.fill(year);

    const continueButton = deceasedForm.getByRole("button");
    await continueButton.click();
    await page.waitForLoadState("domcontentloaded");

    page.goto("/apply/deceased-details/dob");
    await expect(dayInput).toHaveValue(day);
    await expect(monthInput).toHaveValue(month);
    await expect(yearInput).toHaveValue(year);
  });
});
