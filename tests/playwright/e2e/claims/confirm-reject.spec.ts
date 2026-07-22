import { test, expect } from "../../fixtures/index.js";

test.describe("Claim - confirm reject", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/claim");
    await page
      .getByTestId("case-search-form")
      .getByLabel("Enter the case reference number")
      .fill("force-rejected");
    await page
      .getByTestId("case-search-form")
      .getByRole("button", { name: "Continue" })
      .click();
    await page.waitForURL("**/claim/results");
    await page
      .getByRole("table")
      .getByRole("row")
      .nth(1)
      .getByRole("link")
      .click();

    await page.waitForURL("**/claim/type");
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

    await page.waitForURL("**/claim/confirmation/reject");
  });

  test("renders the red rejection panel heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Payment on account claim has been rejected",
      }),
    ).toBeVisible();

    await expect(
      page.locator(".govuk-panel.app-panel--rejected"),
    ).toBeVisible();
  });

  test("renders the rejection reasons heading and mapped descriptions", async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: "Your claim has been rejected because:",
      }),
    ).toBeVisible();

    await expect(
      page.getByText("Maximum number of POAs exceeded"),
    ).toBeVisible();
    await expect(page.getByText("Claim exceeds cost limit")).toBeVisible();
  });

  test("renders unknown rejection reasons as raw reason code text", async ({
    page,
  }) => {
    await expect(
      page.getByText("UNLISTED_REJECTION_REASON_CODE"),
    ).toBeVisible();
  });

  test("renders what happens next section", async ({ page }) => {
    await expect(
      page.getByRole("heading", { level: 2, name: "What happens next" }),
    ).toBeVisible();

    await expect(
      page.getByText("You cannot go back and edit your claim."),
    ).toBeVisible();
    await expect(page.getByText("You need to make a new claim.")).toBeVisible();
  });

  test("renders a Make a new claim button linking to /claim", async ({
    page,
  }) => {
    const button = page.getByRole("button", { name: "Make a new claim" });

    await expect(button).toBeVisible();
    await expect(button).toHaveAttribute("href", "/claim");
  });

  test("does not render claim reference number or copy reference button", async ({
    page,
  }) => {
    await expect(page.getByText("Claim reference number")).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Copy reference number" }),
    ).not.toBeVisible();
  });
});
