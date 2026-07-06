import { test, expect } from "../../fixtures/index.js";

test.describe("Claim - confirm and submit", () => {
  test.beforeEach(async ({ page }) => {
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

  test("renders the cost card with placeholder totals", async ({ page }) => {
    const card = page.getByTestId("cost-summary-list");

    await expect(card).toContainText("Total claim cost");
    await expect(card).toContainText("Net total at 20%");
    await expect(card).toContainText("Gross total at 20%");
    await expect(card).toContainText("£1,000.00");
    await expect(card).toContainText("£1,200.00");
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

  test("renders a Change link for each section that does not link anywhere", async ({
    page,
  }) => {
    const changeLinks = page.getByRole("link", { name: /^Change/ });

    await expect(changeLinks).toHaveCount(4);

    const count = await changeLinks.count();
    for (let index = 0; index < count; index++) {
      await expect(changeLinks.nth(index)).toHaveAttribute("href", "#");
    }
  });

  test("renders the finish and submit button", async ({ page }) => {
    const form = page.getByTestId("confirm-and-submit-form");
    const submitButton = form.getByRole("button", {
      name: "Finish and submit claim",
    });

    await expect(submitButton).toBeVisible();
    await expect(submitButton).toHaveAttribute("type", "submit");
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

  test("redirects to the home page when the claim is submitted", async ({
    page,
  }) => {
    await page
      .getByTestId("confirm-and-submit-form")
      .getByRole("button", { name: "Finish and submit claim" })
      .click();

    await expect(page).toHaveURL("/");
  });
});
