import type { Page } from "@playwright/test";
import { test, expect } from "../../fixtures/index.js";
import { PRE_CERTIFICATE_COSTS_ERROR } from "#src/infrastructure/locales/constants.js";
import { validateCSRFToken } from "../../utils/govuk-validators.js";

// Pre-certificate costs is only reached when the recovery cost has not been made (No / Don't know)
async function answerRecoveryCostMadeAndContinue(
  page: Page,
  answer: "No" | "Don't know",
): Promise<void> {
  await page.goto("/claim/inquest-outcome-recovery");
  const form = page.getByTestId("inquest-outcome-recovery-form");
  await form.getByLabel(answer, { exact: true }).check();
  await form.getByRole("button", { name: "Continue" }).click();
}

test.describe("Claim - pre-certificate costs", () => {
  test("redirects to inquest outcome recovery when accessed directly without an answer", async ({
    page,
  }) => {
    await page.goto("/claim/pre-cert-costs");

    await expect(page).toHaveURL("/claim/inquest-outcome-recovery");
  });

  test("redirects to inquest outcome recovery when the recovery cost has been made", async ({
    page,
  }) => {
    await page.goto("/claim/inquest-outcome-recovery");
    const recoveryForm = page.getByTestId("inquest-outcome-recovery-form");
    await recoveryForm.getByLabel("Yes", { exact: true }).check();
    await recoveryForm.getByRole("button", { name: "Continue" }).click();

    await page.goto("/claim/pre-cert-costs");

    await expect(page).toHaveURL("/claim/inquest-outcome-recovery");
  });

  test.describe("page content", () => {
    test.beforeEach(async ({ page }) => {
      await answerRecoveryCostMadeAndContinue(page, "No");
    });

    test("renders back link to inquest outcome recovery", async ({
      page,
      checkAccessibility,
    }) => {
      const backLink = page.getByRole("link", { name: "Back", exact: true });

      await expect(backLink).toBeVisible();
      await expect(backLink).toHaveAttribute(
        "href",
        "/claim/inquest-outcome-recovery",
      );

      await checkAccessibility();
    });

    test("renders page heading", async ({ page }) => {
      await expect(
        page.getByRole("heading", {
          level: 1,
          name: "What is the amount for previous pre-certificate costs?",
        }),
      ).toBeVisible();
    });

    test("renders the currency input", async ({ page }) => {
      const form = page.getByTestId("pre-certificate-costs-form");

      await expect(form.getByLabel("Enter the total amount")).toBeVisible();
    });

    test("includes a csrf token in the form", async ({ page }) => {
      await validateCSRFToken(page.getByTestId("pre-certificate-costs-form"));
    });

    test("renders continue button", async ({ page }) => {
      const form = page.getByTestId("pre-certificate-costs-form");
      const continueButton = form.getByRole("button", { name: "Continue" });

      await expect(continueButton).toBeVisible();
      await expect(continueButton).toHaveAttribute("type", "submit");
    });
  });

  for (const answer of ["No", "Don't know"] as const) {
    test.describe(`when the recovery cost has not been made (${answer})`, () => {
      test.beforeEach(async ({ page }) => {
        await answerRecoveryCostMadeAndContinue(page, answer);
      });

      test("shows a validation error when the field is blank", async ({
        page,
        checkAccessibility,
      }) => {
        const form = page.getByTestId("pre-certificate-costs-form");

        await form.getByRole("button", { name: "Continue" }).click();

        await expect(page).toHaveURL("/claim/pre-cert-costs");
        await expect(
          page.getByRole("link", {
            name: PRE_CERTIFICATE_COSTS_ERROR.MISSING,
          }),
        ).toBeVisible();

        await checkAccessibility();
      });

      test("shows a validation error when the field is not a valid amount", async ({
        page,
      }) => {
        const form = page.getByTestId("pre-certificate-costs-form");

        await form.getByLabel("Enter the total amount").fill("abc");
        await form.getByRole("button", { name: "Continue" }).click();

        await expect(page).toHaveURL("/claim/pre-cert-costs");
        await expect(
          page.getByRole("link", {
            name: PRE_CERTIFICATE_COSTS_ERROR.INVALID,
          }),
        ).toBeVisible();
      });

      test("saves the entered value and continues to paying party", async ({
        page,
      }) => {
        const form = page.getByTestId("pre-certificate-costs-form");

        await form.getByLabel("Enter the total amount").fill("400");
        await form.getByRole("button", { name: "Continue" }).click();

        await expect(page).toHaveURL("/claim/paying-party");

        await page.goto("/claim/pre-cert-costs");
        await expect(
          page
            .getByTestId("pre-certificate-costs-form")
            .getByLabel("Enter the total amount"),
        ).toHaveValue("400");
      });
    });
  }
});
