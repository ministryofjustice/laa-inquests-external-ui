import { test, expect } from "../../fixtures/index.js";
import { validateCSRFToken } from "../../utils/govuk-validators.js";

test.describe("Claim - paying party", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/claim/paying-party");
  });

  test("renders back link to recovery costs when the recovery cost was made", async ({
    page,
    checkAccessibility,
  }) => {
    await page.goto("/claim/inquest-outcome-recovery");
    const recoveryForm = page.getByTestId("inquest-outcome-recovery-form");
    await recoveryForm.getByLabel("Yes", { exact: true }).check();
    await recoveryForm.getByRole("button", { name: "Continue" }).click();
    await page.goto("/claim/paying-party");

    const backLink = page.getByRole("link", { name: "Back", exact: true });

    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", "/claim/recovery-costs");

    await checkAccessibility();
  });

  test("renders back link to pre-certificate costs when the recovery cost was not made", async ({
    page,
  }) => {
    await page.goto("/claim/inquest-outcome-recovery");
    const recoveryForm = page.getByTestId("inquest-outcome-recovery-form");
    await recoveryForm.getByLabel("No", { exact: true }).check();
    await recoveryForm.getByRole("button", { name: "Continue" }).click();
    await page.goto("/claim/paying-party");

    const backLink = page.getByRole("link", { name: "Back", exact: true });

    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", "/claim/pre-cert-costs");
  });

  test("renders page heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Who is the paying party?",
      }),
    ).toBeVisible();
  });

  test("renders the paying party input", async ({ page }) => {
    const form = page.getByTestId("paying-party-form");

    await expect(form.locator("#paying-party")).toBeVisible();
    await expect(
      form.getByText(
        "Add the name of the organisation where the costs are being claimed back from",
      ),
    ).toBeVisible();
  });

  test("includes a csrf token in the form", async ({ page }) => {
    await validateCSRFToken(page.getByTestId("paying-party-form"));
  });

  test("shows validation error when submitted with empty paying party", async ({
    page,
  }) => {
    const form = page.getByTestId("paying-party-form");

    await form.getByRole("button", { name: "Continue" }).click();

    await expect(page.locator(".govuk-error-summary")).toContainText(
      "Enter the name of the paying party",
    );
  });

  test("renders continue button", async ({ page }) => {
    const form = page.getByTestId("paying-party-form");
    const continueButton = form.getByRole("button", { name: "Continue" });

    await expect(continueButton).toBeVisible();
    await expect(continueButton).toHaveAttribute("type", "submit");
  });

  test("saves the entered value and continues to check your answers", async ({
    page,
  }) => {
    const form = page.getByTestId("paying-party-form");

    await form.locator("#paying-party").fill("Acme Ltd");
    await form.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/claim/check-your-answers");

    await page.goto("/claim/paying-party");
    await expect(
      page.getByTestId("paying-party-form").locator("#paying-party"),
    ).toHaveValue("Acme Ltd");
  });
});
