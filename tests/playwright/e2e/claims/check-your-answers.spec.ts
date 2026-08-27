import { test, expect } from "../../fixtures/index.js";
import type { Page } from "@playwright/test";
import assert from "assert";

// Mirrors the ids/name returned by the mocked claim evidence endpoints in
// tests/playwright/factories/handlers/api.ts
const EVIDENCE_FILE_ID = "2f76cf9d-a90f-4f9c-8f27-bf22312c7138";
const NOT_FOUND_EVIDENCE_ID = "00000000-0000-0000-0000-000000000404";

async function uploadEvidence(page: Page): Promise<void> {
  await page.goto("/claim/evidence");
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes("/claim/evidence/upload") &&
        response.request().method() === "POST" &&
        response.status() === 201,
    ),
    page.setInputFiles("#documents", {
      name: "test-evidence.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("fake evidence content"),
    }),
  ]);
}

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

  test("renders back link to the evidence page", async ({
    page,
    checkAccessibility,
  }) => {
    const backLink = page.getByRole("link", { name: "Back", exact: true });

    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", "/claim/evidence");
    await checkAccessibility();
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
      page.getByRole("heading", { name: "Claim details", exact: true }),
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
    await expect(card).toContainText("Total at 0%");
    await expect(card).toContainText("Net total at 20%");
    await expect(card).toContainText("Gross total at 20%");
  });

  test("renders None for each missing cost value", async ({ page }) => {
    const card = page.getByTestId("cost-summary-list");

    await expect(card.getByText("None", { exact: true })).toHaveCount(3);
  });

  test("renders the cost card with values entered on the total-cost page", async ({
    page,
  }) => {
    await page.goto("/claim/total-cost");
    await page.getByLabel("Total for costs charged at 0% VAT").fill("10");
    await page
      .getByLabel("Net total excluding VAT, for costs where VAT can be charged")
      .fill("111.11");
    await page
      .getByLabel(
        "Gross total of the claim including VAT (calculated by adding the net total plus 20% vat, with the zero% VAT total)",
      )
      .fill("133.33");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForURL("**/claim/evidence");

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/claim/evidence/upload") &&
          response.request().method() === "POST" &&
          response.status() === 201,
      ),
      page.setInputFiles("#documents", {
        name: "test-evidence.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("fake evidence content"),
      }),
    ]);

    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForURL("**/claim/check-your-answers");

    const card = page.getByTestId("cost-summary-list");
    await expect(card).toContainText("£10.00");
    await expect(card).toContainText("£111.11");
    await expect(card).toContainText("£133.33");
  });

  test("renders the evidence card with a row per uploaded file and view/download links", async ({
    page,
  }) => {
    await uploadEvidence(page);
    await page.goto("/claim/check-your-answers");

    const card = page.getByTestId("evidence-summary-list");

    await expect(card).toContainText("Files");
    await expect(card).toContainText("test-evidence.pdf");

    await expect(card.getByRole("link", { name: "View" })).toHaveCount(1);
    await expect(
      card.getByRole("link", { name: "Download (PDF 1KB)" }),
    ).toBeVisible();
  });

  test("View link opens the file inline in a new tab", async ({ page }) => {
    await uploadEvidence(page);
    await page.goto("/claim/check-your-answers");

    const viewLink = page
      .getByTestId("evidence-summary-list")
      .getByRole("link", { name: "View" });

    await expect(viewLink).toHaveAttribute(
      "href",
      `/claim/evidence/${EVIDENCE_FILE_ID}/view`,
    );
    await expect(viewLink).toHaveAttribute("target", "_blank");
  });

  test("Download link points to the download route without opening a new tab", async ({
    page,
  }) => {
    await uploadEvidence(page);
    await page.goto("/claim/check-your-answers");

    const downloadLink = page
      .getByTestId("evidence-summary-list")
      .getByRole("link", { name: "Download (PDF 1KB)" });

    await expect(downloadLink).toHaveAttribute(
      "href",
      `/claim/evidence/${EVIDENCE_FILE_ID}/download`,
    );
    await expect(downloadLink).not.toHaveAttribute("target", "_blank");
  });

  test("requesting the view route streams the file with an inline disposition", async ({
    page,
  }) => {
    await uploadEvidence(page);

    const response = await page.request.get(
      `/claim/evidence/${EVIDENCE_FILE_ID}/view`,
    );

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/pdf");
    expect(response.headers()["content-disposition"]).toContain("inline");
  });

  test("requesting the download route streams the file with an attachment disposition", async ({
    page,
  }) => {
    await uploadEvidence(page);

    const response = await page.request.get(
      `/claim/evidence/${EVIDENCE_FILE_ID}/download`,
    );

    expect(response.status()).toBe(200);
    expect(response.headers()["content-disposition"]).toContain("attachment");
  });

  test("renders the not found page when the evidence does not exist", async ({
    page,
  }) => {
    const response = await page.request.get(
      `/claim/evidence/${NOT_FOUND_EVIDENCE_ID}/view`,
    );

    expect(response.status()).toBe(404);
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
    ).toHaveAttribute("href", "/claim/type?from=check-your-answers");
    await expect(
      claimDetails.getByRole("link", { name: "Change type of POA" }),
    ).toHaveAttribute("href", "/claim/subtype?from=check-your-answers");

    const cost = page.getByTestId("cost-summary-list");
    await expect(
      cost.getByRole("link", { name: "Change total at 0%" }),
    ).toHaveAttribute("href", "/claim/total-cost?from=check-your-answers");
    await expect(
      cost.getByRole("link", { name: "Change net total at 20%" }),
    ).toHaveAttribute("href", "/claim/total-cost?from=check-your-answers");
    await expect(
      cost.getByRole("link", { name: "Change gross total at 20%" }),
    ).toHaveAttribute("href", "/claim/total-cost?from=check-your-answers");

    const evidence = page.getByTestId("evidence-summary-list");
    await expect(
      evidence.getByRole("link", { name: "Change evidence" }),
    ).toHaveAttribute("href", "/claim/evidence?from=check-your-answers");
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
    await expect(caseDetails.getByText("1", { exact: true })).toBeVisible();
    const texts = await caseDetails.getByRole("definition").allInnerTexts();
    assert.equal(texts.length, 5);
  });

  test("redirects to the claim confirmation success page when the claim is submitted", async ({
    page,
  }) => {
    await page.goto("/claim/evidence");
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/claim/evidence/upload") &&
          response.request().method() === "POST" &&
          response.status() === 201,
      ),
      page.setInputFiles("#documents", {
        name: "test-evidence.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("fake evidence content"),
      }),
    ]);
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForURL("**/claim/check-your-answers");

    await page
      .getByTestId("confirm-and-submit-form")
      .getByRole("button", { name: "Finish and submit claim" })
      .click();

    await expect(page).toHaveURL("/claim/confirmation/success");
  });

  test("displays a 'There is a problem' error summary when claim evidence is missing", async ({
    page,
  }) => {
    await page
      .getByTestId("confirm-and-submit-form")
      .getByRole("button", { name: "Finish and submit claim" })
      .click();

    await expect(page).toHaveURL("/claim/check-your-answers");
    await expect(
      page.getByRole("heading", { name: "There is a problem" }),
    ).toBeVisible();
    await expect(page.getByText("Claim evidence is required")).toBeVisible();
  });

  test("displays a 'There is a problem' error summary when the API returns a 422", async ({
    page,
  }) => {
    await page.goto("/claim");
    await page
      .getByTestId("case-search-form")
      .getByLabel("Enter the case reference number")
      .fill("force-422");
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

    await page.goto("/claim/evidence");
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/claim/evidence/upload") &&
          response.request().method() === "POST" &&
          response.status() === 201,
      ),
      page.setInputFiles("#documents", {
        name: "test-evidence.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("fake evidence content"),
      }),
    ]);
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForURL("**/claim/check-your-answers");

    await page
      .getByTestId("confirm-and-submit-form")
      .getByRole("button", { name: "Finish and submit claim" })
      .click();

    await expect(page).toHaveURL("/claim/check-your-answers");
    await expect(
      page.getByRole("heading", { name: "There is a problem" }),
    ).toBeVisible();
    await expect(
      page.getByText("Net total cannot be higher than the gross total value"),
    ).toBeVisible();
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

  test.describe("Other claim details", () => {
    async function answerFunding(
      page: Page,
      answer: "Yes" | "No",
    ): Promise<void> {
      await page.goto("/claim/inquest-outcome");
      await page.getByLabel("Accident or misadventure").check();
      await page.getByRole("button", { name: "Continue" }).click();
      await page.waitForURL("**/claim/funding-post-inquest");
      await page.getByLabel(answer, { exact: true }).check();
      await page.getByRole("button", { name: "Continue" }).click();
    }

    async function completeRecoveryJourney(page: Page): Promise<void> {
      await answerFunding(page, "Yes");
      await page.waitForURL("**/claim/inquest-outcome-recovery");
      await page.getByLabel("Yes", { exact: true }).check();
      await page.getByRole("button", { name: "Continue" }).click();
      await page.waitForURL("**/claim/recovery-costs");
      await page.getByLabel("Costs", { exact: true }).fill("100");
      await page.getByLabel("Damages").fill("200");
      await page.getByLabel("Interest").fill("300");
      await page.getByLabel("Previous pre-certificate costs").fill("400");
      await page.getByRole("button", { name: "Continue" }).click();
      await page.waitForURL("**/claim/paying-party");
      await page.getByLabel("Who is the paying party?").fill("Acme Ltd");
      await page.getByRole("button", { name: "Continue" }).click();
      await page.waitForURL("**/claim/check-your-answers");
    }

    test("renders the Other claim details heading", async ({ page }) => {
      await expect(
        page
          .locator("h2.govuk-heading-m")
          .filter({ hasText: "Other claim details" }),
      ).toBeVisible();
    });

    test("always renders the Inquest details card", async ({ page }) => {
      const card = page.getByTestId("inquest-details-summary-list");

      await expect(card).toContainText("Inquest details");
      await expect(card).toContainText("Inquest outcome");
      await expect(card).toContainText("Alternative funding post-inquest");
    });

    test("renders the recovery cards with their rows and values when funding is Yes", async ({
      page,
    }) => {
      await completeRecoveryJourney(page);

      const inquest = page.getByTestId("inquest-details-summary-list");
      await expect(inquest).toContainText("Accident or misadventure");
      await expect(inquest).toContainText("Yes");

      const alternativeFunding = page.getByTestId(
        "alternative-funding-details-summary-list",
      );
      await expect(alternativeFunding).toContainText(
        "Alternative funding details",
      );
      await expect(alternativeFunding).toContainText("Recovery cost made");
      await expect(alternativeFunding).toContainText(
        "Previous pre-certificate costs",
      );
      await expect(alternativeFunding).toContainText("The paying party");
      await expect(alternativeFunding).toContainText("Acme Ltd");
      await expect(alternativeFunding).toContainText("£400.00");

      const financial = page.getByTestId(
        "financial-recovery-costs-summary-list",
      );
      await expect(financial).toContainText("Financial recovery costs");
      await expect(financial).toContainText("Costs");
      await expect(financial).toContainText("£100.00");
      await expect(financial).toContainText("£200.00");
      await expect(financial).toContainText("£300.00");
      await expect(financial).toContainText("£400.00");
    });

    test("renders a single panel-level Change link for financial recovery costs", async ({
      page,
    }) => {
      await completeRecoveryJourney(page);

      const financial = page.getByTestId(
        "financial-recovery-costs-summary-list",
      );
      const changeLinks = financial.getByRole("link", { name: "Change" });

      await expect(changeLinks).toHaveCount(1);
      await expect(changeLinks).toHaveAttribute(
        "href",
        "/claim/recovery-costs?from=check-your-answers",
      );
    });

    test("hides the recovery cards when funding post-inquest is No", async ({
      page,
    }) => {
      await answerFunding(page, "No");
      await page.waitForURL("**/claim/check-your-answers");

      await expect(
        page.getByTestId("inquest-details-summary-list"),
      ).toBeVisible();
      await expect(
        page.getByTestId("alternative-funding-details-summary-list"),
      ).toHaveCount(0);
      await expect(
        page.getByTestId("financial-recovery-costs-summary-list"),
      ).toHaveCount(0);
    });
  });
});
