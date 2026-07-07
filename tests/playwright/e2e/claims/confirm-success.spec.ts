import { test, expect } from "../../fixtures/index.js";

test.describe("Claim - confirm success", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/claim/type");
    await page.getByLabel("Payment on account (POA)").check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForURL("**/claim/subtype");
    await page.getByLabel("Profit cost").check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForURL("**/claim/total-cost");
    await page.goto("/claim/check-your-answers");
    await page
      .getByTestId("confirm-and-submit-form")
      .getByRole("button", { name: "Finish and submit claim" })
      .click();
    await page.waitForURL("**/claim/confirmation/success");
  });

  test("renders the panel heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Payment on account claim has been submitted",
      }),
    ).toBeVisible();
  });

  test("renders the claim reference number returned from the API", async ({
    page,
  }) => {
    await expect(page.getByText("Claim reference number")).toBeVisible();
    await expect(page.locator(".govuk-panel__body")).toContainText("42");
  });

  test("renders the What happens next heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { level: 2, name: "What happens next" }),
    ).toBeVisible();
  });

  test("renders the what happens next body text", async ({ page }) => {
    await expect(
      page.getByText(
        "Your claim has been successfully submitted, we will get back to you shortly with our decision and next steps.",
      ),
    ).toBeVisible();
  });

  test("renders a Make a new claim button linking to /claim", async ({
    page,
  }) => {
    const button = page.getByRole("button", { name: "Make a new claim" });

    await expect(button).toBeVisible();
    await expect(button).toHaveAttribute("href", "/claim");
  });
});
