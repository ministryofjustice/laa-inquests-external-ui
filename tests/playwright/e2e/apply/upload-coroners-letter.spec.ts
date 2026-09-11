import { test, expect } from "../../fixtures/index.js";
import type { Page } from "playwright-core";
import {
  validateHeader,
  validateBackButton,
  validateCSRFToken,
  validateContinueButton,
} from "../../utils/govuk-validators.js";
import {
  CORONERS_LETTER_ERROR,
  INVALID_FILE_NAME,
} from "#src/infrastructure/locales/constants.js";

// The mock upload handler returns this fixed file name for any non-virus file.
const MOCK_UPLOADED_FILE_NAME = "test_coroners_letter.pdf";

const uploadViaWidget = async (
  page: Page,
  file: { name: string; mimeType: string; buffer: Buffer },
): Promise<void> => {
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes("/apply/upload-coroners-letter/upload") &&
        response.request().method() === "POST" &&
        response.status() === 201,
    ),
    page.setInputFiles("#documents", file),
  ]);
};

test.describe("Apply - upload coroner's letter", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/apply/upload-coroners-letter");
  });

  test("renders the page heading, back link and continue button", async ({
    page,
    checkAccessibility,
  }) => {
    await validateHeader(page, "Upload coroner's letter", 1);
    await validateBackButton(page, "/apply/public-authority");

    const continueForm = page.getByTestId("upload-coroners-letter-form");
    await validateCSRFToken(continueForm);
    await validateContinueButton(continueForm);

    await checkAccessibility();
  });

  test("renders the MOJ multi file upload widget", async ({ page }) => {
    const multiFileUpload = page.locator(
      "[data-module='moj-multi-file-upload']",
    );

    await expect(multiFileUpload).toBeVisible();
    await expect(multiFileUpload).toHaveAttribute(
      "data-moj-multi-file-upload-init",
      "",
    );

    await expect(
      page
        .locator("label[for='documents']")
        .filter({ hasText: "Attach a file" }),
    ).toBeVisible();
  });

  test("stays on the page and shows an error when continue is clicked without an upload", async ({
    page,
  }) => {
    const errorSummary = page.getByRole("alert");
    await expect(errorSummary).not.toBeVisible();

    await page
      .getByTestId("upload-coroners-letter-form")
      .getByRole("button", { name: "Continue" })
      .click();

    await expect(page).toHaveURL("/apply/upload-coroners-letter");
    await expect(errorSummary).toBeVisible();
    await expect(errorSummary).toContainText("There is a problem");
    await expect(errorSummary).toContainText(
      CORONERS_LETTER_ERROR.NO_FILE_CHOSEN,
    );
  });

  test("uploads a coroner's letter using the multifile uploader", async ({
    page,
  }) => {
    await uploadViaWidget(page, {
      name: "test-coroners-letter.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("coroners letter content"),
    });

    await expect(
      page
        .locator(".moj-multi-file-upload__message")
        .filter({ hasText: MOCK_UPLOADED_FILE_NAME })
        .first(),
    ).toBeVisible();
  });

  test("redirects to check your answers when continue is clicked with an uploaded file", async ({
    page,
  }) => {
    await uploadViaWidget(page, {
      name: "test-coroners-letter.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("coroners letter content"),
    });

    await page
      .getByTestId("upload-coroners-letter-form")
      .getByRole("button", { name: "Continue" })
      .click();

    await expect(page).toHaveURL("/apply/check-your-answers");
  });

  test("deletes an uploaded coroner's letter using the javascript uploader", async ({
    page,
  }) => {
    await uploadViaWidget(page, {
      name: "test-coroners-letter.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("coroners letter content"),
    });

    const deleteButton = page.getByRole("button", {
      name: new RegExp(`Delete ${MOCK_UPLOADED_FILE_NAME}`, "i"),
    });

    const [deleteResponse] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/apply/upload-coroners-letter/delete") &&
          response.request().method() === "POST",
      ),
      deleteButton.click(),
    ]);

    expect(deleteResponse.status()).toBe(200);
    await expect(
      page
        .locator(".moj-multi-file-upload__message")
        .filter({ hasText: MOCK_UPLOADED_FILE_NAME }),
    ).toHaveCount(0);
  });
  test("renders a file name error when file name contains unaccepted punctuation", async ({
    page,
  }) => {
    await page.goto("/apply/upload-coroners-letter");

    await page.setInputFiles("#documents", {
      name: "coroner's-letter.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("letter content"),
    });

    const errorSummary = page.locator(".moj-multi-file-upload__error");
    await expect(errorSummary).toBeVisible();
    await expect(errorSummary).toContainText(INVALID_FILE_NAME);
  });
});
