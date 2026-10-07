import { test, expect } from "../../../fixtures/index.js";

test.describe("Application - declaration", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/apply");
  });

  test("renders back link to start page", async ({
    page,
    checkAccessibility,
  }) => {
    const backLink = page.getByRole("link", { name: "Back", exact: true });

    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", "/");

    await checkAccessibility();
  });

  test("renders page heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Before you start your application",
      }),
    ).toBeVisible();
  });

  test("renders application declaration form", async ({ page }) => {
    const form = page.getByTestId("application-declaration-form");

    await expect(form).toBeVisible();
  });

  test("renders declaration subheader, copy text and back button", async ({
    page,
    checkAccessibility,
  }) => {
    page.goto("/apply");
    const declarationHeading = await page.getByRole("heading", {
      level: 1,
      name: "Before you start your application",
    });

    const declarationCopy = page.getByText(
      "By submitting this application, you confirm that:",
    );
    const representationDeclaration = await page
      .getByRole("list")
      .getByText(
        "you are authorised to make this application on behalf of your client",
      );
    const clientDeclaration = await page
      .getByRole("list")
      .getByText(
        "you'll go through all parts of this application with your client",
      );
    const correctDeclaration = await page
      .getByRole("list")
      .getByText(
        "all the information you provided is true and complete to the best of your knowledge",
      );

    const backButton = page.getByRole("link", { name: "Back", exact: true });

    await expect(declarationHeading).toBeVisible();
    await expect(declarationCopy).toBeVisible();
    await expect(representationDeclaration).toBeVisible();
    await expect(clientDeclaration).toBeVisible();
    await expect(correctDeclaration).toBeVisible();

    await expect(backButton).toBeVisible();
    await expect(backButton).toHaveAttribute("href", "/");

    await checkAccessibility();
  });

  test("renders start button", async ({ page }) => {
    const form = page.getByTestId("application-declaration-form");
    const startButton = form.getByRole("button", { name: "Start" });

    await expect(startButton).toBeVisible();
    await expect(startButton).toContainClass("govuk-button--start");
  });

  test("shows validation error when submitted without checking the declaration", async ({
    page,
  }) => {
    const form = page.getByTestId("application-declaration-form");

    await form.getByRole("button", { name: "Start" }).click();

    const errorSummary = page.getByRole("alert");
    await expect(errorSummary).toBeVisible();
    await expect(errorSummary).toContainText(
      "Confirm you have read and agree to the declaration",
    );

    const errorMessageElement = form.locator(
      "#application-declaration-confirmation-error",
    );
    await expect(errorMessageElement).toBeVisible();
    await expect(errorMessageElement).toContainText(
      "Confirm you have read and agree to the declaration",
    );
  });

  test("submits form when declaration is checked and redirects to office accounts", async ({
    page,
  }) => {
    const form = page.getByTestId("application-declaration-form");

    await form
      .getByLabel("I confirm that I have read and agree to the declaration")
      .check();
    await form.getByRole("button", { name: "Start" }).click();

    await expect(page).toHaveURL("/apply/office-accounts");
  });

  test("Maintains selection on back navigation from office accounts", async ({
    page,
  }) => {
    const form = page.getByTestId("application-declaration-form");

    await form
      .getByLabel("I confirm that I have read and agree to the declaration")
      .check();
    await form.getByRole("button", { name: "Start" }).click();

    await expect(page).toHaveURL("/apply/office-accounts");

    await page.getByRole("link", { name: "Back", exact: true }).click();
    await expect(page).toHaveURL("/apply");

    await expect(
      form.getByLabel(
        "I confirm that I have read and agree to the declaration",
      ),
    ).toBeChecked();
  });
});
