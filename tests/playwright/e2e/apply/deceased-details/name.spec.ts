import { Page, type Locator } from "@playwright/test";
import { test, expect } from "../../../fixtures/index.js";
import { DECEASED_DETAILS_ERROR } from "#src/infrastructure/locales/constants.js";
import { continueToNextPage } from "./form-validation-utils.js";

test.describe("Deceased details - name", () => {
  test("renders basic details header and back link", async ({ page }) => {
    page.goto("/apply/deceased-details/name");
    const deceasedDetailsHeading = await page.getByRole("heading", {
      level: 2,
      name: "What is the name of the deceased?",
    });
    const backButton = page.getByRole("link", { name: "Back", exact: true });

    await expect(deceasedDetailsHeading).toBeVisible();

    await expect(backButton).toBeVisible();
    await expect(backButton).toHaveAttribute("href", "/apply/proceedings");
  });

  test("renders deceased details form", async ({ page }) => {
    page.goto("/apply/deceased-details/name");

    const deceasedDetailsForm = await page.getByTestId("deceased-details-form");
    const firstNameLabel = deceasedDetailsForm.getByLabel("First name");
    const lastNameLabel = deceasedDetailsForm.getByLabel("Last name", {
      exact: true,
    });
    const continueButton = deceasedDetailsForm.getByRole("button");

    await expect(firstNameLabel).toBeVisible();
    await expect(lastNameLabel).toBeVisible();

    await expect(continueButton).toBeVisible();
    await expect(continueButton).toHaveText("Continue");
    await expect(continueButton).toHaveAttribute("type", "submit");

    await firstNameLabel.fill("Test");
    await lastNameLabel.fill("Test");

    await continueButton.click();
    await page.waitForLoadState("domcontentloaded");
    await expect(page.url()).toContain("apply/deceased-details/dod");
  });

  test("shows errors when first name is empty", async ({ page }) => {
    page.goto("/apply/deceased-details/name");

    const deceasedDetailsForm = await page.getByTestId("deceased-details-form");

    const continueButton = deceasedDetailsForm.getByRole("button");
    await continueButton.click();
    await page.waitForLoadState("domcontentloaded");

    const errorMessage = deceasedDetailsForm.locator(
      "#deceased-first-name-error",
    );
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(
      DECEASED_DETAILS_ERROR.MISSING_FIRST_NAME,
    );
  });

  test("shows errors when first name is over character limit", async ({
    page,
  }) => {
    page.goto("/apply/deceased-details/name");

    const deceasedDetailsForm = await page.getByTestId("deceased-details-form");
    const firstName = deceasedDetailsForm.getByLabel("First name");
    firstName.fill("a".repeat(101));

    const continueButton = deceasedDetailsForm.getByRole("button");
    await continueButton.click();
    await page.waitForLoadState("domcontentloaded");

    const errorMessage = deceasedDetailsForm.locator(
      "#deceased-first-name-error",
    );
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(
      DECEASED_DETAILS_ERROR.FIRST_NAME_EXCEEDS_MAX_CHARACTER_LENGTH,
    );
  });

  test("shows errors when last name is empty", async ({ page }) => {
    page.goto("/apply/deceased-details/name");

    const deceasedDetailsForm = await page.getByTestId("deceased-details-form");

    const continueButton = deceasedDetailsForm.getByRole("button");
    await continueButton.click();
    await page.waitForLoadState("domcontentloaded");

    const errorMessage = deceasedDetailsForm.locator(
      "#deceased-last-name-error",
    );
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(
      DECEASED_DETAILS_ERROR.MISSING_LAST_NAME,
    );
  });

  test("shows errors when last name is over character limit", async ({
    page,
  }) => {
    page.goto("/apply/deceased-details/name");

    const deceasedDetailsForm = await page.getByTestId("deceased-details-form");
    const lastName = deceasedDetailsForm.getByLabel("Last name");
    lastName.fill("a".repeat(101));

    const continueButton = deceasedDetailsForm.getByRole("button");
    await continueButton.click();
    await page.waitForLoadState("domcontentloaded");

    const errorMessage = deceasedDetailsForm.locator(
      "#deceased-last-name-error",
    );
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(
      DECEASED_DETAILS_ERROR.LAST_NAME_EXCEEDS_MAX_CHARACTER_LENGTH,
    );
  });

  test("fill in details, continue and navigate back with deceased details name automatically filled in", async ({
    page,
  }) => {
    page.goto("/apply/deceased-details/name");

    const form = await page.getByTestId("deceased-details-form");

    const firstNameField = form.getByLabel("First name");
    const lastNameField = form.getByLabel("Last name");

    const [firstName, lastName] = ["Test", "Test 2"];
    await firstNameField.fill(firstName);
    await lastNameField.fill(lastName);

    await continueToNextPage(form, page);
    await page.goBack();

    await expect(firstNameField).toHaveValue(firstName);
    await expect(lastNameField).toHaveValue(lastName);
  });
});
