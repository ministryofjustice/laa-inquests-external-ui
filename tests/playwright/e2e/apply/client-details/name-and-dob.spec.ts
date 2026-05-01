import { Page } from "@playwright/test";
import { test, expect } from "../../../fixtures/index.js";

test.describe("Client details - name and dob", () => {
  test("renders basic details header and back link", async ({ page }) => {
    page.goto("/apply/client-details/name-and-dob");
    const clientDetailsHeading = await page.getByRole("heading", {
      level: 2,
      name: "Enter your client's details",
    });
    const backButton = page.getByRole("link", { name: "Back", exact: true });

    await expect(clientDetailsHeading).toBeVisible();

    await expect(backButton).toBeVisible();
    await expect(backButton).toHaveAttribute("href", "/apply");
  });

  test("renders basic client details form", async ({ page }) => {
    page.goto("/apply/client-details/name-and-dob");

    const basicDetailsForm = await page.getByTestId("client-details-form");
    const firstNameLabel = basicDetailsForm.getByLabel("First name");
    const lastNameLabel = basicDetailsForm.getByLabel("Last name", {
      exact: true,
    });
    const nameChangedLabel = basicDetailsForm.getByText(
      "Has your client ever changed their last name?",
    );
    const yesNameChangedLabel = basicDetailsForm.getByLabel("Yes");
    const yesNameChangedInputLabel = basicDetailsForm.getByLabel(
      "What was your client's last name at birth?",
    );
    const noNameChangedLabel = basicDetailsForm.getByLabel("No");

    const dobLabel = basicDetailsForm.getByText("Date of birth");
    const continueButton = basicDetailsForm.getByRole("button");

    await expect(basicDetailsForm).toBeVisible();
    await expect(firstNameLabel).toBeVisible();
    await expect(lastNameLabel).toBeVisible();
    await expect(nameChangedLabel).toBeVisible();
    await expect(yesNameChangedLabel).toBeVisible();
    await expect(noNameChangedLabel).toBeVisible();
    await expect(yesNameChangedInputLabel).toBeHidden();
    yesNameChangedLabel.click();
    await expect(yesNameChangedInputLabel).toBeVisible();

    await expect(dobLabel).toBeVisible();
    await expect(continueButton).toHaveText("Continue");
    await expect(continueButton).toHaveAttribute("type", "submit");

    await fillInMinimumFields(page);

    await continueButton.click();
    await page.waitForLoadState("domcontentloaded");
    await expect(page.url()).toContain("apply/client-details/nino");
  });

  test.describe("render validation errors", () => {
    test("if first name input is missing", async ({ page }) => {
      page.goto("/apply/client-details/name-and-dob");
      const basicDetailsForm = await page.getByTestId("client-details-form");
      const continueButton = basicDetailsForm.getByRole("button");

      continueButton.click();
      await page.waitForLoadState("domcontentloaded");

      const errorMessageElement = basicDetailsForm.locator("#first-name-error");
      const errorMessageStr = "Please enter your client's first name";
      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(errorMessageStr);
    });

    test("if first name input is more than 100 characters", async ({
      page,
    }) => {
      page.goto("/apply/client-details/name-and-dob");
      const basicDetailsForm = await page.getByTestId("client-details-form");
      const continueButton = basicDetailsForm.getByRole("button");
      const firstNameLabel = basicDetailsForm.getByLabel("First name");
      await firstNameLabel.fill("a".repeat(101));

      const characterLengthHint = basicDetailsForm.locator("#first-name-hint");
      const characterLimitHintMessage = "Character limit: 100";
      await expect(characterLengthHint).toContainText(
        characterLimitHintMessage,
      );

      continueButton.click();
      await page.waitForLoadState("domcontentloaded");

      const errorMessageElement = basicDetailsForm.locator("#first-name-error");
      const characterLimitErrorMessage =
        "First name(s) cannot exceed 100 characters";
      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(
        characterLimitErrorMessage,
      );
    });
    test("if last name input is missing", async ({ page }) => {
      page.goto("/apply/client-details/name-and-dob");
      const basicDetailsForm = await page.getByTestId("client-details-form");
      const continueButton = basicDetailsForm.getByRole("button");
      const firstNameLabel = basicDetailsForm.getByLabel("First name");
      await firstNameLabel.fill("test name");

      continueButton.click();
      await page.waitForLoadState("domcontentloaded");

      const errorMessageElement = basicDetailsForm.locator("#last-name-error");
      const errorMessageStr = "Please enter your client's last name";
      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(errorMessageStr);
    });

    test("if last name input is more than 100 characters", async ({ page }) => {
      page.goto("/apply/client-details/name-and-dob");
      const basicDetailsForm = await page.getByTestId("client-details-form");
      const continueButton = basicDetailsForm.getByRole("button");
      const firstNameLabel = basicDetailsForm.getByLabel("First name");
      await firstNameLabel.fill("test name");
      const lastNameLabel = basicDetailsForm.getByLabel("Last name", {
        exact: true,
      });
      await lastNameLabel.fill("a".repeat(101));

      const characterLengthHint = basicDetailsForm.locator("#last-name-hint");
      const characterLimitHintMessage = "Character limit: 100";
      await expect(characterLengthHint).toContainText(
        characterLimitHintMessage,
      );

      continueButton.click();
      await page.waitForLoadState("domcontentloaded");

      const errorMessageElement = basicDetailsForm.locator("#last-name-error");
      const characterLimitErrorMessage =
        "Last name cannot exceed 100 characters";
      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(
        characterLimitErrorMessage,
      );
    });
    test.skip("if no radio selected for last name changed input", async ({
      page,
    }) => {
      page.goto("/apply/client-details/name-and-dob");
      const basicDetailsForm = await page.getByTestId("client-details-form");
      const continueButton = basicDetailsForm.getByRole("button");

      // const yesNameChangedLabel = basicDetailsForm.getByLabel("Yes");
      // const yesNameChangedInputLabel = basicDetailsForm.getByLabel("What was your client's last name at birth?");
      // const noNameChangedLabel = basicDetailsForm.getByLabel("No");
      const firstNameLabel = basicDetailsForm.getByLabel("First name");
      await firstNameLabel.fill("test name");
      const lastNameLabel = basicDetailsForm.getByLabel("Last name", {
        exact: true,
      });
      await lastNameLabel.fill("test last name");

      continueButton.click();
      await page.waitForLoadState("domcontentloaded");
      const errorMessageElement =
        basicDetailsForm.locator("#name-change-error");
      const noRadioSelectedErrorMessage = "Please select an option";
      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(
        noRadioSelectedErrorMessage,
      );
    });
    // no last name change yes / no > error message for name change
    // no name input if yes > error message for name change input
    // max 70 characters
    // no dob > error message for dob
    // invalid dob > error message for dob (date in future, letters)
    // continue button > no inputs > error messages
  });
});

const fillInMinimumFields = async (page: Page) => {
  const firstNameInput = page.getByLabel("First name");
  const lastNameInput = page.getByLabel("Last name", { exact: true });
  const dobDayInput = page.getByLabel("Day");
  const dobMonthInput = page.getByLabel("Month");
  const dobYearInput = page.getByLabel("Year");

  await firstNameInput.fill("Test");
  await lastNameInput.fill("User");
  await dobDayInput.fill("01");
  await dobMonthInput.fill("01");
  await dobYearInput.fill("1990");
};
