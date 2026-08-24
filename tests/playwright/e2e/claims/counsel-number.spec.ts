import { test, expect } from "../../fixtures/index.js";

test.describe("Claim - counsel number", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/claim/counsel-number");
  });

  test("renders back link to evidence", async ({
    page,
    checkAccessibility,
  }) => {
    const backLink = page.getByRole("link", { name: "Back", exact: true });

    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", "/claim/evidence");

    await checkAccessibility();
  });

  test("renders page heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "How many counsel were instructed on this case?",
      }),
    ).toBeVisible();
  });

  test("sets the browser tab title from the page heading", async ({ page }) => {
    await expect(page).toHaveTitle(
      /How many counsel were instructed on this case\? – Inquests – GOV\.UK/,
    );
  });

  test("renders all counsel number options", async ({ page }) => {
    const form = page.getByTestId("counsel-number-form");

    await expect(form).toBeVisible();
    await expect(form.getByLabel("0", { exact: true })).toBeVisible();
    await expect(form.getByLabel("1", { exact: true })).toBeVisible();
    await expect(form.getByLabel("2", { exact: true })).toBeVisible();
    await expect(form.getByLabel("3", { exact: true })).toBeVisible();
    await expect(form.getByLabel("4", { exact: true })).toBeVisible();
    await expect(form.getByLabel("5", { exact: true })).toBeVisible();
    await expect(form.getByLabel("6 or more", { exact: true })).toBeVisible();
  });

  test("renders continue button", async ({ page }) => {
    const form = page.getByTestId("counsel-number-form");
    const continueButton = form.getByRole("button", { name: "Continue" });

    await expect(continueButton).toBeVisible();
    await expect(continueButton).toHaveAttribute("type", "submit");
  });

  test("shows validation error when submitted without a selection", async ({
    page,
  }) => {
    const form = page.getByTestId("counsel-number-form");

    await form.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/claim/counsel-number");
    await expect(
      page.getByRole("link", {
        name: "Select how many counsel were instructed on this case",
      }),
    ).toBeVisible();
  });

  test("skips to check your answers page when 0 counsel is selected", async ({
    page,
  }) => {
    const form = page.getByTestId("counsel-number-form");

    await form.getByLabel("0", { exact: true }).check();
    await form.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/claim/check-your-answers");
  });

  test("continues to pay confirmation page when more than 0 counsel is selected", async ({
    page,
  }) => {
    const form = page.getByTestId("counsel-number-form");

    await form.getByLabel("2", { exact: true }).check();
    await form.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/claim/counsel-pay-confirmation");
  });

  test("keeps the previously selected option marked when returning", async ({
    page,
  }) => {
    const form = page.getByTestId("counsel-number-form");

    await form.getByLabel("2", { exact: true }).check();
    await form.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL("/claim/counsel-pay-confirmation");

    await page.goto("/claim/counsel-number");

    await expect(
      page.getByTestId("counsel-number-form").getByLabel("2", { exact: true }),
    ).toBeChecked();
  });

  test("routes to the pay confirmation page when changing from zero to a non-zero value via check your answers", async ({
    page,
  }) => {
    const form = page.getByTestId("counsel-number-form");

    await form.getByLabel("0", { exact: true }).check();
    await form.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL("/claim/check-your-answers");

    await page.goto("/claim/counsel-number?from=check-your-answers");

    const changeForm = page.getByTestId("counsel-number-form");
    await changeForm.getByLabel("2", { exact: true }).check();
    await changeForm.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/claim/counsel-pay-confirmation");
  });
});
