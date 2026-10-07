import { test, expect } from "../fixtures/index.js";
import { validateMojHeader } from "#tests/playwright/utils/govuk-validators.js";
import { PROVIDER_DISPLAY_NAME } from "#tests/playwright/constants/Provider.js";

test.describe("Home page", () => {
  test.beforeEach(async ({ page, checkAccessibility }) => {
    await page.goto("/");
    await checkAccessibility();
  });

  test("should have the correct title", async ({ page }) => {
    await expect(page).toHaveTitle(/Inquests – GOV.UK/);
  });

  test("should display correct navigation content", async ({ page }) => {
    await expect(validateMojHeader(page)).resolves.not.toThrow();
  });

  test("should have the correct link for sign out button", async ({ page }) => {
    const signOutLink = page.getByRole("link", { name: "Sign out" });
    await expect(signOutLink).toHaveAttribute("href", "/auth/logout");
  });

  test("navigation items should be in correct order", async ({ page }) => {
    const header = page.getByRole("banner");
    const navigation = header.getByRole("navigation", {
      name: "Account navigation",
    });
    const navLinks = navigation.getByRole("link");

    await expect(navLinks.nth(0)).toHaveText(PROVIDER_DISPLAY_NAME);
    await expect(navLinks.nth(1)).toHaveText("Sign out");
  });

  test("should display the authenticated user name in the header", async ({
    page,
  }) => {
    const header = page.getByRole("banner");
    const navigation = header.getByRole("navigation", {
      name: "Account navigation",
    });
    const accountLink = navigation.getByRole("link").nth(0);

    await expect(accountLink).toHaveText(PROVIDER_DISPLAY_NAME);
  });

  test("should show error summary if you do not select a journey type", async ({
    page,
  }) => {
    const errorSummary = page.getByRole("alert");
    await expect(errorSummary).not.toBeVisible();

    const submitButton = page.getByRole("button", { name: "Continue" });
    await submitButton.click();

    await expect(errorSummary).toHaveText(/Select what you need to do/);
  });

  test("should go to /apply if Apply selected", async ({ page }) => {
    const applyRadio = page.getByRole("radio", {
      name: "Apply for inquest legal aid",
    });
    await applyRadio.check();

    const submitButton = page.getByRole("button", { name: "Continue" });
    await submitButton.click();

    await expect(page).toHaveURL("/apply");
  });

  test("should go to /claim if Claim selected", async ({ page }) => {
    const claimRadio = page.getByRole("radio", {
      name: "Make a claim against a certificate",
    });
    await claimRadio.check();

    const submitButton = page.getByRole("button", { name: "Continue" });
    await submitButton.click();

    await expect(page).toHaveURL("/claim");
  });
});
