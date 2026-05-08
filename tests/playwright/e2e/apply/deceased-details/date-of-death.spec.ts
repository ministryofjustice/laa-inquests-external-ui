import { DECEASED_DETAILS_ERROR } from "#src/infrastructure/locales/constants.js";
import { test, expect } from "../../../fixtures/index.js";
import type { Page } from "playwright-core";

test.describe.only("Deceased details - date of death", () => {
  test("renders basic details header and back link", async ({ page }) => {
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

  test("clicking continue with all empty fields shows error", async ({
    page,
  }) => {
    const inputs = {
      Day: "",
      Month: "",
      Year: "",
    };

    await testEmptyInputs(page, inputs);
  });

  test("clicking continue with day field empty shows error", async ({
    page,
  }) => {
    const inputs = {
      Day: "",
      Month: "1",
      Year: "1990",
    };

    await testEmptyInputs(page, inputs);
  });

  test("clicking continue with month field empty shows error", async ({
    page,
  }) => {
    const inputs = {
      Day: "1",
      Month: "",
      Year: "1990",
    };

    await testEmptyInputs(page, inputs);
  });

  test("clicking continue with year field empty shows error", async ({
    page,
  }) => {
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

    const deceasedForm = await page.getByTestId("deceased-date-of-death-form");

    for (const [key, value] of Object.entries(inputs)) {
      const input = deceasedForm.getByLabel(key);
      input.fill(value);
    }

    const continueButton = deceasedForm.getByRole("button");
    await continueButton.click();

    const errorMessage = await deceasedForm.locator("#date-of-death-error");
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(
      DECEASED_DETAILS_ERROR.MISSING_DATE_OF_DEATH_INPUT,
    );
  };
});
