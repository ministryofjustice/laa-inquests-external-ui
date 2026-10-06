import { test, expect } from "../../fixtures/index.js";

test.describe("Claim - declaration", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/claim");
  });

  test("renders back link to start page", async ({
    page,
    checkAccessibility,
  }) => {
    const backLink = page.getByRole("link", { name: "Back", exact: true });

    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", "/");

    await checkAccessibility();
  });

  test("renders page heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Before you make a claim",
      }),
    ).toBeVisible();
  });

  test("renders claim declaration form", async ({ page }) => {
    const form = page.getByTestId("claim-declaration-form");

    await expect(form).toBeVisible();
  });

  test("renders continue button to the right of the input", async ({
    page,
  }) => {
    const form = page.getByTestId("claim-declaration-form");
    const startButton = form.getByRole("button", { name: "Start" });

    await expect(startButton).toBeVisible();
    await expect(startButton).toContainClass("govuk-button--start");
  });

  test("shows validation error when submitted without checking the declaration", async ({
    page,
  }) => {
    const form = page.getByTestId("claim-declaration-form");

    await form.getByRole("button", { name: "Start" }).click();

    const errorSummary = page.getByRole("alert");
    await expect(errorSummary).toBeVisible();
    await expect(errorSummary).toContainText(
      "Confirm you have read and agree to the declaration",
    );

    const errorMessageElement = form.locator(
      "#claim-declaration-confirmation-error",
    );
    await expect(errorMessageElement).toBeVisible();
    await expect(errorMessageElement).toContainText(
      "Confirm you have read and agree to the declaration",
    );
  });

  test("submits form when declaration is checked and redirects to case search", async ({
    page,
  }) => {
    const form = page.getByTestId("claim-declaration-form");

    await form
      .getByLabel("I confirm that I have read and agree to the declaration")
      .check();
    await form.getByRole("button", { name: "Start" }).click();

    await expect(page).toHaveURL("/claim/search");
  });

  test("Maintains selection on back navigation from case search", async ({
    page,
  }) => {
    const form = page.getByTestId("claim-declaration-form");

    await form
      .getByLabel("I confirm that I have read and agree to the declaration")
      .check();
    await form.getByRole("button", { name: "Start" }).click();

    await expect(page).toHaveURL("/claim/search");

    await page.getByRole("link", { name: "Back", exact: true }).click();
    await expect(page).toHaveURL("/claim");

    await expect(
      form.getByLabel(
        "I confirm that I have read and agree to the declaration",
      ),
    ).toBeChecked();
  });

  test("clears claim session data so back link on total cost reverts to /claim/type", async ({
    page,
  }) => {
    await page.goto("/claim/type");
    await page.getByLabel("Payment on account (POA)").check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForURL("**/claim/subtype");
    await page.getByLabel("Expert cost").check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForURL("**/claim/total-cost");

    await page.goto("/claim");
    await page.goto("/claim/total-cost");

    const backLink = page.getByRole("link", { name: "Back", exact: true });
    await expect(backLink).toHaveAttribute("href", "/claim/type");
  });
});
