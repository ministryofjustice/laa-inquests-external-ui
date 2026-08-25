import { test, expect } from "../../fixtures/index.js";
import { validateCSRFToken } from "../../utils/govuk-validators.js";

test.describe("Claim - financial recovery costs", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/claim/recovery-costs");
  });

  test("renders back link to inquest outcome recovery", async ({
    page,
    checkAccessibility,
  }) => {
    const backLink = page.getByRole("link", { name: "Back", exact: true });

    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute(
      "href",
      "/claim/inquest-outcome-recovery",
    );

    await checkAccessibility();
  });

  test("renders page heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "What are the financial recovery costs?",
      }),
    ).toBeVisible();
  });

  test("renders the four currency inputs", async ({ page }) => {
    const form = page.getByTestId("recovery-costs-form");

    await expect(form.getByLabel("Costs", { exact: true })).toBeVisible();
    await expect(form.getByLabel("Damages")).toBeVisible();
    await expect(form.getByLabel("Interest")).toBeVisible();
    await expect(
      form.getByLabel("Previous pre-certificate costs"),
    ).toBeVisible();
  });

  test("includes a csrf token in the form", async ({ page }) => {
    await validateCSRFToken(page.getByTestId("recovery-costs-form"));
  });

  test("renders continue button", async ({ page }) => {
    const form = page.getByTestId("recovery-costs-form");
    const continueButton = form.getByRole("button", { name: "Continue" });

    await expect(continueButton).toBeVisible();
    await expect(continueButton).toHaveAttribute("type", "submit");
  });

  test("saves the entered values and continues to paying party", async ({
    page,
  }) => {
    const form = page.getByTestId("recovery-costs-form");

    await form.getByLabel("Costs", { exact: true }).fill("100");
    await form.getByLabel("Damages").fill("200");
    await form.getByLabel("Interest").fill("300");
    await form.getByLabel("Previous pre-certificate costs").fill("400");
    await form.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/claim/paying-party");

    await page.goto("/claim/recovery-costs");
    await expect(
      page
        .getByTestId("recovery-costs-form")
        .getByLabel("Costs", { exact: true }),
    ).toHaveValue("100");
  });
});
