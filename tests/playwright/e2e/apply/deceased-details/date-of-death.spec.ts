import { DECEASED_DETAILS_ERROR } from "#src/infrastructure/locales/constants.js";
import { test, expect } from "../../../fixtures/index.js";
import type { Page } from "playwright-core";
import { continueToNextPage } from "./form-validation-utils.js";

test.describe("Deceased details - date of death", () => {
  test("renders basic details header", async ({ page }) => {
    page.goto("/apply/deceased-details/dod");
    const deceasedDateOfDeathHeading = await page.getByRole("heading", {
      level: 2,
      name: "What was their date of death?",
    });
    await expect(deceasedDateOfDeathHeading).toBeVisible();
  });

  test("renders back label with href pointing to deceased name", async ({
    page,
  }) => {
    page.goto("/apply/deceased-details/dod");
    const backButton = page.getByRole("link", { name: "Back", exact: true });
    await expect(backButton).toBeVisible();
    await expect(backButton).toHaveAttribute(
      "href",
      "/apply/deceased-details/name",
    );
  });

  test("renders form fields and posts to date of death route", async ({
    page,
  }) => {
    page.goto("/apply/deceased-details/dod");

    const deceasedForm = await page.getByTestId("deceased-date-of-death-form");
    const dateOfDeathInput = await deceasedForm.getByText("Date of death");
    const continueButton = deceasedForm.getByRole("button");

    await expect(dateOfDeathInput).toBeVisible();
    await expect(continueButton).toBeVisible();
    await expect(continueButton).toHaveText("Continue");
    await expect(continueButton).toHaveAttribute("type", "submit");

    await expect(deceasedForm).toHaveAttribute("method", "post");
    await expect(deceasedForm).toHaveAttribute(
      "action",
      "/apply/deceased-details/dod",
    );
  });

  test.describe("renders error message when", () => {
    test("clicking continue with all empty fields", async ({ page }) => {
      const inputs = {
        Day: "",
        Month: "",
        Year: "",
      };

      await testEmptyInputs(page, inputs);
    });

    test("clicking continue with day field empty", async ({ page }) => {
      const inputs = {
        Day: "",
        Month: "1",
        Year: "1990",
      };

      await testEmptyInputs(page, inputs);
    });

    test("clicking continue with month field empty", async ({ page }) => {
      const inputs = {
        Day: "1",
        Month: "",
        Year: "1990",
      };

      await testEmptyInputs(page, inputs);
    });

    test("clicking continue with year field empty", async ({ page }) => {
      const inputs = {
        Day: "1",
        Month: "1",
        Year: "",
      };

      await testEmptyInputs(page, inputs);
    });

    const testEmptyInputs = async (
      page: Page,
      inputs: Record<string, string>,
    ) => {
      page.goto("/apply/deceased-details/dod");

      const deceasedForm = await page.getByTestId(
        "deceased-date-of-death-form",
      );

      for (const [key, value] of Object.entries(inputs)) {
        const input = deceasedForm.getByLabel(key);
        input.fill(value);
      }

      const continueButton = deceasedForm.getByRole("button");
      await continueButton.click();

      const errorMessage = await deceasedForm.locator(
        "#deceased-date-of-death-error",
      );
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(
        DECEASED_DETAILS_ERROR.MISSING_DATE_OF_DEATH_INPUT,
      );
    };
  });

  test("fills in inputs on error", async ({ page }) => {
    page.goto("/apply/deceased-details/dod");

    const deceasedForm = await page.getByTestId("deceased-date-of-death-form");
    const continueButton = deceasedForm.getByRole("button");

    const dayInput = deceasedForm.getByLabel("Day");
    const monthInput = deceasedForm.getByLabel("Month");
    const yearInput = deceasedForm.getByLabel("Year");

    await dayInput.fill("1");
    await monthInput.fill("2");
    await yearInput.fill("abc");

    await continueButton.click();
    await page.waitForLoadState("domcontentloaded");

    await expect(dayInput).toHaveValue("1");
    await expect(monthInput).toHaveValue("2");
    await expect(yearInput).toHaveValue("abc");
  });

  test("continuing with valid inputs redirects to deceased dob", async ({
    page,
  }) => {
    page.goto("/apply/deceased-details/dod");

    const deceasedForm = await page.getByTestId("deceased-date-of-death-form");
    const continueButton = deceasedForm.getByRole("button");

    const dayInput = deceasedForm.getByLabel("Day");
    const monthInput = deceasedForm.getByLabel("Month");
    const yearInput = deceasedForm.getByLabel("Year");

    await dayInput.fill("1");
    await monthInput.fill("1");
    await yearInput.fill("1990");

    await continueButton.click();

    await page.waitForLoadState("domcontentloaded");
    await expect(page.url()).toContain("apply/deceased-details/dob");
  });

  test("fill in details, continue and navigate back with deceased date of death automatically filled in", async ({
    page,
  }) => {
    page.goto("/apply/deceased-details/dod");

    const form = await page.getByTestId("deceased-date-of-death-form");

    const dayField = form.getByLabel("Day");
    const monthField = form.getByLabel("Month");
    const yearField = form.getByLabel("Year");

    const [day, month, year] = ["1", "1", "1990"];
    await dayField.fill(day);
    await monthField.fill(month);
    await yearField.fill(year);

    await continueToNextPage(form, page);
    await page.goBack();

    await expect(dayField).toHaveValue(day);
    await expect(monthField).toHaveValue(month);
    await expect(yearField).toHaveValue(year);
  });
});
