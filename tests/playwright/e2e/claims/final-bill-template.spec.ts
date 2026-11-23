import { test, expect } from "../../fixtures/index.js";
import type { Page } from "@playwright/test";
import { testFilenameUploadErrors } from "../../utils/upload-validation.js";
import { searchAndSelectCase } from "../../utils/claim-journey.js";
import { CLAIM_FINAL_BILL_TEMPLATE_ERROR } from "#src/infrastructure/locales/constants.js";

const xlsxMimeType =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

async function goToFinalBillTemplate(page: Page): Promise<void> {
  await searchAndSelectCase(page, "INQ-YYY-001");
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

  testFilenameUploadErrors(
    "cost-template.xlsx",
    xlsxMimeType,
    "a valid .xlsx file",
    ".moj-multi-file-upload__error",
  );

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

    await expect(page.getByText(".xlsx", { exact: true })).toBeVisible();
    await expect(page.getByText("10mb max")).toBeVisible();
    await expect(page.locator("#documents")).toHaveAttribute("accept", ".xlsx");
  });

  test("renders upload new files section with MOJ multi file upload", async ({
    page,
  }) => {
    const multiFileUpload = page.locator(
      '[data-module="moj-multi-file-upload"]',
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

  test("clears the file-required error after a successful JS upload", async ({
    page,
  }) => {
    await page
      .getByTestId("final-bill-template-form")
      .getByRole("button", { name: "Continue" })
      .click();

    await expect(page.locator(".govuk-error-summary")).toContainText(
      CLAIM_FINAL_BILL_TEMPLATE_ERROR.FILE_REQUIRED,
    );
    await expect(page).toHaveTitle(/^Error:/);

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

    await expect(page.locator(".govuk-error-summary")).toHaveCount(0);
    await expect(page.locator(".govuk-form-group--error")).toHaveCount(0);
    await expect(page.locator("#documents")).not.toHaveClass(
      /govuk-file-upload--error/,
    );
    await expect(page).not.toHaveTitle(/^Error:/);
  });

  test("uploads the template using the multi-file uploader", async ({
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

  test("keeps the upload input visible but rejects a second file after reloading", async ({
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

    await expect(page.locator("#documents")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Delete cost-template\.xlsx/i }),
    ).toBeVisible();

    const [uploadResponse] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes("/claim/final-bill-template/upload") &&
          r.request().method() === "POST",
      ),
      page.setInputFiles("#documents", {
        name: "second-cost-template.xlsx",
        mimeType: xlsxMimeType,
        buffer: Buffer.from("another fake spreadsheet content"),
      }),
    ]);

    expect(uploadResponse.status()).not.toBe(201);
    await expect(
      page.locator(".moj-multi-file-upload__error").last(),
    ).toContainText(CLAIM_FINAL_BILL_TEMPLATE_ERROR.ONLY_ONE_FILE_ALLOWED);
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

  test("deletes the uploaded template using AJAX after reloading the page", async ({
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

  test("shows an error when uploading a second file while one is already uploaded", async ({
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

    const [uploadResponse] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes("/claim/final-bill-template/upload") &&
          r.request().method() === "POST",
      ),
      page.setInputFiles("#documents", {
        name: "second-cost-template.xlsx",
        mimeType: xlsxMimeType,
        buffer: Buffer.from("another fake spreadsheet content"),
      }),
    ]);

    expect(uploadResponse.status()).not.toBe(201);
    await expect(
      page.locator(".moj-multi-file-upload__error").last(),
    ).toContainText(CLAIM_FINAL_BILL_TEMPLATE_ERROR.ONLY_ONE_FILE_ALLOWED);
  });
  test("identifies the filename when the file exceeds 10MB", async ({
    page,
    checkAccessibility,
  }) => {
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024);

    await page.setInputFiles("#documents", {
      name: "cost-template.xlsx",
      mimeType: xlsxMimeType,
      buffer: largeBuffer,
    });

    const errorSummary = page.locator(".moj-multi-file-upload__error");
    await expect(errorSummary).toBeVisible();
    await expect(errorSummary).toHaveText(
      "cost-template.xlsx must be smaller than 10MB",
    );
    await checkAccessibility();
  });

  test("rejects a legacy .xls spreadsheet before uploading it", async ({
    page,
    checkAccessibility,
  }) => {
    const [response] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes("/claim/final-bill-template/upload") &&
          r.request().method() === "POST",
      ),
      page.setInputFiles("#documents", {
        name: "cost-template.xls",
        mimeType: "application/vnd.ms-excel",
        buffer: Buffer.from("legacy spreadsheet content"),
      }),
    ]);

    expect(response.status()).toBe(422);
    await expect(page.locator(".moj-multi-file-upload__error")).toHaveText(
      "cost-template.xls must be a valid .xlsx file",
    );
    await checkAccessibility();
  });

  test("shows a macro error when the API rejects a macro-enabled spreadsheet", async ({
    page,
    checkAccessibility,
  }) => {
    const [response] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes("/claim/final-bill-template/upload") &&
          r.request().method() === "POST",
      ),
      page.setInputFiles("#documents", {
        name: "macro-template.xlsx",
        mimeType: xlsxMimeType,
        buffer: Buffer.from("macro spreadsheet content"),
      }),
    ]);

    expect(response.status()).toBe(422);
    await expect(page.locator(".moj-multi-file-upload__error")).toHaveText(
      "macro-template.xlsx must not contain macros",
    );
    await checkAccessibility();
  });

  test("shows an invalid file type error when the API rejects the file content", async ({
    page,
  }) => {
    const [response] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes("/claim/final-bill-template/upload") &&
          r.request().method() === "POST",
      ),
      page.setInputFiles("#documents", {
        name: "mismatch-template.xlsx",
        mimeType: xlsxMimeType,
        buffer: Buffer.from("not really a spreadsheet"),
      }),
    ]);

    expect(response.status()).toBe(422);
    await expect(page.locator(".moj-multi-file-upload__error")).toHaveText(
      "mismatch-template.xlsx must be a valid .xlsx file",
    );
  });

  test("clears a previous invalid-file-type error row when a valid file is uploaded next", async ({
    page,
  }) => {
    const [rejected] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes("/claim/final-bill-template/upload") &&
          r.request().method() === "POST",
      ),
      page.setInputFiles("#documents", {
        name: "mismatch-template.xlsx",
        mimeType: xlsxMimeType,
        buffer: Buffer.from("not really a spreadsheet"),
      }),
    ]);
    expect(rejected.status()).toBe(422);
    await expect(page.locator(".moj-multi-file-upload__error")).toHaveText(
      "mismatch-template.xlsx must be a valid .xlsx file",
    );

    const [accepted] = await Promise.all([
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
    expect(accepted.status()).toBe(201);

    await expect(page.locator(".moj-multi-file-upload__error")).toHaveCount(0);
    await expect(
      page
        .locator(".moj-multi-file-upload__message")
        .filter({ hasText: "cost-template.xlsx" }),
    ).toBeVisible();
  });

  test("clears a previous client-side too-large error row on the next attempt", async ({
    page,
  }) => {
    await page.setInputFiles("#documents", {
      name: "cost-template.xlsx",
      mimeType: xlsxMimeType,
      buffer: Buffer.alloc(11 * 1024 * 1024),
    });
    await expect(page.locator(".moj-multi-file-upload__error")).toHaveText(
      "cost-template.xlsx must be smaller than 10MB",
    );

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

    await expect(page.locator(".moj-multi-file-upload__error")).toHaveCount(0);
  });

  test.describe("without JavaScript", () => {
    test.use({ javaScriptEnabled: false });

    test("shows a macro error in the error summary when the API rejects a macro-enabled spreadsheet", async ({
      page,
    }) => {
      await page.setInputFiles("#documents", {
        name: "macro-template.xlsx",
        mimeType: xlsxMimeType,
        buffer: Buffer.from("macro spreadsheet content"),
      });
      const [response] = await Promise.all([
        page.waitForResponse(
          (r) =>
            r.url().includes("/claim/final-bill-template/upload") &&
            r.request().method() === "POST",
        ),
        page.getByRole("button", { name: "Upload file", exact: true }).click(),
      ]);

      expect(response.status()).toBe(400);
      await expect(page.locator(".govuk-error-summary")).toContainText(
        "macro-template.xlsx must not contain macros",
      );
    });
  });
});
