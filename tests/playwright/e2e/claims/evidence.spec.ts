import { test, expect } from "../../fixtures/index.js";

test.describe("Claim - evidence", () => {
  test.beforeEach(async ({ page }) => {
    console.log("Starting claim evidence test");
    await page.goto("/claim/evidence");
  });

  test("renders back link to total cost", async ({ page }) => {
    const backLink = page.getByRole("link", { name: "Back", exact: true });

    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", "/claim/total-cost");
  });

  test("renders page heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { level: 1, name: "Upload evidence" }),
    ).toBeVisible();
  });

  test("renders continue button", async ({ page }) => {
    const form = page.getByTestId("evidence-form");
    const continueButton = form.getByRole("button", { name: "Continue" });

    await expect(continueButton).toBeVisible();
    await expect(continueButton).toHaveAttribute("type", "submit");
  });

  test("redirects to /claim/check-your-answers when continue is clicked", async ({
    page,
  }) => {
    await page
      .getByTestId("evidence-form")
      .getByRole("button", { name: "Continue" })
      .click();

    await expect(page).toHaveURL("/claim/check-your-answers");
  });
});
