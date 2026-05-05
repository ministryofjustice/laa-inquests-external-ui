import { Page, type Locator } from "@playwright/test";
import { test, expect } from "../../../fixtures/index.js";
import { CLIENT_DETAILS_ERROR } from "#src/infrastructure/locales/constants.js";

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

    await getAndUpdateFormFields(
      page,
      {
        "First name": "Testuser",
        "Last name": "Surname",
        Day: "1",
        Month: "1",
        Year: "2000",
        No: "",
      },
      ["Last name"],
    );

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
      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(
        CLIENT_DETAILS_ERROR.MISSING_FIRST_NAME,
      );
    });

    test("if first name input is more than 100 characters", async ({
      page,
    }) => {
      page.goto("/apply/client-details/name-and-dob");
      const basicDetailsForm = await page.getByTestId("client-details-form");
      const continueButton = basicDetailsForm.getByRole("button");
      getAndUpdateFormFields(page, { "First name": "a".repeat(101) });

      const characterLengthHint = basicDetailsForm.locator("#first-name-hint");
      const characterLimitHintMessage = "Character limit: 100";
      await expect(characterLengthHint).toContainText(
        characterLimitHintMessage,
      );

      continueButton.click();
      await page.waitForLoadState("domcontentloaded");

      const errorMessageElement = basicDetailsForm.locator("#first-name-error");

      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(
        CLIENT_DETAILS_ERROR.FIRST_NAME_EXCEEDS_MAX_CHARACTER_LENGTH,
      );
    });
    test("if last name input is missing", async ({ page }) => {
      page.goto("/apply/client-details/name-and-dob");
      const basicDetailsForm = await page.getByTestId("client-details-form");
      const continueButton = basicDetailsForm.getByRole("button");
      getAndUpdateFormFields(page, { "First name": "test name" });

      continueButton.click();
      await page.waitForLoadState("domcontentloaded");

      const errorMessageElement = basicDetailsForm.locator("#last-name-error");

      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(
        CLIENT_DETAILS_ERROR.MISSING_LAST_NAME,
      );
    });

    test("if last name input is more than 100 characters", async ({ page }) => {
      page.goto("/apply/client-details/name-and-dob");
      const basicDetailsForm = await page.getByTestId("client-details-form");
      const continueButton = basicDetailsForm.getByRole("button");

      getAndUpdateFormFields(
        page,
        { "First name": "test name", "Last name": "a".repeat(101) },
        ["Last name"],
      );

      const characterLengthHint = basicDetailsForm.locator("#last-name-hint");
      const characterLimitHintMessage = "Character limit: 100";
      await expect(characterLengthHint).toContainText(
        characterLimitHintMessage,
      );

      continueButton.click();
      await page.waitForLoadState("domcontentloaded");

      const errorMessageElement = basicDetailsForm.locator("#last-name-error");

      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(
        CLIENT_DETAILS_ERROR.LAST_NAME_EXCEEDS_MAX_CHARACTER_LENGTH,
      );
    });
    test("if no radio selected for last name changed input", async ({
      page,
    }) => {
      page.goto("/apply/client-details/name-and-dob");
      const basicDetailsForm = await page.getByTestId("client-details-form");
      const continueButton = basicDetailsForm.getByRole("button");
      getAndUpdateFormFields(
        page,
        { "First name": "testname", "Last name": "testington" },
        ["Last name"],
      );

      continueButton.click();
      await page.waitForLoadState("domcontentloaded");

      const errorMessageElement =
        basicDetailsForm.locator("#name-change-error");

      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(
        CLIENT_DETAILS_ERROR.INPUT_NOT_SELECTED,
      );
    });
    test("if radio is selected but birth name is not provided", async ({
      page,
    }) => {
      page.goto("/apply/client-details/name-and-dob");
      const basicDetailsForm = await page.getByTestId("client-details-form");
      const continueButton = basicDetailsForm.getByRole("button");

      const { Yes: yesNameChangedRadio } = await getAndUpdateFormFields(
        page,
        { "First name": "testname", "Last name": "testington", Yes: "" },
        ["Last name"],
      );

      continueButton.click();
      await page.waitForLoadState("domcontentloaded");

      await expect(yesNameChangedRadio).toBeChecked();
      const errorMessageElement = basicDetailsForm.locator(
        "#last-name-at-birth-error",
      );

      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(
        CLIENT_DETAILS_ERROR.MISSING_LAST_NAME_AT_BIRTH,
      );
    });
    test("renders partially filled in form entries from session on error", async ({
      page,
    }) => {
      page.goto("/apply/client-details/name-and-dob");
      const basicDetailsForm = await page.getByTestId("client-details-form");
      const continueButton = await basicDetailsForm.getByRole("button");
      const { "First name": firstNameInput, "Last name": lastNameInput } =
        await getAndUpdateFormFields(
          page,
          { "First name": "testname", "Last name": "testington", Yes: "" },
          ["Last name"],
        );

      await continueButton.click();
      await page.waitForLoadState("domcontentloaded");

      await expect(firstNameInput).toHaveValue("testname");
      await expect(lastNameInput).toHaveValue("testington");
    });
    test("shows dob error when not provided", async ({ page }) => {
      page.goto("/apply/client-details/name-and-dob");
      const basicDetailsForm = await page.getByTestId("client-details-form");
      const continueButton = await basicDetailsForm.getByRole("button");

      await continueButton.click();
      await page.waitForLoadState("domcontentloaded");

      const errorMessageElement = basicDetailsForm.locator("#dob-error");
      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(
        CLIENT_DETAILS_ERROR.MISSING_DOB_INPUT,
      );
    });
    test("shows dob error when non-numeric", async ({ page }) => {
      page.goto("/apply/client-details/name-and-dob");
      const basicDetailsForm = await page.getByTestId("client-details-form");
      const continueButton = await basicDetailsForm.getByRole("button");

      await getAndUpdateFormFields(page, {
        Day: "test",
        Month: "test",
        Year: "test",
      });

      await continueButton.click();
      await page.waitForLoadState("domcontentloaded");

      const errorMessageElement = basicDetailsForm.locator("#dob-error");
      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(
        CLIENT_DETAILS_ERROR.NON_NUMERIC_DATE,
      );
    });
    test("shows dob error when date is in the future", async ({ page }) => {
      page.goto("/apply/client-details/name-and-dob");
      const basicDetailsForm = await page.getByTestId("client-details-form");
      const continueButton = await basicDetailsForm.getByRole("button");

      await getAndUpdateFormFields(page, {
        Day: "1",
        Month: "1",
        Year: "3000",
      });

      await continueButton.click();
      await page.waitForLoadState("domcontentloaded");

      const errorMessageElement = basicDetailsForm.locator("#dob-error");
      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(
        CLIENT_DETAILS_ERROR.FUTURE_DATE,
      );
    });
  });
});

const getAndUpdateFormFields = async (
  page: Page,
  inputLookup: Record<string, string>,
  exactLabels: string[] = [],
): Promise<Record<string, Locator>> => {
  const locatorLookup: Record<string, Locator> = {};
  for (let label in inputLookup) {
    if (exactLabels.includes(label)) {
      const input = page.getByLabel(label, { exact: true });
      locatorLookup[label] = input;
      await input.fill(inputLookup[label]);
    } else if (inputLookup[label] !== "") {
      const input = page.getByLabel(label);
      locatorLookup[label] = input;
      await input.fill(inputLookup[label]);
    } else {
      const input = page.getByLabel(label);
      locatorLookup[label] = input;
      await input.click();
    }
  }
  return locatorLookup;
};
