import { expect, test } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { APPLY_PATHS } from "#src/infrastructure/express/routes/paths.js";

async function loginWithAccessToken(
  page: Page,
  accessToken: string,
): Promise<void> {
  // Start from a clean cookie jar so this spec gets its own session. The 401
  // case destroys the session, and reusing the shared seeded session would
  // wipe it for other specs.
  await page.context().clearCookies();
  await page.goto(`/auth/test-login?accessToken=${accessToken}`);
  await page.waitForURL("/");
}

async function expectNoAccessibilityViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags([
      "wcag2a",
      "wcag2aa",
      "wcag21a",
      "wcag21aa",
      "wcag22a",
      "wcag22aa",
    ])
    .disableRules(["aria-allowed-attr"])
    .analyze();
  expect(results.violations).toEqual([]);
}

test.describe("Inquests API auth and failure handling", () => {
  test("destroys the session and redirects to login on an upstream 401", async ({
    page,
  }) => {
    await page.route(/login\.microsoftonline\.com/, (route) =>
      route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "entra-login-stub",
      }),
    );

    await loginWithAccessToken(page, "FORCE_401");

    await page.goto(APPLY_PATHS.PUBLIC_AUTHORITY);

    expect(page.url()).toContain("login.microsoftonline.com");
  });

  test("renders a 403 page on an upstream 403", async ({ page }) => {
    await loginWithAccessToken(page, "FORCE_403");

    const response = await page.goto(APPLY_PATHS.PUBLIC_AUTHORITY);

    expect(response?.status()).toBe(403);
    await expect(page.locator("h1")).toHaveText("403");
    await expectNoAccessibilityViolations(page);
  });

  test("returns a real 500 page on an upstream 5xx", async ({ page }) => {
    await loginWithAccessToken(page, "FORCE_500");

    const response = await page.goto(APPLY_PATHS.PUBLIC_AUTHORITY);

    expect(response?.status()).toBe(500);
    await expect(page.locator("h1")).toHaveText("500");
    await expectNoAccessibilityViolations(page);
  });
});

test.describe("Provider offices auth and failure handling", () => {
  test("destroys the session and redirects to login on an upstream 401", async ({
    page,
  }) => {
    await page.route(/login\.microsoftonline\.com/, (route) =>
      route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "entra-login-stub",
      }),
    );

    await loginWithAccessToken(page, "FORCE_401");

    await page.goto(APPLY_PATHS.OFFICE_ACCOUNTS);

    expect(page.url()).toContain("login.microsoftonline.com");
  });

  test("renders a 403 page on an upstream 403", async ({ page }) => {
    await loginWithAccessToken(page, "FORCE_403");

    const response = await page.goto(APPLY_PATHS.OFFICE_ACCOUNTS);

    expect(response?.status()).toBe(403);
    await expect(page.locator("h1")).toHaveText("403");
    await expectNoAccessibilityViolations(page);
  });

  test("returns a real 500 page on an upstream 5xx", async ({ page }) => {
    await loginWithAccessToken(page, "FORCE_500");

    const response = await page.goto(APPLY_PATHS.OFFICE_ACCOUNTS);

    expect(response?.status()).toBe(500);
    await expect(page.locator("h1")).toHaveText("500");
    await expectNoAccessibilityViolations(page);
  });
});
