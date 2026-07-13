import { test, expect } from "../../fixtures/index.js";

test.describe("Claim - total cost", () => {
  test.beforeEach(async ({ page }) => {
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

  test("renders total cost input fields", async ({ page }) => {
    await expect(
      page.getByLabel("Total for costs charged at 0% VAT"),
    ).toBeVisible();
    await expect(
      page.getByLabel(
        "Net total excluding VAT, for costs where VAT can be charged",
      ),
    ).toBeVisible();
    await expect(
      page.getByLabel("Gross total of claim including VAT"),
    ).toBeVisible();
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

  test("shows validation error and does not progress when no values are entered", async ({
    page,
  }) => {
    await page
      .getByTestId("total-cost-form")
      .getByRole("button", { name: "Continue" })
      .click();

    await expect(page).toHaveURL("/claim/total-cost");
    await expect(page.getByText("There is a problem")).toBeVisible();
    await expect(
      page.getByRole("link", {
        name: "Enter at least one amount for 0% VAT, net total, or gross total",
      }),
    ).toBeVisible();
    await expect(page.locator("#zero-vat-total-error")).toContainText(
      "Enter at least one amount for 0% VAT, net total, or gross total",
    );
  });

  test("shows validation error when net total is entered without gross total", async ({
    page,
  }) => {
    await page
      .getByLabel("Net total excluding VAT, for costs where VAT can be charged")
      .fill("100");

    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/claim/total-cost");
    await expect(
      page.getByRole("link", {
        name: "Enter gross total of claim including VAT when net total is entered",
      }),
    ).toBeVisible();
    await expect(page.locator("#gross-total-error")).toContainText(
      "Enter gross total of claim including VAT when net total is entered",
    );
  });

  test("shows validation error when gross total is less than net total", async ({
    page,
  }) => {
    await page
      .getByLabel("Net total excluding VAT, for costs where VAT can be charged")
      .fill("100");
    await page.getByLabel("Gross total of claim including VAT").fill("99.99");

    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/claim/total-cost");
    await expect(
      page.getByRole("link", {
        name: "Gross total of claim including VAT cannot be less than the net total",
      }),
    ).toBeVisible();
    await expect(page.locator("#gross-total-error")).toContainText(
      "Gross total of claim including VAT cannot be less than the net total",
    );
  });

  test("shows validation error when gross total does not match claim calculation", async ({
    page,
  }) => {
    await page.getByLabel("Total for costs charged at 0% VAT").fill("50");
    await page
      .getByLabel("Net total excluding VAT, for costs where VAT can be charged")
      .fill("100");
    await page.getByLabel("Gross total of claim including VAT").fill("160");

    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/claim/total-cost");
    await expect(
      page.getByRole("link", {
        name: "Gross total of claim including VAT must equal 0% VAT total plus net total plus 20% VAT",
      }),
    ).toBeVisible();
    await expect(page.locator("#gross-total-error")).toContainText(
      "Gross total of claim including VAT must equal 0% VAT total plus net total plus 20% VAT",
    );
  });

  test("redirects to /claim/evidence when valid values are submitted", async ({
    page,
  }) => {
    await page.getByLabel("Total for costs charged at 0% VAT").fill("100");
    await page
      .getByLabel("Net total excluding VAT, for costs where VAT can be charged")
      .fill("250.25");
    await page.getByLabel("Gross total of claim including VAT").fill("400.30");

    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/claim/evidence");
  });
});
