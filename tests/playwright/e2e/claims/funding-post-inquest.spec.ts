import { test, expect } from "../../fixtures/index.js";
import { FUNDING_POST_INQUEST_ERROR } from "#src/infrastructure/locales/constants.js";
import { validateCSRFToken } from "../../utils/govuk-validators.js";

test.describe("Claim - funding post-inquest", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/claim/funding-post-inquest");
  });

  test("renders back link to inquest outcome", async ({
    page,
    checkAccessibility,
  }) => {
    const backLink = page.getByRole("link", { name: "Back", exact: true });

    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", "/claim/inquest-outcome");

    await checkAccessibility();
  });

  test("renders page heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Has the matter progressed to alternate funding post-inquest?",
      }),
    ).toBeVisible();
  });

  test("renders all funding options", async ({ page }) => {
    const form = page.getByTestId("funding-post-inquest-form");

    await expect(form).toBeVisible();
    await expect(form.getByLabel("Yes", { exact: true })).toBeVisible();
    await expect(form.getByLabel("No", { exact: true })).toBeVisible();
    await expect(form.getByLabel("Don't know", { exact: true })).toBeVisible();
  });

  test("includes a csrf token in the form", async ({ page }) => {
    await validateCSRFToken(page.getByTestId("funding-post-inquest-form"));
  });

  test("renders continue button", async ({ page }) => {
    const form = page.getByTestId("funding-post-inquest-form");
    const continueButton = form.getByRole("button", { name: "Continue" });

    await expect(continueButton).toBeVisible();
    await expect(continueButton).toHaveAttribute("type", "submit");
  });

  test("shows validation error when submitted without a selection", async ({
    page,
  }) => {
    const form = page.getByTestId("funding-post-inquest-form");

    await form.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/claim/funding-post-inquest");
    await expect(
      page.getByRole("link", {
        name: FUNDING_POST_INQUEST_ERROR.MISSING_SELECTION,
      }),
    ).toBeVisible();
  });

  test("skips to check your answers when No is selected", async ({ page }) => {
    const form = page.getByTestId("funding-post-inquest-form");

    await form.getByLabel("No", { exact: true }).check();
    await form.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/claim/check-your-answers");
  });

  test("continues to the recovery sub-flow when Yes is selected", async ({
    page,
  }) => {
    const form = page.getByTestId("funding-post-inquest-form");

    await form.getByLabel("Yes", { exact: true }).check();
    await form.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/claim/inquest-outcome-recovery");
  });

  test("continues to the recovery sub-flow when Don't know is selected", async ({
    page,
  }) => {
    const form = page.getByTestId("funding-post-inquest-form");

    await form.getByLabel("Don't know", { exact: true }).check();
    await form.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/claim/inquest-outcome-recovery");
  });

  test("keeps the previously selected option marked when returning", async ({
    page,
  }) => {
    const form = page.getByTestId("funding-post-inquest-form");

    await form.getByLabel("Yes", { exact: true }).check();
    await form.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL("/claim/inquest-outcome-recovery");

    await page.goto("/claim/funding-post-inquest");

    await expect(
      page
        .getByTestId("funding-post-inquest-form")
        .getByLabel("Yes", { exact: true }),
    ).toBeChecked();
  });
});
