import type { Page } from "@playwright/test";
import { test, expect } from "../../fixtures/index.js";
import { FINANCIAL_RECOVERY_COSTS_ERROR } from "#src/infrastructure/locales/constants.js";
import { validateCSRFToken } from "../../utils/govuk-validators.js";

// Recovery costs now requires an answer from the previous step, so reach it via the real journey
async function answerRecoveryCostMadeAndContinue(
  page: Page,
  answer: "Yes" | "No" | "Don't know",
): Promise<void> {
  await page.goto("/claim/inquest-outcome-recovery");
  const form = page.getByTestId("inquest-outcome-recovery-form");
  await form.getByLabel(answer, { exact: true }).check();
  await form.getByRole("button", { name: "Continue" }).click();
}

test.describe("Claim - financial recovery costs", () => {
  test("redirects to inquest outcome recovery when accessed directly without an answer", async ({
    page,
  }) => {
    await page.goto("/claim/recovery-costs");

    await expect(page).toHaveURL("/claim/inquest-outcome-recovery");
  });

  test.describe("page content", () => {
    test.beforeEach(async ({ page }) => {
      await answerRecoveryCostMadeAndContinue(page, "Yes");
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
          name: "What are the financial recovery costs?",
        }),
      ).toBeVisible();
    });

    test("renders the four currency inputs", async ({ page }) => {
      const form = page.getByTestId("recovery-costs-form");

      await expect(form.getByLabel("Costs", { exact: true })).toBeVisible();
      await expect(form.getByLabel("Damages")).toBeVisible();
      await expect(form.getByLabel("Interest")).toBeVisible();
      await expect(
        form.getByLabel("Previous pre-certificate costs"),
      ).toBeVisible();
    });

    test("includes a csrf token in the form", async ({ page }) => {
      await validateCSRFToken(page.getByTestId("recovery-costs-form"));
    });

    test("renders continue button", async ({ page }) => {
      const form = page.getByTestId("recovery-costs-form");
      const continueButton = form.getByRole("button", { name: "Continue" });

      await expect(continueButton).toBeVisible();
      await expect(continueButton).toHaveAttribute("type", "submit");
    });
  });

  test.describe("when the recovery cost has been made (Yes)", () => {
    test.beforeEach(async ({ page }) => {
      await answerRecoveryCostMadeAndContinue(page, "Yes");
    });

    test("shows validation errors when costs, damages and interest are blank", async ({
      page,
      checkAccessibility,
    }) => {
      const form = page.getByTestId("recovery-costs-form");

      await form.getByRole("button", { name: "Continue" }).click();

      await expect(page).toHaveURL("/claim/recovery-costs");
      await expect(
        page.getByRole("link", {
          name: FINANCIAL_RECOVERY_COSTS_ERROR.MISSING_COSTS,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", {
          name: FINANCIAL_RECOVERY_COSTS_ERROR.MISSING_DAMAGES,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", {
          name: FINANCIAL_RECOVERY_COSTS_ERROR.MISSING_INTEREST,
        }),
      ).toBeVisible();

      await checkAccessibility();
    });

    test("does not require previous pre-certificate costs", async ({
      page,
    }) => {
      const form = page.getByTestId("recovery-costs-form");

      await form.getByLabel("Costs", { exact: true }).fill("100");
      await form.getByLabel("Damages").fill("200");
      await form.getByLabel("Interest").fill("300");
      await form.getByRole("button", { name: "Continue" }).click();

      await expect(page).toHaveURL("/claim/paying-party");
    });

    test("saves the entered values and continues to paying party", async ({
      page,
    }) => {
      const form = page.getByTestId("recovery-costs-form");

      await form.getByLabel("Costs", { exact: true }).fill("100");
      await form.getByLabel("Damages").fill("200");
      await form.getByLabel("Interest").fill("300");
      await form.getByLabel("Previous pre-certificate costs").fill("400");
      await form.getByRole("button", { name: "Continue" }).click();

      await expect(page).toHaveURL("/claim/paying-party");

      await page.goto("/claim/recovery-costs");
      await expect(
        page
          .getByTestId("recovery-costs-form")
          .getByLabel("Costs", { exact: true }),
      ).toHaveValue("100");
    });
  });

  for (const answer of ["No", "Don't know"] as const) {
    test.describe(`when the recovery cost has not been made (${answer})`, () => {
      test.beforeEach(async ({ page }) => {
        await answerRecoveryCostMadeAndContinue(page, answer);
      });

      test("shows a validation error when previous pre-certificate costs is blank", async ({
        page,
      }) => {
        const form = page.getByTestId("recovery-costs-form");

        await form.getByRole("button", { name: "Continue" }).click();

        await expect(page).toHaveURL("/claim/recovery-costs");
        await expect(
          page.getByRole("link", {
            name: FINANCIAL_RECOVERY_COSTS_ERROR.MISSING_PREVIOUS_PRE_CERTIFICATE_COSTS,
          }),
        ).toBeVisible();
      });

      test("does not require costs, damages or interest", async ({ page }) => {
        const form = page.getByTestId("recovery-costs-form");

        await form.getByLabel("Previous pre-certificate costs").fill("400");
        await form.getByRole("button", { name: "Continue" }).click();

        await expect(page).toHaveURL("/claim/paying-party");
      });
    });
  }
});
