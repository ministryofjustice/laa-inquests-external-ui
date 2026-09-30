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
        name: "Select the account number of the office handling this application",
      }),
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

  test("has a back link to the apply declaration page", async ({ page }) => {
    await validateBackButton(page, "/apply");
  });

  test("clicking save and continue redirects to the client name and date of birth page", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Save and continue" }).click();

    await expect(page).toHaveURL(/\/apply\/client-details\/name-and-dob$/);
  });

  test("shows a message when the logged-in user has no office accounts", async ({
    page,
    checkAccessibility,
  }) => {
    await page.goto("/auth/test-login?officeAccounts=");
    await page.waitForURL("/");

    await page.goto("/apply/office-accounts");
    await checkAccessibility();

    await expect(
      page.getByText("No office accounts were found for this firm."),
    ).toBeVisible();
    await expect(page.getByRole("radio")).toHaveCount(0);

    // Restore the default session so later tests aren't affected by this override.
    await page.goto("/auth/test-login");
    await page.waitForURL("/");
  });
});
