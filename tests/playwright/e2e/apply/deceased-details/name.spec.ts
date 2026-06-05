import { Page, type Locator } from "@playwright/test";
import { test, expect } from "../../../fixtures/index.js";
import {
  DECEASED_DETAILS_ERROR,
  DECEASED_NAME_PAGE,
} from "#src/infrastructure/locales/constants.js";
import {
  continueToNextPage,
  validateBackButton,
  validateContinueButton,
  validateCSRFToken,
  validateFormAttributes,
  validateHeader,
} from "../../../utils/govuk-validators.js";

test.describe("Provider can", () => {
  let form: Locator;
  test.beforeEach(async ({ page }) => {
    await page.goto(DECEASED_NAME_PAGE.FORM_PATH);
    form = await page.getByTestId("deceased-details-form");
  });

  test("view deceased name page", async ({ page }) => {
    await validateHeader(page, DECEASED_NAME_PAGE.HEADING, 2);
    await validateBackButton(page, DECEASED_NAME_PAGE.BACK_PATH);
    await validateFormAttributes(form, DECEASED_NAME_PAGE.FORM_PATH);
    await validateCSRFToken(form);
    await validateContinueButton(form);

    const firstNameLabel = form.getByLabel(DECEASED_NAME_PAGE.FIRST_NAME_LABEL);
    const lastNameLabel = form.getByLabel(DECEASED_NAME_PAGE.LAST_NAME_LABEL, {
      exact: true,
    });
    await expect(firstNameLabel).toBeVisible();
    await expect(lastNameLabel).toBeVisible();
  });

  test("continue to deceased date of death when they've filled in deceased name", async ({
    page,
  }) => {
    const firstNameLabel = form.getByLabel(DECEASED_NAME_PAGE.FIRST_NAME_LABEL);
    const lastNameLabel = form.getByLabel(DECEASED_NAME_PAGE.LAST_NAME_LABEL, {
      exact: true,
    });

    await firstNameLabel.fill("Test");
    await lastNameLabel.fill("Test");

    await continueToNextPage(form, page);
    await expect(page.url()).toContain(DECEASED_NAME_PAGE.NEXT_PATH);
  });

  test.describe("see validation errors when", () => {
    test("first and last names are empty", async ({ page }) => {
      await continueToNextPage(form, page);
      await expect(page.url()).toContain(DECEASED_NAME_PAGE.FORM_PATH);

      const firstNameErrorMessage = form.locator("#deceased-first-name-error");
      await expect(firstNameErrorMessage).toBeVisible();
      await expect(firstNameErrorMessage).toContainText(
        DECEASED_DETAILS_ERROR.MISSING_FIRST_NAME,
      );

      const lastNameErrorMessage = form.locator("#deceased-last-name-error");
      await expect(lastNameErrorMessage).toBeVisible();
      await expect(lastNameErrorMessage).toContainText(
        DECEASED_DETAILS_ERROR.MISSING_LAST_NAME,
      );
    });
    test("when first name and last names are over character limit", async ({
      page,
    }) => {
      const firstName = form.getByLabel("First name");
      await firstName.fill("a".repeat(101));

      const lastName = form.getByLabel("Last name", {
        exact: true,
      });
      await lastName.fill("b".repeat(101));

      await continueToNextPage(form, page);
      await expect(page.url()).toContain(DECEASED_NAME_PAGE.FORM_PATH);

      const firstNameErrorMessage = form.locator("#deceased-first-name-error");
      await expect(firstNameErrorMessage).toBeVisible();
      await expect(firstNameErrorMessage).toContainText(
        DECEASED_DETAILS_ERROR.FIRST_NAME_EXCEEDS_MAX_CHARACTER_LENGTH,
      );

      const lastNameErrorMessage = form.locator("#deceased-last-name-error");
      await expect(lastNameErrorMessage).toBeVisible();
      await expect(lastNameErrorMessage).toContainText(
        DECEASED_DETAILS_ERROR.LAST_NAME_EXCEEDS_MAX_CHARACTER_LENGTH,
      );
    });
  });

  test("fill in details, continue and navigate back with deceased details name automatically filled in", async ({
    page,
  }) => {
    const firstNameField = form.getByLabel(DECEASED_NAME_PAGE.FIRST_NAME_LABEL);
    const lastNameField = form.getByLabel(DECEASED_NAME_PAGE.LAST_NAME_LABEL);

    const [firstName, lastName] = ["Test", "Test 2"];
    await firstNameField.fill(firstName);
    await lastNameField.fill(lastName);

    await continueToNextPage(form, page);
    await page.goto(DECEASED_NAME_PAGE.FORM_PATH);

    await expect(firstNameField).toHaveValue(firstName);
    await expect(lastNameField).toHaveValue(lastName);
  });
});
