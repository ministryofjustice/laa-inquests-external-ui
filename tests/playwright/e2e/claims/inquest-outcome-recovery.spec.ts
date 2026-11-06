import { test, expect } from "../../fixtures/index.js";
import { RECOVERY_COST_ERROR } from "#src/infrastructure/locales/constants.js";
import { validateCSRFToken } from "../../utils/govuk-validators.js";

test.describe("Claim - inquest outcome recovery", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/claim/inquest-outcome-recovery");
  });

  test("renders back link to funding post-inquest", async ({
    page,
    checkAccessibility,
  }) => {
    const backLink = page.getByRole("link", { name: "Back", exact: true });

    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute(
      "href",
      "/claim/funding-post-inquest",
    );

    await checkAccessibility();
  });

  test("renders page heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Has the recovery cost been made?",
      }),
    ).toBeVisible();
  });

  test("renders all recovery options", async ({ page }) => {
    const form = page.getByTestId("inquest-outcome-recovery-form");

    await expect(form).toBeVisible();
    await expect(form.getByLabel("Yes", { exact: true })).toBeVisible();
    await expect(form.getByLabel("No", { exact: true })).toBeVisible();
    await expect(form.getByLabel("Don't know", { exact: true })).toBeVisible();
  });

  test("includes a csrf token in the form", async ({ page }) => {
    await validateCSRFToken(page.getByTestId("inquest-outcome-recovery-form"));
  });

  test("renders continue button", async ({ page }) => {
    const form = page.getByTestId("inquest-outcome-recovery-form");
    const continueButton = form.getByRole("button", { name: "Continue" });

    await expect(continueButton).toBeVisible();
    await expect(continueButton).toHaveAttribute("type", "submit");
  });

  test("shows validation error when submitted without a selection", async ({
    page,
  }) => {
    const form = page.getByTestId("inquest-outcome-recovery-form");

    await form.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/claim/inquest-outcome-recovery");
    await expect(
      page.getByRole("link", {
        name: RECOVERY_COST_ERROR.MISSING_SELECTION,
      }),
    ).toBeVisible();
  });

  test("continues to recovery costs when Yes is selected", async ({ page }) => {
    const form = page.getByTestId("inquest-outcome-recovery-form");

    await form.getByLabel("Yes", { exact: true }).check();
    await form.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/claim/recovery-costs");
  });

  test("continues to pre-certificate costs when No is selected", async ({
    page,
  }) => {
    const form = page.getByTestId("inquest-outcome-recovery-form");

    await form.getByLabel("No", { exact: true }).check();
    await form.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/claim/pre-cert-costs");
  });

  test("continues to pre-certificate costs when Don't know is selected", async ({
    page,
  }) => {
    const form = page.getByTestId("inquest-outcome-recovery-form");

    await form.getByLabel("Don't know", { exact: true }).check();
    await form.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/claim/pre-cert-costs");
  });
});
