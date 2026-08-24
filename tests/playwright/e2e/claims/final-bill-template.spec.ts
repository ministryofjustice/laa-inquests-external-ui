import { test, expect } from "../../fixtures/index.js";
import type { Page } from "@playwright/test";
import { CLAIM_FINAL_BILL_TEMPLATE_ERROR } from "#src/infrastructure/locales/constants.js";

const xlsxMimeType =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

async function goToFinalBillTemplate(page: Page): Promise<void> {
  await page.goto("/claim/type");
  await page.getByLabel("Final bill").check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL("**/claim/total-cost");
  await page.getByLabel("Enter the total gross amount").fill("1250.50");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL("**/claim/final-bill-template");
}

test.describe("Claim - final bill template", () => {
  test.beforeEach(async ({ page }) => {
    await goToFinalBillTemplate(page);
  });

  test("renders back link to total cost", async ({
    page,
    checkAccessibility,
  }) => {
    const backLink = page.getByRole("link", { name: "Back", exact: true });

    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", "/claim/total-cost");
    await checkAccessibility();
  });

  test("renders page heading and guidance content", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Upload claim cost template",
      }),
    ).toBeVisible();

    await expect(
      page.getByText(
        "Provide us with a breakdown of all the line items associated with. this case.",
      ),
    ).toBeVisible();

    await expect(
      page.getByText(
        "You must use the LAA cost claim evidence template for Inquest final bills. Final bills submitted which don't use this template will be rejected.",
      ),
    ).toBeVisible();

    await expect(
      page.getByText("For more information on how to complete the template", {
        exact: false,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", {
        name: "How to complete the LAA cost claim template and submit evidence",
      }),
    ).toHaveAttribute("href", "#");

    await expect(page.getByText(".excel")).toBeVisible();
    await expect(page.getByText("10mb max")).toBeVisible();
  });

  test("renders upload new files section with MOJ multi file upload", async ({
    page,
  }) => {
    const multiFileUpload = page.locator(
      "[data-module='moj-multi-file-upload']",
    );

    await expect(multiFileUpload).toBeVisible();

    await expect(
      page
        .locator("label[for='documents']")
        .filter({ hasText: "Upload new files" }),
    ).toBeVisible();
  });

  test("renders continue button", async ({ page }) => {
    const form = page.getByTestId("final-bill-template-form");
    const continueButton = form.getByRole("button", { name: "Continue" });

    await expect(continueButton).toBeVisible();
    await expect(continueButton).toHaveAttribute("type", "submit");
  });

  test("stays on final bill template page and shows error when continue is clicked without an upload", async ({
    page,
  }) => {
    await page
      .getByTestId("final-bill-template-form")
      .getByRole("button", { name: "Continue" })
      .click();

    await expect(page).toHaveURL("/claim/final-bill-template");
    await expect(page.locator(".govuk-error-summary")).toContainText(
      CLAIM_FINAL_BILL_TEMPLATE_ERROR.FILE_REQUIRED,
    );
  });

  test("uploads the template using the javascript multi-file uploader", async ({
    page,
  }) => {
    const [response] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes("/claim/final-bill-template/upload") &&
          r.request().method() === "POST",
      ),
      page.setInputFiles("#documents", {
        name: "cost-template.xlsx",
        mimeType: xlsxMimeType,
        buffer: Buffer.from("fake spreadsheet content"),
      }),
    ]);

    expect(response.status()).toBe(201);

    await page.reload();

    await expect(
      page
        .locator(".moj-multi-file-upload__message")
        .filter({ hasText: "cost-template.xlsx" })
        .first(),
    ).toBeVisible();
  });

  test("hides the upload input once a file has been uploaded", async ({
    page,
  }) => {
    await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes("/claim/final-bill-template/upload") &&
          r.request().method() === "POST" &&
          r.status() === 201,
      ),
      page.setInputFiles("#documents", {
        name: "cost-template.xlsx",
        mimeType: xlsxMimeType,
        buffer: Buffer.from("fake spreadsheet content"),
      }),
    ]);

    await page.reload();

    await expect(page.locator("#documents")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /Delete cost-template\.xlsx/i }),
    ).toBeVisible();
  });

  test("redirects to /claim/evidence when continue is clicked with an uploaded file", async ({
    page,
  }) => {
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/claim/final-bill-template/upload") &&
          response.request().method() === "POST" &&
          response.status() === 201,
      ),
      page.setInputFiles("#documents", {
        name: "cost-template.xlsx",
        mimeType: xlsxMimeType,
        buffer: Buffer.from("fake spreadsheet content"),
      }),
    ]);

    await page
      .getByTestId("final-bill-template-form")
      .getByRole("button", { name: "Continue" })
      .click();

    await expect(page).toHaveURL("/claim/evidence");
  });

  test("deletes the uploaded template and shows the upload input again", async ({
    page,
  }) => {
    await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes("/claim/final-bill-template/upload") &&
          r.request().method() === "POST" &&
          r.status() === 201,
      ),
      page.setInputFiles("#documents", {
        name: "cost-template.xlsx",
        mimeType: xlsxMimeType,
        buffer: Buffer.from("fake spreadsheet content"),
      }),
    ]);

    const deleteButton = page.getByRole("button", {
      name: /Delete cost-template\.xlsx/i,
    });

    const [deleteResponse] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes("/claim/final-bill-template/delete") &&
          r.request().method() === "POST",
      ),
      deleteButton.click(),
    ]);

    expect(deleteResponse.status()).toBe(200);
    await expect(
      page
        .locator(".moj-multi-file-upload__message")
        .filter({ hasText: "cost-template.xlsx" }),
    ).toHaveCount(0);
    await expect(page.locator("#documents")).toBeVisible();
  });
});

test.describe("Claim - final bill template (no javascript)", () => {
  test.use({ javaScriptEnabled: false });

  test("uploads the template and redirects back to the final bill template page", async ({
    page,
  }) => {
    await goToFinalBillTemplate(page);

    await page.setInputFiles("#documents", {
      name: "cost-template.xlsx",
      mimeType: xlsxMimeType,
      buffer: Buffer.from("fake spreadsheet content"),
    });

    await page.getByRole("button", { name: "Upload file" }).click();

    await expect(page).toHaveURL("/claim/final-bill-template");
  });
});
