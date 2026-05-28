import { test, expect } from "../../../fixtures/index.js";
import type { Locator } from "playwright-core";
import { DECEASED_DETAILS_ERROR } from "#src/infrastructure/locales/constants.js";
import {
  continueToNextPage,
  validateBackButton,
  validateContinueButton,
  validateCSRFToken,
  validateFormAttributes,
  validateHeader,
} from "./form-validation-utils.js";

test.describe("Provider can", () => {
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

  test("continue to client relationship on valid input", async ({ page }) => {
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

  test.describe("see validation errors when", () => {
    test("clicking continue with all empty fields", async ({ page }) => {
      const dayInput = form.getByLabel("Day");
      const monthInput = form.getByLabel("Month");
      const yearInput = form.getByLabel("Year");

      await dayInput.fill("");
      await monthInput.fill("");
      await yearInput.fill("");

      await continueToNextPage(form, page);
      await expect(page.url()).toContain("/apply/deceased-details/dob");

      const errorMessage = form.locator("#deceased-date-of-birth-error");
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(
        DECEASED_DETAILS_ERROR.MISSING_DATE_OF_BIRTH_INPUT,
      );
    });

    test("date of birth is invalid", async ({ page }) => {
      const dayInput = form.getByLabel("Day");
      const monthInput = form.getByLabel("Month");
      const yearInput = form.getByLabel("Year");

      await dayInput.fill("1");
      await monthInput.fill("13");
      await yearInput.fill("2000");

      await continueToNextPage(form, page);
      await expect(page.url()).toContain("/apply/deceased-details/dob");

      const errorMessage = form.locator("#deceased-date-of-birth-error");
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(
        DECEASED_DETAILS_ERROR.INVALID_DATE,
      );
    });

    test("date of birth is in the future", async ({ page }) => {
      const dayInput = form.getByLabel("Day");
      const monthInput = form.getByLabel("Month");
      const yearInput = form.getByLabel("Year");

      await dayInput.fill("1");
      await monthInput.fill("1");
      await yearInput.fill("3000");

      await continueToNextPage(form, page);

      const errorMessage = form.locator("#deceased-date-of-birth-error");
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(
        DECEASED_DETAILS_ERROR.FUTURE_DATE_OF_BIRTH,
      );
    });
  });

  test("view auto-populated fields given they've filled in the date, continued and navigated back", async ({
    page,
  }) => {
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
