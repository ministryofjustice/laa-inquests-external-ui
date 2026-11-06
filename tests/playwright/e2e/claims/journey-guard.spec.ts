import { test, expect } from "#tests/playwright/fixtures/index.js";
import en from "#src/infrastructure/locales/en.json" with { type: "json" };

test.describe("Claim - journey guard", () => {
  for (const pageUrl of [
    "/claim/search",
    "/claim/type",
    "/claim/check-your-answers",
    "/claim/results/select/INQ-NOT-IN-RESULTS",
    "/claim/confirmation/reject",
  ]) {
    test(`redirects to the declaration when ${pageUrl} is accessed before starting a claim`, async ({
      page,
    }) => {
      await page.goto(pageUrl);

      await expect(page).toHaveURL(/\/claim$/);
      await expect(page.getByTestId("claim-declaration-form")).toBeVisible();
    });
  }

  test("does not unlock case search when the declaration fails validation", async ({
    page,
  }) => {
    await page.goto("/claim");
    await page
      .getByTestId("claim-declaration-form")
      .getByRole("button", { name: "Start" })
      .click();
    await expect(page.getByRole("alert")).toBeVisible();

    await page.goto("/claim/search");

    await expect(page).toHaveURL(/\/claim$/);
    await expect(page.getByTestId("claim-declaration-form")).toBeVisible();
  });

  test("allows case search after accepting the declaration but blocks jumping to check your answers", async ({
    page,
  }) => {
    await page.goto("/claim");
    const declarationForm = page.getByTestId("claim-declaration-form");
    await declarationForm
      .getByLabel("I confirm that I have read and agree to the declaration")
      .check();
    await declarationForm.getByRole("button", { name: "Start" }).click();

    await expect(page).toHaveURL(/\/claim\/search$/);
    await expect(page.getByTestId("case-search-form")).toBeVisible();

    await page.goto("/claim/check-your-answers");

    await expect(page).toHaveURL(/\/claim$/);
    await expect(declarationForm).toBeVisible();
    await expect(
      declarationForm.getByLabel(
        "I confirm that I have read and agree to the declaration",
      ),
    ).toBeChecked();
  });

  test("allows final bills to skip subtype and zero-value bills to skip directly to inquest outcome", async ({
    page,
    withClaimStep,
  }) => {
    await withClaimStep("/claim/type");
    await page.goto("/claim/type");
    await page.getByLabel("Final bill").check();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL(/\/claim\/total-cost$/);

    await page
      .getByLabel(en.pages.claim.totalCost.finalBill.grossAmountLabel)
      .fill("0");
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL(/\/claim\/inquest-outcome$/);
    await expect(page.getByTestId("inquest-outcome-form")).toBeVisible();
  });

  test("skips counsel payment confirmation when no counsel were instructed", async ({
    page,
    withClaimStep,
  }) => {
    await withClaimStep("/claim/counsel-number");
    await page.goto("/claim/counsel-number");
    await page.getByLabel("0", { exact: true }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL(/\/claim\/end-date$/);
    await expect(
      page.getByRole("link", { name: "Back", exact: true }),
    ).toHaveAttribute("href", "/claim/counsel-number");
  });

  test("allows check your answers when no post-inquest funding is required", async ({
    page,
    withClaimStep,
  }) => {
    await withClaimStep("/claim/funding-post-inquest");
    await page.goto("/claim/funding-post-inquest");
    await page.getByLabel("No", { exact: true }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL(/\/claim\/check-your-answers$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Check your answers" }),
    ).toBeVisible();
  });

  test("requires recovery costs after changing the recovery answer from No to Yes", async ({
    page,
    withClaimStep,
  }) => {
    await withClaimStep("/claim/inquest-outcome-recovery");
    await page.goto("/claim/inquest-outcome-recovery");
    await page.getByLabel("No", { exact: true }).check();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL(/\/claim\/pre-cert-costs$/);

    await page.goto("/claim/inquest-outcome-recovery");
    await page.getByLabel("Yes", { exact: true }).check();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL(/\/claim\/recovery-costs$/);

    await page.goto("/claim/paying-party");

    await expect(page).toHaveURL(/\/claim\/inquest-outcome-recovery$/);
    await expect(page.getByLabel("Yes", { exact: true })).toBeChecked();
  });

  test("preserves claim answers when the fixture advances progress and allows revisiting earlier steps", async ({
    page,
    withClaimStep,
  }) => {
    await withClaimStep("/claim/type");
    await page.goto("/claim/type");
    await page.getByLabel("Final bill").check();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL(/\/claim\/total-cost$/);
    await page
      .getByLabel(en.pages.claim.totalCost.finalBill.grossAmountLabel)
      .fill("1250.50");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL(/\/claim\/final-bill-template$/);

    await withClaimStep("/claim/check-your-answers");
    await page.goto("/claim/total-cost");

    await expect(page).toHaveURL(/\/claim\/total-cost$/);
    await expect(
      page.getByLabel(en.pages.claim.totalCost.finalBill.grossAmountLabel),
    ).toHaveValue("1250.50");
    await page.goto("/claim/type");
    await expect(page.getByLabel("Final bill")).toBeChecked();
  });
});
