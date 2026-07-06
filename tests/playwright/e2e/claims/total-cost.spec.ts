import { test, expect } from "../../fixtures/index.js";

test.describe("Claim - total cost", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/claim/total-cost");
  });

  test("renders back link to claim subtype", async ({ page }) => {
    const backLink = page.getByRole("link", { name: "Back", exact: true });

    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", "/claim/subtype");
  });

  test("renders page heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "What is your total claim cost?",
      }),
    ).toBeVisible();
  });

  test("renders continue button", async ({ page }) => {
    const form = page.getByTestId("total-cost-form");
    const continueButton = form.getByRole("button", { name: "Continue" });

    await expect(continueButton).toBeVisible();
    await expect(continueButton).toHaveAttribute("type", "submit");
  });

  test("redirects to /claim/evidence when continue is clicked", async ({
    page,
  }) => {
    await page
      .getByTestId("total-cost-form")
      .getByRole("button", { name: "Continue" })
      .click();

    await expect(page).toHaveURL("/claim/evidence");
  });
});
