import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import { APP_ROLES } from "#src/infrastructure/config/accessControl.js";

const HTTP_OK = 200;
const HTTP_FORBIDDEN = 403;
const HTTP_FOUND = 302;

type RoleSelector = "application" | "claims" | "none" | "both";

// Seeds a fresh session with the requested role selection via the test-only
// login route. Starting from a clean cookie jar keeps each test isolated.
async function loginAs(page: Page, role: RoleSelector): Promise<void> {
  await page.context().clearCookies();
  const query = role === "both" ? "" : `?role=${role}`;
  await page.goto(`/auth/test-login${query}`);
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

test.describe("Role-based access control", () => {
  test.describe("public and infrastructure routes", () => {
    test("serves /health to an unauthenticated request", async ({ page }) => {
      await page.context().clearCookies();

      const response = await page.request.get("/health", { maxRedirects: 0 });

      expect(response.status()).toBe(HTTP_OK);
    });

    test("serves /status to an unauthenticated request", async ({ page }) => {
      await page.context().clearCookies();

      const response = await page.request.get("/status", { maxRedirects: 0 });

      expect(response.status()).toBe(HTTP_OK);
    });

    test("redirects an unauthenticated protected request to /auth/login", async ({
      page,
    }) => {
      await page.context().clearCookies();

      const response = await page.request.get("/apply", { maxRedirects: 0 });

      expect(response.status()).toBe(HTTP_FOUND);
      expect(response.headers().location).toContain("/auth/login");
    });

    test("keeps logout available to a roleless authenticated session", async ({
      page,
    }) => {
      await loginAs(page, "none");

      const response = await page.request.get("/auth/logout", {
        maxRedirects: 0,
      });

      expect(response.status()).toBe(HTTP_FOUND);
      expect(response.headers().location).toContain(
        "login.microsoftonline.com",
      );
    });
  });

  test.describe("Application user", () => {
    test("can access Apply", async ({ page }) => {
      await loginAs(page, "application");

      const response = await page.goto("/apply");

      expect(response?.status()).toBe(HTTP_OK);
    });

    test("is denied access to Make a claim", async ({ page }) => {
      await loginAs(page, "application");

      const response = await page.goto("/claim");

      expect(response?.status()).toBe(HTTP_FORBIDDEN);
      await expect(page.locator("h1")).toHaveText("403");
    });
  });

  test.describe("Claims user", () => {
    test("can access Make a claim", async ({ page }) => {
      await loginAs(page, "claims");

      const response = await page.goto("/claim");

      expect(response?.status()).toBe(HTTP_OK);
    });

    test("is denied access to Apply", async ({ page }) => {
      await loginAs(page, "claims");

      const response = await page.goto("/apply");

      expect(response?.status()).toBe(HTTP_FORBIDDEN);
      await expect(page.locator("h1")).toHaveText("403");
      await expectNoAccessibilityViolations(page);
    });

    test("is denied at the early multipart upload endpoint before CSRF or upload handling", async ({
      page,
    }) => {
      await loginAs(page, "claims");

      const response = await page.request.post(
        "/apply/upload-coroners-letter/upload",
        { maxRedirects: 0 },
      );

      expect(response.status()).toBe(HTTP_FORBIDDEN);
    });
  });

  test.describe("Unconfigured routes", () => {
    test("returns 403 for an authenticated request to an unknown page", async ({
      page,
    }) => {
      await loginAs(page, "both");

      const response = await page.goto("/random-page");

      expect(response?.status()).toBe(HTTP_FORBIDDEN);
      await expect(page.locator("h1")).toHaveText("403");
    });
  });

  test.describe("Home journey links", () => {
    test("shows only Apply for an application user", async ({ page }) => {
      await loginAs(page, "application");

      await page.goto("/");

      await expect(page.getByRole("button", { name: "Apply" })).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Make a claim" }),
      ).toHaveCount(0);
    });

    test("shows only Make a claim for a claims user", async ({ page }) => {
      await loginAs(page, "claims");

      await page.goto("/");

      await expect(
        page.getByRole("button", { name: "Make a claim" }),
      ).toBeVisible();
      await expect(page.getByRole("button", { name: "Apply" })).toHaveCount(0);
    });

    test("shows both links for a user with both roles", async ({ page }) => {
      await loginAs(page, "both");

      await page.goto("/");

      await expect(page.getByRole("button", { name: "Apply" })).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Make a claim" }),
      ).toBeVisible();
    });
  });
});

// Keeps the shared role constants referenced so the exact display names stay in
// step with the production config.
test.describe("recognised role names", () => {
  test("match the provider role display names", () => {
    expect(APP_ROLES.APPLICATION_USER).toBe(
      "Inquests - Provider Application User",
    );
    expect(APP_ROLES.CLAIMS_USER).toBe("Inquests - Provider Claims User");
  });
});
