import { test, expect } from "../../fixtures/index.js";
import {
  validateBackButton,
  validateCSRFToken,
  validateFormAttributes,
} from "../../utils/govuk-validators.js";

test.describe("Office accounts", () => {
  test.beforeEach(async ({ page, checkAccessibility }) => {
    await page.goto("/apply/office-accounts");
    await checkAccessibility();
  });

  test("has the correct page heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        name: "Select an office",
      }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Choose which office is handling this application. The office must hold a civil contract for the matter type of the inquest.",
      ),
    ).toBeVisible();
    await expect(
      page.getByText(
        "If you can't find the correct office in the list, please contact your administrator.",
      ),
    ).toBeVisible();
  });

  test("only shows offices the logged-in user has access to", async ({
    page,
  }) => {
    await expect(
      page.getByText(
        "1 Test Street, Suite 2, London, Greater London, SW1A 1AA",
      ),
    ).toBeVisible();
    await expect(
      page.getByText("2 Test Street, Manchester, M1A 1AA"),
    ).toBeVisible();
    await expect(page.getByText("3 Test Street", { exact: false })).toHaveCount(
      0,
    );
  });

  test("does not render empty address parts for offices with missing address lines", async ({
    page,
  }) => {
    const manchesterOffice = page.getByText(
      "2 Test Street, Manchester, M1A 1AA",
    );

    await expect(manchesterOffice).toBeVisible();
    await expect(manchesterOffice).not.toContainText(", ,");
  });

  test("prefixes office addresses with the firm name from the default login", async ({
    page,
  }) => {
    await expect(
      page.getByRole("radio", {
        name: "Test Firm, 1 Test Street, Suite 2, London, Greater London, SW1A 1AA",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("radio", {
        name: "Test Firm, 2 Test Street, Manchester, M1A 1AA",
      }),
    ).toBeVisible();
  });

  test("has a back link to the apply declaration page", async ({ page }) => {
    await validateBackButton(page, "/apply");
  });

  test("clicking continue redirects to the client name and date of birth page", async ({
    page,
  }) => {
    await page.getByRole("radio").first().check();
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL(/\/apply\/client-details\/name-and-dob$/);
  });

  test("keeps the selected office checked when returning to the page", async ({
    page,
  }) => {
    const manchesterOffice = page.getByRole("radio", {
      name: /2 Test Street, Manchester/,
    });
    await manchesterOffice.check();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL(/\/apply\/client-details\/name-and-dob$/);

    await page.getByRole("link", { name: "Back", exact: true }).click();

    await expect(page).toHaveURL(/\/apply\/office-accounts$/);
    await expect(manchesterOffice).toBeChecked();
  });

  test("shows a validation error when no office is selected", async ({
    page,
    checkAccessibility,
  }) => {
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL(/\/apply\/office-accounts$/);
    const errorSummary = page.locator(".govuk-error-summary");
    await expect(errorSummary).toBeVisible();
    await expect(
      errorSummary.getByRole("link", { name: "Select an office" }),
    ).toHaveAttribute("href", "#office-accounts");
    await expect(page.locator("#office-accounts-error")).toContainText(
      "Select an office",
    );
    await expect(page.getByRole("radio")).toHaveCount(2);

    await checkAccessibility();
  });

  test("shows an interruption panel when the logged-in user has no office accounts", async ({
    page,
    checkAccessibility,
  }) => {
    await page.goto("/auth/test-login?officeAccounts=");
    await page.waitForURL("/");

    await page.goto("/apply/office-accounts");
    await checkAccessibility();

    const panel = page.locator(".govuk-panel--interruption");
    await expect(panel).toBeVisible();
    await expect(
      panel.getByRole("heading", {
        level: 1,
        name: "You cannot continue with your application",
      }),
    ).toBeVisible();
    await expect(panel).toContainText(
      "When you apply for legal aid, we check your office has the correct contract to do the work. Your account is not linked to any offices, so you cannot continue. Please contact your administrator.",
    );
    await expect(page).toHaveTitle(/You cannot continue with your application/);
    await expect(page.getByRole("radio")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Continue" })).toHaveCount(0);

    await panel
      .getByRole("link", { name: "Return to legal aid service" })
      .click();
    await expect(page).toHaveURL(/\/$/);

    // Restore the default session so later tests aren't affected by this override.
    await page.goto("/auth/test-login");
    await page.waitForURL("/");
  });
});
