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

  test("shows validation error and does not progress when no values are entered for non-profit POA", async ({
    page,
  }) => {
    await page.goto("/claim/type");
    await page.getByLabel("Payment on account (POA)").check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForURL("**/claim/subtype");
    await page.getByLabel("Expert cost").check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForURL("**/claim/total-cost");

    await page
      .getByTestId("total-cost-form")
      .getByRole("button", { name: "Continue" })
      .click();

    await expect(page).toHaveURL("/claim/total-cost");
    await expect(page.getByText("There is a problem")).toBeVisible();
    await expect(
      page.getByRole("link", {
        name: "Please complete the total value of your claim to continue",
      }),
    ).toBeVisible();
    await expect(page.locator("#zero-vat-total-error")).toContainText(
      "Please complete the total value of your claim to continue",
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
        name: "Please complete the gross total value of your claim",
      }),
    ).toBeVisible();
    await expect(page.locator("#gross-total-error")).toContainText(
      "Please complete the gross total value of your claim",
    );
  });

  test("shows validation error when net total is higher than gross total", async ({
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
        name: "Net total cannot be higher than the gross total value",
      }),
    ).toBeVisible();
    await expect(page.locator("#net-total-error")).toContainText(
      "Net total cannot be higher than the gross total value",
    );
  });

  test("shows validation error when profit cost claim has both 0% and 20% VAT entered", async ({
    page,
  }) => {
    await page.goto("/claim/type");
    await page.getByLabel("Payment on account (POA)").check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForURL("**/claim/subtype");
    await page.getByLabel("Profit cost").check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForURL("**/claim/total-cost");

    await page.getByLabel("Total for costs charged at 0% VAT").fill("150");
    await page
      .getByLabel("Net total excluding VAT, for costs where VAT can be charged")
      .fill("200");
    await page.getByLabel("Gross total of claim including VAT").fill("440");

    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/claim/total-cost");
    await expect(
      page.getByRole("link", {
        name: "You cannot submit a profit cost claim with both 0% and 20% VAT",
      }),
    ).toBeVisible();
    await expect(page.locator("#zero-vat-total-error")).toContainText(
      "You cannot submit a profit cost claim with both 0% and 20% VAT",
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

  test("allows all three fields for non-profit POA", async ({ page }) => {
    await page.goto("/claim/type");
    await page.getByLabel("Payment on account (POA)").check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForURL("**/claim/subtype");
    await page.getByLabel("Expert cost").check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForURL("**/claim/total-cost");

    await page.getByLabel("Total for costs charged at 0% VAT").fill("100.00");
    await page
      .getByLabel("Net total excluding VAT, for costs where VAT can be charged")
      .fill("200.00");
    await page.getByLabel("Gross total of claim including VAT").fill("340.00");

    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/claim/evidence");
  });

  test("allows 0% VAT field only for non-profit POA", async ({ page }) => {
    await page.goto("/claim/type");
    await page.getByLabel("Payment on account (POA)").check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForURL("**/claim/subtype");
    await page.getByLabel("Expert cost").check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForURL("**/claim/total-cost");

    await page.getByLabel("Total for costs charged at 0% VAT").fill("150.00");

    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/claim/evidence");
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
