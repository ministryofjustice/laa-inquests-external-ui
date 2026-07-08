import { test, expect } from "../../fixtures/index.js";

test.describe("Claim - evidence", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/claim");
    await page
      .getByTestId("case-search-form")
      .getByLabel("Enter the case reference number")
      .fill("1");
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
    await page.getByLabel("Final bill").check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForURL("**/claim/total-cost");
    await page
      .getByTestId("total-cost-form")
      .getByRole("button", { name: "Continue" })
      .click();
    await page.waitForURL("**/claim/evidence");
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
