import { test, expect } from "../../fixtures/index.js";
import type { Page } from "playwright-core";
import { testFilenameUploadErrors } from "../../utils/upload-validation.js";
import {
  validateHeader,
  validateBackButton,
  validateCSRFToken,
  validateContinueButton,
} from "../../utils/govuk-validators.js";
import { CORONERS_LETTER_ERROR } from "#src/infrastructure/locales/constants.js";

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

test.describe("Apply - upload correspondence from the coroner", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/apply/upload-coroners-letter");
  });

  testFilenameUploadErrors(
    "coroners-letter.pdf",
    "application/pdf",
    "a JPG, PNG, BMP or PDF",
  );

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

    expect(response.status()).toBe(201);
    await expect(page).toHaveURL("/apply/upload-coroners-letter");
    await expect(page.getByRole("status")).toHaveText("File uploaded");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page).toHaveURL("/apply/check-your-answers");
    await expect(
      page.getByTestId("coroners-letter-summary-list"),
    ).toContainText(MOCK_UPLOADED_FILE_NAME);
  });

  test("blocks Continue while an automatic upload is pending", async ({
    page,
  }) => {
    let releaseUpload = (): void => {};
    const uploadGate = new Promise<void>((resolve) => {
      releaseUpload = resolve;
    });
    await page.route(
      "**/apply/upload-coroners-letter/upload*",
      async (route) => {
        await uploadGate;
        await route.continue();
      },
    );
    const request = page.waitForRequest(
      (request) =>
        request.method() === "POST" &&
        request.url().includes("/apply/upload-coroners-letter/upload"),
    );
    const continueButton = page.getByRole("button", {
      name: "Continue",
      exact: true,
    });
    try {
      await page.locator('input[type="file"][name="documents"]').setInputFiles({
        name: "test-coroners-letter.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("coroners letter content"),
      });
      await request;
      await expect(continueButton).toBeDisabled();
      await expect(page).toHaveURL("/apply/upload-coroners-letter");
    } finally {
      releaseUpload();
    }
    await expect(page.getByRole("status")).toHaveText("File uploaded");
    await expect(continueButton).toBeEnabled();
    await continueButton.click();
    await expect(page).toHaveURL("/apply/check-your-answers");
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
    await expect(page.getByRole("status")).toHaveText("File uploaded");
    const uploadedFile = page.getByTestId("uploaded-coroners-letter");
    await expect(uploadedFile).toContainText(MOCK_UPLOADED_FILE_NAME);
    await expect(fileInput).toBeDisabled();
    await page.goto("/apply/public-authority");
    await page.goto("/apply/upload-coroners-letter");
    await expect(uploadedFile).toContainText(MOCK_UPLOADED_FILE_NAME);
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
    await expect(page.getByRole("status")).toHaveText("File uploaded");
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

    test("shows the uploaded filename on the upload page", async ({
      page,
      checkAccessibility,
    }) => {
      await page.getByLabel("Upload new file", { exact: true }).setInputFiles({
        name: "test-coroners-letter.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("coroners letter content"),
      });
      await page
        .getByRole("button", { name: "Upload file", exact: true })
        .click();

      await expect(page).toHaveURL("/apply/upload-coroners-letter");
      await expect(
        page.getByText(MOCK_UPLOADED_FILE_NAME, { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", {
          name: `Delete ${MOCK_UPLOADED_FILE_NAME}`,
          exact: true,
        }),
      ).toBeVisible();
      await checkAccessibility();
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

  test("renders the file guidance before the uploaded files and the upload input", async ({
    page,
  }) => {
    await uploadViaWidget(page, {
      name: "test-coroners-letter.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("coroners letter content"),
    });

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

    await uploadViaWidget(page, {
      name: "test-coroners-letter.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("coroners letter content"),
    });

    await expect(errorSummary).not.toBeVisible();
    await expect(page.locator(".govuk-form-group--error")).toHaveCount(0);
    await expect(page.locator("#documents")).not.toHaveClass(
      /govuk-file-upload--error/,
    );
    await expect(page).not.toHaveTitle(/^Error:/);
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
  test("identifies the filename when the file exceeds 10MB", async ({
    page,
    checkAccessibility,
  }) => {
    await page.goto("/apply/upload-coroners-letter");
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024);

    await page.setInputFiles("#documents", {
      name: "coroners-letter.pdf",
      mimeType: "application/pdf",
      buffer: largeBuffer,
    });

    const errorSummary = page.locator(".moj-multi-file-upload__error");
    await expect(errorSummary).toBeVisible();
    await expect(errorSummary).toHaveText(
      "coroners-letter.pdf must be smaller than 10MB",
    );
    await checkAccessibility();
  });
});
