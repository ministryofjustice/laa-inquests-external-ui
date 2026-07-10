import { test, expect } from "../../fixtures/index.js";

test.describe("Claim - total cost", () => {
  test.beforeEach(async ({ page }) => {
    console.log("Starting total cost type test");
    await page.goto("/claim/total-cost");
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

  test("back link points to /claim/subtype when POA was selected", async ({
    page,
  }) => {
    await page.goto("/claim/type");
    await page.getByLabel("Payment on account (POA)").check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForURL("**/claim/subtype");
    await page.getByLabel("Expert cost").check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForURL("**/claim/total-cost");

    const backLink = page.getByRole("link", { name: "Back", exact: true });
    await expect(backLink).toHaveAttribute("href", "/claim/subtype");
  });

  test("back link points to /claim/type when a non-POA type was selected", async ({
    page,
  }) => {
    await page.goto("/claim/type");
    await page.getByLabel("Final bill").check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForURL("**/claim/total-cost");

    const backLink = page.getByRole("link", { name: "Back", exact: true });
    await expect(backLink).toHaveAttribute("href", "/claim/type");
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
