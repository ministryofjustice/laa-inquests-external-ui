import { test, expect } from "../../fixtures/index.js";
import type { Page } from "playwright-core";
import { testFilenameUploadErrors } from "../../utils/upload-validation.js";
import {
  validateHeader,
  validateBackButton,
  validateCSRFToken,
  validateContinueButton,
} from "../../utils/govuk-validators.js";
import {
  CORONERS_LETTER_ERROR,
  CORONERS_LETTER_MAX_FILE_SIZE_BYTES,
} from "#src/infrastructure/locales/constants.js";

// The mock upload handler returns this fixed file name for any non-virus file.
const MOCK_UPLOADED_FILE_NAME = "test_coroners_letter.pdf";

const uploadCoronersLetter = async (
  page: Page,
  file: { name: string; mimeType: string; buffer: Buffer },
): Promise<void> => {
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes("/apply/upload-coroners-letter/upload") &&
        response.request().method() === "POST" &&
        response.status() === 302,
    ),
    page.setInputFiles('input[type="file"][name="documents"]', file),
  ]);
};

test.describe("Apply - upload correspondence from the coroner", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/apply/upload-coroners-letter");
  });

  testFilenameUploadErrors(
    "coroners-letter.pdf",
    "application/pdf",
    "a JPG, PNG, BMP or PDF",
    "#documents-error",
  );

  test("displays an HTML 500 response returned by the upload POST", async ({
    page,
    checkAccessibility,
  }) => {
    await page.route(
      "**/apply/upload-coroners-letter/upload",
      async (route) => {
        await route.fulfill({
          status: 500,
          contentType: "text/html",
          body: '<!doctype html><html lang="en"><title>Service problem</title><main><h1>500</h1><p>Internal Server Error</p></main></html>',
        });
      },
    );
    const [errorPage] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.request().isNavigationRequest() &&
          response.url().endsWith("/apply/upload-coroners-letter/upload"),
      ),
      page.locator('input[type="file"][name="documents"]').setInputFiles({
        name: "coroners-letter.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("coroners letter content"),
      }),
      expect(page).toHaveURL("/apply/upload-coroners-letter/upload"),
    ]);
    expect(errorPage.status()).toBe(500);
    await expect(
      page.getByRole("heading", { name: "500", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Internal Server Error", { exact: true }),
    ).toBeVisible();
    await checkAccessibility();
  });
  test("renders the page heading, back link and continue button", async ({
    page,
    checkAccessibility,
  }) => {
    await validateHeader(page, "Upload correspondence from the coroner", 1);
    await validateBackButton(page, "/apply/public-authority");

    await expect(
      page.getByText(
        "Your file should include details of the inquest, including specific reference to one or more public authorities being named as interested parties. We will use this evidence when assessing your claim.",
      ),
    ).toBeVisible();
    await expect(
      page.getByText(/maximum file size for each file is 10MB/),
    ).toBeVisible();
    await expect(
      page.getByText(/We can accept these file types/),
    ).toBeVisible();

    const continueForm = page.getByTestId("upload-coroners-letter-form");
    await validateCSRFToken(continueForm);
    await validateContinueButton(continueForm);

    await checkAccessibility();
  });

  test("renders the GOV.UK single file upload component", async ({
    page,
    checkAccessibility,
  }) => {
    const fileInput = page.locator('input[type="file"][name="documents"]');
    await expect(fileInput).toHaveCount(1);

    await expect(
      page.locator('[data-module="govuk-file-upload"]'),
    ).toHaveAttribute("data-govuk-file-upload-init", "");
    await expect(
      page.getByRole("button", { name: /Upload new file.*Choose file/ }),
    ).toBeVisible();
    await expect(
      page.locator('[data-module="moj-multi-file-upload"]'),
    ).toHaveCount(0);
    await checkAccessibility();
  });

  test("hides the explicit Upload file button when JavaScript is active", async ({
    page,
  }) => {
    await expect(
      page.getByRole("button", { name: "Upload file", exact: true }),
    ).toBeHidden();
    await expect(
      page.getByRole("button", { name: "Continue", exact: true }),
    ).toBeVisible();
  });

  test("uploads on file selection and only proceeds when Continue is clicked", async ({
    page,
  }) => {
    const [response] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/apply/upload-coroners-letter/upload") &&
          response.request().method() === "POST",
      ),
      page.locator('input[type="file"][name="documents"]').setInputFiles({
        name: "test-coroners-letter.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("coroners letter content"),
      }),
    ]);

    expect(response.request().isNavigationRequest()).toBe(true);
    expect(response.status()).toBe(302);
    await expect(page).toHaveURL("/apply/upload-coroners-letter");
    await expect(page.getByTestId("uploaded-coroners-letter")).toBeVisible();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page).toHaveURL("/apply/check-your-answers");
    await expect(
      page.getByTestId("coroners-letter-summary-list"),
    ).toContainText(MOCK_UPLOADED_FILE_NAME);
  });

  test("preserves the uploaded filename and allows deletion after returning to the page", async ({
    page,
  }) => {
    const file = {
      name: "test-coroners-letter.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("coroners letter content"),
    };
    const fileInput = page.locator('input[type="file"][name="documents"]');
    await fileInput.setInputFiles(file);
    await expect(page.getByTestId("uploaded-coroners-letter")).toBeVisible();
    const uploadedFile = page.getByTestId("uploaded-coroners-letter");
    await expect(uploadedFile).toContainText(MOCK_UPLOADED_FILE_NAME);
    await expect(fileInput).toBeDisabled();
    await page.goto("/apply/public-authority");
    await page.goto("/apply/upload-coroners-letter");
    await expect(uploadedFile).toContainText(MOCK_UPLOADED_FILE_NAME);
    await expect(
      uploadedFile.getByRole("heading", { name: "Uploaded files", level: 2 }),
    ).toBeVisible();
    await expect(uploadedFile.locator(".govuk-summary-list__row")).toHaveCount(
      1,
    );
    await expect(fileInput).toBeDisabled();
    await uploadedFile
      .getByRole("button", {
        name: `Delete ${MOCK_UPLOADED_FILE_NAME}`,
        exact: true,
      })
      .click();
    await expect(uploadedFile).toBeHidden();
    await expect(fileInput).toBeEnabled();
    await fileInput.setInputFiles(file);
    await expect(page.getByTestId("uploaded-coroners-letter")).toBeVisible();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page).toHaveURL("/apply/check-your-answers");
    await expect(
      page.getByTestId("coroners-letter-summary-list"),
    ).toContainText(MOCK_UPLOADED_FILE_NAME);
  });

  test.describe("Apply - single coroner's letter upload without JavaScript", () => {
    test.use({ javaScriptEnabled: false });

    test.beforeEach(async ({ page }) => {
      await page.goto("/apply/upload-coroners-letter");
    });

    test("renders separate CSRF-protected upload and Continue forms", async ({
      page,
    }) => {
      const uploadForm = page.locator(
        'form[data-module="coroners-letter-upload"]',
      );
      await expect(uploadForm).toHaveAttribute("method", "post");
      await expect(uploadForm).toHaveAttribute(
        "enctype",
        "multipart/form-data",
      );
      await expect(uploadForm.locator('input[name="_csrf"]')).toHaveCount(1);
      await expect(uploadForm.locator('input[name="_csrf"]')).toHaveValue(/.+/);
      await expect(uploadForm.locator('input[name="uploadMode"]')).toHaveValue(
        "html",
      );
      await expect(
        uploadForm.getByLabel("Upload new file", { exact: true }),
      ).toHaveAttribute("name", "documents");
      await expect(
        uploadForm.getByRole("button", { name: "Upload file", exact: true }),
      ).toBeVisible();
      await expect(
        uploadForm.getByRole("button", { name: "Continue", exact: true }),
      ).toHaveCount(0);

      const continueForm = page.getByTestId("upload-coroners-letter-form");
      await expect(continueForm).toHaveAttribute(
        "action",
        "/apply/upload-coroners-letter",
      );
      await expect(continueForm).toHaveAttribute("method", "post");
      await expect(continueForm.locator('input[name="_csrf"]')).toHaveCount(1);
      await expect(continueForm.locator('input[name="_csrf"]')).toHaveValue(
        /.+/,
      );
      await validateContinueButton(continueForm);
    });

    test("renders a linked validation error when Continue is clicked without an upload", async ({
      page,
    }) => {
      await page.getByRole("button", { name: "Continue", exact: true }).click();
      await expect(page).toHaveURL("/apply/upload-coroners-letter");
      const errorSummary = page.getByRole("alert");
      await expect(errorSummary).toContainText(
        CORONERS_LETTER_ERROR.NO_FILE_CHOSEN,
      );
      await expect(errorSummary.getByRole("link")).toHaveAttribute(
        "href",
        "#documents",
      );
      await expect(page.locator("#documents")).toHaveAttribute(
        "aria-describedby",
        /documents-error/,
      );
      await expect(page.locator("#documents-error")).toContainText(
        CORONERS_LETTER_ERROR.NO_FILE_CHOSEN,
      );
    });

    test("uploads a file before Continue proceeds to check your answers", async ({
      page,
    }) => {
      await page.locator('input[type="file"]').setInputFiles({
        name: "test-coroners-letter.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("coroners letter content"),
      });
      await page
        .getByRole("button", { name: "Upload file", exact: true })
        .click();
      await expect(page).toHaveURL("/apply/upload-coroners-letter");
      await page.getByRole("button", { name: "Continue", exact: true }).click();
      await expect(page).toHaveURL("/apply/check-your-answers");
      await expect(
        page.getByTestId("coroners-letter-summary-list"),
      ).toContainText(MOCK_UPLOADED_FILE_NAME);
    });

    test("shows the uploaded filename on the upload page", async ({ page }) => {
      await page.getByLabel("Upload new file", { exact: true }).setInputFiles({
        name: "test-coroners-letter.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("coroners letter content"),
      });
      await page
        .getByRole("button", { name: "Upload file", exact: true })
        .click();

      await expect(page).toHaveURL("/apply/upload-coroners-letter");
      const uploadedFile = page.getByTestId("uploaded-coroners-letter");
      await expect(
        uploadedFile.getByRole("heading", { name: "Uploaded files", level: 2 }),
      ).toBeVisible();
      await expect(
        uploadedFile.locator(".govuk-summary-list__row"),
      ).toHaveCount(1);
      await expect(
        uploadedFile
          .locator(".govuk-summary-list")
          .getByText(MOCK_UPLOADED_FILE_NAME, { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", {
          name: `Delete ${MOCK_UPLOADED_FILE_NAME}`,
          exact: true,
        }),
      ).toBeVisible();
    });

    test("deletes the uploaded file and allows another upload", async ({
      page,
    }) => {
      const file = {
        name: "test-coroners-letter.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("coroners letter content"),
      };
      const input = page.locator('input[type="file"][name="documents"]');
      await input.setInputFiles(file);
      await page
        .getByRole("button", { name: "Upload file", exact: true })
        .click();
      await page
        .getByRole("button", {
          name: `Delete ${MOCK_UPLOADED_FILE_NAME}`,
          exact: true,
        })
        .click();
      await expect(page.getByTestId("uploaded-coroners-letter")).toBeHidden();
      await expect(input).toBeEnabled();
      await input.setInputFiles(file);
      await page
        .getByRole("button", { name: "Upload file", exact: true })
        .click();
      await expect(page.getByTestId("uploaded-coroners-letter")).toContainText(
        MOCK_UPLOADED_FILE_NAME,
      );
    });

    test("can upload after an upload validation error without losing its CSRF token", async ({
      page,
    }) => {
      await page
        .getByRole("button", { name: "Upload file", exact: true })
        .click();
      await expect(page.getByRole("alert")).toContainText(
        CORONERS_LETTER_ERROR.NO_FILE_CHOSEN,
      );
      const uploadForm = page.locator(
        'form[data-module="coroners-letter-upload"]',
      );
      await expect(uploadForm.locator('input[name="_csrf"]')).toHaveValue(/.+/);
      await uploadForm.locator('input[type="file"]').setInputFiles({
        name: "test-coroners-letter.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("coroners letter content"),
      });
      await page
        .getByRole("button", { name: "Upload file", exact: true })
        .click();
      await expect(page).toHaveURL("/apply/upload-coroners-letter");
      await page.getByRole("button", { name: "Continue", exact: true }).click();
      await expect(page).toHaveURL("/apply/check-your-answers");
      await expect(
        page.getByTestId("coroners-letter-summary-list"),
      ).toContainText(MOCK_UPLOADED_FILE_NAME);
    });
  });

  test("shows one uploaded-file summary row with Delete button", async ({
    page,
    checkAccessibility,
  }) => {
    const uploadedFile = page.getByTestId("uploaded-coroners-letter");
    await expect(uploadedFile).toBeHidden();
    await page.locator('input[type="file"][name="documents"]').setInputFiles({
      name: "test-coroners-letter.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("coroners letter content"),
    });

    await expect(
      uploadedFile.getByRole("heading", { name: "Uploaded files", level: 2 }),
    ).toBeVisible();
    const row = uploadedFile.locator(".govuk-summary-list__row");
    await expect(row).toHaveCount(1);
    await expect(row.locator("[data-uploaded-filename]")).toHaveText(
      MOCK_UPLOADED_FILE_NAME,
    );
    await expect(
      row.getByRole("button", {
        name: `Delete ${MOCK_UPLOADED_FILE_NAME}`,
        exact: true,
      }),
    ).toBeVisible();

    const guidance = await page
      .getByText(/Filenames should only include/)
      .boundingBox();
    const uploadedFilesHeading = await page
      .getByRole("heading", { name: "Uploaded files", level: 2 })
      .boundingBox();
    const uploadLabel = await page
      .locator("label.govuk-label[for='documents']")
      .boundingBox();

    expect(guidance).not.toBeNull();
    expect(uploadedFilesHeading).not.toBeNull();
    expect(uploadLabel).not.toBeNull();
    expect(guidance!.y).toBeLessThan(uploadedFilesHeading!.y);
    expect(uploadedFilesHeading!.y).toBeLessThan(uploadLabel!.y);
    await checkAccessibility();
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

  test("clears the no-file-chosen error after a successful JS upload", async ({
    page,
  }) => {
    const errorSummary = page.getByRole("alert");

    await page
      .getByTestId("upload-coroners-letter-form")
      .getByRole("button", { name: "Continue" })
      .click();

    await expect(errorSummary).toContainText(
      CORONERS_LETTER_ERROR.NO_FILE_CHOSEN,
    );
    await expect(page).toHaveTitle(/^Error:/);

    await uploadCoronersLetter(page, {
      name: "test-coroners-letter.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("coroners letter content"),
    });

    await expect(errorSummary).not.toBeVisible();
    await expect(page.locator(".govuk-form-group--error")).toHaveCount(0);
    await expect(
      page.locator('input[type="file"][name="documents"]'),
    ).not.toHaveClass(/govuk-file-upload--error/);
    await expect(page).not.toHaveTitle(/^Error:/);
  });

  test("shows the automatically uploaded coroner's letter in the summary list", async ({
    page,
  }) => {
    await uploadCoronersLetter(page, {
      name: "test-coroners-letter.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("coroners letter content"),
    });

    await expect(
      page
        .getByTestId("uploaded-coroners-letter")
        .locator("[data-uploaded-filename]"),
    ).toHaveText(MOCK_UPLOADED_FILE_NAME);
  });

  test("redirects to check your answers when continue is clicked with an uploaded file", async ({
    page,
  }) => {
    await uploadCoronersLetter(page, {
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

  test("deletes an automatically uploaded coroner's letter using the Delete form", async ({
    page,
  }) => {
    await uploadCoronersLetter(page, {
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
          response.url().includes("/apply/upload-coroners-letter/upload") &&
          response.request().method() === "POST",
      ),
      deleteButton.click(),
    ]);

    expect(deleteResponse.status()).toBe(302);
    await expect(page.getByTestId("uploaded-coroners-letter")).toBeHidden();
    await expect(
      page.locator('input[type="file"][name="documents"]'),
    ).toBeEnabled();
  });
  test("rejects a file one byte over 10MB in the browser before sending an upload request and identifies the filename", async ({
    page,
    checkAccessibility,
  }) => {
    await page.goto("/apply/upload-coroners-letter");
    const largeBuffer = Buffer.alloc(CORONERS_LETTER_MAX_FILE_SIZE_BYTES + 1);
    const uploadRequests: string[] = [];
    page.on("request", (request) => {
      if (
        request.method() === "POST" &&
        request.url().includes("/apply/upload-coroners-letter/upload")
      ) {
        uploadRequests.push(request.url());
      }
    });

    await page.setInputFiles('input[type="file"][name="documents"]', {
      name: "coroners-letter.pdf",
      mimeType: "application/pdf",
      buffer: largeBuffer,
    });

    const errorSummary = page.locator("#documents-error");
    await expect(errorSummary).toBeVisible();
    await expect(errorSummary).toHaveText(
      "coroners-letter.pdf must be smaller than 10MB",
    );
    expect(uploadRequests).toHaveLength(0);
    await expect(
      page.getByRole("button", { name: "Continue", exact: true }),
    ).toBeEnabled();
    await checkAccessibility();
  });

  test("rejects an invalid filename in the browser without sending a request and allows a valid upload afterwards", async ({
    page,
  }) => {
    const uploadRequests: string[] = [];
    page.on("request", (request) => {
      if (
        request.method() === "POST" &&
        request.url().includes("/apply/upload-coroners-letter/upload")
      ) {
        uploadRequests.push(request.url());
      }
    });
    const input = page.locator('input[type="file"][name="documents"]');
    await input.setInputFiles({
      name: "invalid'name.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("coroners letter content"),
    });

    await expect(page.locator("#documents-error")).toContainText(
      "invalid'name.pdf has an invalid filename",
    );
    expect(uploadRequests).toHaveLength(0);
    await expect(input).toBeEnabled();
    await expect(
      page.getByRole("button", { name: "Continue", exact: true }),
    ).toBeEnabled();

    const response = page.waitForResponse(
      (response) =>
        response.url().includes("/apply/upload-coroners-letter/upload") &&
        response.request().method() === "POST",
    );
    await input.setInputFiles({
      name: "coroners-letter.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("coroners letter content"),
    });
    expect((await response).status()).toBe(302);
    await expect(page.getByTestId("uploaded-coroners-letter")).toBeVisible();
    await expect(page.locator("#documents-error")).toHaveCount(0);
    expect(uploadRequests).toHaveLength(1);
  });

  test("allows a file of exactly 10MB with accepted filename punctuation through browser validation", async ({
    page,
  }) => {
    const response = page.waitForResponse(
      (response) =>
        response.url().includes("/apply/upload-coroners-letter/upload") &&
        response.request().method() === "POST",
    );
    await page.locator('input[type="file"][name="documents"]').setInputFiles({
      name: "coroners-letter! (final)_1.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.alloc(CORONERS_LETTER_MAX_FILE_SIZE_BYTES),
    });

    expect((await response).status()).toBe(302);
    await expect(page.getByTestId("uploaded-coroners-letter")).toBeVisible();
    await expect(page.locator("#documents-error")).toHaveCount(0);
  });
});
