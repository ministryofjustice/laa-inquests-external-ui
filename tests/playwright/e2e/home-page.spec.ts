import { test, expect } from "../fixtures/index.js";
import { validateMojHeader } from "#tests/playwright/utils/govuk-validators.js";

test.describe("Home page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
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

    await expect(navLinks.nth(0)).toHaveText("Test User");
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

    await expect(accountLink).toHaveText("Test User");
  });
});
