import { expect, test } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { APPLY_PATHS } from "#src/infrastructure/express/routes/paths.js";
import { loginAtStepWithParams } from "#tests/playwright/fixtures/index.js";

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

    await loginAtStepWithParams(
      page,
      APPLY_PATHS.PUBLIC_AUTHORITY,
      "accessToken=FORCE_401",
    );

    await page.goto(APPLY_PATHS.PUBLIC_AUTHORITY);

    expect(page.url()).toContain("login.microsoftonline.com");
  });

  test("renders a 403 page on an upstream 403", async ({ page }) => {
    await loginAtStepWithParams(
      page,
      APPLY_PATHS.PUBLIC_AUTHORITY,
      "accessToken=FORCE_403",
    );

    const response = await page.goto(APPLY_PATHS.PUBLIC_AUTHORITY);

    expect(response?.status()).toBe(403);
    await expectNoAccessibilityViolations(page);
  });

  test("returns a real 500 page on an upstream 5xx", async ({ page }) => {
    await loginAtStepWithParams(
      page,
      APPLY_PATHS.PUBLIC_AUTHORITY,
      "accessToken=FORCE_500",
    );

    const response = await page.goto(APPLY_PATHS.PUBLIC_AUTHORITY);

    expect(response?.status()).toBe(500);
    await expect(page.locator("h1")).toHaveText("500");
    await expect(page.getByText("Internal Server Error")).toBeVisible();
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

    await loginAtStepWithParams(
      page,
      APPLY_PATHS.OFFICE_ACCOUNTS,
      "accessToken=FORCE_401",
    );

    await page.goto(APPLY_PATHS.OFFICE_ACCOUNTS);

    expect(page.url()).toContain("login.microsoftonline.com");
  });

  test("renders a 403 page on an upstream 403", async ({ page }) => {
    await loginAtStepWithParams(
      page,
      APPLY_PATHS.OFFICE_ACCOUNTS,
      "accessToken=FORCE_403",
    );

    const response = await page.goto(APPLY_PATHS.OFFICE_ACCOUNTS);

    expect(response?.status()).toBe(403);
    await expectNoAccessibilityViolations(page);
  });

  test("returns a real 500 page on an upstream 5xx", async ({ page }) => {
    await loginAtStepWithParams(
      page,
      APPLY_PATHS.OFFICE_ACCOUNTS,
      "accessToken=FORCE_500",
    );

    const response = await page.goto(APPLY_PATHS.OFFICE_ACCOUNTS);

    expect(response?.status()).toBe(500);
    await expect(page.locator("h1")).toHaveText("500");
    await expect(page.getByText("Internal Server Error")).toBeVisible();
    await expectNoAccessibilityViolations(page);
  });
});
