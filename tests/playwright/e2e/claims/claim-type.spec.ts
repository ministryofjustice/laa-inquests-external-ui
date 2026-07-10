import { test, expect } from "../../fixtures/index.js";

test.describe("Claim - claim type", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/claim/type");
  });

  test("renders back link to case search results", async ({ page }) => {
    const backLink = page.getByRole("link", { name: "Back", exact: true });

    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", "/claim/results");
  });

  test("renders page heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "What type of claim are you making?",
      }),
    ).toBeVisible();
  });

  test("renders the three claim type options", async ({ page }) => {
    const form = page.getByTestId("claim-type-form");

    await expect(form).toBeVisible();
    await expect(form.getByLabel("Payment on account (POA)")).toBeVisible();
    await expect(form.getByLabel("Nil bill")).toBeVisible();
    await expect(form.getByLabel("Final bill")).toBeVisible();
  });

  test("renders continue button", async ({ page }) => {
    const form = page.getByTestId("claim-type-form");
    const continueButton = form.getByRole("button", { name: "Continue" });

    await expect(continueButton).toBeVisible();
    await expect(continueButton).toHaveAttribute("type", "submit");
  });

  test("shows validation error when submitted without a selection", async ({
    page,
  }) => {
    const form = page.getByTestId("claim-type-form");

    await form.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/claim/type");
    await expect(
      page.getByRole("link", {
        name: "Please select a claim type",
      }),
    ).toBeVisible();
    await expect(
      page.getByText("Error: Please select a claim type"),
    ).toBeVisible();
  });

  test("redirects to subtype page when Payment on account is selected", async ({
    page,
  }) => {
    const form = page.getByTestId("claim-type-form");

    await form.getByLabel("Payment on account (POA)").check();
    await form.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/claim/subtype");
  });

  test("skips to total cost page when a non-POA option is selected", async ({
    page,
  }) => {
    const form = page.getByTestId("claim-type-form");

    await form.getByLabel("Final bill").check();
    await form.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/claim/total-cost");
  });

  test("keeps the previously selected option marked when returning", async ({
    page,
  }) => {
    const form = page.getByTestId("claim-type-form");

    await form.getByLabel("Nil bill").check();
    await form.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL("/claim/total-cost");

    await page.goto("/claim/type");

    await expect(
      page.getByTestId("claim-type-form").getByLabel("Nil bill"),
    ).toBeChecked();
  });
});
