import { test, expect } from "../../fixtures/index.js";
import type { Page } from "@playwright/test";
import en from "#src/infrastructure/locales/en.json" with { type: "json" };
import { TOTAL_CLAIM_ERROR } from "#src/infrastructure/locales/constants.js";

const finalBillCopy = en.pages.claim.totalCost.finalBill;
const finalBillHeading = finalBillCopy.heading;
const finalBillParagraph = finalBillCopy.paragraph;
const grossAmountLabel = finalBillCopy.grossAmountLabel;
const grossAmountHint = finalBillCopy.grossAmountHint;

const missingAmountError = TOTAL_CLAIM_ERROR.MISSING_FINAL_BILL_GROSS_TOTAL;
const invalidAmountError = TOTAL_CLAIM_ERROR.INVALID_FINAL_BILL_GROSS_TOTAL;

async function goToFinalBillTotalCost(page: Page): Promise<void> {
  await page.goto("/claim/type");
  await page.getByLabel("Final bill").check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL("**/claim/total-cost");
}

test.describe("Claim - total cost (FINAL_BILL)", () => {
  test.beforeEach(async ({ page }) => {
    await goToFinalBillTotalCost(page);
  });

  test("renders the final bill layout", async ({
    page,
    checkAccessibility,
  }) => {
    await expect(
      page.getByRole("heading", { level: 1, name: finalBillHeading }),
    ).toBeVisible();
    await expect(page.getByText(finalBillParagraph)).toBeVisible();

    const form = page.getByTestId("total-cost-form");
    await expect(form.getByLabel(grossAmountLabel)).toBeVisible();
    await expect(page.getByText(grossAmountHint)).toBeVisible();

    const continueButton = form.getByRole("button", { name: "Continue" });
    await expect(continueButton).toBeVisible();
    await expect(continueButton).toHaveAttribute("type", "submit");

    await checkAccessibility();
  });

  test("does not render the POA cost inputs", async ({ page }) => {
    await expect(
      page.getByLabel("Total for costs charged at 0% VAT"),
    ).toHaveCount(0);
    await expect(
      page.getByLabel(
        "Net total excluding VAT, for costs where VAT can be charged",
      ),
    ).toHaveCount(0);
  });

  test("back link points to /claim/type", async ({ page }) => {
    const backLink = page.getByRole("link", { name: "Back", exact: true });
    await expect(backLink).toHaveAttribute("href", "/claim/type");
  });

  test("shows a validation error when no amount is entered", async ({
    page,
  }) => {
    await page
      .getByTestId("total-cost-form")
      .getByRole("button", { name: "Continue" })
      .click();

    await expect(page).toHaveURL("/claim/total-cost");
    await expect(
      page.getByRole("link", { name: missingAmountError }),
    ).toBeVisible();
    await expect(page.locator("#gross-total-error")).toContainText(
      missingAmountError,
    );
  });

  test("shows a validation error when the amount is not a number", async ({
    page,
  }) => {
    await page.getByLabel(grossAmountLabel).fill("abc");
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/claim/total-cost");
    await expect(
      page.getByRole("link", { name: invalidAmountError }),
    ).toBeVisible();
    await expect(page.locator("#gross-total-error")).toContainText(
      invalidAmountError,
    );
  });

  test("redirects to /claim/inquest-outcome when the amount is 0 (nil bill)", async ({
    page,
  }) => {
    await page.getByLabel(grossAmountLabel).fill("0");
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/claim/inquest-outcome");
  });

  test("redirects to /claim/inquest-outcome when the amount is 0.00 (nil bill)", async ({
    page,
  }) => {
    await page.getByLabel(grossAmountLabel).fill("0.00");
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/claim/inquest-outcome");
  });

  test("redirects to /claim/final-bill-template when the amount is greater than 0", async ({
    page,
  }) => {
    await page.getByLabel(grossAmountLabel).fill("1250.50");
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/claim/final-bill-template");
  });
});
