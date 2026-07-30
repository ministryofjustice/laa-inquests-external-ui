import { test, expect } from "../../fixtures/index.js";

test.describe("Claim - evidence", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/claim/evidence");
  });

  test("renders back link to total cost", async ({ page }) => {
    const backLink = page.getByRole("link", { name: "Back", exact: true });

    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", "/claim/total-cost");
  });

  test("renders page heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { level: 1, name: "Upload evidence" }),
    ).toBeVisible();
  });

  test("renders upload requirements and guidance content", async ({ page }) => {
    await expect(page.getByText("You can upload:")).toBeVisible();
    await expect(page.getByText(".jpg, .png, .pdf, .bmp")).toBeVisible();
    await expect(page.getByText("10mb max")).toBeVisible();

    await expect(
      page.getByText(
        "Examples of evidence include: a court order, court attendance notes, an evidence bundle.",
      ),
    ).toBeVisible();

    await expect(
      page.getByText(
        "When uploading evidence, make sure file names match the names used in the uploaded LAA cost claim evidence template",
      ),
    ).toBeVisible();

    await expect(
      page.getByText("for help and guidance, read", { exact: false }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", {
        name: "How to complete the LAA cost claim template and submit evidence",
      }),
    ).toHaveAttribute("href", "#");

    await expect(
      page.getByText(
        "You can upload all your files at once, or one at a time.",
      ),
    ).toBeVisible();
  });

  test("renders upload new files section with MOJ multi file upload", async ({
    page,
  }) => {
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
        .filter({ hasText: "Upload new files" }),
    ).toBeVisible();
  });

  test("renders continue button", async ({ page }) => {
    const form = page.getByTestId("evidence-form");
    const continueButton = form.getByRole("button", { name: "Continue" });

    await expect(continueButton).toBeVisible();
    await expect(continueButton).toHaveAttribute("type", "submit");
  });

  test("stays on evidence page and shows error when continue is clicked without uploads", async ({
    page,
  }) => {
    await page
      .getByTestId("evidence-form")
      .getByRole("button", { name: "Continue" })
      .click();

    await expect(page).toHaveURL("/claim/evidence");
    await expect(page.locator(".govuk-error-summary")).toContainText(
      "Minimum of one evidence file required",
    );
  });

  test("uploads evidence using javascript multi-file uploader", async ({
    page,
  }) => {
    const [response] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes("/claim/evidence/upload") &&
          r.request().method() === "POST",
      ),
      page.setInputFiles("#documents", {
        name: "test-evidence.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("fake evidence content"),
      }),
    ]);

    expect(response.status()).toBe(201);

    await page.reload();

    await expect(
      page
        .locator(".moj-multi-file-upload__message")
        .filter({ hasText: "test-evidence.pdf" })
        .first(),
    ).toBeVisible();
  });

  test("redirects to /claim/check-your-answers when continue is clicked with an uploaded file", async ({
    page,
  }) => {
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

    await page
      .getByTestId("evidence-form")
      .getByRole("button", { name: "Continue" })
      .click();

    await expect(page).toHaveURL("/claim/check-your-answers");
  });
});

test.describe("Claim - evidence (no javascript)", () => {
  test.use({ javaScriptEnabled: false });

  test("uploads evidence and redirects back to evidence page", async ({
    page,
  }) => {
    await page.goto("/claim/evidence");

    await page.setInputFiles("#documents", {
      name: "test-evidence.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("fake evidence content"),
    });

    await page.getByRole("button", { name: "Upload file" }).click();

    await expect(page).toHaveURL("/claim/evidence");
  });
});
