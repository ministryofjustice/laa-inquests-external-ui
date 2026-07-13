import { test, expect } from "../../fixtures/index.js";

test.describe("Claim - confirm and submit", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/claim/type");
    await page.getByLabel("Payment on account (POA)").check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForURL("**/claim/subtype");
    await page.getByLabel("Expert cost").check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForURL("**/claim/total-cost");
    await page.goto("/claim/check-your-answers");
  });

  test("renders back link to the evidence page", async ({ page }) => {
    const backLink = page.getByRole("link", { name: "Back", exact: true });

    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", "/claim/evidence");
  });

  test("renders the page heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { level: 1, name: "Check your answers" }),
    ).toBeVisible();
  });

  test("renders the section headings", async ({ page }) => {
    const sectionHeadings = page.locator("h2.govuk-heading-m");

    await expect(
      sectionHeadings.filter({ hasText: "Case details" }),
    ).toBeVisible();
    await expect(
      sectionHeadings.filter({ hasText: "Claim details" }),
    ).toBeVisible();
    await expect(sectionHeadings.filter({ hasText: "Cost" })).toBeVisible();
    await expect(sectionHeadings.filter({ hasText: "Evidence" })).toBeVisible();
  });

  test("renders the case details card with its rows", async ({ page }) => {
    const card = page.getByTestId("case-details-summary-list");

    await expect(card).toContainText("Case reference number");
    await expect(card).toContainText("Client first name");
    await expect(card).toContainText("Client last name");
    await expect(card).toContainText("Client date of birth");
  });

  test("renders the claim details card with its rows", async ({ page }) => {
    const card = page.getByTestId("claim-details-summary-list");

    await expect(card).toContainText("Overview");
    await expect(card).toContainText("Type of claim");
    await expect(card).toContainText("Type of POA");
  });

  test("renders the cost card with expected rows", async ({ page }) => {
    const card = page.getByTestId("cost-summary-list");

    await expect(card).toContainText("Total claim cost");
    await expect(card).toContainText("Net total at 20%");
    await expect(card).toContainText("Gross total at 20%");
  });

  test("renders the cost card with values entered on the total-cost page", async ({
    page,
  }) => {
    await page.goto("/claim/total-cost");
    await page
      .getByLabel("Net total excluding VAT, for costs where VAT can be charged")
      .fill("111.11");
    await page.getByLabel("Gross total of claim including VAT").fill("133.33");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForURL("**/claim/evidence");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForURL("**/claim/check-your-answers");

    const card = page.getByTestId("cost-summary-list");
    await expect(card).toContainText("£111.11");
    await expect(card).toContainText("£133.33");
  });

  test("renders the evidence card with a row per file and view/download links", async ({
    page,
  }) => {
    const card = page.getByTestId("evidence-summary-list");

    await expect(card).toContainText("Files");
    await expect(card).toContainText("evidence-document-1.png");
    await expect(card).toContainText("evidence-document-2.pdf");

    await expect(card.getByRole("link", { name: "View" })).toHaveCount(2);
    await expect(
      card.getByRole("link", { name: "Download (png 57KB)" }),
    ).toBeVisible();
    await expect(
      card.getByRole("link", { name: "Download (pdf 112KB)" }),
    ).toBeVisible();
  });

  test("renders Change links pointing to the correct pages", async ({
    page,
  }) => {
    const caseDetails = page.getByTestId("case-details-summary-list");
    await expect(
      caseDetails.getByRole("link", { name: "Change case reference number" }),
    ).toHaveAttribute("href", "/claim");

    const claimDetails = page.getByTestId("claim-details-summary-list");
    await expect(
      claimDetails.getByRole("link", { name: "Change type of claim" }),
    ).toHaveAttribute("href", "/claim/type");
    await expect(
      claimDetails.getByRole("link", { name: "Change type of POA" }),
    ).toHaveAttribute("href", "/claim/subtype");

    const cost = page.getByTestId("cost-summary-list");
    await expect(
      cost.getByRole("link", { name: "Change net total at 20%" }),
    ).toHaveAttribute("href", "/claim/total-cost");
    await expect(
      cost.getByRole("link", { name: "Change gross total at 20%" }),
    ).toHaveAttribute("href", "/claim/total-cost");

    const evidence = page.getByTestId("evidence-summary-list");
    await expect(
      evidence.getByRole("link", { name: "Change evidence" }),
    ).toHaveAttribute("href", "/claim/evidence");
  });

  test("renders the finish and submit button", async ({ page }) => {
    const form = page.getByTestId("confirm-and-submit-form");
    const submitButton = form.getByRole("button", {
      name: "Finish and submit claim",
    });

    await expect(submitButton).toBeVisible();
    await expect(submitButton).toHaveAttribute("type", "submit");
    await expect(submitButton).toHaveAttribute(
      "data-prevent-double-click",
      "true",
    );
  });

  test("displays the claim answers that were saved in the session", async ({
    page,
  }) => {
    await page.goto("/claim/type");
    await page.getByLabel("Payment on account (POA)").check();
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/claim/subtype");
    await page.getByLabel("Expert cost").check();
    await page.getByRole("button", { name: "Continue" }).click();

    await page.goto("/claim/check-your-answers");

    const claimDetails = page.getByTestId("claim-details-summary-list");
    await expect(claimDetails).toContainText("Payment on account (POA)");
    await expect(claimDetails).toContainText("Expert cost");
  });

  test("displays the selected client details that were saved in the session", async ({
    page,
  }) => {
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

    await page.goto("/claim/check-your-answers");

    const caseDetails = page.getByTestId("case-details-summary-list");
    await expect(caseDetails).toContainText("Jane");
    await expect(caseDetails).toContainText("Smith");
    await expect(caseDetails).toContainText("01/01/2000");
  });

  test("redirects to the claim confirmation success page when the claim is submitted", async ({
    page,
  }) => {
    await page
      .getByTestId("confirm-and-submit-form")
      .getByRole("button", { name: "Finish and submit claim" })
      .click();

    await expect(page).toHaveURL("/claim/confirmation/success");
  });

  test("shows the Type of POA row when POA is the claim type", async ({
    page,
  }) => {
    await page.goto("/claim/type");
    await page.getByLabel("Payment on account (POA)").check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForURL("**/claim/subtype");
    await page.getByLabel("Expert cost").check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForURL("**/claim/total-cost");

    await page.goto("/claim/check-your-answers");

    const claimDetails = page.getByTestId("claim-details-summary-list");
    await expect(claimDetails).toContainText("Type of POA");
    await expect(claimDetails).toContainText("Expert cost");
  });

  test("hides the Type of POA row when the claim type is not POA", async ({
    page,
  }) => {
    await page.goto("/claim/type");
    await page.getByLabel("Final bill").check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForURL("**/claim/total-cost");

    await page.goto("/claim/check-your-answers");

    const claimDetails = page.getByTestId("claim-details-summary-list");
    await expect(claimDetails).not.toContainText("Type of POA");
  });
});
