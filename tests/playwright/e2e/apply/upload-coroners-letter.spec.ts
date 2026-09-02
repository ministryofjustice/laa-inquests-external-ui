import { test, expect } from "../../fixtures/index.js";
import type { Locator, Page } from "playwright-core";
import {
  validateHeader,
  validateBackButton,
  validateCSRFToken,
  validateContinueButton,
  validateFormAttributes,
} from "../../utils/govuk-validators.js";
import {
  CORONERS_LETTER_ERROR,
  CORONERS_LETTER_MAX_FILE_SIZE_BYTES,
} from "#src/infrastructure/locales/constants.js";

const fileInputSelector = 'input[name="coroners-letter-file-upload"]';
const uploadFile = async (
  page: Page,
  file: { name: string; mimeType: string; buffer: Buffer },
): Promise<void> => {
  await page.locator(fileInputSelector).setInputFiles(file);
};

test.describe("Provider can", () => {
  let form: Locator;

  test.beforeEach(async ({ page }) => {
    await page.goto("/apply/upload-coroners-letter");
    form = page.getByTestId("upload-coroners-letter-form");
  });

  test("view the upload coroners letter evidence form", async ({
    page,
    checkAccessibility,
  }) => {
    await validateHeader(page, "Upload coroner's letter", 1);
    await validateBackButton(page, "/apply/public-authority");
    await validateFormAttributes(form, "/apply/upload-coroners-letter");
    await validateCSRFToken(form);
    await validateContinueButton(form);

    const uploadFormButton = form.getByLabel("Attach a file");
    await expect(uploadFormButton).toBeVisible();
    await checkAccessibility();
  });
  test("renders no file chosen error if file not uploaded before clicking continue", async ({
    page,
  }) => {
    const errorSummary = await page.getByRole("alert");
    await expect(errorSummary).not.toBeVisible();

    await form.getByRole("button", { name: "Continue" }).click();

    await expect(errorSummary).toBeVisible();
    await expect(errorSummary).toContainText("There is a problem");
    await expect(errorSummary).toContainText(
      CORONERS_LETTER_ERROR.NO_FILE_CHOSEN,
    );
  });
  test("renders file too large error if uploaded file exceeds 10MB", async ({
    page,
  }) => {
    const errorSummary = await page.getByRole("alert");
    await expect(errorSummary).not.toBeVisible();

    await uploadFile(page, {
      name: "too-large.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.alloc(CORONERS_LETTER_MAX_FILE_SIZE_BYTES + 1),
    });

    await form.getByRole("button", { name: "Continue" }).click();

    await expect(errorSummary).toBeVisible();
    await expect(errorSummary).toContainText("There is a problem");
    await expect(errorSummary).toContainText(
      CORONERS_LETTER_ERROR.FILE_TOO_LARGE,
    );
  });
  test("renders virus detected error if virus scan comes back positive", async ({
    page,
  }) => {
    const errorSummary = await page.getByRole("alert");
    await expect(errorSummary).not.toBeVisible();

    await uploadFile(page, {
      name: "virus.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("infected content"),
    });

    await form.getByRole("button", { name: "Continue" }).click();

    await expect(errorSummary).toBeVisible();
    await expect(errorSummary).toContainText("There is a problem");
    await expect(errorSummary).toContainText(
      CORONERS_LETTER_ERROR.FILE_SCAN_FOUND_VIRUS,
    );
  });
  test("renders file empty error if no content detected", async ({ page }) => {
    const errorSummary = await page.getByRole("alert");
    await expect(errorSummary).not.toBeVisible();

    await uploadFile(page, {
      name: "empty.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.alloc(0),
    });

    await form.getByRole("button", { name: "Continue" }).click();

    await expect(errorSummary).toBeVisible();
    await expect(errorSummary).toContainText("There is a problem");
    await expect(errorSummary).toContainText(
      CORONERS_LETTER_ERROR.FILE_IS_EMPTY,
    );
  });
  test("renders invalid file type error if file not one of jpg/png/bmp/pdf", async ({
    page,
  }) => {
    const errorSummary = await page.getByRole("alert");
    await expect(errorSummary).not.toBeVisible();

    await uploadFile(page, {
      name: "notes.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("hello"),
    });

    await form.getByRole("button", { name: "Continue" }).click();

    await expect(errorSummary).toBeVisible();
    await expect(errorSummary).toContainText("There is a problem");
    await expect(errorSummary).toContainText(
      CORONERS_LETTER_ERROR.INVALID_FILE_TYPE,
    );
  });

  test("deletes an uploaded coroner's letter", async ({ page }) => {
    await uploadFile(page, {
      name: "test-coroners-letter.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("coroners letter content"),
    });

    await form.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/apply/upload-coroners-letter");
    await expect(page.getByText("test_coroners_letter.pdf")).toBeVisible();

    await page.getByRole("button", { name: "Delete" }).click();

    await expect(page.getByText("test_coroners_letter.pdf")).toHaveCount(0);
  });
});
