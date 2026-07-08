import { test, expect } from "../../fixtures/index.js";
import type { Page } from "@playwright/test";

const completeJourneyToCheckYourAnswers = async (page: Page): Promise<void> => {
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

  await page.getByLabel("Payment on account (POA)").check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL("**/claim/subtype");
  await page.getByLabel("Profit cost").check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL("**/claim/total-cost");
  await page
    .getByTestId("total-cost-form")
    .getByRole("button", { name: "Continue" })
    .click();
  await page.waitForURL("**/claim/evidence");
  await page
    .getByTestId("evidence-form")
    .getByRole("button", { name: "Continue" })
    .click();
  await page.waitForURL("**/claim/check-your-answers");
};

test.describe("Claim - confirm success", () => {
  test.beforeEach(async ({ page }) => {
    await completeJourneyToCheckYourAnswers(page);
    await page
      .getByTestId("confirm-and-submit-form")
      .getByRole("button", { name: "Finish and submit claim" })
      .click();
    await page.waitForURL("**/claim/confirmation/success");
  });

  test("renders the panel heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Payment on account claim has been submitted",
      }),
    ).toBeVisible();
  });

  test("renders the claim reference number returned from the API", async ({
    page,
  }) => {
    await expect(page.getByText("Claim reference number")).toBeVisible();
    await expect(page.locator(".govuk-panel__body")).toContainText("42");
  });

  test("renders the What happens next heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { level: 2, name: "What happens next" }),
    ).toBeVisible();
  });

  test("renders the what happens next body text", async ({ page }) => {
    await expect(
      page.getByText(
        "Your claim has been successfully submitted, we will get back to you shortly with our decision and next steps.",
      ),
    ).toBeVisible();
  });

  test("renders a Make a new claim button linking to /claim", async ({
    page,
  }) => {
    const button = page.getByRole("button", { name: "Make a new claim" });

    await expect(button).toBeVisible();
    await expect(button).toHaveAttribute("href", "/claim");
  });

  test("renders a Copy reference number button that copies the claim reference", async ({
    page,
  }) => {
    await page.evaluate(() => {
      (
        window as typeof window & { copiedClaimReference?: string }
      ).copiedClaimReference = "";
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async (text: string) => {
            (
              window as typeof window & { copiedClaimReference?: string }
            ).copiedClaimReference = text;
          },
        },
      });
    });

    const button = page.getByRole("button", { name: "Copy reference number" });

    await expect(button).toBeVisible();
    await button.click();

    await expect
      .poll(async () =>
        page.evaluate(
          () =>
            (window as typeof window & { copiedClaimReference?: string })
              .copiedClaimReference,
        ),
      )
      .toBe("42");
  });
});
