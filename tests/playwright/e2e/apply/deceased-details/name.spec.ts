import { Page, type Locator } from "@playwright/test";
import { test, expect } from "../../../fixtures/index.js";
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
    await page.goto("/apply/deceased-details/name");
    form = await page.getByTestId("deceased-details-form");
  });

  test("view deceased name page", async ({ page }) => {
    await validateHeader(page, "What is the name of the deceased?", 2);
    await validateBackButton(page, "/apply/proceedings");
    await validateFormAttributes(form, "/apply/deceased-details/name");
    await validateCSRFToken(form);
    await validateContinueButton(form);

    const firstNameLabel = form.getByLabel("First name");
    const lastNameLabel = form.getByLabel("Last name", {
      exact: true,
    });
    await expect(firstNameLabel).toBeVisible();
    await expect(lastNameLabel).toBeVisible();
  });

  test("continue to deceased date of death when they've filled in deceased name", async ({
    page,
  }) => {
    const firstNameLabel = form.getByLabel("First name");
    const lastNameLabel = form.getByLabel("Last name", {
      exact: true,
    });

    await firstNameLabel.fill("Test");
    await lastNameLabel.fill("Test");

    await continueToNextPage(form, page);
    await expect(page.url()).toContain("apply/deceased-details/dod");
  });

  test.describe("see validation errors when", () => {
    test("first and last names are empty", async ({ page }) => {
      await continueToNextPage(form, page);

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

      await continueToNextPage(form, page);

      const firstNameErrorMessage = form.locator("#deceased-first-name-error");
      await expect(firstNameErrorMessage).toBeVisible();
      await expect(firstNameErrorMessage).toContainText(
        DECEASED_DETAILS_ERROR.FIRST_NAME_EXCEEDS_MAX_CHARACTER_LENGTH,
      );

      const lastNameErrorMessage = form.locator("#deceased-last-name-error");
      await expect(lastNameErrorMessage).toBeVisible();
      await expect(lastNameErrorMessage).toContainText(
        DECEASED_DETAILS_ERROR.MISSING_LAST_NAME,
      );
    });
  });

  test("fill in details, continue and navigate back with deceased details name automatically filled in", async ({
    page,
  }) => {
    const firstNameField = form.getByLabel("First name");
    const lastNameField = form.getByLabel("Last name");

    const [firstName, lastName] = ["Test", "Test 2"];
    await firstNameField.fill(firstName);
    await lastNameField.fill(lastName);

    await continueToNextPage(form, page);
    await page.goto("/apply/deceased-details/name");

    await expect(firstNameField).toHaveValue(firstName);
    await expect(lastNameField).toHaveValue(lastName);
  });
});
