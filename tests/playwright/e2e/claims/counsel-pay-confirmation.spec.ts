import { test, expect } from "../../fixtures/index.js";

test.describe("Claim - counsel pay confirmation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/claim/counsel-pay-confirmation");
  });

  test("renders back link to counsel number", async ({
    page,
    checkAccessibility,
  }) => {
    const backLink = page.getByRole("link", { name: "Back", exact: true });

    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", "/claim/counsel-number");

    await checkAccessibility();
  });

  test("renders page heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Confirm all instructed counsel has billed and been paid on all outstanding claims",
      }),
    ).toBeVisible();
  });

  test("renders the warning text", async ({ page }) => {
    await expect(
      page.getByText(
        "Before submitting your bill you must check all counsel fees are paid. If they have not been paid, your bill could be rejected.",
      ),
    ).toBeVisible();
  });

  test("renders the confirmation checkbox", async ({ page }) => {
    const form = page.getByTestId("counsel-pay-confirmation-form");

    await expect(
      form.getByLabel("Yes, all counsel bills have been paid."),
    ).toBeVisible();
  });

  test("renders continue button", async ({ page }) => {
    const form = page.getByTestId("counsel-pay-confirmation-form");
    const continueButton = form.getByRole("button", { name: "Continue" });

    await expect(continueButton).toBeVisible();
    await expect(continueButton).toHaveAttribute("type", "submit");
  });

  test("shows validation error when submitted without ticking the checkbox", async ({
    page,
  }) => {
    const form = page.getByTestId("counsel-pay-confirmation-form");

    await form.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/claim/counsel-pay-confirmation");
    await expect(
      page.getByRole("link", {
        name: "Confirm that all counsel bills have been paid",
      }),
    ).toBeVisible();
  });

  test("continues to check your answers page when the checkbox is ticked", async ({
    page,
  }) => {
    const form = page.getByTestId("counsel-pay-confirmation-form");

    await form.getByLabel("Yes, all counsel bills have been paid.").check();
    await form.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/claim/check-your-answers");
  });
});
